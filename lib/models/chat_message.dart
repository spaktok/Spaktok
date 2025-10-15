
import 'package:cloud_firestore/cloud_firestore.dart';

class ChatMessage {
  final String id;
  final String senderId;
  final String receiverId;
  final String? text;
  final String? mediaUrl;
  final String? mediaType;
  final Timestamp timestamp;
<<<<<<< HEAD
  final bool isEphemeral;
  final List<String> viewedBy;
=======
  final bool isDisappearing; // لتحديد ما إذا كانت الرسالة تختفي
  final int? disappearAfterSeconds; // مدة اختفاء الرسالة بالثواني (اختياري)
  final Timestamp? disappearsAt; // وقت اختفاء الرسالة
  final bool? isRead; // لتتبع ما إذا كانت الرسالة قد قرئت
>>>>>>> origin/cursor/send-arabic-greeting-070f

  ChatMessage({
    required this.id,
    required this.senderId,
    required this.receiverId,
    this.text,
    this.mediaUrl,
    this.mediaType,
    required this.timestamp,
<<<<<<< HEAD
    this.isEphemeral = false,
    this.viewedBy = const [],
=======
    this.isDisappearing = false,
    this.disappearAfterSeconds,
    this.disappearsAt,
    this.isRead = false,
>>>>>>> origin/cursor/send-arabic-greeting-070f
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
<<<<<<< HEAD
      isEphemeral: json['isEphemeral'] ?? false,
      viewedBy: List<String>.from(json['viewedBy'] ?? []),
=======
      isDisappearing: json['isDisappearing'] ?? false,
      disappearAfterSeconds: json["disappearAfterSeconds"],
      disappearsAt: json["disappearsAt"] as Timestamp?,
      isRead: json["isRead"] ?? false,
>>>>>>> origin/cursor/send-arabic-greeting-070f
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
<<<<<<< HEAD
      'isEphemeral': isEphemeral,
      'viewedBy': viewedBy,
=======
      'isDisappearing': isDisappearing,
      'disappearAfterSeconds': disappearAfterSeconds,
      'disappearsAt': disappearsAt,
      'isRead': isRead,
>>>>>>> origin/cursor/send-arabic-greeting-070f
    };
  }
}

