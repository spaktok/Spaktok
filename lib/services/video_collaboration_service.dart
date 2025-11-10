import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:spaktok/services/auth_service.dart';
import 'dart:io';
import 'dart:developer' as developer;

/// Service for handling video collaboration features (Duet, Stitch, Reaction)
/// Similar to TikTok's duet and stitch features
class VideoCollaborationService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseStorage _storage = FirebaseStorage.instance;
  final AuthService _authService = AuthService();

  /// Create a duet video (side-by-side with original)
  /// Returns the new video ID
  Future<String> createDuet({
    required String originalVideoId,
    required File userVideoFile,
    String? caption,
  }) async {
    try {
      final user = _authService.currentUser;
      if (user == null) throw Exception('User not authenticated');

      // Get original video data
      final originalVideoDoc =
          await _firestore.collection('videos').doc(originalVideoId).get();

      if (!originalVideoDoc.exists) {
        throw Exception('Original video not found');
      }

      final originalVideoData = originalVideoDoc.data()!;

      // Check if duets are allowed
      if (originalVideoData['allowDuet'] == false) {
        throw Exception('Duets are not allowed for this video');
      }

      // Upload user video
      final String videoId = _firestore.collection('videos').doc().id;
      final String filePath =
          'videos/${user.uid}/$videoId-${DateTime.now().millisecondsSinceEpoch}.mp4';

      final UploadTask uploadTask =
          _storage.ref().child(filePath).putFile(userVideoFile);
      final TaskSnapshot snapshot = await uploadTask;
      final String userVideoUrl = await snapshot.ref.getDownloadURL();

      // Create duet video document
      await _firestore.collection('videos').doc(videoId).set({
        'id': videoId,
        'userId': user.uid,
        'username': user.displayName ?? 'Unknown',
        'userProfileImage': user.photoURL ?? '',
        'videoUrl': userVideoUrl,
        'caption': caption ?? 'Duet with @${originalVideoData['username']}',
        'type': 'duet',
        'originalVideoId': originalVideoId,
        'originalUserId': originalVideoData['userId'],
        'originalVideoUrl': originalVideoData['videoUrl'],
        'duetLayout': 'side-by-side', // or 'top-bottom', 'green-screen'
        'hashtags': ['#duet', ...(originalVideoData['hashtags'] ?? [])],
        'soundId': originalVideoData['soundId'],
        'likes': 0,
        'views': 0,
        'comments': 0,
        'shares': 0,
        'createdAt': FieldValue.serverTimestamp(),
        'status': 'active',
      });

      // Update original video duet count
      await _firestore.collection('videos').doc(originalVideoId).update({
        'duetCount': FieldValue.increment(1),
      });

      // Notify original video owner
      await _createNotification(
        recipientId: originalVideoData['userId'],
        type: 'duet',
        message:
            '${user.displayName ?? "Someone"} created a duet with your video',
        videoId: videoId,
      );

      return videoId;
    } catch (e) {
      developer.log('Error creating duet: $e', name: 'video_collaboration_service');
      rethrow;
    }
  }

  /// Create a stitch video (clips from original + new content)
  /// Returns the new video ID
  Future<String> createStitch({
    required String originalVideoId,
    required File userVideoFile,
    required Duration clipStart,
    required Duration clipEnd,
    String? caption,
  }) async {
    try {
      final user = _authService.currentUser;
      if (user == null) throw Exception('User not authenticated');

      // Get original video data
      final originalVideoDoc =
          await _firestore.collection('videos').doc(originalVideoId).get();

      if (!originalVideoDoc.exists) {
        throw Exception('Original video not found');
      }

      final originalVideoData = originalVideoDoc.data()!;

      // Check if stitches are allowed
      if (originalVideoData['allowStitch'] == false) {
        throw Exception('Stitches are not allowed for this video');
      }

      // Validate clip duration (max 5 seconds)
      final clipDuration = clipEnd - clipStart;
      if (clipDuration.inSeconds > 5) {
        throw Exception('Stitch clip must be 5 seconds or less');
      }

      // Upload user video
      final String videoId = _firestore.collection('videos').doc().id;
      final String filePath =
          'videos/${user.uid}/$videoId-${DateTime.now().millisecondsSinceEpoch}.mp4';

      final UploadTask uploadTask =
          _storage.ref().child(filePath).putFile(userVideoFile);
      final TaskSnapshot snapshot = await uploadTask;
      final String userVideoUrl = await snapshot.ref.getDownloadURL();

      // Create stitch video document
      await _firestore.collection('videos').doc(videoId).set({
        'id': videoId,
        'userId': user.uid,
        'username': user.displayName ?? 'Unknown',
        'userProfileImage': user.photoURL ?? '',
        'videoUrl': userVideoUrl,
        'caption': caption ?? 'Stitch with @${originalVideoData['username']}',
        'type': 'stitch',
        'originalVideoId': originalVideoId,
        'originalUserId': originalVideoData['userId'],
        'originalVideoUrl': originalVideoData['videoUrl'],
        'stitchClipStart': clipStart.inSeconds,
        'stitchClipEnd': clipEnd.inSeconds,
        'hashtags': ['#stitch', ...(originalVideoData['hashtags'] ?? [])],
        'soundId': originalVideoData['soundId'],
        'likes': 0,
        'views': 0,
        'comments': 0,
        'shares': 0,
        'createdAt': FieldValue.serverTimestamp(),
        'status': 'active',
      });

      // Update original video stitch count
      await _firestore.collection('videos').doc(originalVideoId).update({
        'stitchCount': FieldValue.increment(1),
      });

      // Notify original video owner
      await _createNotification(
        recipientId: originalVideoData['userId'],
        type: 'stitch',
        message: '${user.displayName ?? "Someone"} stitched your video',
        videoId: videoId,
      );

      return videoId;
    } catch (e) {
      developer.log('Error creating stitch: $e', name: 'video_collaboration_service');
      rethrow;
    }
  }

  /// Create a reaction video (small video overlay reacting to original)
  /// Returns the new video ID
  Future<String> createReaction({
    required String originalVideoId,
    required File reactionVideoFile,
    String? caption,
  }) async {
    try {
      final user = _authService.currentUser;
      if (user == null) throw Exception('User not authenticated');

      // Get original video data
      final originalVideoDoc =
          await _firestore.collection('videos').doc(originalVideoId).get();

      if (!originalVideoDoc.exists) {
        throw Exception('Original video not found');
      }

      final originalVideoData = originalVideoDoc.data()!;

      // Upload reaction video
      final String videoId = _firestore.collection('videos').doc().id;
      final String filePath =
          'videos/${user.uid}/$videoId-${DateTime.now().millisecondsSinceEpoch}.mp4';

      final UploadTask uploadTask =
          _storage.ref().child(filePath).putFile(reactionVideoFile);
      final TaskSnapshot snapshot = await uploadTask;
      final String reactionVideoUrl = await snapshot.ref.getDownloadURL();

      // Create reaction video document
      await _firestore.collection('videos').doc(videoId).set({
        'id': videoId,
        'userId': user.uid,
        'username': user.displayName ?? 'Unknown',
        'userProfileImage': user.photoURL ?? '',
        'videoUrl': reactionVideoUrl,
        'caption': caption ?? 'Reacting to @${originalVideoData['username']}',
        'type': 'reaction',
        'originalVideoId': originalVideoId,
        'originalUserId': originalVideoData['userId'],
        'originalVideoUrl': originalVideoData['videoUrl'],
        'reactionPosition':
            'bottom-right', // or 'top-right', 'top-left', 'bottom-left'
        'hashtags': ['#reaction', ...(originalVideoData['hashtags'] ?? [])],
        'soundId': originalVideoData['soundId'],
        'likes': 0,
        'views': 0,
        'comments': 0,
        'shares': 0,
        'createdAt': FieldValue.serverTimestamp(),
        'status': 'active',
      });

      // Update original video reaction count
      await _firestore.collection('videos').doc(originalVideoId).update({
        'reactionCount': FieldValue.increment(1),
      });

      // Notify original video owner
      await _createNotification(
        recipientId: originalVideoData['userId'],
        type: 'reaction',
        message: '${user.displayName ?? "Someone"} reacted to your video',
        videoId: videoId,
      );

      return videoId;
    } catch (e) {
      developer.log('Error creating reaction: $e', name: 'video_collaboration_service');
      rethrow;
    }
  }

  /// Get all duets for a video
  Future<List<Map<String, dynamic>>> getDuets(String videoId) async {
    try {
      final querySnapshot = await _firestore
          .collection('videos')
          .where('originalVideoId', isEqualTo: videoId)
          .where('type', isEqualTo: 'duet')
          .orderBy('createdAt', descending: true)
          .limit(50)
          .get();

      return querySnapshot.docs
          .map((doc) => {'id': doc.id, ...doc.data()})
          .toList();
    } catch (e) {
      developer.log('Error getting duets: $e', name: 'video_collaboration_service');
      return [];
    }
  }

  /// Get all stitches for a video
  Future<List<Map<String, dynamic>>> getStitches(String videoId) async {
    try {
      final querySnapshot = await _firestore
          .collection('videos')
          .where('originalVideoId', isEqualTo: videoId)
          .where('type', isEqualTo: 'stitch')
          .orderBy('createdAt', descending: true)
          .limit(50)
          .get();

      return querySnapshot.docs
          .map((doc) => {'id': doc.id, ...doc.data()})
          .toList();
    } catch (e) {
      developer.log('Error getting stitches: $e', name: 'video_collaboration_service');
      return [];
    }
  }

  /// Get all reactions for a video
  Future<List<Map<String, dynamic>>> getReactions(String videoId) async {
    try {
      final querySnapshot = await _firestore
          .collection('videos')
          .where('originalVideoId', isEqualTo: videoId)
          .where('type', isEqualTo: 'reaction')
          .orderBy('createdAt', descending: true)
          .limit(50)
          .get();

      return querySnapshot.docs
          .map((doc) => {'id': doc.id, ...doc.data()})
          .toList();
    } catch (e) {
      developer.log('Error getting reactions: $e', name: 'video_collaboration_service');
      return [];
    }
  }

  /// Helper method to create notifications
  Future<void> _createNotification({
    required String recipientId,
    required String type,
    required String message,
    String? videoId,
  }) async {
    try {
      await _firestore.collection('notifications').add({
        'recipientId': recipientId,
        'type': type,
        'message': message,
        'videoId': videoId,
        'isRead': false,
        'createdAt': FieldValue.serverTimestamp(),
      });
    } catch (e) {
      developer.log('Error creating notification: $e', name: 'video_collaboration_service');
    }
  }
}
