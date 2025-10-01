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
