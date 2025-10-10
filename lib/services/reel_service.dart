import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:spaktok/lib/models/reel.dart';
import 'dart:io';

class ReelService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseStorage _storage = FirebaseStorage.instance;

  // رفع Reel جديد
  Future<void> uploadReel({
    required String userId,
    required File videoFile,
    String description = '',
  }) async {
    try {
      final String reelId = _firestore.collection('reels').doc().id;
      final String filePath = 'reels/$userId/$reelId-${DateTime.now().millisecondsSinceEpoch}.mp4';
      final UploadTask uploadTask = _storage.ref().child(filePath).putFile(videoFile);
      final TaskSnapshot snapshot = await uploadTask.whenComplete(() => null);
      final String videoUrl = await snapshot.ref.getDownloadURL();

      final Reel reel = Reel(
        id: reelId,
        userId: userId,
        videoUrl: videoUrl,
        description: description,
        timestamp: Timestamp.now(),
      );

      await _firestore.collection('reels').doc(reelId).set(reel.toJson());
      print('Reel uploaded successfully: $reelId');
    } catch (e) {
      print('Error uploading reel: $e');
      rethrow;
    }
  }

  // جلب جميع Reels
  Stream<List<Reel>> getAllReels() {
    return _firestore
        .collection('reels')
        .orderBy('timestamp', descending: true)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => Reel.fromJson(doc.data() as Map<String, dynamic>))
            .toList());
  }

  // إضافة إعجاب لـ Reel
  Future<void> likeReel(String reelId, String userId) async {
    final DocumentReference reelRef = _firestore.collection('reels').doc(reelId);
    final DocumentReference likeRef = reelRef.collection('likes').doc(userId);

    await _firestore.runTransaction((transaction) async {
      final DocumentSnapshot reelSnapshot = await transaction.get(reelRef);
      if (reelSnapshot.exists) {
        final int currentLikes = (reelSnapshot.data() as Map<String, dynamic>)['likesCount'] ?? 0;
        transaction.update(reelRef, {'likesCount': currentLikes + 1});
        transaction.set(likeRef, {'userId': userId, 'timestamp': FieldValue.serverTimestamp()});
      }
    });
  }

  // إزالة إعجاب من Reel
  Future<void> unlikeReel(String reelId, String userId) async {
    final DocumentReference reelRef = _firestore.collection('reels').doc(reelId);
    final DocumentReference likeRef = reelRef.collection('likes').doc(userId);

    await _firestore.runTransaction((transaction) async {
      final DocumentSnapshot reelSnapshot = await transaction.get(reelRef);
      if (reelSnapshot.exists) {
        final int currentLikes = (reelSnapshot.data() as Map<String, dynamic>)['likesCount'] ?? 0;
        if (currentLikes > 0) {
          transaction.update(reelRef, {'likesCount': currentLikes - 1});
        }
        transaction.delete(likeRef);
      }
    });
  }

  // إضافة تعليق لـ Reel
  Future<void> addComment(String reelId, String userId, String commentText) async {
    final DocumentReference reelRef = _firestore.collection('reels').doc(reelId);
    final DocumentReference commentRef = reelRef.collection('comments').doc();

    await _firestore.runTransaction((transaction) async {
      final DocumentSnapshot reelSnapshot = await transaction.get(reelRef);
      if (reelSnapshot.exists) {
        final int currentComments = (reelSnapshot.data() as Map<String, dynamic>)['commentsCount'] ?? 0;
        transaction.update(reelRef, {'commentsCount': currentComments + 1});
        transaction.set(commentRef, {
          'userId': userId,
          'commentText': commentText,
          'timestamp': FieldValue.serverTimestamp(),
        });
      }
    });
  }

  // حذف Reel
  Future<void> deleteReel(String reelId) async {
    try {
      await _firestore.collection('reels').doc(reelId).delete();
      // يمكن إضافة منطق لحذف الملف من Firebase Storage هنا أيضًا
      print('Reel deleted successfully: $reelId');
    } catch (e) {
      print('Error deleting reel: $e');
      rethrow;
    }
  }
}

