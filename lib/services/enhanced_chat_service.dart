
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:spaktok/services/auth_service.dart';
import 'dart:io';


class EnhancedChatService {
  static EnhancedChatService? _instance;
  static EnhancedChatService get instance {
    _instance ??= EnhancedChatService._();
    return _instance!;
  }

  EnhancedChatService._();

  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseStorage _storage = FirebaseStorage.instance;
  final AuthService _authService = AuthService();

  // Create or get a chat room
  Future<String> createChatRoom(String currentUserId, String otherUserId) async {
    try {
      // Create a unique chat room ID by sorting participant UIDs
      final participants = [currentUserId, otherUserId]..sort();
      final chatRoomId = participants.join('_');

      // Check if chat room already exists
      final chatRoomDoc = await _firestore.collection('conversations').doc(chatRoomId).get();

      if (!chatRoomDoc.exists) {
        // Create new chat room
        await _firestore.collection('conversations').doc(chatRoomId).set({
          'participants': participants,
          'createdAt': FieldValue.serverTimestamp(),
          'lastMessage': null,
          'updatedAt': FieldValue.serverTimestamp(),
        });
      }

      return chatRoomId;
    } catch (e) {
      throw Exception('Failed to create chat room: $e');
    }
  }

  // Send a message (text or media)
  Future<void> sendMessage({
    required String chatRoomId,
    required String senderId,
    String? text,
    String? mediaUrl,
<<<<<<< HEAD
    String? mediaType,
    bool isEphemeral = false,
=======
    bool isDisappearing = false,
    int? disappearAfterSeconds,
>>>>>>> origin/cursor/send-arabic-greeting-070f
  }) async {
    if (text == null && mediaUrl == null) {
      throw ArgumentError('Either text or mediaUrl must be provided.');
    }

    try {
      final messageData = {
        'senderId': senderId,
        'text': text,
        'mediaUrl': mediaUrl,
        'mediaType': mediaType,
        'timestamp': FieldValue.serverTimestamp(),
        'isEphemeral': isEphemeral,
        'viewedBy': [],
      };

      await _firestore
          .collection('conversations')
          .doc(chatRoomId)
          .collection('messages')
<<<<<<< HEAD
          .add(messageData);
=======
          .add({
        'senderId': user.uid,
        'senderName': user.displayName ?? 'Anonymous',
        'senderPhotoUrl': user.photoURL,
        'message': message,
        'type': type.toString(),
        'mediaUrl': mediaUrl,
        'timestamp': FieldValue.serverTimestamp(),
        'isRead': false,
        'isDisappearing': isDisappearing,
        'disappearAfterSeconds': disappearAfterSeconds,
        'disappearsAt': isDisappearing && disappearAfterSeconds != null
            ? Timestamp.fromDate(DateTime.now().add(Duration(seconds: disappearAfterSeconds)))
            : null,
      });
>>>>>>> origin/cursor/send-arabic-greeting-070f

      // Update lastMessage in conversation
      await _firestore.collection('conversations').doc(chatRoomId).update({
        'lastMessage': {
          'senderId': senderId,
          'text': text ?? (mediaType != null ? 'Sent a $mediaType' : ''),
          'timestamp': FieldValue.serverTimestamp(),
          'type': mediaType ?? 'text',
        },
        'updatedAt': FieldValue.serverTimestamp(),
      });
    } catch (e) {
      throw Exception('Failed to send message: $e');
    }
  }

  // Upload chat media file to Firebase Storage
  Future<String?> uploadChatMedia(String filePath, String userId) async {
    try {
      File file = File(filePath);
      String fileName = 'chat_media/${userId}/${DateTime.now().millisecondsSinceEpoch}_${file.path.split('/').last}';
      UploadTask uploadTask = _storage.ref().child(fileName).putFile(file);
      TaskSnapshot snapshot = await uploadTask;
      return await snapshot.ref.getDownloadURL();
    } catch (e) {
      print('Error uploading chat media: $e');
      return null;
    }
  }

  // Get messages stream for a chat room
  Stream<QuerySnapshot> getMessages(String chatRoomId) {
    return _firestore
        .collection('conversations')
        .doc(chatRoomId)
        .collection('messages')
        .orderBy('timestamp', descending: true)
        .snapshots();
  }

  // Send a screenshot notification (this would typically trigger a Cloud Function)
  Future<void> sendScreenshotNotification({
    required String chatId,
    required String userId,
    required String messageId,
  }) async {
    try {
      // This is a placeholder. In a real app, you might call a Cloud Function
      // to notify the other user that a screenshot was taken.
      print('Screenshot detected in chat $chatId by user $userId for message $messageId');
      // Example of calling a Cloud Function (if implemented):
      // final callable = FirebaseFunctions.instance.httpsCallable('notifyScreenshot');
      // await callable.call({'chatId': chatId, 'userId': userId, 'messageId': messageId});
    } catch (e) {
      print('Error sending screenshot notification: $e');
    }
  }

  // Other chat-related methods (getChatRooms, markMessagesAsRead, deleteMessage, deleteChatRoom, etc.)
  // ... (keep existing methods or adapt as needed)

  // Get chat rooms stream
  Stream<QuerySnapshot> getChatRooms() {
    final user = _authService.currentUser;
    if (user == null) {
      throw Exception('User must be logged in');
    }

    return _firestore
        .collection('conversations')
        .where('participants', arrayContains: user.uid)
        .orderBy('updatedAt', descending: true)
        .snapshots();
  }

