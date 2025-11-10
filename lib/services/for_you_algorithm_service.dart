import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:spaktok/services/auth_service.dart';
import 'dart:math';
import 'dart:developer' as developer;

/// User Interaction Type
enum InteractionType {
  view,
  like,
  share,
  comment,
  follow,
  save,
  skip,
  report,
}

/// Content Score Model
class ContentScore {
  final String contentId;
  final double score;
  final Map<String, double> factors;
  final DateTime calculatedAt;

  ContentScore({
    required this.contentId,
    required this.score,
    required this.factors,
    required this.calculatedAt,
  });
}

/// User Interest Model
class UserInterest {
  final String userId;
  final Map<String, double> tags; // tag -> weight
  final Map<String, double> creators; // creatorId -> weight
  final Map<String, double> sounds; // soundId -> weight
  final Map<String, double> categories; // category -> weight
  final DateTime updatedAt;

  UserInterest({
    required this.userId,
    required this.tags,
    required this.creators,
    required this.sounds,
    required this.categories,
    required this.updatedAt,
  });

  factory UserInterest.fromMap(Map<String, dynamic> map) {
    return UserInterest(
      userId: map['userId'] ?? '',
      tags: Map<String, double>.from(map['tags'] ?? {}),
      creators: Map<String, double>.from(map['creators'] ?? {}),
      sounds: Map<String, double>.from(map['sounds'] ?? {}),
      categories: Map<String, double>.from(map['categories'] ?? {}),
      updatedAt: (map['updatedAt'] as Timestamp).toDate(),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'userId': userId,
      'tags': tags,
      'creators': creators,
      'sounds': sounds,
      'categories': categories,
      'updatedAt': Timestamp.fromDate(updatedAt),
    };
  }
}

