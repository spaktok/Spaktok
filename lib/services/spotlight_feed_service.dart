import 'package:cloud_firestore/cloud_firestore.dart';
import 'dart:developer' as developer;
import 'package:spaktok/services/auth_service.dart';

/// Spotlight Video Model
class SpotlightVideo {
  final String id;
  final String userId;
  final String username;
  final String userProfileImage;
  final String videoUrl;
  final String thumbnailUrl;
  final String caption;
  final List<String> tags;
  final String? soundId;
  final int views;
  final int likes;
  final int shares;
  final int comments;
  final double engagementScore;
  final double trendingScore;
  final bool isPublic;
  final bool isMonetized;
  final double earnings;
  final DateTime createdAt;
  final DateTime? featuredAt;

  SpotlightVideo({
    required this.id,
    required this.userId,
    required this.username,
    required this.userProfileImage,
    required this.videoUrl,
    required this.thumbnailUrl,
    required this.caption,
    required this.tags,
    this.soundId,
    this.views = 0,
    this.likes = 0,
    this.shares = 0,
    this.comments = 0,
    this.engagementScore = 0.0,
    this.trendingScore = 0.0,
    this.isPublic = true,
    this.isMonetized = false,
    this.earnings = 0.0,
    required this.createdAt,
    this.featuredAt,
  });

  factory SpotlightVideo.fromMap(Map<String, dynamic> map, String id) {
    return SpotlightVideo(
      id: id,
      userId: map['userId'] ?? '',
      username: map['username'] ?? '',
      userProfileImage: map['userProfileImage'] ?? '',
      videoUrl: map['videoUrl'] ?? '',
      thumbnailUrl: map['thumbnailUrl'] ?? '',
      caption: map['caption'] ?? '',
      tags: List<String>.from(map['tags'] ?? []),
      soundId: map['soundId'],
      views: map['views'] ?? 0,
      likes: map['likes'] ?? 0,
      shares: map['shares'] ?? 0,
      comments: map['comments'] ?? 0,
      engagementScore: (map['engagementScore'] ?? 0.0).toDouble(),
      trendingScore: (map['trendingScore'] ?? 0.0).toDouble(),
      isPublic: map['isPublic'] ?? true,
      isMonetized: map['isMonetized'] ?? false,
      earnings: (map['earnings'] ?? 0.0).toDouble(),
      createdAt: (map['createdAt'] as Timestamp).toDate(),
      featuredAt: map['featuredAt'] != null
          ? (map['featuredAt'] as Timestamp).toDate()
          : null,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'userId': userId,
      'username': username,
      'userProfileImage': userProfileImage,
      'videoUrl': videoUrl,
      'thumbnailUrl': thumbnailUrl,
      'caption': caption,
      'tags': tags,
      'soundId': soundId,
      'views': views,
      'likes': likes,
      'shares': shares,
      'comments': comments,
      'engagementScore': engagementScore,
      'trendingScore': trendingScore,
      'isPublic': isPublic,
      'isMonetized': isMonetized,
      'earnings': earnings,
      'createdAt': Timestamp.fromDate(createdAt),
      'featuredAt': featuredAt != null ? Timestamp.fromDate(featuredAt!) : null,
    };
  }
}

/// Creator Reward Model
class CreatorReward {
  final String id;
  final String userId;
  final String videoId;
  final double amount;
  final int views;
  final String rewardType; // 'view', 'engagement', 'trending', 'bonus'
  final DateTime earnedAt;
  final String status; // 'pending', 'approved', 'paid'

  CreatorReward({
    required this.id,
    required this.userId,
    required this.videoId,
    required this.amount,
    required this.views,
    required this.rewardType,
    required this.earnedAt,
    this.status = 'pending',
  });

