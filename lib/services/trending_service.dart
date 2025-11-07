import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:spaktok/models/trending_content.dart';

class TrendingService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  // Fetch trending content (Explore/Trending)
  Stream<List<TrendingContent>> getTrendingContent() {
    return _firestore
        .collection('trending_content')
        .orderBy('viewsCount', descending: true) // Can modify sorting criteria
        .limit(20) // Fetch top 20 trending content
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => TrendingContent.fromJson(doc.data()))
            .toList());
  }

  // Update views count for specific content (to increase its popularity)
  Future<void> updateViewsCount(String contentId) async {
    try {
      final DocumentReference docRef = _firestore.collection('trending_content').doc(contentId);
      await docRef.update({
        'viewsCount': FieldValue.increment(1),
        'timestamp': FieldValue.serverTimestamp(), // Update last view timestamp
      });
    } catch (e) {
      print('Error updating views count: $e');
    }
  }

  // Add new content to trending list (for internal use or through Firebase functions)
  Future<void> addTrendingContent(TrendingContent content) async {
    try {
      await _firestore.collection('trending_content').doc(content.id).set(content.toJson());
    } catch (e) {
      print('Error adding trending content: $e');
    }
  }
}

