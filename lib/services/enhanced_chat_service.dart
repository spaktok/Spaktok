import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:spaktok/services/auth_service.dart';
import 'dart:io';

enum MessageType {
  text,
  image,
  video,
  audio,
  gif,
}

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
  Future<String> createChatRoom(String otherUserId) async {
    try {
      final user = _authService.currentUser;
      if (user == null) {
        throw Exception('User must be logged in');
      }

      // Create a unique chat room ID
      final participants = [user.uid, otherUserId]..sort();
      final chatRoomId = participants.join('_');

      // Check if chat room already exists
      final chatRoomDoc = await _firestore.collection('chatRooms').doc(chatRoomId).get();

      if (!chatRoomDoc.exists) {
        // Create new chat room
        await _firestore.collection('chatRooms').doc(chatRoomId).set({
          'participants': participants,
          'createdAt': FieldValue.serverTimestamp(),
          'lastMessage': null,
          'lastMessageTime': null,
          'unreadCount': {user.uid: 0, otherUserId: 0},
        });
      }

      return chatRoomId;
    } catch (e) {
      throw Exception('Failed to create chat room: $e');
    }
  }

  // Send a text message
  Future<void> sendMessage({
    required String chatRoomId,
    required String message,
    MessageType type = MessageType.text,
    String? mediaUrl,
    bool isDisappearing = false,
    int? disappearAfterSeconds,
  }) async {
    try {
      final user = _authService.currentUser;
      if (user == null) {
        throw Exception('User must be logged in');
      }

      // Add message to chat room
      await _firestore
          .collection('chatRooms')
          .doc(chatRoomId)
          .collection('messages')
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

      // Update last message in chat room
      await _firestore.collection('chatRooms').doc(chatRoomId).update({
        'lastMessage': message,
        'lastMessageTime': FieldValue.serverTimestamp(),
      });
    } catch (e) {
      throw Exception('Failed to send message: $e');
    }
  }

  // Upload media file
  Future<String> uploadMediaFile(File file, String chatRoomId, MessageType type) async {
    try {
      final user = _authService.currentUser;
      if (user == null) {
        throw Exception('User must be logged in');
      }

      String folder;
      switch (type) {
        case MessageType.image:
          folder = 'images';
          break;
        case MessageType.video:
          folder = 'videos';
          break;
        case MessageType.audio:
          folder = 'audio';
          break;
        default:
          folder = 'files';
      }

      final fileName = '${DateTime.now().millisecondsSinceEpoch}_${file.path.split('/').last}';
      final ref = _storage.ref().child('chats/$chatRoomId/$folder/$fileName');
      
      await ref.putFile(file);
      final url = await ref.getDownloadURL();
      
      return url;
    } catch (e) {
      throw Exception('Failed to upload media: $e');
    }
  }

  // Send image message
  Future<void> sendImageMessage({
    required String chatRoomId,
    required File imageFile,
  }) async {
    try {
      final url = await uploadMediaFile(imageFile, chatRoomId, MessageType.image);
      await sendMessage(
        chatRoomId: chatRoomId,
        message: 'Image',
        type: MessageType.image,
        mediaUrl: url,
      );
    } catch (e) {
      throw Exception('Failed to send image: $e');
    }
  }

  // Send video message
  Future<void> sendVideoMessage({
    required String chatRoomId,
    required File videoFile,
  }) async {
    try {
      final url = await uploadMediaFile(videoFile, chatRoomId, MessageType.video);
      await sendMessage(
        chatRoomId: chatRoomId,
        message: 'Video',
        type: MessageType.video,
        mediaUrl: url,
      );
    } catch (e) {
      throw Exception('Failed to send video: $e');
    }
  }

  // Get messages stream
  Stream<QuerySnapshot> getMessages(String chatRoomId) {
    return _firestore
        .collection('chatRooms')
        .doc(chatRoomId)
        .collection('messages')
        .orderBy('timestamp', descending: false)
        .snapshots();
  }

  // Get chat rooms stream
  Stream<QuerySnapshot> getChatRooms() {
    final user = _authService.currentUser;
    if (user == null) {
      throw Exception('User must be logged in');
    }

    return _firestore
        .collection('chatRooms')
        .where('participants', arrayContains: user.uid)
        .orderBy('lastMessageTime', descending: true)
        .snapshots();
  }

  // Mark messages as read
  Future<void> markMessagesAsRead(String chatRoomId) async {
    try {
      final user = _authService.currentUser;
      if (user == null) return;

      final messages = await _firestore
          .collection('chatRooms')
          .doc(chatRoomId)
          .collection('messages')
          .where('senderId', isNotEqualTo: user.uid)
          .where('isRead', isEqualTo: false)
          .get();

      for (var doc in messages.docs) {
        await doc.reference.update({'isRead': true});
      }
    } catch (e) {
      throw Exception('Failed to mark messages as read: $e');
    }
  }

  // Delete message
  Future<void> deleteMessage(String chatRoomId, String messageId) async {
    try {
      await _firestore
          .collection('chatRooms')
          .doc(chatRoomId)
          .collection('messages')
          .doc(messageId)
          .delete();
    } catch (e) {
      throw Exception('Failed to delete message: $e');
    }
  }

  // Delete chat room
  Future<void> deleteChatRoom(String chatRoomId) async {
    try {
      // Delete all messages
      final messages = await _firestore
          .collection('chatRooms')
          .doc(chatRoomId)
          .collection('messages')
          .get();

      for (var doc in messages.docs) {
        await doc.reference.delete();
      }

      // Delete chat room
      await _firestore.collection('chatRooms').doc(chatRoomId).delete();
    } catch (e) {
      throw Exception('Failed to delete chat room: $e');
    }
  }

  // Get user's chat settings
  Future<Map<String, dynamic>> getChatSettings() async {
    try {
      final user = _authService.currentUser;
      if (user == null) {
        throw Exception('User must be logged in');
      }

      final doc = await _firestore
          .collection('users')
          .doc(user.uid)
          .collection('settings')
          .doc('chat')
          .get();

      if (doc.exists) {
        return doc.data() as Map<String, dynamic>;
      } else {
        // Return default settings
        return {
          'cameraBackgroundEnabled': false,
          'notificationsEnabled': true,
          'soundEnabled': true,
        };
      }
    } catch (e) {
      throw Exception('Failed to get chat settings: $e');
    }
  }

  // Update chat settings
  Future<void> updateChatSettings(Map<String, dynamic> settings) async {
    try {
      final user = _authService.currentUser;
      if (user == null) {
        throw Exception('User must be logged in');
      }

      await _firestore
          .collection('users')
          .doc(user.uid)
          .collection('settings')
          .doc('chat')
          .set(settings, SetOptions(merge: true));
    } catch (e) {
      throw Exception('Failed to update chat settings: $e');
    }
  }

  // Enable camera background for chat
  Future<void> enableCameraBackground(bool enable) async {
    try {
      await updateChatSettings({'cameraBackgroundEnabled': enable});
    } catch (e) {
      throw Exception('Failed to enable camera background: $e');
    }
  }

  // Check if camera background is enabled
  Future<bool> isCameraBackgroundEnabled() async {
    try {
      final settings = await getChatSettings();
      return settings['cameraBackgroundEnabled'] ?? false;
    } catch (e) {
      return false;
    }
  }
}


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

