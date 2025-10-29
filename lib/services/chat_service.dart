import 'dart:io';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:spaktok/models/chat_message.dart';

class ChatService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseStorage _storage = FirebaseStorage.instance;

  /// Get or create a chat room ID for two users
  Future<String> getChatRoomId(String userId1, String userId2) async {
    final ids = [userId1, userId2]..sort();
    return ids.join('_');
  }

  /// Get a stream of messages for a chat room
  Stream<List<ChatMessage>> getMessages(String chatRoomId) {
    return _firestore
        .collection('chat_rooms').doc(chatRoomId).collection('messages')
        .orderBy('timestamp', descending: true)
        .snapshots()
        .map((snapshot) => snapshot.docs.map((doc) => ChatMessage.fromFirestore(doc)).toList());
  }

  /// Send a message
  Future<void> sendMessage(ChatMessage message) async {
    await _firestore
        .collection('chat_rooms').doc(message.chatRoomId).collection('messages')
        .doc(message.id)
        .set(message.toFirestore());
    // Here you would also update the 'lastMessage' for the chat room document
  }

  /// Upload a media file (image, video, audio) to Firebase Storage
  Future<String> uploadMedia(File file, String chatRoomId, String fileName) async {
    final ref = _storage.ref().child('chat_media').child(chatRoomId).child(fileName);
    final uploadTask = await ref.putFile(file);
    return await uploadTask.ref.getDownloadURL();
  }

  /// Update the status of a message
  Future<void> updateMessageStatus(String chatRoomId, String messageId, MessageStatus status) async {
    await _firestore
        .collection('chat_rooms').doc(chatRoomId).collection('messages').doc(messageId)
        .update({'status': status.name});
  }

  /// Set the typing status for a user in a chat room
  Future<void> setTypingStatus(String chatRoomId, String userId, bool isTyping) async {
    // This requires a different structure, e.g., updating the chat room document
    await _firestore.collection('chat_rooms').doc(chatRoomId).set({
      'typing_status': {
        userId: isTyping,
      }
    }, SetOptions(merge: true));
  }

  /// Get the typing status stream for a user in a chat room
  Stream<bool> getTypingStatus(String chatRoomId, String otherUserId) {
     return _firestore.collection('chat_rooms').doc(chatRoomId).snapshots().map((snapshot) {
         if(snapshot.exists && snapshot.data()!.containsKey('typing_status')){
             final typingStatus = snapshot.data()!['typing_status'];
             return typingStatus[otherUserId] ?? false;
         }
         return false;
     });
  }
}
