import 'package:cloud_firestore/cloud_firestore.dart';

enum MessageType { text, audio, video, image }

MessageType _messageTypeFromString(String? value) {
  switch (value) {
    case 'audio':
      return MessageType.audio;
    case 'video':
      return MessageType.video;
    case 'image':
      return MessageType.image;
    case 'text':
    default:
      return MessageType.text;
  }
}

String _messageTypeToString(MessageType type) {
  switch (type) {
    case MessageType.audio:
      return 'audio';
    case MessageType.video:
      return 'video';
    case MessageType.image:
      return 'image';
    case MessageType.text:
    default:
      return 'text';
  }
}

class ChatMessage {
  final String id;
  final String senderId;
  final String content;
  final MessageType type;
  final DateTime timestamp;
  final bool read;
  final Map<String, int> reactions;
  final DateTime? disappearingAt;

  ChatMessage({
    required this.id,
    required this.senderId,
    required this.content,
    required this.type,
    required this.timestamp,
    required this.read,
    required this.reactions,
    this.disappearingAt,
  });

  factory ChatMessage.fromFirestore(DocumentSnapshot<Map<String, dynamic>> doc) {
    final data = doc.data() ?? {};
    return ChatMessage(
      id: doc.id,
      senderId: data['senderId'] as String? ?? '',
      content: data['content'] as String? ?? '',
      type: _messageTypeFromString(data['type'] as String?),
      timestamp: (data['timestamp'] is Timestamp)
          ? (data['timestamp'] as Timestamp).toDate()
          : DateTime.fromMillisecondsSinceEpoch((data['timestamp'] as int?) ?? DateTime.now().millisecondsSinceEpoch),
      read: data['read'] as bool? ?? false,
      reactions: (data['reactions'] as Map<String, dynamic>? ?? {})
          .map((k, v) => MapEntry(k, (v as num).toInt())),
      disappearingAt: (data['disappearingAt'] is Timestamp)
          ? (data['disappearingAt'] as Timestamp).toDate()
          : null,
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'senderId': senderId,
      'content': content,
      'type': _messageTypeToString(type),
      'timestamp': Timestamp.fromDate(timestamp),
      'read': read,
      'reactions': reactions,
      if (disappearingAt != null) 'disappearingAt': Timestamp.fromDate(disappearingAt!),
    };
  }
}
