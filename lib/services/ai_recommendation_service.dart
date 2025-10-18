import 'package:cloud_firestore/cloud_firestore.dart';
import 'dart:math';

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
        final videoDoc = await _firestore.collection('videos').doc(videoId).get();
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
      'follow
