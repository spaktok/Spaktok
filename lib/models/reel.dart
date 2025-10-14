import 'package:cloud_firestore/cloud_firestore.dart';

class Reel {
  final String id;
  final String userId;
  final String videoUrl;
  final String description;
  final Timestamp timestamp;
  final int likesCount;
  final int commentsCount;
  bool isSaved;

  Reel({
    required this.id,
    required this.userId,
    required this.videoUrl,
    this.description = '',
    required this.timestamp,
    this.likesCount = 0,
    this.commentsCount = 0,
    this.isSaved = false,
  });

  factory Reel.fromJson(Map<String, dynamic> json) {
    return Reel(
      id: json['id'],
      userId: json['userId'],
      videoUrl: json['videoUrl'],
      description: json['description'] ?? '',
      timestamp: json['timestamp'] as Timestamp,
      likesCount: json['likesCount'] ?? 0,
      commentsCount: json["commentsCount"] ?? 0,
      isSaved: json["isSaved"] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'videoUrl': videoUrl,
      'description': description,
      'timestamp': timestamp,
      'likesCount': likesCount,
      'commentsCount': commentsCount,
      'isSaved': isSaved,
    };
  }
}

