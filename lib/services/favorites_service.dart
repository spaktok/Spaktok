import 'package:cloud_firestore/cloud_firestore.dart';
import 'dart:developer' as developer;

class FavoritesService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  // Save post to favorites
  Future<void> saveToFavorites(String userId, String postId) async {
    try {
      final favoriteRef = _firestore
          .collection('users')
          .doc(userId)
          .collection('favorites')
          .doc(postId);

      final favoriteDoc = await favoriteRef.get();

      if (favoriteDoc.exists) {
        // Remove from favorites
        await favoriteRef.delete();
      } else {
        // Add to favorites
        await favoriteRef.set({
          'postId': postId,
          'savedAt': FieldValue.serverTimestamp(),
        });
      }
    } catch (e) {
      developer.log('Error saving to favorites: $e', name: 'favorites_service');
      rethrow;
    }
  }

  // Check if post is in favorites
  Future<bool> isInFavorites(String userId, String postId) async {
    try {
      final favoriteDoc = await _firestore
          .collection('users')
          .doc(userId)
          .collection('favorites')
          .doc(postId)
          .get();

      return favoriteDoc.exists;
    } catch (e) {
      developer.log('Error checking favorites: $e', name: 'favorites_service');
      return false;
    }
  }

  // Get all favorites for a user
  Stream<QuerySnapshot> getUserFavorites(String userId) {
    return _firestore
        .collection('users')
        .doc(userId)
        .collection('favorites')
        .orderBy('savedAt', descending: true)
        .snapshots();
  }

  // Get favorite posts with details
  Future<List<Map<String, dynamic>>> getFavoritePostsWithDetails(
    String userId, {
    int limit = 20,
  }) async {
    try {
      final favoritesSnapshot = await _firestore
          .collection('users')
          .doc(userId)
          .collection('favorites')
          .orderBy('savedAt', descending: true)
          .limit(limit)
          .get();

      final postIds = favoritesSnapshot.docs.map((doc) => doc.id).toList();

      if (postIds.isEmpty) return [];

      // Get post details
      final posts = <Map<String, dynamic>>[];
      for (final postId in postIds) {
        final postDoc = await _firestore.collection('posts').doc(postId).get();
        if (postDoc.exists) {
          posts.add({
            'id': postDoc.id,
            ...postDoc.data()!,
          });
        }
      }

      return posts;
    } catch (e) {
      developer.log('Error getting favorite posts: $e', name: 'favorites_service');
      return [];
    }
  }

  // Remove post from favorites
  Future<void> removeFromFavorites(String userId, String postId) async {
    try {
      await _firestore
          .collection('users')
          .doc(userId)
          .collection('favorites')
          .doc(postId)
          .delete();
    } catch (e) {
      developer.log('Error removing from favorites: $e', name: 'favorites_service');
      rethrow;
    }
  }

  // Get favorites count
  Future<int> getFavoritesCount(String userId) async {
    try {
      final favoritesSnapshot = await _firestore
          .collection('users')
          .doc(userId)
          .collection('favorites')
          .get();

      return favoritesSnapshot.docs.length;
    } catch (e) {
      developer.log('Error getting favorites count: $e', name: 'favorites_service');
      return 0;
    }
  }

  // Create collection (folder) for favorites
  Future<String> createFavoriteCollection({
    required String userId,
    required String name,
    String? description,
  }) async {
    try {
      final collectionRef = await _firestore
          .collection('users')
          .doc(userId)
          .collection('favoriteCollections')
          .add({
        'name': name,
        'description': description,
        'postCount': 0,
        'createdAt': FieldValue.serverTimestamp(),
      });

      return collectionRef.id;
    } catch (e) {
      developer.log('Error creating favorite collection: $e', name: 'favorites_service');
      rethrow;
    }
  }

  // Add post to collection
  Future<void> addToCollection({
    required String userId,
    required String collectionId,
    required String postId,
  }) async {
    try {
      final postRef = _firestore
          .collection('users')
          .doc(userId)
          .collection('favoriteCollections')
          .doc(collectionId)
          .collection('posts')
          .doc(postId);

      await postRef.set({
        'postId': postId,
        'addedAt': FieldValue.serverTimestamp(),
      });

      // Update collection post count
      await _firestore
          .collection('users')
          .doc(userId)
          .collection('favoriteCollections')
          .doc(collectionId)
          .update({
        'postCount': FieldValue.increment(1),
      });
    } catch (e) {
      developer.log('Error adding to collection: $e', name: 'favorites_service');
      rethrow;
    }
  }

  // Get user's favorite collections
  Stream<QuerySnapshot> getFavoriteCollections(String userId) {
    return _firestore
        .collection('users')
        .doc(userId)
        .collection('favoriteCollections')
        .orderBy('createdAt', descending: true)
        .snapshots();
  }

  // Get posts in a collection
  Stream<QuerySnapshot> getCollectionPosts(
    String userId,
    String collectionId,
  ) {
    return _firestore
        .collection('users')
        .doc(userId)
        .collection('favoriteCollections')
        .doc(collectionId)
        .collection('posts')
        .orderBy('addedAt', descending: true)
        .snapshots();
  }
}
