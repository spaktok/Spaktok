import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';
import 'package:spaktok/services/auth_service.dart';

/// Notification Service - Handles all notification operations
class NotificationService {
  static NotificationService? _instance;
  static NotificationService get instance {
    _instance ??= NotificationService._();
    return _instance!;
  }

  NotificationService._();

  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final AuthService _authService = AuthService();

  // ─────────────────────────────── NOTIFICATION CREATION ───────────────────────────────

  /// Create a notification
  Future<void> createNotification({
    required String recipientId,
    required String
        type, // 'follow', 'like', 'comment', 'message', 'gift', etc.
    required String title,
    required String body,
    String? actionId,
    Map<String, dynamic>? data,
  }) async {
    try {
      final user = _authService.currentUser;
      if (user == null) return;

      await _firestore.collection('notifications').add({
        'recipientId': recipientId,
        'senderId': user.uid,
        'type': type,
        'title': title,
        'body': body,
        'actionId': actionId,
        'data': data,
        'isRead': false,
        'createdAt': FieldValue.serverTimestamp(),
      });
    } catch (e) {
      debugPrint('Error creating notification: $e');
    }
  }

  /// Create follow notification
  Future<void> notifyFollow(String targetUserId) async {
    try {
      final user = _authService.currentUser;
      if (user == null) return;

      await createNotification(
        recipientId: targetUserId,
        type: 'follow',
        title: 'New Follower',
        body: '${user.displayName ?? "A user"} started following you',
        actionId: user.uid,
      );
    } catch (e) {
      debugPrint('Error creating follow notification: $e');
    }
  }

  /// Create like notification
  Future<void> notifyLike({
    required String targetUserId,
    required String postId,
  }) async {
    try {
      final user = _authService.currentUser;
      if (user == null) return;

      await createNotification(
        recipientId: targetUserId,
        type: 'like',
        title: 'New Like',
        body: '${user.displayName ?? "A user"} liked your post',
        actionId: postId,
      );
    } catch (e) {
      debugPrint('Error creating like notification: $e');
    }
  }

  /// Create comment notification
  Future<void> notifyComment({
    required String targetUserId,
    required String postId,
    required String commentId,
  }) async {
    try {
      final user = _authService.currentUser;
      if (user == null) return;

      await createNotification(
        recipientId: targetUserId,
        type: 'comment',
        title: 'New Comment',
        body: '${user.displayName ?? "A user"} commented on your post',
        actionId: postId,
      );
    } catch (e) {
      debugPrint('Error creating comment notification: $e');
    }
  }

  /// Create gift notification
  Future<void> notifyGift({
    required String targetUserId,
    required String giftName,
  }) async {
    try {
      final user = _authService.currentUser;
      if (user == null) return;

      await createNotification(
        recipientId: targetUserId,
        type: 'gift',
        title: 'You Received a Gift!',
        body: '${user.displayName ?? "A user"} sent you a $giftName',
        actionId: user.uid,
      );
    } catch (e) {
      debugPrint('Error creating gift notification: $e');
    }
  }

  /// Create message notification
  Future<void> notifyMessage({
    required String targetUserId,
    required String senderId,
    required String messagePreview,
  }) async {
    try {
      final user = _authService.currentUser;
      if (user == null) return;

      await createNotification(
        recipientId: targetUserId,
        type: 'message',
        title: 'New Message',
        body: messagePreview,
        actionId: senderId,
      );
    } catch (e) {
      debugPrint('Error creating message notification: $e');
    }
  }

  // ─────────────────────────────── NOTIFICATION RETRIEVAL ───────────────────────────────

  /// Get notifications stream (real-time)
  Stream<QuerySnapshot> getNotifications({int limit = 50}) {
    final user = _authService.currentUser;
    if (user == null) {
      throw Exception('User must be logged in');
    }

    return _firestore
        .collection('notifications')
        .where('recipientId', isEqualTo: user.uid)
        .orderBy('createdAt', descending: true)
        .limit(limit)
        .snapshots();
  }

