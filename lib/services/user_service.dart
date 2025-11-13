import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:spaktok/services/auth_service.dart';
import 'dart:developer' as developer;

/// User Service - Manages user data and profile operations
class UserService {
  static UserService? _instance;
  static UserService get instance {
    _instance ??= UserService._();
    return _instance!;
  }

  UserService._();

  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final AuthService _authService = AuthService();

  // ─────────────────────────────── USER PROFILE ───────────────────────────────

  /// Get user data
  Future<Map<String, dynamic>?> getUserData(String userId) async {
    try {
      final doc = await _firestore.collection('users').doc(userId).get();
      return doc.data();
    } catch (e) {
      developer.log('Error getting user data: $e', name: 'user_service');
      return null;
    }
  }

  /// Get user data stream (real-time)
  Stream<DocumentSnapshot> getUserDataStream(String userId) {
    return _firestore.collection('users').doc(userId).snapshots();
  }

  /// Update user profile
  Future<void> updateProfile({
    required String displayName,
    String? photoUrl,
    String? bio,
    String? location,
    String? website,
  }) async {
    try {
      final user = _authService.currentUser;
      if (user == null) {
        throw Exception('User must be logged in');
      }

      await _firestore.collection('users').doc(user.uid).update({
        'displayName': displayName,
        if (photoUrl != null) 'photoUrl': photoUrl,
        if (bio != null) 'bio': bio,
        if (location != null) 'location': location,
        if (website != null) 'website': website,
        'updatedAt': FieldValue.serverTimestamp(),
      });

      developer.log('Profile updated successfully', name: 'user_service');
    } catch (e) {
      developer.log('Error updating profile: $e', name: 'user_service');
      throw Exception('Failed to update profile: $e');
    }
  }

  // ─────────────────────────────── FOLLOW SYSTEM ───────────────────────────────

  /// Follow a user
  Future<void> followUser(String targetUserId) async {
    try {
      final user = _authService.currentUser;
      if (user == null) {
        throw Exception('User must be logged in');
      }

      if (user.uid == targetUserId) {
        throw Exception('Cannot follow yourself');
      }

      // Add follow relationship
      await _firestore
          .collection('users')
          .doc(user.uid)
          .collection('following')
          .doc(targetUserId)
          .set({
        'followedAt': FieldValue.serverTimestamp(),
      });

      // Add follower
      await _firestore
          .collection('users')
          .doc(targetUserId)
          .collection('followers')
          .doc(user.uid)
          .set({
        'followedAt': FieldValue.serverTimestamp(),
      });

      // Update follower count
      await _firestore.collection('users').doc(user.uid).update({
        'followingCount': FieldValue.increment(1),
      });

      await _firestore.collection('users').doc(targetUserId).update({
        'followersCount': FieldValue.increment(1),
      });

      developer.log('User followed: $targetUserId', name: 'user_service');
    } catch (e) {
      developer.log('Error following user: $e', name: 'user_service');
      throw Exception('Failed to follow user: $e');
    }
  }

  /// Unfollow a user
  Future<void> unfollowUser(String targetUserId) async {
    try {
      final user = _authService.currentUser;
      if (user == null) {
        throw Exception('User must be logged in');
      }

      // Remove follow relationship
      await _firestore
          .collection('users')
          .doc(user.uid)
          .collection('following')
          .doc(targetUserId)
          .delete();

      // Remove follower
      await _firestore
          .collection('users')
          .doc(targetUserId)
          .collection('followers')
          .doc(user.uid)
          .delete();

      // Update follower count
      await _firestore.collection('users').doc(user.uid).update({
        'followingCount': FieldValue.increment(-1),
      });

      await _firestore.collection('users').doc(targetUserId).update({
        'followersCount': FieldValue.increment(-1),
      });

      developer.log('User unfollowed: $targetUserId', name: 'user_service');
    } catch (e) {
      developer.log('Error unfollowing user: $e', name: 'user_service');
      throw Exception('Failed to unfollow user: $e');
    }
  }

  /// Check if user is followed
  Future<bool> isUserFollowed(String targetUserId) async {
    try {
      final user = _authService.currentUser;
      if (user == null) return false;

      final doc = await _firestore
          .collection('users')
          .doc(user.uid)
          .collection('following')
          .doc(targetUserId)
          .get();

      return doc.exists;
    } catch (e) {
      developer.log('Error checking if user is followed: $e',
          name: 'user_service');
      return false;
    }
  }

  /// Get followers stream
  Stream<QuerySnapshot> getFollowers(String userId) {
    return _firestore
        .collection('users')
        .doc(userId)
        .collection('followers')
        .snapshots();
  }

  /// Get following stream
  Stream<QuerySnapshot> getFollowing(String userId) {
    return _firestore
        .collection('users')
        .doc(userId)
        .collection('following')
        .snapshots();
  }

  // ─────────────────────────────── BLOCK SYSTEM ───────────────────────────────

  /// Block a user
  Future<void> blockUser(String targetUserId) async {
    try {
      final user = _authService.currentUser;
      if (user == null) {
        throw Exception('User must be logged in');
      }

      await _firestore
          .collection('users')
          .doc(user.uid)
          .collection('blocked')
          .doc(targetUserId)
          .set({
        'blockedAt': FieldValue.serverTimestamp(),
      });

      developer.log('User blocked: $targetUserId', name: 'user_service');
    } catch (e) {
      developer.log('Error blocking user: $e', name: 'user_service');
      throw Exception('Failed to block user: $e');
    }
  }

