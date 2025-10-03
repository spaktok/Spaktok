import 'package:cloud_firestore/cloud_firestore.dart';

class ChatMessage {
  final String id;
  final String senderId;
  final String receiverId;
  final String content;
  final Timestamp timestamp;
  final bool isDisappearing; // لتحديد ما إذا كانت الرسالة تختفي
  final int? disappearAfterSeconds; // مدة اختفاء الرسالة بالثواني (اختياري)
  final Timestamp? disappearsAt; // وقت اختفاء الرسالة
  final bool? isRead; // لتتبع ما إذا كانت الرسالة قد قرئت

  ChatMessage({
    required this.id,
    required this.senderId,
    required this.receiverId,
    required this.content,
    required this.timestamp,
    this.isDisappearing = false,
    this.disappearAfterSeconds,
    this.disappearsAt,
    this.isRead = false,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: json['id'],
      senderId: json['senderId'],
      receiverId: json['receiverId'],
      content: json['content'],
      timestamp: json['timestamp'] as Timestamp,
      isDisappearing: json['isDisappearing'] ?? false,
      disappearAfterSeconds: json["disappearAfterSeconds"],
      disappearsAt: json["disappearsAt"] as Timestamp?,
      isRead: json["isRead"] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'senderId': senderId,
      'receiverId': receiverId,
      'content': content,
      'timestamp': timestamp,
      'isDisappearing': isDisappearing,
      'disappearAfterSeconds': disappearAfterSeconds,
      'disappearsAt': disappearsAt,
      'isRead': isRead,
    };
  }
}

