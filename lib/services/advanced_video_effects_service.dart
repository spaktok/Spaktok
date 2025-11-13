import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:spaktok/services/auth_service.dart';
import 'dart:io';
import 'dart:developer' as developer;

/// Voice Effect Types
enum VoiceEffectType {
  chipmunk,
  deep,
  robot,
  echo,
  reverb,
  alien,
  monster,
  baritone,
  vibrato,
  none,
}

/// Time Effect Types
enum TimeEffectType {
  slowMotion,
  fastForward,
  timeWarp,
  reverse,
  freeze,
  boomerang,
}

/// Filter Types
enum VideoFilterType {
  vintage,
  blackWhite,
  sepia,
  warm,
  cool,
  bright,
  dark,
  dramatic,
  vibrant,
  none,
}

/// Advanced Video Effects Service
/// Handles TikTok-style video effects including green screen, voice effects, time effects, and auto-captions
class AdvancedVideoEffectsService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseStorage _storage = FirebaseStorage.instance;
  final AuthService _authService = AuthService();

  /// Apply green screen effect to video
  /// Removes background and replaces with custom image/video
  Future<String> applyGreenScreen({
    required String videoId,
    required File backgroundMedia,
    double threshold = 0.4,
    String? backgroundColor, // hex color for chroma key
  }) async {
    try {
      final user = _authService.currentUser;
      if (user == null) throw Exception('User not authenticated');

      // Upload background media
      final String bgPath =
          'video-effects/${user.uid}/backgrounds/${DateTime.now().millisecondsSinceEpoch}.jpg';
      final UploadTask uploadTask =
          _storage.ref().child(bgPath).putFile(backgroundMedia);
      final TaskSnapshot snapshot = await uploadTask;
      final String bgUrl = await snapshot.ref.getDownloadURL();

      // Update video with green screen effect metadata
      await _firestore.collection('videos').doc(videoId).update({
        'effects.greenScreen': {
          'enabled': true,
          'backgroundUrl': bgUrl,
          'threshold': threshold,
          'chromaKeyColor': backgroundColor ?? '#00FF00',
          'appliedAt': FieldValue.serverTimestamp(),
        },
        'hasEffects': true,
      });

      // Create processing job for backend
      await _firestore.collection('videoProcessingJobs').add({
        'videoId': videoId,
        'userId': user.uid,
        'type': 'greenScreen',
        'parameters': {
          'backgroundUrl': bgUrl,
          'threshold': threshold,
          'chromaKeyColor': backgroundColor ?? '#00FF00',
        },
        'status': 'pending',
        'createdAt': FieldValue.serverTimestamp(),
      });

      return bgUrl;
    } catch (e) {
      developer.log('Error applying green screen: $e',
          name: 'advanced_video_effects_service');
      rethrow;
    }
  }

  /// Apply voice effect to video
  Future<void> applyVoiceEffect({
    required String videoId,
    required VoiceEffectType effect,
    double intensity = 1.0,
  }) async {
    try {
      final user = _authService.currentUser;
      if (user == null) throw Exception('User not authenticated');

      // Update video with voice effect metadata
      await _firestore.collection('videos').doc(videoId).update({
        'effects.voice': {
          'type': effect.toString().split('.').last,
          'intensity': intensity,
          'appliedAt': FieldValue.serverTimestamp(),
        },
        'hasEffects': true,
      });

      // Create processing job
      await _firestore.collection('videoProcessingJobs').add({
        'videoId': videoId,
        'userId': user.uid,
        'type': 'voiceEffect',
        'parameters': {
          'effectType': effect.toString().split('.').last,
          'intensity': intensity,
        },
        'status': 'pending',
        'createdAt': FieldValue.serverTimestamp(),
      });
    } catch (e) {
      developer.log('Error applying voice effect: $e',
          name: 'advanced_video_effects_service');
      rethrow;
    }
  }

  /// Apply time effect (slow motion, fast forward, etc.)
  Future<void> applyTimeEffect({
    required String videoId,
    required TimeEffectType effect,
    double speedMultiplier = 1.0, // 0.5 = half speed, 2.0 = double speed
    Duration? startTime,
    Duration? endTime,
  }) async {
    try {
      final user = _authService.currentUser;
      if (user == null) throw Exception('User not authenticated');

      // Validate speed multiplier
      if (speedMultiplier < 0.1 || speedMultiplier > 10.0) {
        throw Exception('Speed multiplier must be between 0.1 and 10.0');
      }

      // Update video with time effect metadata
      await _firestore.collection('videos').doc(videoId).update({
        'effects.time': {
          'type': effect.toString().split('.').last,
          'speedMultiplier': speedMultiplier,
          'startTime': startTime?.inSeconds,
          'endTime': endTime?.inSeconds,
          'appliedAt': FieldValue.serverTimestamp(),
        },
        'hasEffects': true,
      });

      // Create processing job
      await _firestore.collection('videoProcessingJobs').add({
        'videoId': videoId,
        'userId': user.uid,
        'type': 'timeEffect',
        'parameters': {
          'effectType': effect.toString().split('.').last,
          'speedMultiplier': speedMultiplier,
          'startTime': startTime?.inSeconds,
          'endTime': endTime?.inSeconds,
        },
        'status': 'pending',
        'createdAt': FieldValue.serverTimestamp(),
      });
    } catch (e) {
      developer.log('Error applying time effect: $e',
          name: 'advanced_video_effects_service');
      rethrow;
    }
  }

  /// Generate auto-captions using speech recognition
  Future<List<Map<String, dynamic>>> generateAutoCaptions({
    required String videoId,
    String language = 'en',
    bool autoTranslate = false,
    List<String>? targetLanguages,
  }) async {
    try {
      final user = _authService.currentUser;
      if (user == null) throw Exception('User not authenticated');

      // Get video data
      final videoDoc = await _firestore.collection('videos').doc(videoId).get();
      if (!videoDoc.exists) throw Exception('Video not found');

      final videoData = videoDoc.data()!;
      final videoUrl = videoData['videoUrl'];

      // Create processing job for speech recognition
      await _firestore.collection('videoProcessingJobs').add({
        'videoId': videoId,
        'userId': user.uid,
        'type': 'autoCaptions',
        'parameters': {
          'videoUrl': videoUrl,
          'language': language,
          'autoTranslate': autoTranslate,
          'targetLanguages': targetLanguages ?? [],
        },
        'status': 'pending',
        'createdAt': FieldValue.serverTimestamp(),
      });

      // In production, this would trigger a Cloud Function that:
      // 1. Downloads video
      // 2. Extracts audio
      // 3. Uses Google Speech-to-Text API
      // 4. Generates timestamp-aligned captions
      // 5. Optionally translates to target languages
      // 6. Updates video document with captions

      // Mock captions for demo (would be replaced by actual speech recognition)
      final mockCaptions = [
        {
          'text': 'Welcome to my video',
          'startTime': 0.0,
          'endTime': 2.0,
          'language': language,
        },
        {
          'text': 'This is auto-generated caption',
          'startTime': 2.5,
          'endTime': 4.5,
          'language': language,
        },
      ];

      // Update video with captions
      await _firestore.collection('videos').doc(videoId).update({
        'captions': {
          language: mockCaptions,
        },
        'hasAutoCaptions': true,
        'captionLanguages': [language, ...?targetLanguages],
      });

      return mockCaptions;
    } catch (e) {
      developer.log('Error generating auto-captions: $e',
          name: 'advanced_video_effects_service');
      rethrow;
    }
  }

  /// Apply video filter
  Future<void> applyVideoFilter({
    required String videoId,
    required VideoFilterType filter,
    double intensity = 1.0,
  }) async {
    try {
      final user = _authService.currentUser;
      if (user == null) throw Exception('User not authenticated');

      await _firestore.collection('videos').doc(videoId).update({
        'effects.filter': {
          'type': filter.toString().split('.').last,
          'intensity': intensity,
          'appliedAt': FieldValue.serverTimestamp(),
        },
        'hasEffects': true,
      });

      // Create processing job
      await _firestore.collection('videoProcessingJobs').add({
        'videoId': videoId,
        'userId': user.uid,
        'type': 'videoFilter',
        'parameters': {
          'filterType': filter.toString().split('.').last,
          'intensity': intensity,
        },
        'status': 'pending',
        'createdAt': FieldValue.serverTimestamp(),
      });
    } catch (e) {
      developer.log('Error applying video filter: $e',
          name: 'advanced_video_effects_service');
      rethrow;
    }
  }

  /// Add text overlay with animations
  Future<void> addTextOverlay({
    required String videoId,
    required String text,
    required double x, // 0-1 (percentage)
    required double y, // 0-1 (percentage)
    String fontFamily = 'Roboto',
    double fontSize = 24.0,
    String color = '#FFFFFF',
    String? backgroundColor,
    String animation = 'fadeIn', // fadeIn, slideIn, bounce, typewriter
    Duration? startTime,
    Duration? endTime,
  }) async {
    try {
      final user = _authService.currentUser;
      if (user == null) throw Exception('User not authenticated');

      final textOverlay = {
        'text': text,
        'x': x,
        'y': y,
        'fontFamily': fontFamily,
        'fontSize': fontSize,
        'color': color,
        'backgroundColor': backgroundColor,
        'animation': animation,
        'startTime': startTime?.inSeconds ?? 0,
        'endTime': endTime?.inSeconds,
        'createdAt': FieldValue.serverTimestamp(),
      };

      await _firestore.collection('videos').doc(videoId).update({
        'textOverlays': FieldValue.arrayUnion([textOverlay]),
        'hasEffects': true,
      });
    } catch (e) {
      developer.log('Error adding text overlay: $e',
          name: 'advanced_video_effects_service');
      rethrow;
    }
  }

  /// Add sticker/emoji overlay
  Future<void> addStickerOverlay({
    required String videoId,
    required String stickerId,
    required double x,
    required double y,
    double scale = 1.0,
    double rotation = 0.0,
    Duration? startTime,
    Duration? endTime,
    String animation = 'none', // none, bounce, rotate, pulse
  }) async {
    try {
      final user = _authService.currentUser;
      if (user == null) throw Exception('User not authenticated');

      final stickerOverlay = {
        'stickerId': stickerId,
        'x': x,
        'y': y,
        'scale': scale,
        'rotation': rotation,
        'animation': animation,
        'startTime': startTime?.inSeconds ?? 0,
        'endTime': endTime?.inSeconds,
        'createdAt': FieldValue.serverTimestamp(),
      };

      await _firestore.collection('videos').doc(videoId).update({
        'stickerOverlays': FieldValue.arrayUnion([stickerOverlay]),
        'hasEffects': true,
      });
    } catch (e) {
      developer.log('Error adding sticker overlay: $e',
          name: 'advanced_video_effects_service');
      rethrow;
    }
  }

  /// Get available voice effects
  List<Map<String, dynamic>> getAvailableVoiceEffects() {
    return VoiceEffectType.values.map((effect) {
      return {
        'type': effect,
        'name': effect.toString().split('.').last,
        'description': _getVoiceEffectDescription(effect),
        'icon': _getVoiceEffectIcon(effect),
      };
    }).toList();
  }

  /// Get available time effects
  List<Map<String, dynamic>> getAvailableTimeEffects() {
    return TimeEffectType.values.map((effect) {
      return {
        'type': effect,
        'name': effect.toString().split('.').last,
        'description': _getTimeEffectDescription(effect),
        'icon': _getTimeEffectIcon(effect),
      };
    }).toList();
  }

  /// Get available filters
  List<Map<String, dynamic>> getAvailableFilters() {
    return VideoFilterType.values.map((filter) {
      return {
        'type': filter,
        'name': filter.toString().split('.').last,
        'description': _getFilterDescription(filter),
        'thumbnailUrl': _getFilterThumbnail(filter),
      };
    }).toList();
  }

  /// Get video processing job status
  Future<Map<String, dynamic>?> getProcessingJobStatus(String jobId) async {
    try {
      final jobDoc =
          await _firestore.collection('videoProcessingJobs').doc(jobId).get();

      if (!jobDoc.exists) return null;

      return {'id': jobDoc.id, ...jobDoc.data()!};
    } catch (e) {
      developer.log('Error getting job status: $e',
          name: 'advanced_video_effects_service');
      return null;
    }
  }

  /// Cancel processing job
  Future<void> cancelProcessingJob(String jobId) async {
    try {
      await _firestore.collection('videoProcessingJobs').doc(jobId).update({
        'status': 'cancelled',
        'cancelledAt': FieldValue.serverTimestamp(),
      });
    } catch (e) {
      developer.log('Error cancelling job: $e',
          name: 'advanced_video_effects_service');
      rethrow;
    }
  }

  // Helper methods for descriptions and icons
  String _getVoiceEffectDescription(VoiceEffectType effect) {
    switch (effect) {
      case VoiceEffectType.chipmunk:
        return 'High-pitched, fast voice';
      case VoiceEffectType.deep:
        return 'Deep, low-pitched voice';
      case VoiceEffectType.robot:
        return 'Robotic, mechanical voice';
      case VoiceEffectType.echo:
        return 'Echo effect';
      case VoiceEffectType.reverb:
        return 'Reverb/hall effect';
      case VoiceEffectType.alien:
        return 'Alien-like voice';
      case VoiceEffectType.monster:
        return 'Monster/scary voice';
      case VoiceEffectType.baritone:
        return 'Deep, rich voice';
      case VoiceEffectType.vibrato:
        return 'Vibrating voice';
      case VoiceEffectType.none:
        return 'No effect';
    }
  }

  String _getVoiceEffectIcon(VoiceEffectType effect) {
    // Return emoji or icon identifier
    switch (effect) {
      case VoiceEffectType.chipmunk:
        return '🐿️';
      case VoiceEffectType.deep:
        return '🎙️';
      case VoiceEffectType.robot:
        return '🤖';
      case VoiceEffectType.echo:
        return '🔊';
      case VoiceEffectType.reverb:
        return '🎵';
      case VoiceEffectType.alien:
        return '👽';
      case VoiceEffectType.monster:
        return '👹';
      case VoiceEffectType.baritone:
        return '🎤';
      case VoiceEffectType.vibrato:
        return '〰️';
      case VoiceEffectType.none:
        return '🔇';
    }
  }

  String _getTimeEffectDescription(TimeEffectType effect) {
    switch (effect) {
      case TimeEffectType.slowMotion:
        return 'Slow down video';
      case TimeEffectType.fastForward:
        return 'Speed up video';
      case TimeEffectType.timeWarp:
        return 'Variable speed effect';
      case TimeEffectType.reverse:
        return 'Play in reverse';
      case TimeEffectType.freeze:
        return 'Freeze frame effect';
      case TimeEffectType.boomerang:
        return 'Loop forward and backward';
    }
  }

  String _getTimeEffectIcon(TimeEffectType effect) {
    switch (effect) {
      case TimeEffectType.slowMotion:
        return '🐌';
      case TimeEffectType.fastForward:
        return '⏩';
      case TimeEffectType.timeWarp:
        return '⏰';
      case TimeEffectType.reverse:
        return '⏪';
      case TimeEffectType.freeze:
        return '❄️';
      case TimeEffectType.boomerang:
        return '🔄';
    }
  }

  String _getFilterDescription(VideoFilterType filter) {
    switch (filter) {
      case VideoFilterType.vintage:
        return 'Classic vintage look';
      case VideoFilterType.blackWhite:
        return 'Black and white';
      case VideoFilterType.sepia:
        return 'Warm sepia tone';
      case VideoFilterType.warm:
        return 'Warm color tone';
      case VideoFilterType.cool:
        return 'Cool color tone';
      case VideoFilterType.bright:
        return 'Increased brightness';
      case VideoFilterType.dark:
        return 'Darkened mood';
      case VideoFilterType.dramatic:
        return 'High contrast, dramatic';
      case VideoFilterType.vibrant:
        return 'Vibrant, saturated colors';
      case VideoFilterType.none:
        return 'No filter';
    }
  }

  String _getFilterThumbnail(VideoFilterType filter) {
    // Return URL to filter thumbnail preview
    return 'https://example.com/filters/${filter.toString().split('.').last}.jpg';
  }
}