  /// Get unread notifications count
  Future<int> getUnreadCount() async {
    try {
      final user = _authService.currentUser;
      if (user == null) return 0;

      final snapshot = await _firestore
          .collection('notifications')
          .where('recipientId', isEqualTo: user.uid)
          .where('isRead', isEqualTo: false)
          .count()
          .get();

      return snapshot.count ?? 0;
    } catch (e) {
      debugPrint('Error getting unread count: $e');
      return 0;
    }
  }

  /// Get unread notifications stream
  Stream<QuerySnapshot> getUnreadNotifications() {
    final user = _authService.currentUser;
    if (user == null) {
      throw Exception('User must be logged in');
    }

    return _firestore
        .collection('notifications')
        .where('recipientId', isEqualTo: user.uid)
        .where('isRead', isEqualTo: false)
        .orderBy('createdAt', descending: true)
        .snapshots();
  }

  // ─────────────────────────────── NOTIFICATION MANAGEMENT ───────────────────────────────

  /// Mark notification as read
  Future<void> markAsRead(String notificationId) async {
    try {
      await _firestore.collection('notifications').doc(notificationId).update({
        'isRead': true,
        'readAt': FieldValue.serverTimestamp(),
      });
    } catch (e) {
      debugPrint('Error marking notification as read: $e');
    }
  }

  /// Mark all notifications as read
  Future<void> markAllAsRead() async {
    try {
      final user = _authService.currentUser;
      if (user == null) return;

      final snapshot = await _firestore
          .collection('notifications')
          .where('recipientId', isEqualTo: user.uid)
          .where('isRead', isEqualTo: false)
          .get();

      for (var doc in snapshot.docs) {
        await doc.reference.update({
          'isRead': true,
          'readAt': FieldValue.serverTimestamp(),
        });
      }
    } catch (e) {
      debugPrint('Error marking all notifications as read: $e');
    }
  }

  /// Delete notification
  Future<void> deleteNotification(String notificationId) async {
    try {
      await _firestore.collection('notifications').doc(notificationId).delete();
    } catch (e) {
      debugPrint('Error deleting notification: $e');
    }
  }

  /// Delete all notifications
  Future<void> deleteAllNotifications() async {
    try {
      final user = _authService.currentUser;
      if (user == null) return;

      final snapshot = await _firestore
          .collection('notifications')
          .where('recipientId', isEqualTo: user.uid)
          .get();

      for (var doc in snapshot.docs) {
        await doc.reference.delete();
      }
    } catch (e) {
      debugPrint('Error deleting all notifications: $e');
    }
  }

  // ─────────────────────────────── NOTIFICATION PREFERENCES ───────────────────────────────

  /// Update notification preferences
  Future<void> updateNotificationPreferences(
      Map<String, bool> preferences) async {
    try {
      final user = _authService.currentUser;
      if (user == null) return;

      await _firestore.collection('users').doc(user.uid).update({
        'notificationPreferences': preferences,
      });
    } catch (e) {
      debugPrint('Error updating notification preferences: $e');
    }
  }

  /// Get notification preferences
  Future<Map<String, dynamic>> getNotificationPreferences() async {
    try {
      final user = _authService.currentUser;
      if (user == null) return {};

      final doc = await _firestore.collection('users').doc(user.uid).get();
      if (doc.exists) {
        return doc.get('notificationPreferences') ?? {};
      }
      return {};
    } catch (e) {
      debugPrint('Error getting notification preferences: $e');
      return {};
    }
  }

  /// Disable notifications for a specific type
  Future<void> disableNotificationType(String type) async {
    try {
      final user = _authService.currentUser;
      if (user == null) return;

      await _firestore.collection('users').doc(user.uid).update({
        'notificationPreferences.$type': false,
      });
    } catch (e) {
      debugPrint('Error disabling notification type: $e');
    }
  }

  /// Enable notifications for a specific type
  Future<void> enableNotificationType(String type) async {
    try {
      final user = _authService.currentUser;
      if (user == null) return;

      await _firestore.collection('users').doc(user.uid).update({
        'notificationPreferences.$type': true,
      });
    } catch (e) {
      debugPrint('Error enabling notification type: $e');
    }
  }
}
