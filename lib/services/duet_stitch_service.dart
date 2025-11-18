import 'package:ffmpeg_kit_flutter_min_gpl/ffmpeg_kit.dart';
import 'package:ffmpeg_kit_flutter_min_gpl/return_code.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:path_provider/path_provider.dart';
import 'dart:io';
import 'dart:developer' as developer;

/// Duet & Stitch Service
/// Implements TikTok-style video collaboration features
/// - Duet: Side-by-side videos
/// - Stitch: Clip and append videos
class DuetStitchService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseStorage _storage = FirebaseStorage.instance;

  /// Create a duet video (side-by-side)
  Future<String> createDuet({
    required String originalVideoUrl,
    required String duetVideoPath,
    required String userId,
    double scale = 0.5, // Scale each video to 50% width
  }) async {
    try {
      developer.log('Starting duet creation', name: 'duet_stitch_service');

      // Download original video
      final tempDir = await getTemporaryDirectory();
      final originalPath =
          '${tempDir.path}/original_${DateTime.now().millisecondsSinceEpoch}.mp4';
      await _downloadVideo(originalVideoUrl, originalPath);

      // Output path
      final outputPath =
          '${tempDir.path}/duet_${DateTime.now().millisecondsSinceEpoch}.mp4';

      // FFmpeg command: side-by-side with audio from both
      final command = '-i "$originalPath" -i "$duetVideoPath" '
          '-filter_complex "'
          '[0:v]scale=640:1280,setsar=1[left];'
          '[1:v]scale=640:1280,setsar=1[right];'
          '[left][right]hstack=inputs=2[v];'
          '[0:a][1:a]amix=inputs=2:duration=longest[a]" '
          '-map "[v]" -map "[a]" '
          '-c:v libx264 -preset ultrafast -crf 23 '
          '-c:a aac -b:a 128k '
          '"$outputPath"';

      developer.log('Executing FFmpeg command', name: 'duet_stitch_service');

      final session = await FFmpegKit.execute(command);
      final returnCode = await session.getReturnCode();

      if (ReturnCode.isSuccess(returnCode)) {
        developer.log('Duet created successfully', name: 'duet_stitch_service');

        // Clean up original download
        await File(originalPath).delete();

        return outputPath;
      } else {
        final output = await session.getOutput();
        throw Exception('FFmpeg failed: $output');
      }
    } catch (e) {
      developer.log('Error creating duet: $e', name: 'duet_stitch_service');
      rethrow;
    }
  }

  /// Create a stitch video (clip + append)
  Future<String> createStitch({
    required String originalVideoUrl,
    required String stitchVideoPath,
    required double clipStartTime, // seconds
    required double clipDuration, // seconds
    required String userId,
  }) async {
    try {
      developer.log('Starting stitch creation', name: 'duet_stitch_service');

      // Download original video
      final tempDir = await getTemporaryDirectory();
      final originalPath =
          '${tempDir.path}/original_${DateTime.now().millisecondsSinceEpoch}.mp4';
      await _downloadVideo(originalVideoUrl, originalPath);

      // Extract clip from original
      final clipPath =
          '${tempDir.path}/clip_${DateTime.now().millisecondsSinceEpoch}.mp4';

      final clipCommand = '-i "$originalPath" '
          '-ss $clipStartTime '
          '-t $clipDuration '
          '-c:v libx264 -preset ultrafast -crf 23 '
          '-c:a aac '
          '"$clipPath"';

      developer.log('Extracting clip', name: 'duet_stitch_service');

      var session = await FFmpegKit.execute(clipCommand);
      var returnCode = await session.getReturnCode();

      if (!ReturnCode.isSuccess(returnCode)) {
        final output = await session.getOutput();
        throw Exception('Clip extraction failed: $output');
      }

      // Create concat file
      final concatPath = '${tempDir.path}/concat.txt';
      final concatFile = File(concatPath);
      await concatFile.writeAsString(
        "file '$clipPath'\nfile '$stitchVideoPath'",
      );

      // Concatenate videos
      final outputPath =
          '${tempDir.path}/stitch_${DateTime.now().millisecondsSinceEpoch}.mp4';

      final concatCommand = '-f concat -safe 0 -i "$concatPath" '
          '-c:v libx264 -preset ultrafast -crf 23 '
          '-c:a aac -b:a 128k '
          '"$outputPath"';

      developer.log('Concatenating videos', name: 'duet_stitch_service');

      session = await FFmpegKit.execute(concatCommand);
      returnCode = await session.getReturnCode();

      if (ReturnCode.isSuccess(returnCode)) {
        developer.log('Stitch created successfully',
            name: 'duet_stitch_service');

        // Clean up temp files
        await File(originalPath).delete();
        await File(clipPath).delete();
        await File(concatPath).delete();

        return outputPath;
      } else {
        final output = await session.getOutput();
        throw Exception('Concatenation failed: $output');
      }
    } catch (e) {
      developer.log('Error creating stitch: $e', name: 'duet_stitch_service');
      rethrow;
    }
  }

  /// Upload duet video to Firebase
  Future<Map<String, dynamic>> uploadDuet({
    required String duetVideoPath,
    required String userId,
    required String originalVideoId,
    required String caption,
    List<String> hashtags = const [],
  }) async {
    try {
      developer.log('Uploading duet', name: 'duet_stitch_service');

      // Get original video data
      final originalDoc =
          await _firestore.collection('videos').doc(originalVideoId).get();

      if (!originalDoc.exists) {
        throw Exception('Original video not found');
      }

      final originalData = originalDoc.data()!;

      // Generate video ID
      final videoId = _firestore.collection('videos').doc().id;

      // Upload to Firebase Storage
      final videoRef = _storage.ref().child('videos/$userId/$videoId.mp4');
      await videoRef.putFile(File(duetVideoPath));
      final videoUrl = await videoRef.getDownloadURL();

      // Generate thumbnail (use first frame)
      final thumbnailPath = await _generateThumbnail(duetVideoPath);
      final thumbnailRef =
          _storage.ref().child('thumbnails/$userId/$videoId.jpg');
      await thumbnailRef.putFile(File(thumbnailPath));
      final thumbnailUrl = await thumbnailRef.getDownloadURL();

      // Create video document
      final videoData = {
        'id': videoId,
        'userId': userId,
        'videoUrl': videoUrl,
        'thumbnailUrl': thumbnailUrl,
        'caption': caption,
        'hashtags': hashtags,
        'isDuet': true,
        'originalVideoId': originalVideoId,
        'originalUserId': originalData['userId'],
        'originalUsername': originalData['username'],
        'viewsCount': 0,
        'likesCount': 0,
        'commentsCount': 0,
        'sharesCount': 0,
        'timestamp': FieldValue.serverTimestamp(),
        'isPublic': true,
        'isDeleted': false,
      };

      await _firestore.collection('videos').doc(videoId).set(videoData);

      // Update original video duet count
      await _firestore.collection('videos').doc(originalVideoId).update({
        'duetCount': FieldValue.increment(1),
      });

      // Send notification to original creator
      await _firestore.collection('notifications').add({
        'userId': originalData['userId'],
        'type': 'duet',
        'videoId': videoId,
        'triggeredBy': userId,
        'timestamp': FieldValue.serverTimestamp(),
      });

      developer.log('Duet uploaded successfully', name: 'duet_stitch_service');

      return videoData;
    } catch (e) {
      developer.log('Error uploading duet: $e', name: 'duet_stitch_service');
      rethrow;
    }
  }

  /// Upload stitch video to Firebase
  Future<Map<String, dynamic>> uploadStitch({
    required String stitchVideoPath,
    required String userId,
    required String originalVideoId,
    required String caption,
    List<String> hashtags = const [],
  }) async {
    try {
      developer.log('Uploading stitch', name: 'duet_stitch_service');

      // Get original video data
      final originalDoc =
          await _firestore.collection('videos').doc(originalVideoId).get();

      if (!originalDoc.exists) {
        throw Exception('Original video not found');
      }

      final originalData = originalDoc.data()!;

      // Generate video ID
      final videoId = _firestore.collection('videos').doc().id;

      // Upload to Firebase Storage
      final videoRef = _storage.ref().child('videos/$userId/$videoId.mp4');
      await videoRef.putFile(File(stitchVideoPath));
      final videoUrl = await videoRef.getDownloadURL();

      // Generate thumbnail
      final thumbnailPath = await _generateThumbnail(stitchVideoPath);
      final thumbnailRef =
          _storage.ref().child('thumbnails/$userId/$videoId.jpg');
      await thumbnailRef.putFile(File(thumbnailPath));
      final thumbnailUrl = await thumbnailRef.getDownloadURL();

      // Create video document
      final videoData = {
        'id': videoId,
        'userId': userId,
        'videoUrl': videoUrl,
        'thumbnailUrl': thumbnailUrl,
        'caption': caption,
        'hashtags': hashtags,
        'isStitch': true,
        'originalVideoId': originalVideoId,
        'originalUserId': originalData['userId'],
        'originalUsername': originalData['username'],
        'viewsCount': 0,
        'likesCount': 0,
        'commentsCount': 0,
        'sharesCount': 0,
        'timestamp': FieldValue.serverTimestamp(),
        'isPublic': true,
        'isDeleted': false,
      };

      await _firestore.collection('videos').doc(videoId).set(videoData);

      // Update original video stitch count
      await _firestore.collection('videos').doc(originalVideoId).update({
        'stitchCount': FieldValue.increment(1),
      });

      // Send notification to original creator
      await _firestore.collection('notifications').add({
        'userId': originalData['userId'],
        'type': 'stitch',
        'videoId': videoId,
        'triggeredBy': userId,
        'timestamp': FieldValue.serverTimestamp(),
      });

      developer.log('Stitch uploaded successfully',
          name: 'duet_stitch_service');

      return videoData;
    } catch (e) {
      developer.log('Error uploading stitch: $e', name: 'duet_stitch_service');
      rethrow;
    }
  }

  /// Download video from URL
  Future<void> _downloadVideo(String url, String savePath) async {
    try {
      final ref = FirebaseStorage.instance.refFromURL(url);
      await ref.writeToFile(File(savePath));
    } catch (e) {
      developer.log('Error downloading video: $e', name: 'duet_stitch_service');
      rethrow;
    }
  }

  /// Generate thumbnail from video
  Future<String> _generateThumbnail(String videoPath) async {
    try {
      final tempDir = await getTemporaryDirectory();
      final thumbnailPath =
          '${tempDir.path}/thumb_${DateTime.now().millisecondsSinceEpoch}.jpg';

      final command =
          '-i "$videoPath" -ss 00:00:01 -vframes 1 -q:v 2 "$thumbnailPath"';

      final session = await FFmpegKit.execute(command);
      final returnCode = await session.getReturnCode();

      if (ReturnCode.isSuccess(returnCode)) {
        return thumbnailPath;
      } else {
        throw Exception('Thumbnail generation failed');
      }
    } catch (e) {
      developer.log('Error generating thumbnail: $e',
          name: 'duet_stitch_service');
      rethrow;
    }
  }

  /// Check if video allows duets
  Future<bool> canDuet(String videoId) async {
    try {
      final doc = await _firestore.collection('videos').doc(videoId).get();

      if (!doc.exists) return false;

      final data = doc.data()!;
      return data['allowDuet'] ?? true; // Default to true if not specified
    } catch (e) {
      developer.log('Error checking duet permission: $e',
          name: 'duet_stitch_service');
      return false;
    }
  }

  /// Check if video allows stitches
  Future<bool> canStitch(String videoId) async {
    try {
      final doc = await _firestore.collection('videos').doc(videoId).get();

      if (!doc.exists) return false;

      final data = doc.data()!;
      return data['allowStitch'] ?? true; // Default to true if not specified
    } catch (e) {
      developer.log('Error checking stitch permission: $e',
          name: 'duet_stitch_service');
      return false;
    }
  }

  /// Get duets of a video
  Future<List<Map<String, dynamic>>> getDuets(String videoId,
      {int limit = 20}) async {
    try {
      final snapshot = await _firestore
          .collection('videos')
          .where('originalVideoId', isEqualTo: videoId)
          .where('isDuet', isEqualTo: true)
          .orderBy('timestamp', descending: true)
          .limit(limit)
          .get();

      return snapshot.docs.map((doc) => {'id': doc.id, ...doc.data()}).toList();
    } catch (e) {
      developer.log('Error getting duets: $e', name: 'duet_stitch_service');
      return [];
    }
  }

  /// Get stitches of a video
  Future<List<Map<String, dynamic>>> getStitches(String videoId,
      {int limit = 20}) async {
    try {
      final snapshot = await _firestore
          .collection('videos')
          .where('originalVideoId', isEqualTo: videoId)
          .where('isStitch', isEqualTo: true)
          .orderBy('timestamp', descending: true)
          .limit(limit)
          .get();

      return snapshot.docs.map((doc) => {'id': doc.id, ...doc.data()}).toList();
    } catch (e) {
      developer.log('Error getting stitches: $e', name: 'duet_stitch_service');
      return [];
    }
  }
}
