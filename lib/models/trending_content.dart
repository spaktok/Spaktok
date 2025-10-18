import 'package:cloud_firestore/cloud_firestore.dart';

class TrendingContent {
  final String id;
  final String title;
  final String description;
  final String thumbnailUrl;
  final String contentType; // e.g., 'story', 'reel', 'live_stream'
  final String contentId; // ID of the actual content
  final int viewsCount;
  final Timestamp timestamp;

  TrendingContent({
    required this.id,
    required this.title,
    required this.description,
    required this.thumbnailUrl,
    required this.contentType,
    required this.contentId,
    required this.viewsCount,
    required this.timestamp,
  });

  factory TrendingContent.fromJson(Map<String, dynamic> json) {
    return TrendingContent(
      id: json['id'] as String,
      title: json['title'] as String,
      description: json['description'] as String,
      thumbnailUrl: json['thumbnailUrl'] as String,
      contentType: json['contentType'] as String,
      contentId: json['contentId'] as String,
      viewsCount: json['viewsCount'] as int,
      timestamp: json['timestamp'] as Timestamp,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'thumbnailUrl': thumbnailUrl,
      'contentType': contentType,
      'contentId': contentId,
      'viewsCount': viewsCount,
      'timestamp': timestamp,
    };
  }
}