  /// Unblock a user
  Future<void> unblockUser(String targetUserId) async {
    try {
      final user = _authService.currentUser;
      if (user == null) {
        throw Exception('User must be logged in');
      }

      await _firestore
          .collection('users')
          .doc(user.uid)
          .collection('blocked')
          .doc(targetUserId)
          .delete();

      developer.log('User unblocked: $targetUserId', name: 'user_service');
    } catch (e) {
      developer.log('Error unblocking user: $e', name: 'user_service');
      throw Exception('Failed to unblock user: $e');
    }
  }

  /// Check if user is blocked
  Future<bool> isUserBlocked(String targetUserId) async {
    try {
      final user = _authService.currentUser;
      if (user == null) return false;

      final doc = await _firestore
          .collection('users')
          .doc(user.uid)
          .collection('blocked')
          .doc(targetUserId)
          .get();

      return doc.exists;
    } catch (e) {
      developer.log('Error checking if user is blocked: $e',
          name: 'user_service');
      return false;
    }
  }

  // ─────────────────────────────── SEARCH ───────────────────────────────

  /// Search users by username or display name
  Future<List<Map<String, dynamic>>> searchUsers(String query,
      {int limit = 20}) async {
    try {
      if (query.isEmpty) return [];

      final snapshot = await _firestore
          .collection('users')
          .where('searchKeywords', arrayContains: query.toLowerCase())
          .limit(limit)
          .get();

      return snapshot.docs.map((doc) => doc.data()).toList();
    } catch (e) {
      developer.log('Error searching users: $e', name: 'user_service');
      return [];
    }
  }

  // ─────────────────────────────── STATISTICS ───────────────────────────────

  /// Get user statistics
  Future<Map<String, dynamic>?> getUserStats(String userId) async {
    try {
      final doc = await _firestore.collection('users').doc(userId).get();
      if (doc.exists) {
        return {
          'postsCount': doc.get('postsCount') ?? 0,
          'followersCount': doc.get('followersCount') ?? 0,
          'followingCount': doc.get('followingCount') ?? 0,
          'giftCount': doc.get('giftCount') ?? 0,
          'totalGiftValue': doc.get('totalGiftValue') ?? 0,
          'coinBalance': doc.get('coinBalance') ?? 0,
        };
      }
      return null;
    } catch (e) {
      developer.log('Error getting user stats: $e', name: 'user_service');
      return null;
    }
  }

  // ─────────────────────────────── BADGES & ACHIEVEMENTS ───────────────────────────────

  /// Add badge to user
  Future<void> addBadge(String userId, String badgeId) async {
    try {
      await _firestore.collection('users').doc(userId).update({
        'badges': FieldValue.arrayUnion([badgeId]),
      });
    } catch (e) {
      developer.log('Error adding badge: $e', name: 'user_service');
    }
  }

  /// Remove badge from user
  Future<void> removeBadge(String userId, String badgeId) async {
    try {
      await _firestore.collection('users').doc(userId).update({
        'badges': FieldValue.arrayRemove([badgeId]),
      });
    } catch (e) {
      developer.log('Error removing badge: $e', name: 'user_service');
    }
  }

  // ─────────────────────────────── PRIVACY & PREFERENCES ───────────────────────────────

  /// Update privacy settings
  Future<void> updatePrivacySettings(Map<String, dynamic> settings) async {
    try {
      final user = _authService.currentUser;
      if (user == null) {
        throw Exception('User must be logged in');
      }

      await _firestore.collection('users').doc(user.uid).update({
        'privacySettings': settings,
      });

      developer.log('Privacy settings updated', name: 'user_service');
    } catch (e) {
      developer.log('Error updating privacy settings: $e',
          name: 'user_service');
      throw Exception('Failed to update privacy settings: $e');
    }
  }

  /// Get privacy settings
  Future<Map<String, dynamic>> getPrivacySettings(String userId) async {
    try {
      final doc = await _firestore.collection('users').doc(userId).get();
      if (doc.exists) {
        return doc.get('privacySettings') ?? {};
      }
      return {};
    } catch (e) {
      developer.log('Error getting privacy settings: $e', name: 'user_service');
      return {};
    }
  }

  // ─────────────────────────────── ACCOUNT MANAGEMENT ───────────────────────────────

  /// Delete user account
  Future<void> deleteAccount() async {
    try {
      final user = _authService.currentUser;
      if (user == null) {
        throw Exception('User must be logged in');
      }

      // Mark user as deleted
      await _firestore.collection('users').doc(user.uid).update({
        'isDeleted': true,
        'deletedAt': FieldValue.serverTimestamp(),
      });

      // Delete Firebase Auth user
      await user.delete();

      developer.log('Account deleted successfully', name: 'user_service');
    } catch (e) {
      developer.log('Error deleting account: $e', name: 'user_service');
      throw Exception('Failed to delete account: $e');
    }
  }

  /// Check if account is active
  Future<bool> isAccountActive(String userId) async {
    try {
      final doc = await _firestore.collection('users').doc(userId).get();
      if (doc.exists) {
        return !(doc.get('isDeleted') ?? false);
      }
      return false;
    } catch (e) {
      developer.log('Error checking account status: $e', name: 'user_service');
      return false;
    }
  }
}