  factory CreatorReward.fromMap(Map<String, dynamic> map, String id) {
    return CreatorReward(
      id: id,
      userId: map['userId'] ?? '',
      videoId: map['videoId'] ?? '',
      amount: (map['amount'] ?? 0.0).toDouble(),
      views: map['views'] ?? 0,
      rewardType: map['rewardType'] ?? 'view',
      earnedAt: (map['earnedAt'] as Timestamp).toDate(),
      status: map['status'] ?? 'pending',
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'userId': userId,
      'videoId': videoId,
      'amount': amount,
      'views': views,
      'rewardType': rewardType,
      'earnedAt': Timestamp.fromDate(earnedAt),
      'status': status,
    };
  }
}

/// Spotlight Feed Service
/// TikTok For You page + Snapchat Spotlight with creator rewards
class SpotlightFeedService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final AuthService _authService = AuthService();

  // Reward rates (configurable)
  static const double _viewRewardRate = 0.001; // $0.001 per view
  static const double _engagementBonus = 0.05; // 5% bonus for high engagement
  static const int _minViewsForReward = 1000; // Minimum views to earn

  /// Submit video to Spotlight
  Future<SpotlightVideo> submitToSpotlight({
    required String videoUrl,
    required String thumbnailUrl,
    required String caption,
    required List<String> tags,
    String? soundId,
    bool enableMonetization = true,
  }) async {
    try {
      final user = _authService.currentUser;
      if (user == null) throw Exception('User not authenticated');

      final String videoId = _firestore.collection('spotlight').doc().id;

      final video = SpotlightVideo(
        id: videoId,
        userId: user.uid,
        username: user.displayName ?? 'Unknown',
        userProfileImage: user.photoURL ?? '',
        videoUrl: videoUrl,
        thumbnailUrl: thumbnailUrl,
        caption: caption,
        tags: tags.map((t) => t.toLowerCase()).toList(),
        soundId: soundId,
        isPublic: true,
        isMonetized: enableMonetization,
        createdAt: DateTime.now(),
      );

      await _firestore.collection('spotlight').doc(videoId).set(video.toMap());

      // Update user's spotlight videos
      await _firestore
          .collection('users')
          .doc(user.uid)
          .collection('spotlightVideos')
          .doc(videoId)
          .set({'videoId': videoId, 'createdAt': FieldValue.serverTimestamp()});

      return video;
    } catch (e, st) {
      developer.log('Error submitting to Spotlight',
          error: e, stackTrace: st, name: 'SpotlightFeedService');
      rethrow;
    }
  }

  /// Get Spotlight feed (trending videos)
  Future<List<SpotlightVideo>> getSpotlightFeed({
    int limit = 20,
    DocumentSnapshot? lastDocument,
  }) async {
    try {
      var query = _firestore
          .collection('spotlight')
          .where('isPublic', isEqualTo: true)
          .orderBy('trendingScore', descending: true);

      if (lastDocument != null) {
        query = query.startAfterDocument(lastDocument);
      }

      final querySnapshot = await query.limit(limit).get();

      return querySnapshot.docs
          .map((doc) => SpotlightVideo.fromMap(doc.data(), doc.id))
          .toList();
    } catch (e, st) {
      developer.log('Error getting Spotlight feed',
          error: e, stackTrace: st, name: 'SpotlightFeedService');
      return [];
    }
  }

  /// Get personalized Spotlight feed (AI-powered recommendations)
  Future<List<SpotlightVideo>> getPersonalizedFeed({
    int limit = 20,
    DocumentSnapshot? lastDocument,
  }) async {
    try {
      final user = _authService.currentUser;
      if (user == null) return getSpotlightFeed(limit: limit);

      // Get user's interests (liked tags, followed creators)
      final userInterests = await _getUserInterests(user.uid);

      var query =
          _firestore.collection('spotlight').where('isPublic', isEqualTo: true);

      // Filter by user interests if available
      if (userInterests.isNotEmpty) {
        query = query.where('tags',
            arrayContainsAny: userInterests.take(10).toList());
      }

      query = query.orderBy('trendingScore', descending: true);

      if (lastDocument != null) {
        query = query.startAfterDocument(lastDocument);
      }

      final querySnapshot = await query.limit(limit).get();

      if (querySnapshot.docs.isEmpty) {
        // Fallback to general feed if no personalized results
        return getSpotlightFeed(limit: limit);
      }

      return querySnapshot.docs
          .map((doc) => SpotlightVideo.fromMap(doc.data(), doc.id))
          .toList();
    } catch (e, st) {
      developer.log('Error getting personalized feed',
          error: e, stackTrace: st, name: 'SpotlightFeedService');
      return getSpotlightFeed(limit: limit);
    }
  }

  /// Get videos by tag
  Future<List<SpotlightVideo>> getVideosByTag(
    String tag, {
    int limit = 20,
  }) async {
    try {
      final querySnapshot = await _firestore
          .collection('spotlight')
          .where('isPublic', isEqualTo: true)
          .where('tags', arrayContains: tag.toLowerCase())
          .orderBy('trendingScore', descending: true)
          .limit(limit)
          .get();

      return querySnapshot.docs
          .map((doc) => SpotlightVideo.fromMap(doc.data(), doc.id))
          .toList();
    } catch (e, st) {
      developer.log('Error getting videos by tag',
          error: e, stackTrace: st, name: 'SpotlightFeedService');
      return [];
    }
  }

  /// Get user's Spotlight videos
  Future<List<SpotlightVideo>> getUserSpotlightVideos(
    String userId, {
    int limit = 50,
  }) async {
    try {
      final querySnapshot = await _firestore
          .collection('spotlight')
          .where('userId', isEqualTo: userId)
          .orderBy('createdAt', descending: true)
          .limit(limit)
          .get();

      return querySnapshot.docs
          .map((doc) => SpotlightVideo.fromMap(doc.data(), doc.id))
          .toList();
    } catch (e, st) {
      developer.log('Error getting user Spotlight videos',
          error: e, stackTrace: st, name: 'SpotlightFeedService');
      return [];
    }
  }

  /// Record video view
  Future<void> recordView(String videoId) async {
    try {
      final user = _authService.currentUser;
      if (user == null) return;

      // Increment views
      await _firestore.collection('spotlight').doc(videoId).update({
        'views': FieldValue.increment(1),
      });

      // Update engagement score
      await _updateEngagementScore(videoId);

      // Record view in analytics
      await _firestore
          .collection('spotlight')
          .doc(videoId)
          .collection('views')
          .doc(user.uid)
          .set({
        'userId': user.uid,
        'viewedAt': FieldValue.serverTimestamp(),
      }, SetOptions(merge: true));

      // Check if video qualifies for rewards
      await _checkAndCalculateRewards(videoId);
    } catch (e, st) {
      developer.log('Error recording view',
          error: e, stackTrace: st, name: 'SpotlightFeedService');
    }
  }

  /// Like video
  Future<void> likeVideo(String videoId) async {
    try {
      final user = _authService.currentUser;
      if (user == null) throw Exception('User not authenticated');

      await _firestore.collection('spotlight').doc(videoId).update({
        'likes': FieldValue.increment(1),
      });

      // Record like
      await _firestore
          .collection('spotlight')
          .doc(videoId)
          .collection('likes')
          .doc(user.uid)
          .set({
        'userId': user.uid,
        'likedAt': FieldValue.serverTimestamp(),
      });

      // Update engagement score
      await _updateEngagementScore(videoId);
    } catch (e, st) {
      developer.log('Error liking video',
          error: e, stackTrace: st, name: 'SpotlightFeedService');
      rethrow;
    }
  }

  /// Unlike video
  Future<void> unlikeVideo(String videoId) async {
    try {
      final user = _authService.currentUser;
      if (user == null) throw Exception('User not authenticated');

      await _firestore.collection('spotlight').doc(videoId).update({
        'likes': FieldValue.increment(-1),
      });

      // Remove like
      await _firestore
          .collection('spotlight')
          .doc(videoId)
          .collection('likes')
          .doc(user.uid)
          .delete();

      // Update engagement score
      await _updateEngagementScore(videoId);
    } catch (e, st) {
      developer.log('Error unliking video',
          error: e, stackTrace: st, name: 'SpotlightFeedService');
      rethrow;
    }
  }

  /// Share video
  Future<void> shareVideo(String videoId) async {
    try {
      await _firestore.collection('spotlight').doc(videoId).update({
        'shares': FieldValue.increment(1),
      });

      // Update engagement score
      await _updateEngagementScore(videoId);
    } catch (e, st) {
      developer.log('Error sharing video',
          error: e, stackTrace: st, name: 'SpotlightFeedService');
    }
  }

  /// Get creator rewards for user
  Future<List<CreatorReward>> getCreatorRewards({
    String? status,
    int limit = 50,
  }) async {
    try {
      final user = _authService.currentUser;
      if (user == null) throw Exception('User not authenticated');

      var query = _firestore
          .collection('creatorRewards')
          .where('userId', isEqualTo: user.uid);

      if (status != null) {
        query = query.where('status', isEqualTo: status);
      }

      final querySnapshot =
          await query.orderBy('earnedAt', descending: true).limit(limit).get();

      return querySnapshot.docs
          .map((doc) => CreatorReward.fromMap(doc.data(), doc.id))
          .toList();
    } catch (e, st) {
      developer.log('Error getting creator rewards',
          error: e, stackTrace: st, name: 'SpotlightFeedService');
      return [];
    }
  }

  /// Get total earnings
  Future<double> getTotalEarnings() async {
    try {
      final user = _authService.currentUser;
      if (user == null) throw Exception('User not authenticated');

      final querySnapshot = await _firestore
          .collection('creatorRewards')
          .where('userId', isEqualTo: user.uid)
          .where('status', isEqualTo: 'approved')
          .get();

      double total = 0.0;
      for (var doc in querySnapshot.docs) {
        total += (doc.data()['amount'] ?? 0.0).toDouble();
      }

      return total;
    } catch (e, st) {
      developer.log('Error getting total earnings',
          error: e, stackTrace: st, name: 'SpotlightFeedService');
      return 0.0;
    }
  }

  /// Get video statistics
  Future<Map<String, dynamic>> getVideoStatistics(String videoId) async {
    try {
      final videoDoc =
          await _firestore.collection('spotlight').doc(videoId).get();

      if (!videoDoc.exists) throw Exception('Video not found');

      final data = videoDoc.data()!;

      return {
        'views': data['views'] ?? 0,
        'likes': data['likes'] ?? 0,
        'shares': data['shares'] ?? 0,
        'comments': data['comments'] ?? 0,
        'engagementScore': data['engagementScore'] ?? 0.0,
        'trendingScore': data['trendingScore'] ?? 0.0,
        'earnings': data['earnings'] ?? 0.0,
      };
    } catch (e, st) {
      developer.log('Error getting video statistics',
          error: e, stackTrace: st, name: 'SpotlightFeedService');
      return {};
    }
  }

  /// Update engagement score
  Future<void> _updateEngagementScore(String videoId) async {
    try {
      final videoDoc =
          await _firestore.collection('spotlight').doc(videoId).get();

      if (!videoDoc.exists) return;

      final data = videoDoc.data()!;
      final views = data['views'] ?? 0;
      final likes = data['likes'] ?? 0;
      final shares = data['shares'] ?? 0;
      final comments = data['comments'] ?? 0;

      // Calculate engagement score (weighted formula)
      final engagementScore = (likes * 2.0) + (shares * 3.0) + (comments * 1.5);
      views > 0 ? engagementScore / views : 0.0;

      // Calculate trending score (combines engagement + recency)
      final createdAt = (data['createdAt'] as Timestamp).toDate();
      final hoursSinceCreation =
          DateTime.now().difference(createdAt).inHours.toDouble();
      final recencyFactor = 1.0 / (1.0 + (hoursSinceCreation / 24.0));

      final trendingScore = engagementScore * recencyFactor;

      await _firestore.collection('spotlight').doc(videoId).update({
        'engagementScore': engagementScore,
        'trendingScore': trendingScore,
      });
    } catch (e, st) {
      developer.log('Error updating engagement score',
          error: e, stackTrace: st, name: 'SpotlightFeedService');
    }
  }

  /// Check and calculate rewards for video
  Future<void> _checkAndCalculateRewards(String videoId) async {
    try {
      final videoDoc =
          await _firestore.collection('spotlight').doc(videoId).get();

      if (!videoDoc.exists) return;

      final data = videoDoc.data()!;
      final isMonetized = data['isMonetized'] ?? false;
      if (!isMonetized) return;

      final views = data['views'] ?? 0;
      if (views < _minViewsForReward) return;

      final userId = data['userId'];
      final currentEarnings = (data['earnings'] ?? 0.0).toDouble();

      // Calculate base reward
      double newEarnings = views * _viewRewardRate;

      // Apply engagement bonus for high-performing videos
      final engagementScore = (data['engagementScore'] ?? 0.0).toDouble();
      if (engagementScore > 1000) {
        newEarnings += newEarnings * _engagementBonus;
      }

      // Only update if earnings increased
      if (newEarnings > currentEarnings) {
        await _firestore.collection('spotlight').doc(videoId).update({
          'earnings': newEarnings,
        });

        // Create reward record
        final rewardId = _firestore.collection('creatorRewards').doc().id;

        final reward = CreatorReward(
          id: rewardId,
          userId: userId,
          videoId: videoId,
          amount: newEarnings - currentEarnings,
          views: views,
          rewardType: engagementScore > 1000 ? 'engagement' : 'view',
          earnedAt: DateTime.now(),
          status: 'pending',
        );

        await _firestore
            .collection('creatorRewards')
            .doc(rewardId)
            .set(reward.toMap());
      }
    } catch (e, st) {
      developer.log('Error calculating rewards',
          error: e, stackTrace: st, name: 'SpotlightFeedService');
    }
  }

  /// Get user interests based on activity
  Future<List<String>> _getUserInterests(String userId) async {
    try {
      // Get tags from liked videos
      final likedVideos = <String>[];
      final likedQuery = await _firestore
          .collectionGroup('likes')
          .where('userId', isEqualTo: userId)
          .limit(50)
          .get();

      for (var doc in likedQuery.docs) {
        final videoId = doc.reference.parent.parent?.id;
        if (videoId != null) likedVideos.add(videoId);
      }

      // Extract tags from liked videos
      final interests = <String>[];
      for (var videoId in likedVideos) {
        final videoDoc =
            await _firestore.collection('spotlight').doc(videoId).get();
        if (videoDoc.exists) {
          final tags = List<String>.from(videoDoc.data()?['tags'] ?? []);
          interests.addAll(tags);
        }
      }

      // Return unique interests sorted by frequency
      final interestCounts = <String, int>{};
      for (var interest in interests) {
        interestCounts[interest] = (interestCounts[interest] ?? 0) + 1;
      }

      final sortedInterests = interestCounts.entries.toList()
        ..sort((a, b) => b.value.compareTo(a.value));

      return sortedInterests.map((e) => e.key).toList();
    } catch (e, st) {
      developer.log('Error getting user interests',
          error: e, stackTrace: st, name: 'SpotlightFeedService');
      return [];
    }
  }

  /// Delete video from Spotlight
  Future<void> deleteVideo(String videoId) async {
    try {
      final user = _authService.currentUser;
      if (user == null) throw Exception('User not authenticated');

      // Verify ownership
      final videoDoc =
          await _firestore.collection('spotlight').doc(videoId).get();
      if (!videoDoc.exists) throw Exception('Video not found');

      if (videoDoc.data()!['userId'] != user.uid) {
        throw Exception('Unauthorized');
      }

      // Delete video
      await _firestore.collection('spotlight').doc(videoId).delete();

      // Remove from user's spotlight videos
      await _firestore
          .collection('users')
          .doc(user.uid)
          .collection('spotlightVideos')
          .doc(videoId)
          .delete();
    } catch (e, st) {
      developer.log('Error deleting video',
          error: e, stackTrace: st, name: 'SpotlightFeedService');
      rethrow;
    }
  }
}
