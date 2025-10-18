import 'package:cloud_firestore/cloud_firestore.dart';
import 'dart:math';

class RecommendationService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  // Get personalized "For You" feed
  Future<List<Map<String, dynamic>>> getForYouFeed(
    String userId, {
    int limit = 20,
    DocumentSnapshot? lastDocument,
  }) async {
    try {
      // Get user preferences and interaction history
      final userPreferences = await _getUserPreferences(userId);
      final interactionHistory = await _getInteractionHistory(userId);

      // Get posts based on user preferences
      Query query = _firestore.collection('posts');

      // Apply filters based on user preferences
      if (userPreferences['preferredCategories'] != null &&
          (userPreferences['preferredCategories'] as List).isNotEmpty) {
        query = query.where('category',
            whereIn: userPreferences['preferredCategories']);
      }

      // Order by engagement score (calculated field)
      query = query.orderBy('engagementScore', descending: true);

      if (lastDocument != null) {
        query = query.startAfterDocument(lastDocument);
      }

      query = query.limit(limit);

      final querySnapshot = await query.get();

      // Filter out posts the user has already seen
      final posts = querySnapshot.docs
          .where((doc) => !interactionHistory.contains(doc.id))
          .map((doc) => {
                'id': doc.id,
                ...doc.data() as Map<String, dynamic>,
              })
          .toList();

      // Apply AI-powered ranking
      final rankedPosts = _rankPostsByRelevance(posts, userPreferences);

      return rankedPosts;
    } catch (e) {
      print('Error getting For You feed: $e');
      return [];
    }
  }

  // Get user preferences
  Future<Map<String, dynamic>> _getUserPreferences(String userId) async {
    try {
      final doc =
          await _firestore.collection('userPreferences').doc(userId).get();

      if (doc.exists) {
        return doc.data()!;
      }

      // Return default preferences
      return {
        'preferredCategories': [],
        'preferredHashtags': [],
        'preferredCreators': [],
        'watchTime': {},
        'engagementRate': 0.0,
      };
    } catch (e) {
      print('Error getting user preferences: $e');
      return {};
    }
  }

  // Get interaction history
  Future<List<String>> _getInteractionHistory(String userId) async {
    try {
      final querySnapshot = await _firestore
          .collection('userInteractions')
          .doc(userId)
          .collection('interactions')
          .orderBy('timestamp', descending: true)
          .limit(1000)
          .get();

      return querySnapshot.docs.map((doc) => doc.data()['postId'] as String).toList();
    } catch (e) {
      print('Error getting interaction history: $e');
      return [];
    }
  }

  // Rank posts by relevance using AI-powered scoring
  List<Map<String, dynamic>> _rankPostsByRelevance(
    List<Map<String, dynamic>> posts,
    Map<String, dynamic> userPreferences,
  ) {
    final rankedPosts = posts.map((post) {
      double score = 0.0;

      // Factor 1: Engagement score (40%)
      final engagementScore = post['engagementScore'] ?? 0.0;
      score += engagementScore * 0.4;

      // Factor 2: Category match (20%)
      if (userPreferences['preferredCategories'] != null &&
          (userPreferences['preferredCategories'] as List)
              .contains(post['category'])) {
        score += 20.0;
      }

      // Factor 3: Creator match (20%)
      if (userPreferences['preferredCreators'] != null &&
          (userPreferences['preferredCreators'] as List)
              .contains(post['creatorId'])) {
        score += 20.0;
      }

      // Factor 4: Hashtag match (10%)
      if (post['hashtags'] != null &&
          userPreferences['preferredHashtags'] != null) {
        final postHashtags = post['hashtags'] as List;
        final preferredHashtags =
            userPreferences['preferredHashtags'] as List;
        final matchCount = postHashtags
            .where((hashtag) => preferredHashtags.contains(hashtag))
            .length;
        score += matchCount * 2.0;
      }

      // Factor 5: Recency (10%)
      final createdAt = post['createdAt'] as Timestamp?;
      if (createdAt != null) {
        final age = DateTime.now().difference(createdAt.toDate()).inHours;
        final recencyScore = max(0, 10 - (age / 24));
        score += recencyScore;
      }

      return {
        ...post,
        'relevanceScore': score,
      };
    }).toList();

    // Sort by relevance score
    rankedPosts.sort((a, b) =>
        (b['relevanceScore'] as double).compareTo(a['relevanceScore'] as double));

    return rankedPosts;
  }

  // Update user preferences based on interaction
  Future<void> updateUserPreferences(
    String userId,
    String postId,
    String interactionType,
  ) async {
    try {
      // Get post details
      final postDoc = await _firestore.collection('posts').doc(postId).get();
      if (!postDoc.exists) return;

      final postData = postDoc.data()!;

      // Record interaction
      await _firestore
          .collection('userInteractions')
          .doc(userId)
          .collection('interactions')
          .add({
        'postId': postId,
        'interactionType': interactionType,
        'timestamp': FieldValue.serverTimestamp(),
      });

      // Update user preferences
      final preferencesRef =
          _firestore.collection('userPreferences').doc(userId);

      final updates = <String, dynamic>{};

      // Update preferred categories
      if (postData['category'] != null) {
        updates['preferredCategories'] =
            FieldValue.arrayUnion([postData['category']]);
      }

      // Update preferred hashtags
      if (postData['hashtags'] != null) {
        updates['preferredHashtags'] =
            FieldValue.arrayUnion(postData['hashtags']);
      }

      // Update preferred creators
      if (postData['creatorId'] != null) {
        updates['preferredCreators'] =
            FieldValue.arrayUnion([postData['creatorId']]);
      }

      // Update engagement rate
      if (interactionType == 'like' || interactionType == 'comment') {
        updates['engagementRate'] = FieldValue.increment(0.1);
      }

      await preferencesRef.set(updates, SetOptions(merge: true));
    } catch (e) {
      print('Error updating user preferences: $e');
    }
  }

  // Get recommended users to follow
  Future<List<Map<String, dynamic>>> getRecommendedUsers(
    String userId, {
    int limit = 20,
  }) async {
    try {
      // Get user's following list
      final followingSnapshot = await _firestore
          .collection('users')
          .doc(userId)
          .collection('following')
          .get();

      final followingIds =
          followingSnapshot.docs.map((doc) => doc.id).toList();

      // Get users with similar interests
      final userPreferences = await _getUserPreferences(userId);

      Query query = _firestore.collection('users');

      // Filter out users already following
      if (followingIds.isNotEmpty) {
        query = query.where(FieldPath.documentId, whereNotIn: followingIds);
      }

      // Order by follower count
      query = query.orderBy('followerCount', descending: true).limit(limit * 2);

      final querySnapshot = await query.get();

      // Rank users by relevance
      final users = querySnapshot.docs
          .map((doc) => {
                'id': doc.id,
                ...doc.data() as Map<String, dynamic>,
              })
          .toList();

      final rankedUsers = _rankUsersByRelevance(users, userPreferences);

      return rankedUsers.take(limit).toList();
    } catch (e) {
      print('Error getting recommended users: $e');
      return [];
    }
  }

  // Rank users by relevance
  List<Map<String, dynamic>> _rankUsersByRelevance(
    List<Map<String, dynamic>> users,
    Map<String, dynamic> userPreferences,
  ) {
    final rankedUsers = users.map((user) {
      double score = 0.0;

      // Factor 1: Follower count (30%)
      final followerCount = user['followerCount'] ?? 0;
      score += (followerCount / 1000) * 30;

      // Factor 2: Category match (40%)
      if (user['categories'] != null &&
          userPreferences['preferredCategories'] != null) {
        final userCategories = user['categories'] as List;
        final preferredCategories =
            userPreferences['preferredCategories'] as List;
        final matchCount = userCategories
            .where((category) => preferredCategories.contains(category))
            .length;
        score += matchCount * 10.0;
      }

      // Factor 3: Engagement rate (30%)
      final engagementRate = user['engagementRate'] ?? 0.0;
      score += engagementRate * 30;

      return {
        ...user,
        'relevanceScore': score,
      };
    }).toList();

    // Sort by relevance score
    rankedUsers.sort((a, b) =>
        (b['relevanceScore'] as double).compareTo(a['relevanceScore'] as double));

    return rankedUsers;
  }
}
