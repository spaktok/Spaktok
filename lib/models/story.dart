import 'package:cloud_firestore/cloud_firestore.dart';

class Story {
  final String id;
  final String userId;
  final String mediaUrl;
  final String mediaType; // 'image' or 'video'
  final Timestamp timestamp;
  final int duration; // in seconds

  Story({
    required this.id,
    required this.userId,
    required this.mediaUrl,
    required this.mediaType,
    required this.timestamp,
    required this.duration,
  });

  factory Story.fromJson(Map<String, dynamic> json) {
    return Story(
      id: json['id'],
      userId: json['userId'],
      mediaUrl: json['mediaUrl'],
      mediaType: json['mediaType'],
      timestamp: json['timestamp'] as Timestamp,
      duration: json['duration'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'mediaUrl': mediaUrl,
      'mediaType': mediaType,
      'timestamp': timestamp,
      'duration': duration,
    };
  }
}

