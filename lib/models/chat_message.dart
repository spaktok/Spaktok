import 'package:cloud_firestore/cloud_firestore.dart';

enum MessageType { text, image, video, audio }
enum MessageStatus { sending, sent, delivered, read }

class ChatMessage {
  final String id;
  final String chatRoomId;
  final String senderId;
  final MessageType type;
  final Timestamp timestamp;

  // Content fields
  final String? text;
  final String? mediaUrl;
  final int? audioDuration;

  // Status fields
  final MessageStatus status;
  final bool isEphemeral;

  ChatMessage({
    required this.id,
    required this.chatRoomId,
    required this.senderId,
    required this.type,
    required this.timestamp,
    this.text,
    this.mediaUrl,
    this.audioDuration,
    this.status = MessageStatus.sending,
    this.isEphemeral = false,
  });

  factory ChatMessage.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return ChatMessage(
      id: doc.id,
      chatRoomId: data['chatRoomId'] ?? '',
      senderId: data['senderId'] ?? '',
      type: MessageType.values.firstWhere((e) => e.name == data['type'], orElse: () => MessageType.text),
      timestamp: data['timestamp'] ?? Timestamp.now(),
      text: data['text'],
      mediaUrl: data['mediaUrl'],
      audioDuration: data['audioDuration'],
      status: MessageStatus.values.firstWhere((e) => e.name == data['status'], orElse: () => MessageStatus.sent),
      isEphemeral: data['isEphemeral'] ?? false,
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'chatRoomId': chatRoomId,
      'senderId': senderId,
      'type': type.name,
      'timestamp': timestamp,
      'text': text,
      'mediaUrl': mediaUrl,
      'audioDuration': audioDuration,
      'status': status.name,
      'isEphemeral': isEphemeral,
    };
  }
}
