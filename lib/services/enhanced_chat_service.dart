
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
    String? mediaType,
    bool isEphemeral = false,
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
          .add(messageData);

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

