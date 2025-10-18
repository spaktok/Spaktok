import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'dart:io';

class VideoReplyService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseStorage _storage = FirebaseStorage.instance;

  // Upload video reply to comment
  Future<String> uploadVideoReply({
    required String postId,
    required String commentId,
    required String userId,
    required File videoFile,
    String? caption,
  }) async {
    try {
      // Generate unique video ID
      final videoId = DateTime.now().millisecondsSinceEpoch.toString();
      final videoPath = 'video_replies/$postId/$commentId/$videoId.mp4';

      // Upload video to Firebase Storage
      final uploadTask = _storage.ref(videoPath).putFile(videoFile);
      final snapshot = await uploadTask;
      final videoUrl = await snapshot.ref.getDownloadURL();

      // Create video reply document
      final videoReplyRef = await _firestore
          .collection('posts')
          .doc(postId)
          .collection('comments')
          .doc(commentId)
          .collection('videoReplies')
          .add({
        'userId': userId,
        'videoUrl': videoUrl,
        'caption': caption,
        'likeCount': 0,
        'viewCount': 0,
        'createdAt': FieldValue.serverTimestamp(),
      });

      // Update comment with video reply count
      await _firestore
          .collection('posts')
          .doc(postId)
          .collection('comments')
          .doc(commentId)
          .update({
        'videoReplyCount': FieldValue.increment(1),
      });

      return videoReplyRef.id;
    } catch (e) {
      print('Error uploading video reply: $e');
      rethrow;
    }
  }

  // Get video replies for a comment
  Stream<QuerySnapshot> getVideoReplies(String postId, String commentId) {
    return _firestore
        .collection('posts')
        .doc(postId)
        .collection('comments')
        .doc(commentId)
        .collection('videoReplies')
        .orderBy('createdAt', descending: true)
        .snapshots();
  }

  // Like a video reply
  Future<void> likeVideoReply({
    required String postId,
    required String commentId,
    required String videoReplyId,
    required String userId,
  }) async {
    try {
      final likeRef = _firestore
          .collection('posts')
          .doc(postId)
          .collection('comments')
          .doc(commentId)
          .collection('videoReplies')
          .doc(videoReplyId)
          .collection('likes')
          .doc(userId);

      final likeDoc = await likeRef.get();

      if (likeDoc.exists) {
        // Unlike
        await likeRef.delete();
        await _firestore
            .collection('posts')
            .doc(postId)
            .collection('comments')
            .doc(commentId)
            .collection('videoReplies')
            .doc(videoReplyId)
            .update({
          'likeCount': FieldValue.increment(-1),
        });
      } else {
        // Like
        await likeRef.set({
          'userId': userId,
          'timestamp': FieldValue.serverTimestamp(),
        });
        await _firestore
            .collection('posts')
            .doc(postId)
            .collection('comments')
            .doc(commentId)
            .collection('videoReplies')
            .doc(videoReplyId)
            .update({
          'likeCount': FieldValue.increment(1),
        });
      }
    } catch (e) {
      print('Error liking video reply: $e');
      rethrow;
    }
  }

  // Increment view count
  Future<void> incrementViewCount({
    required String postId,
    required String commentId,
    required String videoReplyId,
  }) async {
    try {
      await _firestore
          .collection('posts')
          .doc(postId)
          .collection('comments')
          .doc(commentId)
          .collection('videoReplies')
          .doc(videoReplyId)
          .update({
        'viewCount': FieldValue.increment(1),
      });
    } catch (e) {
      print('Error incrementing view count: $e');
    }
  }

  // Delete video reply
  Future<void> deleteVideoReply({
    required String postId,
    required String commentId,
    required String videoReplyId,
  }) async {
    try {
      // Get video reply data
      final videoReplyDoc = await _firestore
          .collection('posts')
          .doc(postId)
          .collection('comments')
          .doc(commentId)
          .collection('videoReplies')
          .doc(videoReplyId)
          .get();

      if (!videoReplyDoc.exists) return;

      final videoUrl = videoReplyDoc.data()?['videoUrl'] as String?;

      // Delete video from storage
      if (videoUrl != null) {
        try {
          final ref = _storage.refFromURL(videoUrl);
          await ref.delete();
        } catch (e) {
          print('Error deleting video from storage: $e');
        }
      }

      // Delete video reply document
      await videoReplyDoc.reference.delete();

      // Update comment video reply count
      await _firestore
          .collection('posts')
          .doc(postId)
          .collection('comments')
          .doc(commentId)
          .update({
        'videoReplyCount': FieldValue.increment(-1),
      });
    } catch (e) {
      print('Error deleting video reply: $e');
      rethrow;
    }
  }
}
