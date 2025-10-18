import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:spaktok/services/auth_service.dart';
import 'package:flutter/foundation.dart';

enum ReportType {
  user,
  stream,
  post,
  comment,
  message,
}

enum ReportReason {
  spam,
  harassment,
  hateSpeech,
  violence,
  nudity,
  falseInformation,
  copyright,
  other,
}

class ReportingService {
  static ReportingService? _instance;
  static ReportingService get instance {
    _instance ??= ReportingService._();
    return _instance!;
  }

  ReportingService._();

  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final AuthService _authService = AuthService();

  // Submit a report
  Future<bool> submitReport({
    required ReportType type,
    required String targetId,
    required ReportReason reason,
    String? description,
    List<String>? evidenceUrls,
  }) async {
    try {
      final user = _authService.currentUser;
      if (user == null) {
        throw Exception('User must be logged in to submit reports');
      }

      await _firestore.collection('reports').add({
        'reporterId': user.uid,
        'reporterName': user.displayName ?? 'Anonymous',
        'type': type.toString(),
        'targetId': targetId,
        'reason': reason.toString(),
        'description': description ?? '',
        'evidenceUrls': evidenceUrls ?? [],
        'status': 'pending',
        'createdAt': FieldValue.serverTimestamp(),
        'reviewedAt': null,
        'reviewedBy': null,
        'action': null,
      });

      return true;
    } catch (e) {
      debugPrint('Error submitting report: $e');
      return false;
    }
  }

  // Report a user
  Future<bool> reportUser({
    required String userId,
    required ReportReason reason,
    String? description,
  }) async {
    return await submitReport(
      type: ReportType.user,
      targetId: userId,
      reason: reason,
      description: description,
    );
  }

  // Report a stream
  Future<bool> reportStream({
    required String streamId,
    required ReportReason reason,
    String? description,
  }) async {
    return await submitReport(
      type: ReportType.stream,
      targetId: streamId,
      reason: reason,
      description: description,
    );
  }

  // Report a post
  Future<bool> reportPost({
    required String postId,
    required ReportReason reason,
    String? description,
  }) async {
    return await submitReport(
      type: ReportType.post,
      targetId: postId,
      reason: reason,
      description: description,
    );
  }

  // Report a comment
  Future<bool> reportComment({
    required String commentId,
    required ReportReason reason,
    String? description,
  }) async {
    return await submitReport(
      type: ReportType.comment,
      targetId: commentId,
      reason: reason,
      description: description,
    );
  }

  // Report a message
  Future<bool> reportMessage({
    required String messageId,
    required ReportReason reason,
    String? description,
  }) async {
    return await submitReport(
      type: ReportType.message,
      targetId: messageId,
      reason: reason,
      description: description,
    );
  }

  // Block a user
  Future<bool> blockUser(String userId) async {
    try {
      final user = _authService.currentUser;
      if (user == null) {
        throw Exception('User must be logged in');
      }

      await _firestore.collection('users').doc(user.uid).update({
        'blockedUsers': FieldValue.arrayUnion([userId]),
      });

      // Also add to blocked by list for the other user
      await _firestore.collection('users').doc(userId).update({
        'blockedBy': FieldValue.arrayUnion([user.uid]),
      });

      return true;
    } catch (e) {
      debugPrint('Error blocking user: $e');
      return false;
    }
  }

  // Unblock a user
  Future<bool> unblockUser(String userId) async {
    try {
      final user = _authService.currentUser;
      if (user == null) {
        throw Exception('User must be logged in');
      }

      await _firestore.collection('users').doc(user.uid).update({
        'blockedUsers': FieldValue.arrayRemove([userId]),
      });

      // Also remove from blocked by list for the other user
      await _firestore.collection('users').doc(userId).update({
        'blockedBy': FieldValue.arrayRemove([user.uid]),
      });

      return true;
    } catch (e) {
      debugPrint('Error unblocking user: $e');
      return false;
    }
  }

  // Get blocked users
  Future<List<String>> getBlockedUsers() async {
    try {
      final user = _authService.currentUser;
      if (user == null) {
        throw Exception('User must be logged in');
      }

      final doc = await _firestore.collection('users').doc(user.uid).get();
      if (doc.exists) {
        final data = doc.data() as Map<String, dynamic>;
        return List<String>.from(data['blockedUsers'] ?? []);
      }
      return [];
    } catch (e) {
      debugPrint('Error getting blocked users: $e');
      return [];
    }
  }

  // Check if user is blocked
  Future<bool> isUserBlocked(String userId) async {
    try {
      final blockedUsers = await getBlockedUsers();
      return blockedUsers.contains(userId);
    } catch (e) {
      return false;
    }
  }

  // Get user's reports
  Stream<QuerySnapshot> getUserReports() {
    final user = _authService.currentUser;
    if (user == null) {
      throw Exception('User must be logged in');
    }

    return _firestore
        .collection('reports')
        .where('reporterId', isEqualTo: user.uid)
        .orderBy('createdAt', descending: true)
        .snapshots();
  }

  // Get report reasons as strings
  static String getReasonString(ReportReason reason) {
    switch (reason) {
      case ReportReason.spam:
        return 'Spam';
      case ReportReason.harassment:
        return 'Harassment or Bullying';
      case ReportReason.hateSpeech:
        return 'Hate Speech';
      case ReportReason.violence:
        return 'Violence or Dangerous Content';
      case ReportReason.nudity:
        return 'Nudity or Sexual Content';
      case ReportReason.falseInformation:
        return 'False Information';
      case ReportReason.copyright:
        return 'Copyright Violation';
      case ReportReason.other:
        return 'Other';
    }
  }

  // Get all report reasons
  static List<ReportReason> getAllReasons() {
    return ReportReason.values;
  }

  // Mute a user (temporary block for notifications)
  Future<bool> muteUser(String userId, {Duration? duration}) async {
    try {
      final user = _authService.currentUser;
      if (user == null) {
        throw Exception('User must be logged in');
      }

      final muteUntil = duration != null
          ? Timestamp.fromDate(DateTime.now().add(duration))
          : null;

      await _firestore
          .collection('users')
          .doc(user.uid)
          .collection('muted')
          .doc(userId)
          .set({
        'mutedAt': FieldValue.serverTimestamp(),
        'muteUntil': muteUntil,
      });

      return true;
    } catch (e) {
      debugPrint('Error muting user: $e');
      return false;
    }
  }

  // Unmute a user
  Future<bool> unmuteUser(String userId) async {
    try {
      final user = _authService.currentUser;
      if (user == null) {
        throw Exception('User must be logged in');
      }

      await _firestore
          .collection('users')
          .doc(user.uid)
          .collection('muted')
          .doc(userId)
          .delete();

      return true;
    } catch (e) {
      debugPrint('Error unmuting user: $e');
      return false;
    }
  }

  // Check if user is muted
  Future<bool> isUserMuted(String userId) async {
    try {
      final user = _authService.currentUser;
      if (user == null) {
        return false;
      }

      final doc = await _firestore
          .collection('users')
          .doc(user.uid)
          .collection('muted')
          .doc(userId)
          .get();

      if (!doc.exists) {
        return false;
      }

      final data = doc.data() as Map<String, dynamic>;
      final muteUntil = data['muteUntil'] as Timestamp?;

      if (muteUntil != null) {
        if (muteUntil.toDate().isBefore(DateTime.now())) {
          // Mute has expired
          await unmuteUser(userId);
          return false;
        }
      }

      return true;
    } catch (e) {
      return false;
    }
  }
}