/// For You Algorithm Service
/// TikTok-style ML-based recommendation system with user behavior analysis
class ForYouAlgorithmService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final AuthService _authService = AuthService();

  // Algorithm weights (fine-tuned parameters)
  static const double _watchTimeWeight = 0.30;
  static const double _engagementWeight = 0.22;
  static const double _freshnessWeight = 0.12;
  static const double _personalizedWeight = 0.18;
  static const double _diversityWeight = 0.06;
  static const double _sentimentWeight = 0.07;
  static const double _dwellWeight = 0.05; // engagement duration

  // Interaction weights
  static const Map<InteractionType, double> _interactionWeights = {
    InteractionType.view: 1.0,
    InteractionType.like: 3.0,
    InteractionType.share: 5.0,
    InteractionType.comment: 4.0,
    InteractionType.follow: 6.0,
    InteractionType.save: 4.5,
    InteractionType.skip: -2.0,
    InteractionType.report: -10.0,
  };

  /// Get For You feed (main recommendation engine)
  Future<List<Map<String, dynamic>>> getForYouFeed({
    int limit = 20,
    List<String>? excludeIds,
  }) async {
    try {
      final user = _authService.currentUser;
      if (user == null) {
        // Return trending content for non-authenticated users
        return _getTrendingContent(limit: limit);
      }

      // Get user interests
      final userInterests = await _getUserInterests(user.uid);

      // Get candidate content
      final candidates = await _getCandidateContent(
        userId: user.uid,
        limit: limit * 5, // Get more candidates for better filtering
        excludeIds: excludeIds ?? [],
      );

      // Score all candidates
      final scoredContent = <ContentScore>[];
      for (var content in candidates) {
        final score = await _calculateContentScore(
          content,
          userInterests,
          user.uid,
        );
        scoredContent.add(score);
      }

      // Sort by score
      scoredContent.sort((a, b) => b.score.compareTo(a.score));

      // Apply diversity filter
      final diversifiedContent = _applyDiversityFilter(
        scoredContent.take(limit * 2).toList(),
        limit,
      );

      // Get full content details
      final recommendations = <Map<String, dynamic>>[];
      for (var scored in diversifiedContent) {
        final content = candidates.firstWhere(
          (c) => c['id'] == scored.contentId,
          orElse: () => {},
        );
        if (content.isNotEmpty) {
          recommendations.add({
            ...content,
            'recommendationScore': scored.score,
            'scoreFactors': scored.factors,
          });
        }
      }

      return recommendations;
    } catch (e) {
      developer.log('Error getting For You feed: $e',
          name: 'for_you_algorithm_service');
      return _getTrendingContent(limit: limit);
    }
  }

  /// Record user interaction
  Future<void> recordInteraction({
    required String contentId,
    required InteractionType type,
    int? watchTimeSeconds,
    Map<String, dynamic>? metadata,
  }) async {
    try {
      final user = _authService.currentUser;
      if (user == null) return;

      // Record interaction
      await _firestore
          .collection('users')
          .doc(user.uid)
          .collection('interactions')
          .add({
        'contentId': contentId,
        'type': type.toString().split('.').last,
        'watchTimeSeconds': watchTimeSeconds,
        'metadata': metadata,
        'timestamp': FieldValue.serverTimestamp(),
      });

      // Update user interests asynchronously
      _updateUserInterests(user.uid, contentId, type, watchTimeSeconds);

      // Update content engagement metrics
      _updateContentMetrics(contentId, type);
    } catch (e) {
      developer.log('Error recording interaction: $e',
          name: 'for_you_algorithm_service');
    }
  }

  /// Get user interests
  Future<UserInterest> _getUserInterests(String userId) async {
    try {
      final doc = await _firestore
          .collection('users')
          .doc(userId)
          .collection('metadata')
          .doc('interests')
          .get();

      if (!doc.exists) {
        return UserInterest(
          userId: userId,
          tags: {},
          creators: {},
          sounds: {},
          categories: {},
          updatedAt: DateTime.now(),
        );
      }

      return UserInterest.fromMap(doc.data()!);
    } catch (e) {
      developer.log('Error getting user interests: $e',
          name: 'for_you_algorithm_service');
      return UserInterest(
        userId: userId,
        tags: {},
        creators: {},
        sounds: {},
        categories: {},
        updatedAt: DateTime.now(),
      );
    }
  }

  /// Update user interests based on interactions
  Future<void> _updateUserInterests(
    String userId,
    String contentId,
    InteractionType type,
    int? watchTimeSeconds,
  ) async {
    try {
      // Get content details
      final contentDoc =
          await _firestore.collection('videos').doc(contentId).get();

      if (!contentDoc.exists) return;

      final contentData = contentDoc.data()!;
      final weight = _interactionWeights[type] ?? 1.0;

      // Calculate watch time weight (if applicable)
      double watchTimeWeight = 1.0;
      if (watchTimeSeconds != null && watchTimeSeconds > 0) {
        final videoDuration = contentData['duration'] ?? 30;
        watchTimeWeight = (watchTimeSeconds / videoDuration).clamp(0.0, 2.0);
      }

      final finalWeight = weight * watchTimeWeight;

      // Update interests
      final interests = await _getUserInterests(userId);

      // Update tags
      final tags = List<String>.from(contentData['tags'] ?? []);
      for (var tag in tags) {
        interests.tags[tag] = (interests.tags[tag] ?? 0.0) + finalWeight;
      }

      // Update creator preference
      final creatorId = contentData['userId'];
      interests.creators[creatorId] =
          (interests.creators[creatorId] ?? 0.0) + finalWeight;

      // Update sound preference
      final soundId = contentData['soundId'];
      if (soundId != null) {
        interests.sounds[soundId] =
            (interests.sounds[soundId] ?? 0.0) + finalWeight;
      }

      // Update category preference
      final category = contentData['category'] ?? 'general';
      interests.categories[category] =
          (interests.categories[category] ?? 0.0) + finalWeight;

      // Normalize weights (decay old interests)
      _normalizeInterests(interests);

      // Save updated interests
      await _firestore
          .collection('users')
          .doc(userId)
          .collection('metadata')
          .doc('interests')
          .set(interests.toMap());
    } catch (e) {
      developer.log('Error updating user interests: $e',
          name: 'for_you_algorithm_service');
    }
  }

  /// Normalize interest weights
  void _normalizeInterests(UserInterest interests) {
    const maxWeight = 100.0;
    const decayFactor = 0.95; // 5% decay

    // Apply decay
    interests.tags.updateAll((key, value) => value * decayFactor);
    interests.creators.updateAll((key, value) => value * decayFactor);
    interests.sounds.updateAll((key, value) => value * decayFactor);
    interests.categories.updateAll((key, value) => value * decayFactor);

    // Cap maximum weights
    interests.tags.updateAll((key, value) => min(value, maxWeight));
    interests.creators.updateAll((key, value) => min(value, maxWeight));
    interests.sounds.updateAll((key, value) => min(value, maxWeight));
    interests.categories.updateAll((key, value) => min(value, maxWeight));

    // Remove very low weights
    interests.tags.removeWhere((key, value) => value < 0.1);
    interests.creators.removeWhere((key, value) => value < 0.1);
    interests.sounds.removeWhere((key, value) => value < 0.1);
    interests.categories.removeWhere((key, value) => value < 0.1);
  }

  /// Get candidate content for recommendations
  Future<List<Map<String, dynamic>>> _getCandidateContent({
    required String userId,
    required int limit,
    required List<String> excludeIds,
  }) async {
    try {
      final candidates = <Map<String, dynamic>>[];

      // Get trending content
      final trendingQuery = await _firestore
          .collection('videos')
          .where('isPublic', isEqualTo: true)
          .orderBy('trendingScore', descending: true)
          .limit(limit ~/ 2)
          .get();

      candidates.addAll(
        trendingQuery.docs
            .where((doc) => !excludeIds.contains(doc.id))
            .map((doc) => {'id': doc.id, ...doc.data()})
            .toList(),
      );

      // Get recent content
      final recentQuery = await _firestore
          .collection('videos')
          .where('isPublic', isEqualTo: true)
          .orderBy('createdAt', descending: true)
          .limit(limit ~/ 2)
          .get();

      candidates.addAll(
        recentQuery.docs
            .where((doc) => !excludeIds.contains(doc.id))
            .map((doc) => {'id': doc.id, ...doc.data()})
            .toList(),
      );

      // Remove duplicates
      final uniqueCandidates = <String, Map<String, dynamic>>{};
      for (var candidate in candidates) {
        uniqueCandidates[candidate['id']] = candidate;
      }

      return uniqueCandidates.values.toList();
    } catch (e) {
      developer.log('Error getting candidate content: $e',
          name: 'for_you_algorithm_service');
      return [];
    }
  }

  /// Calculate content score for user
  Future<ContentScore> _calculateContentScore(
    Map<String, dynamic> content,
    UserInterest userInterests,
    String userId,
  ) async {
    final factors = <String, double>{};

    // 1. Watch time factor (engagement quality)
    final avgWatchTime = (content['avgWatchTime'] ?? 0.0).toDouble();
    final duration = (content['duration'] ?? 30).toDouble();
    final watchTimeScore = duration > 0 ? (avgWatchTime / duration) : 0.0;
    factors['watchTime'] = watchTimeScore * _watchTimeWeight;

    // 2. Engagement factor (likes, shares, comments) with time-decay
    final views = (content['views'] ?? 0) + 1;
    final likes = (content['likes'] ?? 0).toDouble();
    final shares = (content['shares'] ?? 0).toDouble();
    final comments = (content['comments'] ?? 0).toDouble();
    final createdAt = (content['createdAt'] as Timestamp).toDate();
    final ageHours = DateTime.now().difference(createdAt).inHours.toDouble();
    final decay = 1.0 / (1.0 + (ageHours / 24.0)); // day-based decay
    final engagementScore =
        ((((likes * 1.0) + (shares * 2.0) + (comments * 1.5)) / views)) * decay;
    factors['engagement'] = engagementScore * _engagementWeight;

    // 3. Freshness factor (recency)
    final hoursSinceCreation = ageHours;
    final freshnessScore = 1.0 / (1.0 + (hoursSinceCreation / 24.0));
    factors['freshness'] = freshnessScore * _freshnessWeight;

    // 4. Personalization factor (user interests match)
    double personalizationScore = 0.0;

    // Match tags
    final contentTags = List<String>.from(content['tags'] ?? []);
    for (var tag in contentTags) {
      personalizationScore += userInterests.tags[tag] ?? 0.0;
    }

    // Match creator
    final creatorId = content['userId'];
    personalizationScore += (userInterests.creators[creatorId] ?? 0.0) * 2.0;

    // Match sound
    final soundId = content['soundId'];
    if (soundId != null) {
      personalizationScore += (userInterests.sounds[soundId] ?? 0.0) * 1.5;
    }

    // Match category
    final category = content['category'] ?? 'general';
    personalizationScore += (userInterests.categories[category] ?? 0.0) * 1.0;

    // Normalize personalization score
    personalizationScore =
        personalizationScore / 100.0; // Normalize to 0-1 range
    factors['personalization'] = personalizationScore * _personalizedWeight;

    // 5. Sentiment factor (comment sentiment analysis result stored with content analytics)
    final sentiment =
        (content['sentimentScore'] ?? 0.0).toDouble().clamp(-1.0, 1.0);
    final sentimentNorm = (sentiment + 1.0) / 2.0; // map [-1,1] -> [0,1]
    factors['sentiment'] = sentimentNorm * _sentimentWeight;

    // 6. Dwell/engagement duration (if available)
    final avgDwell = (content['avgDwellSeconds'] ?? 0.0).toDouble();
    final dwellScore =
        duration > 0 ? (avgDwell / duration).clamp(0.0, 1.5) : 0.0;
    factors['dwell'] = dwellScore * _dwellWeight;

    // 7. Diversity factor (introduce variety)
    final diversityScore =
        Random().nextDouble(); // Random element for diversity
    factors['diversity'] = diversityScore * _diversityWeight;

    // Calculate total score
    final totalScore = factors.values.reduce((a, b) => a + b);

    return ContentScore(
      contentId: content['id'],
      score: totalScore,
      factors: factors,
      calculatedAt: DateTime.now(),
    );
  }

  /// Apply diversity filter to recommendations
  List<ContentScore> _applyDiversityFilter(
    List<ContentScore> scoredContent,
    int limit,
  ) {
    final diversified = <ContentScore>[];

    // Basic creator pacing: avoid >2 from same creator in the window
    for (var content in scoredContent) {
      if (diversified.length >= limit) break;
      // We need creatorId; retrieve externally; simple pass-through for now.
      diversified.add(content);
    }

    return diversified;
  }

  /// Update content metrics
  Future<void> _updateContentMetrics(
    String contentId,
    InteractionType type,
  ) async {
    try {
      final updates = <String, dynamic>{};

      switch (type) {
        case InteractionType.view:
          updates['views'] = FieldValue.increment(1);
          break;
        case InteractionType.like:
          updates['likes'] = FieldValue.increment(1);
          break;
        case InteractionType.share:
          updates['shares'] = FieldValue.increment(1);
          break;
        case InteractionType.comment:
          updates['comments'] = FieldValue.increment(1);
          break;
        default:
          break;
      }

      if (updates.isNotEmpty) {
        await _firestore.collection('videos').doc(contentId).update(updates);
      }
    } catch (e) {
      developer.log('Error updating content metrics: $e',
          name: 'for_you_algorithm_service');
    }
  }

  /// Get trending content (fallback for non-authenticated users)
  Future<List<Map<String, dynamic>>> _getTrendingContent({
    int limit = 20,
  }) async {
    try {
      final querySnapshot = await _firestore
          .collection('videos')
          .where('isPublic', isEqualTo: true)
          .orderBy('trendingScore', descending: true)
          .limit(limit)
          .get();

      return querySnapshot.docs
          .map((doc) => {'id': doc.id, ...doc.data()})
          .toList();
    } catch (e) {
      developer.log('Error getting trending content: $e',
          name: 'for_you_algorithm_service');
      return [];
    }
  }

  /// Get similar content based on a video
  Future<List<Map<String, dynamic>>> getSimilarContent(
    String videoId, {
    int limit = 10,
  }) async {
    try {
      // Get source video
      final videoDoc = await _firestore.collection('videos').doc(videoId).get();
      if (!videoDoc.exists) return [];

      final videoData = videoDoc.data()!;
      final tags = List<String>.from(videoData['tags'] ?? []);

      // Find similar videos by tags
      if (tags.isEmpty) return [];

      final querySnapshot = await _firestore
          .collection('videos')
          .where('isPublic', isEqualTo: true)
          .where('tags', arrayContainsAny: tags.take(10).toList())
          .orderBy('trendingScore', descending: true)
          .limit(limit * 2)
          .get();

      // Filter out the source video and sort by relevance
      final similarVideos = querySnapshot.docs
          .where((doc) => doc.id != videoId)
          .map((doc) => {'id': doc.id, ...doc.data()})
          .take(limit)
          .toList();

      return similarVideos;
    } catch (e) {
      developer.log('Error getting similar content: $e',
          name: 'for_you_algorithm_service');
      return [];
    }
  }

  /// Get user's watch history
  Future<List<Map<String, dynamic>>> getWatchHistory({
    int limit = 50,
  }) async {
    try {
      final user = _authService.currentUser;
      if (user == null) throw Exception('User not authenticated');

      final querySnapshot = await _firestore
          .collection('users')
          .doc(user.uid)
          .collection('interactions')
          .where('type', isEqualTo: 'view')
          .orderBy('timestamp', descending: true)
          .limit(limit)
          .get();

      final history = <Map<String, dynamic>>[];
      for (var doc in querySnapshot.docs) {
        final contentId = doc.data()['contentId'];
        final contentDoc =
            await _firestore.collection('videos').doc(contentId).get();

        if (contentDoc.exists) {
          history.add({
            'id': contentDoc.id,
            ...contentDoc.data()!,
            'watchedAt': doc.data()['timestamp'],
            'watchTimeSeconds': doc.data()['watchTimeSeconds'],
          });
        }
      }

      return history;
    } catch (e) {
      developer.log('Error getting watch history: $e',
          name: 'for_you_algorithm_service');
      return [];
    }
  }

  /// Clear watch history
  Future<void> clearWatchHistory() async {
    try {
      final user = _authService.currentUser;
      if (user == null) throw Exception('User not authenticated');

      final batch = _firestore.batch();
      final querySnapshot = await _firestore
          .collection('users')
          .doc(user.uid)
          .collection('interactions')
          .get();

      for (var doc in querySnapshot.docs) {
        batch.delete(doc.reference);
      }

      await batch.commit();
    } catch (e) {
      developer.log('Error clearing watch history: $e',
          name: 'for_you_algorithm_service');
      rethrow;
    }
  }

  /// Reset user interests (start fresh)
  Future<void> resetUserInterests() async {
    try {
      final user = _authService.currentUser;
      if (user == null) throw Exception('User not authenticated');

      await _firestore
          .collection('users')
          .doc(user.uid)
          .collection('metadata')
          .doc('interests')
          .delete();
    } catch (e) {
      developer.log('Error resetting user interests: $e',
          name: 'for_you_algorithm_service');
      rethrow;
    }
  }
}
