import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'dart:io';

/// Service for managing short videos (up to 10 minutes)
class ShortVideoService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseStorage _storage = FirebaseStorage.instance;

  static const int MAX_VIDEO_DURATION_SECONDS = 600; // 10 minutes

  /// Upload a short video with metadata
  Future<String> uploadVideo({
    required String userId,
    required File videoFile,
    required int durationSeconds,
    required String title,
    required String description,
    required List<String> hashtags,
    String? musicId,
    String? thumbnailUrl,
    Map<String, dynamic>? location,
  }) async {
    // Validate video duration
    if (durationSeconds > MAX_VIDEO_DURATION_SECONDS) {
      throw Exception('Video duration exceeds maximum allowed duration of 10 minutes');
    }

    // Upload video to Firebase Storage
    final String videoId = _firestore.collection('videos').doc().id;
    final String videoPath = 'videos/$userId/$videoId.mp4';
    final Reference videoRef = _storage.ref().child(videoPath);
    
    await videoRef.putFile(videoFile);
    final String videoUrl = await videoRef.getDownloadURL();

    // Create video document in Firestore
    final videoData = {
      'id': videoId,
      'userId': userId,
      'videoUrl': videoUrl,
      'thumbnailUrl': thumbnailUrl ?? '',
      'title': title,
      'description': description,
      'hashtags': hashtags,
      'musicId': musicId,
      'durationSeconds': durationSeconds,
      'location': location,
      'viewsCount': 0,
      'likesCount': 0,
      'commentsCount': 0,
      'sharesCount': 0,
      'timestamp': FieldValue.serverTimestamp(),
      'isPublic': true,
      'isDeleted': false,
    };

    await _firestore.collection('videos').doc(videoId).set(videoData);

    return videoId;
  }

  /// Get videos for "For You" page (will be enhanced with AI recommendations)
  Stream<List<Map<String, dynamic>>> getForYouVideos({
    int limit = 20,
  }) {
    return _firestore
        .collection('videos')
        .where('isPublic', isEqualTo: true)
        .where('isDeleted', isEqualTo: false)
        .orderBy('timestamp', descending: true)
        .limit(limit)
        .snapshots()
        .map((snapshot) => snapshot.docs.map((doc) => doc.data()).toList());
  }

  /// Get videos from followed users
  Stream<List<Map<String, dynamic>>> getFollowingVideos({
    required String userId,
    int limit = 20,
  }) async* {
    // Get list of followed users
    final followingSnapshot = await _firestore
        .collection('users')
        .doc(userId)
        .collection('following')
        .get();

    final followingIds = followingSnapshot.docs.map((doc) => doc.id).toList();

    if (followingIds.isEmpty) {
      yield [];
      return;
    }

    // Get videos from followed users
    yield* _firestore
        .collection('videos')
        .where('userId', whereIn: followingIds)
        .where('isPublic', isEqualTo: true)
        .where('isDeleted', isEqualTo: false)
        .orderBy('timestamp', descending: true)
        .limit(limit)
        .snapshots()
        .map((snapshot) => snapshot.docs.map((doc) => doc.data()).toList());
  }

  /// Get videos by hashtag
  Stream<List<Map<String, dynamic>>> getVideosByHashtag({
    required String hashtag,
    int limit = 20,
  }) {
    return _firestore
        .collection('videos')
        .where('hashtags', arrayContains: hashtag)
        .where('isPublic', isEqualTo: true)
        .where('isDeleted', isEqualTo: false)
        .orderBy('timestamp', descending: true)
        .limit(limit)
        .snapshots()
        .map((snapshot) => snapshot.docs.map((doc) => doc.data()).toList());
  }

  /// Get trending hashtags
  Future<List<Map<String, dynamic>>> getTrendingHashtags({int limit = 10}) async {
    // This would typically be computed by a Cloud Function
    // For now, we'll return a placeholder implementation
    final videosSnapshot = await _firestore
        .collection('videos')
        .where('isPublic', isEqualTo: true)
        .where('isDeleted', isEqualTo: false)
        .orderBy('timestamp', descending: true)
        .limit(100)
        .get();

    // Count hashtag occurrences
    final Map<String, int> hashtagCounts = {};
    for (var doc in videosSnapshot.docs) {
      final hashtags = doc.data()['hashtags'] as List<dynamic>?;
      if (hashtags != null) {
        for (var hashtag in hashtags) {
          hashtagCounts[hashtag] = (hashtagCounts[hashtag] ?? 0) + 1;
        }
      }
    }

    // Sort by count and return top hashtags
    final sortedHashtags = hashtagCounts.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));

    return sortedHashtags
        .take(limit)
        .map((entry) => {
              'hashtag': entry.key,
              'count': entry.value,
            })
        .toList();
  }

  /// Like a video
  Future<void> likeVideo(String videoId, String userId) async {
    final videoRef = _firestore.collection('videos').doc(videoId);
    final likeRef = videoRef.collection('likes').doc(userId);

    await _firestore.runTransaction((transaction) async {
      final likeDoc = await transaction.get(likeRef);

      if (!likeDoc.exists) {
        transaction.set(likeRef, {
          'userId': userId,
          'timestamp': FieldValue.serverTimestamp(),
        });
        transaction.update(videoRef, {
          'likesCount': FieldValue.increment(1),
        });
      }
    });
  }

  /// Unlike a video
  Future<void> unlikeVideo(String videoId, String userId) async {
    final videoRef = _firestore.collection('videos').doc(videoId);
    final likeRef = videoRef.collection('likes').doc(userId);

    await _firestore.runTransaction((transaction) async {
      final likeDoc = await transaction.get(likeRef);

      if (likeDoc.exists) {
        transaction.delete(likeRef);
        transaction.update(videoRef, {
          'likesCount': FieldValue.increment(-1),
        });
      }
    });
  }

  /// Increment view count
  Future<void> incrementViewCount(String videoId) async {
    await _firestore.collection('videos').doc(videoId).update({
      'viewsCount': FieldValue.increment(1),
    });
  }

  /// Share a video
  Future<void> shareVideo(String videoId) async {
    await _firestore.collection('videos').doc(videoId).update({
      'sharesCount': FieldValue.increment(1),
    });
  }

  /// Delete a video
  Future<void> deleteVideo(String videoId, String userId) async {
    final videoDoc = await _firestore.collection('videos').doc(videoId).get();
    
    if (!videoDoc.exists) {
      throw Exception('Video not found');
    }

    final videoData = videoDoc.data()!;
    if (videoData['userId'] != userId) {
      throw Exception('Unauthorized: You can only delete your own videos');
    }

    // Soft delete
    await _firestore.collection('videos').doc(videoId).update({
      'isDeleted': true,
    });
  }

  /// Get video details
  Future<Map<String, dynamic>?> getVideoDetails(String videoId) async {
    final doc = await _firestore.collection('videos').doc(videoId).get();
    return doc.exists ? doc.data() : null;
  }

  /// Get user's videos
  Stream<List<Map<String, dynamic>>> getUserVideos({
    required String userId,
    int limit = 20,
  }) {
    return _firestore
        .collection('videos')
        .where('userId', isEqualTo: userId)
        .where('isDeleted', isEqualTo: false)
        .orderBy('timestamp', descending: true)
        .limit(limit)
        .snapshots()
        .map((snapshot) => snapshot.docs.map((doc) => doc.data()).toList());
  }
}