  // Mark messages as read (simplified for new model)
  Future<void> markMessageAsViewed(String chatRoomId, String messageId, String userId) async {
    try {
      await _firestore
          .collection('conversations')
          .doc(chatRoomId)
          .collection('messages')
          .doc(messageId)
          .update({
        'viewedBy': FieldValue.arrayUnion([userId]),
      });
    } catch (e) {
      throw Exception('Failed to mark message as viewed: $e');
    }
  }

  // Delete message (ephemeral messages are handled by Cloud Function)
  Future<void> deleteMessage(String chatRoomId, String messageId) async {
    try {
      await _firestore
          .collection('conversations')
          .doc(chatRoomId)
          .collection('messages')
          .doc(messageId)
          .delete();
    } catch (e) {
      throw Exception('Failed to delete message: $e');
    }
  }

  // Delete chat room (conversation)
  Future<void> deleteChatRoom(String chatRoomId) async {
    try {
      // Delete all messages in the subcollection
      final messages = await _firestore
          .collection('conversations')
          .doc(chatRoomId)
          .collection('messages')
          .get();

      for (var doc in messages.docs) {
        await doc.reference.delete();
      }

      // Delete the conversation document itself
      await _firestore.collection('conversations').doc(chatRoomId).delete();
    } catch (e) {
      throw Exception('Failed to delete chat room: $e');
    }
  }

  // Placeholder for chat settings (if needed, adapt from previous version)
  Future<Map<String, dynamic>> getChatSettings() async {
    // Implement as needed, or remove if not used
    return {};
  }

  Future<void> updateChatSettings(Map<String, dynamic> settings) async {
    // Implement as needed, or remove if not used
  }

  Future<void> enableCameraBackground(bool enable) async {
    // Implement as needed, or remove if not used
  }

  Future<bool> isCameraBackgroundEnabled() async {
    // Implement as needed, or remove if not used
    return false;
  }
}

<<<<<<< HEAD
=======

  // Schedule message deletion
  void _scheduleMessageDeletion(
    String chatRoomId,
    String messageId,
    DateTime disappearsAt,
  ) {
    final duration = disappearsAt.difference(DateTime.now());
    if (duration.isNegative) {
      // Delete immediately
      deleteMessage(chatRoomId, messageId);
    } else {
      // Schedule deletion
      Timer(duration, () {
        deleteMessage(chatRoomId, messageId);
      });
    }
  }

  // Mark message as read and start disappearing timer
  Future<void> markAsReadAndScheduleDisappearance(String chatRoomId, String messageId) async {
    try {
      final messageRef = _firestore
          .collection("chatRooms")
          .doc(chatRoomId)
          .collection("messages")
          .doc(messageId);

      final messageDoc = await messageRef.get();
      if (!messageDoc.exists) return;

      final messageData = messageDoc.data()!;
      final disappearAfterSeconds = messageData["disappearAfterSeconds"] as int?;

      DateTime? disappearsAt;
      if (disappearAfterSeconds != null) {
        disappearsAt = DateTime.now().add(Duration(seconds: disappearAfterSeconds));
      } else {
        // Default to 5 seconds if not specified for disappearing messages
        disappearsAt = DateTime.now().add(const Duration(seconds: 5));
      }

      await messageRef.update({
        "isRead": true,
        "readAt": FieldValue.serverTimestamp(),
        "disappearsAt": Timestamp.fromDate(disappearsAt),
      });

      _scheduleMessageDeletion(chatRoomId, messageId, disappearsAt);
    } catch (e) {
      print("Error marking message as read and scheduling disappearance: $e");
    }
  }

  // Toggle disappearing messages for a chat room
  Future<void> toggleDisappearingMessages({
    required String chatRoomId,
    required bool enabled,
    int? defaultDisappearAfterSeconds,
  }) async {
    try {
      await _firestore.collection("chatRooms").doc(chatRoomId).update({
        "disappearingMessagesEnabled": enabled,
        "defaultDisappearAfterSeconds": defaultDisappearAfterSeconds ?? 24 * 60 * 60, // Default to 24 hours
      });
    } catch (e) {
      print("Error toggling disappearing messages: $e");
      rethrow;
    }
  }

  // Check if disappearing messages are enabled for a chat room
  Future<bool> isDisappearingMessagesEnabled(String chatRoomId) async {
    try {
      final chatDoc = await _firestore.collection("chatRooms").doc(chatRoomId).get();
      if (!chatDoc.exists) return false;

      final chatData = chatDoc.data()!;
      return chatData["disappearingMessagesEnabled"] ?? false;
    } catch (e) {
      print("Error checking disappearing messages status: $e");
      return false;
    }
  }

  // Clean up expired messages (should be called periodically, e.g., via Firebase Function)
  Future<void> cleanupExpiredMessages() async {
    try {
      final now = Timestamp.now();
      
      // Query all chats
      final chatsSnapshot = await _firestore.collection("chatRooms").get();

      for (final chatDoc in chatsSnapshot.docs) {
        // Query expired messages
        final expiredMessages = await _firestore
            .collection("chatRooms")
            .doc(chatDoc.id)
            .collection("messages")
            .where("isDisappearing", isEqualTo: true)
            .where("disappearsAt", isLessThan: now)
            .get();

        // Delete expired messages
        for (final messageDoc in expiredMessages.docs) {
          await deleteMessage(chatDoc.id, messageDoc.id);
        }
      }
    } catch (e) {
      print("Error cleaning up expired messages: $e");
    }
  }

>>>>>>> origin/cursor/send-arabic-greeting-070f
