import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'dart:async';

class DisappearingMessagesService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseStorage _storage = FirebaseStorage.instance;

  // Send disappearing message
  Future<String> sendDisappearingMessage({
    required String chatId,
    required String senderId,
    required String receiverId,
    required String content,
    required String type, // text, image, video, audio
    String? mediaUrl,
    int? disappearAfterSeconds, // null = disappear after read
  }) async {
    try {
      final messageRef = await _firestore
          .collection('chats')
          .doc(chatId)
          .collection('messages')
          .add({
        'senderId': senderId,
        'receiverId': receiverId,
        'content': content,
        'type': type,
        'mediaUrl': mediaUrl,
        'isDisappearing': true,
        'disappearAfterSeconds': disappearAfterSeconds,
        'isRead': false,
        'readAt': null,
        'disappearsAt': null,
        'createdAt': FieldValue.serverTimestamp(),
      });

      // Update chat last message
      await _firestore.collection('chats').doc(chatId).update({
        'lastMessage': '🔒 Disappearing message',
        'lastMessageTime': FieldValue.serverTimestamp(),
        'lastMessageSenderId': senderId,
      });

      return messageRef.id;
    } catch (e) {
      print('Error sending disappearing message: $e');
      rethrow;
    }
  }

  // Mark message as read and start disappearing timer
  Future<void> markAsRead(String chatId, String messageId) async {
    try {
      final messageRef = _firestore
          .collection('chats')
          .doc(chatId)
          .collection('messages')
          .doc(messageId);

      final messageDoc = await messageRef.get();
      if (!messageDoc.exists) return;

      final messageData = messageDoc.data()!;
      final disappearAfterSeconds = messageData['disappearAfterSeconds'] as int?;

      DateTime? disappearsAt;
      if (disappearAfterSeconds != null) {
        disappearsAt = DateTime.now().add(Duration(seconds: disappearAfterSeconds));
      } else {
        // Disappear immediately after read
        disappearsAt = DateTime.now().add(const Duration(seconds: 5));
      }

      await messageRef.update({
        'isRead': true,
        'readAt': FieldValue.serverTimestamp(),
        'disappearsAt': Timestamp.fromDate(disappearsAt),
      });

      // Schedule message deletion
      _scheduleMessageDeletion(chatId, messageId, disappearsAt);
    } catch (e) {
      print('Error marking message as read: $e');
    }
  }

  // Schedule message deletion
  void _scheduleMessageDeletion(
    String chatId,
    String messageId,
    DateTime disappearsAt,
  ) {
    final duration = disappearsAt.difference(DateTime.now());
    if (duration.isNegative) {
      // Delete immediately
      deleteMessage(chatId, messageId);
    } else {
      // Schedule deletion
      Timer(duration, () {
        deleteMessage(chatId, messageId);
      });
    }
  }

  // Delete message
  Future<void> deleteMessage(String chatId, String messageId) async {
    try {
      final messageDoc = await _firestore
          .collection('chats')
          .doc(chatId)
          .collection('messages')
          .doc(messageId)
          .get();

      if (!messageDoc.exists) return;

      final messageData = messageDoc.data()!;
      final mediaUrl = messageData['mediaUrl'] as String?;

      // Delete media from storage if exists
      if (mediaUrl != null) {
        try {
          final ref = _storage.refFromURL(mediaUrl);
          await ref.delete();
        } catch (e) {
          print('Error deleting media from storage: $e');
        }
      }

      // Delete message document
      await messageDoc.reference.delete();
    } catch (e) {
      print('Error deleting message: $e');
    }
  }

  // Get disappearing messages for a chat
  Stream<QuerySnapshot> getDisappearingMessages(String chatId) {
    return _firestore
        .collection('chats')
        .doc(chatId)
        .collection('messages')
        .where('isDisappearing', isEqualTo: true)
        .orderBy('createdAt', descending: true)
        .snapshots();
  }

  // Enable/disable disappearing messages for a chat
  Future<void> toggleDisappearingMessages({
    required String chatId,
    required bool enabled,
    int? defaultDisappearAfterSeconds,
  }) async {
    try {
      await _firestore.collection('chats').doc(chatId).update({
        'disappearingMessagesEnabled': enabled,
        'defaultDisappearAfterSeconds': defaultDisappearAfterSeconds ?? 24 * 60 * 60, // 24 hours
      });
    } catch (e) {
      print('Error toggling disappearing messages: $e');
      rethrow;
    }
  }

  // Check if disappearing messages are enabled for a chat
  Future<bool> isDisappearingMessagesEnabled(String chatId) async {
    try {
      final chatDoc = await _firestore.collection('chats').doc(chatId).get();
      if (!chatDoc.exists) return false;

      final chatData = chatDoc.data()!;
      return chatData['disappearingMessagesEnabled'] ?? false;
    } catch (e) {
      print('Error checking disappearing messages status: $e');
      return false;
    }
  }

  // Send screenshot notification
  Future<void> sendScreenshotNotification({
    required String chatId,
    required String userId,
    required String messageId,
  }) async {
    try {
      await _firestore
          .collection('chats')
          .doc(chatId)
          .collection('notifications')
          .add({
        'type': 'screenshot',
        'userId': userId,
        'messageId': messageId,
        'timestamp': FieldValue.serverTimestamp(),
      });
    } catch (e) {
      print('Error sending screenshot notification: $e');
    }
  }

  // Clean up expired messages (should be called periodically)
  Future<void> cleanupExpiredMessages() async {
    try {
      final now = Timestamp.now();
      
      // Query all chats
      final chatsSnapshot = await _firestore.collection('chats').get();

      for (final chatDoc in chatsSnapshot.docs) {
        // Query expired messages
        final expiredMessages = await _firestore
            .collection('chats')
            .doc(chatDoc.id)
            .collection('messages')
            .where('isDisappearing', isEqualTo: true)
            .where('disappearsAt', isLessThan: now)
            .get();

        // Delete expired messages
        for (final messageDoc in expiredMessages.docs) {
          await deleteMessage(chatDoc.id, messageDoc.id);
        }
      }
    } catch (e) {
      print('Error cleaning up expired messages: $e');
    }
  }
}
