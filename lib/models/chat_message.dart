
import 'package:cloud_firestore/cloud_firestore.dart';

class ChatMessage {
  final String id;
  final String senderId;
  final String receiverId;
  final String? text;
  final String? mediaUrl;
  final String? mediaType;
  final Timestamp timestamp;
  final bool isEphemeral;
  final List<String> viewedBy;

  ChatMessage({
    required this.id,
    required this.senderId,
    required this.receiverId,
    this.text,
    this.mediaUrl,
    this.mediaType,
    required this.timestamp,
    this.isEphemeral = false,
    this.viewedBy = const [],
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: json['id'],
      senderId: json['senderId'],
      receiverId: json['receiverId'],
      text: json['text'],
      mediaUrl: json['mediaUrl'],
      mediaType: json['mediaType'],
      timestamp: json['timestamp'] as Timestamp,
      isEphemeral: json['isEphemeral'] ?? false,
      viewedBy: List<String>.from(json['viewedBy'] ?? []),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'senderId': senderId,
      'receiverId': receiverId,
      'text': text,
      'mediaUrl': mediaUrl,
      'mediaType': mediaType,
      'timestamp': timestamp,
      'isEphemeral': isEphemeral,
      'viewedBy': viewedBy,
    };
  }
}

