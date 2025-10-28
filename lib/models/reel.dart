import 'package:cloud_firestore/cloud_firestore.dart';

class Reel {
  final String id;
  final String userId;
  final String videoUrl;
  final String description;
  final Timestamp timestamp;
  final int likesCount;
  final int commentsCount;
  final List<String> hashtags;
  final String? musicId;
  final String? musicTitle;
  final String? musicArtist;
  final int sharesCount;
  final int savesCount;
  final String? challengeId;
  final String? duetWithId;
  final String? stitchWithId;
  final bool isDuet;
  final bool isStitch;
  final Map<String, dynamic>? location;

  Reel({
    required this.id,
    required this.userId,
    required this.videoUrl,
    this.description = '',
    required this.timestamp,
    this.likesCount = 0,
    this.commentsCount = 0,
    this.hashtags = const [],
    this.musicId,
    this.musicTitle,
    this.musicArtist,
    this.sharesCount = 0,
    this.savesCount = 0,
    this.challengeId,
    this.duetWithId,
    this.stitchWithId,
    this.isDuet = false,
    this.isStitch = false,
    this.location,
  });

  factory Reel.fromJson(Map<String, dynamic> json) {
    return Reel(
      id: json['id'],
      userId: json['userId'],
      videoUrl: json['videoUrl'],
      description: json['description'] ?? '',
      timestamp: json['timestamp'] as Timestamp,
      likesCount: json['likesCount'] ?? 0,
      commentsCount: json['commentsCount'] ?? 0,
      hashtags: List<String>.from(json['hashtags'] ?? []),
      musicId: json['musicId'],
      musicTitle: json['musicTitle'],
      musicArtist: json['musicArtist'],
      sharesCount: json['sharesCount'] ?? 0,
      savesCount: json['savesCount'] ?? 0,
      challengeId: json['challengeId'],
      duetWithId: json['duetWithId'],
      stitchWithId: json['stitchWithId'],
      isDuet: json['isDuet'] ?? false,
      isStitch: json['isStitch'] ?? false,
      location: json['location'],
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
      'hashtags': hashtags,
      'musicId': musicId,
      'musicTitle': musicTitle,
      'musicArtist': musicArtist,
      'sharesCount': sharesCount,
      'savesCount': savesCount,
      'challengeId': challengeId,
      'duetWithId': duetWithId,
      'stitchWithId': stitchWithId,
      'isDuet': isDuet,
      'isStitch': isStitch,
      'location': location,
    };
  }
}
