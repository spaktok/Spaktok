import 'package:cloud_firestore/cloud_firestore.dart';

class HashtagService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  // Extract hashtags from text
  List<String> extractHashtags(String text) {
    final RegExp hashtagRegex = RegExp(r'#(\w+)');
    final matches = hashtagRegex.allMatches(text);
    return matches.map((match) => match.group(1)!.toLowerCase()).toList();
  }

  // Save hashtags to Firestore
  Future<void> saveHashtags(String postId, List<String> hashtags) async {
    try {
      final batch = _firestore.batch();

      for (final hashtag in hashtags) {
        final hashtagRef = _firestore.collection('hashtags').doc(hashtag);
        
        // Update hashtag document
        batch.set(
          hashtagRef,
          {
            'name': hashtag,
            'count': FieldValue.increment(1),
            'lastUsed': FieldValue.serverTimestamp(),
          },
          SetOptions(merge: true),
        );

        // Add post to hashtag's posts subcollection
        final postRef = hashtagRef.collection('posts').doc(postId);
        batch.set(postRef, {
          'postId': postId,
          'timestamp': FieldValue.serverTimestamp(),
        });
      }

      await batch.commit();
    } catch (e) {
      print('Error saving hashtags: $e');
      rethrow;
    }
  }

  // Get trending hashtags
  Future<List<Map<String, dynamic>>> getTrendingHashtags({int limit = 20}) async {
    try {
      final querySnapshot = await _firestore
          .collection('hashtags')
          .orderBy('count', descending: true)
          .limit(limit)
          .get();

      return querySnapshot.docs
          .map((doc) => {
                'name': doc.data()['name'],
                'count': doc.data()['count'],
                'lastUsed': doc.data()['lastUsed'],
              })
          .toList();
    } catch (e) {
      print('Error getting trending hashtags: $e');
      return [];
    }
  }

  // Get posts by hashtag
  Stream<QuerySnapshot> getPostsByHashtag(String hashtag) {
    return _firestore
        .collection('hashtags')
        .doc(hashtag.toLowerCase())
        .collection('posts')
        .orderBy('timestamp', descending: true)
        .snapshots();
  }

  // Search hashtags
  Future<List<String>> searchHashtags(String query) async {
    try {
      final querySnapshot = await _firestore
          .collection('hashtags')
          .where('name', isGreaterThanOrEqualTo: query.toLowerCase())
          .where('name', isLessThanOrEqualTo: query.toLowerCase() + '\uf8ff')
          .limit(10)
          .get();

      return querySnapshot.docs.map((doc) => doc.data()['name'] as String).toList();
    } catch (e) {
      print('Error searching hashtags: $e');
      return [];
    }
  }
}
