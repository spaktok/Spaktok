import 'package:cloud_firestore/cloud_firestore.dart';

/// Service for AI-powered recommendations
/// This is a basic implementation that can be enhanced with actual ML models
class AIRecommendationService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  /// Get personalized video recommendations for "For You" page
  Future<List<Map<String, dynamic>>> getForYouRecommendations({
    required String userId,
    int limit = 20,
  }) async {
    // Get user's interaction history
    final userProfile = await _getUserProfile(userId);

    // Get videos based on user interests
    final recommendations = await _getRecommendedVideos(
      userId: userId,
      userProfile: userProfile,
      limit: limit,
    );

    return recommendations;
  }

  /// Get user profile for recommendations
  Future<Map<String, dynamic>> _getUserProfile(String userId) async {
    // Get user's liked videos
    final likedVideos = await _firestore
        .collectionGroup('likes')
        .where('userId', isEqualTo: userId)
        .limit(50)
        .get();

    // Get user's viewed videos
    final viewedVideos = await _firestore
        .collection('users')
        .doc(userId)
        .collection('viewed_videos')
        .orderBy('timestamp', descending: true)
        .limit(100)
        .get();

    // Get user's followed creators
    final following = await _firestore
        .collection('users')
        .doc(userId)
        .collection('following')
        .get();

    // Extract interests (hashtags, categories, etc.)
    final interests = <String>{};
    final creatorIds = <String>{};

    // Collect hashtags from liked videos
    for (var likeDoc in likedVideos.docs) {
      final videoId = likeDoc.reference.parent.parent?.id;
      if (videoId != null) {
        final videoDoc =
            await _firestore.collection('videos').doc(videoId).get();
        if (videoDoc.exists) {
          final hashtags = videoDoc.data()?['hashtags'] as List<dynamic>?;
          if (hashtags != null) {
            interests.addAll(hashtags.cast<String>());
          }
        }
      }
    }

    // Collect followed creator IDs
    for (var followDoc in following.docs) {
      creatorIds.add(followDoc.id);
    }

    return {
      'interests': interests.toList(),
      'followedCreators': creatorIds.toList(),
    };
  }

  /// Get recommended videos based on user profile
  Future<List<Map<String, dynamic>>> _getRecommendedVideos({
    required String userId,
    required Map<String, dynamic> userProfile,
    required int limit,
  }) async {
    final interests = userProfile['interests'] as List<String>? ?? [];
    final followedCreators =
        userProfile['followedCreators'] as List<String>? ?? [];

    // Get videos from followed creators (high priority)
    final followedVideos =
        await _getVideosFromCreators(followedCreators, limit ~/ 2);

    // Get videos with matching interests (medium priority)
    final interestVideos = await _getVideosByInterests(interests, limit ~/ 2);

    // Get trending videos (low priority)
    final trendingVideos = await _getTrendingVideos(limit ~/ 4);

    // Combine and deduplicate
    final allVideos = <Map<String, dynamic>>[];
    allVideos.addAll(followedVideos);
    allVideos.addAll(interestVideos);
    allVideos.addAll(trendingVideos);

    // Remove duplicates and limit
    final seenIds = <String>{};
    final uniqueVideos = <Map<String, dynamic>>[];

    for (final video in allVideos) {
      final videoId = video['id'] as String?;
      if (videoId != null && !seenIds.contains(videoId)) {
        seenIds.add(videoId);
        uniqueVideos.add(video);
        if (uniqueVideos.length >= limit) break;
      }
    }

    return uniqueVideos;
  }

  /// Get videos from followed creators
  Future<List<Map<String, dynamic>>> _getVideosFromCreators(
    List<String> creatorIds,
    int limit,
  ) async {
    if (creatorIds.isEmpty) return [];

    final videos = await _firestore
        .collection('videos')
        .where('userId',
            whereIn: creatorIds.take(10).toList()) // Firestore limit
        .orderBy('timestamp', descending: true)
        .limit(limit)
        .get();

    return videos.docs.map((doc) => doc.data()).toList();
  }

  /// Get videos by interests (hashtags)
  Future<List<Map<String, dynamic>>> _getVideosByInterests(
    List<String> interests,
    int limit,
  ) async {
    if (interests.isEmpty) return [];

    // Use the first interest for now (can be enhanced)
    final videos = await _firestore
        .collection('videos')
        .where('hashtags', arrayContains: interests.first)
        .orderBy('timestamp', descending: true)
        .limit(limit)
        .get();

    return videos.docs.map((doc) => doc.data()).toList();
  }

  /// Get trending videos
  Future<List<Map<String, dynamic>>> _getTrendingVideos(int limit) async {
    final videos = await _firestore
        .collection('videos')
        .orderBy('likesCount', descending: true)
        .orderBy('commentsCount', descending: true)
        .limit(limit)
        .get();

    return videos.docs.map((doc) => doc.data()).toList();
  }

  /// Track user interaction for better recommendations
  Future<void> trackVideoInteraction({
    required String userId,
    required String videoId,
    required String
        interactionType, // 'view', 'like', 'comment', 'share', 'save'
    double? watchTime,
    double? completionRate,
  }) async {
    final interactionData = {
      'userId': userId,
      'videoId': videoId,
      'interactionType': interactionType,
      'timestamp': FieldValue.serverTimestamp(),
      if (watchTime != null) 'watchTime': watchTime,
      if (completionRate != null) 'completionRate': completionRate,
    };

    await _firestore
        .collection('users')
        .doc(userId)
        .collection('video_interactions')
        .add(interactionData);
  }

  /// Get smart following suggestions
  Future<List<Map<String, dynamic>>> getFollowingSuggestions({
    required String userId,
    int limit = 10,
  }) async {
    // Get users who liked similar videos
    final userInteractions = await _firestore
        .collection('users')
        .doc(userId)
        .collection('video_interactions')
        .where('interactionType', isEqualTo: 'like')
        .limit(20)
        .get();

    final videoIds = userInteractions.docs
        .map((doc) => doc.data()['videoId'] as String)
        .toSet()
        .toList();

    if (videoIds.isEmpty) return [];

    // Find other users who liked the same videos
    final similarUsers = <String>{};
    for (final videoId in videoIds.take(5)) {
      // Limit to avoid too many queries
      final likes = await _firestore
          .collection('videos')
          .doc(videoId)
          .collection('likes')
          .limit(20)
          .get();

      for (final like in likes.docs) {
        final likerId = like.data()['userId'] as String?;
        if (likerId != null && likerId != userId) {
          similarUsers.add(likerId);
        }
      }
    }

    // Get user profiles for suggestions
    final suggestions = <Map<String, dynamic>>[];
    for (final userId in similarUsers.take(limit)) {
      final userDoc = await _firestore.collection('users').doc(userId).get();
      if (userDoc.exists) {
        suggestions.add(userDoc.data()!);
      }
    }

    return suggestions;
  }

  /// Get trending content discovery
  Future<List<Map<String, dynamic>>> getTrendingContent({
    int limit = 20,
  }) async {
    // Get videos with high engagement in the last 24 hours
    final yesterday = DateTime.now().subtract(const Duration(days: 1));

    final trendingVideos = await _firestore
        .collection('videos')
        .where('timestamp', isGreaterThan: Timestamp.fromDate(yesterday))
        .orderBy('timestamp', descending: true)
        .orderBy('likesCount', descending: true)
        .limit(limit)
        .get();

    return trendingVideos.docs.map((doc) => doc.data()).toList();
  }
}
