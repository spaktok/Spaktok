
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

class CommentService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;

  Future<void> addComment(String reelId, String text) async {
    final userId = _auth.currentUser?.uid;
    if (userId == null) throw Exception('User not authenticated');

    await _firestore.collection('reels').doc(reelId).collection('comments').add({
      'userId': userId,
      'text': text,
      'timestamp': Timestamp.now(),
    });

    // Increment comment count on the reel
    await _firestore.collection('reels').doc(reelId).update({
      'commentsCount': FieldValue.increment(1),
    });
  }

  Stream<List<Map<String, dynamic>>> getComments(String reelId) {
    return _firestore
        .collection('reels')
        .doc(reelId)
        .collection('comments')
        .orderBy('timestamp', descending: true)
        .snapshots()
        .map((snapshot) => snapshot.docs.map((doc) => doc.data()).toList());
  }

  Future<void> deleteComment(String reelId, String commentId) async {
    await _firestore.collection('reels').doc(reelId).collection('comments').doc(commentId).delete();

    // Decrement comment count on the reel
    await _firestore.collection('reels').doc(reelId).update({
      'commentsCount': FieldValue.increment(-1),
    });
  }
}

