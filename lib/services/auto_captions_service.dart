import 'dart:async';
import 'dart:io';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;
import 'package:path_provider/path_provider.dart';
import 'package:ffmpeg_kit_flutter_min_gpl/ffmpeg_kit.dart';
import 'package:ffmpeg_kit_flutter_min_gpl/return_code.dart';

class AutoCaptionsService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseFunctions _functions = FirebaseFunctions.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final stt.SpeechToText _speech = stt.SpeechToText();

  bool _isInitialized = false;

  /// Initialize speech recognition
  Future<bool> initialize() async {
    if (_isInitialized) return true;

    try {
      _isInitialized = await _speech.initialize(
        onError: (error) => print('Speech recognition error: $error'),
        onStatus: (status) => print('Speech recognition status: $status'),
      );
      return _isInitialized;
    } catch (e) {
      print('Error initializing speech recognition: $e');
      return false;
    }
  }

  /// Generate captions for video using Cloud Functions
  Future<List<Map<String, dynamic>>?> generateCaptions({
    required String videoId,
    String language = 'en-US',
  }) async {
    try {
      final callable = _functions.httpsCallable('generateCaptionsManual');
      final result = await callable.call({
        'videoId': videoId,
        'language': language,
      });

      if (result.data['success'] == true) {
        return List<Map<String, dynamic>>.from(result.data['captions']);
      }

      return null;
    } catch (e) {
      print('Error generating captions: $e');
      return null;
    }
  }

  /// Generate captions locally from video file
  Future<List<Map<String, dynamic>>?> generateCaptionsLocal({
    required String videoPath,
    String language = 'en-US',
  }) async {
    try {
      if (!_isInitialized) {
        final initialized = await initialize();
        if (!initialized) {
          throw Exception('Failed to initialize speech recognition');
        }
      }

      // 1. Extract audio from video
      final audioPath = await _extractAudio(videoPath);
      if (audioPath == null) {
        throw Exception('Failed to extract audio');
      }

      // 2. Transcribe audio
      final captions = await _transcribeAudio(audioPath, language);

      // 3. Clean up temp audio file
      try {
        await File(audioPath).delete();
      } catch (e) {
        print('Error deleting temp audio: $e');
      }

      return captions;
    } catch (e) {
      print('Error generating local captions: $e');
      return null;
    }
  }

  /// Extract audio from video using FFmpeg
  Future<String?> _extractAudio(String videoPath) async {
    try {
      final tempDir = await getTemporaryDirectory();
      final audioPath = '${tempDir.path}/audio_${DateTime.now().millisecondsSinceEpoch}.wav';

      // Extract audio as WAV for speech recognition
      final command = '-i "$videoPath" -vn -acodec pcm_s16le -ar 16000 -ac 1 "$audioPath"';
      
      final session = await FFmpegKit.execute(command);
      final returnCode = await session.getReturnCode();

      if (ReturnCode.isSuccess(returnCode)) {
        return audioPath;
      } else {
        print('FFmpeg audio extraction failed');
        return null;
      }
    } catch (e) {
      print('Error extracting audio: $e');
      return null;
    }
  }

  /// Transcribe audio file to text with timestamps
  Future<List<Map<String, dynamic>>> _transcribeAudio(
    String audioPath,
    String language,
  ) async {
    final captions = <Map<String, dynamic>>[];

    try {
      // Note: For production, use Cloud Speech-to-Text API via Cloud Functions
      // This is a simplified local implementation for demo purposes
      
      // Check if language is available
      final locales = await _speech.locales();
      final locale = locales.firstWhere(
        (l) => l.localeId == language,
        orElse: () => locales.first,
      );

      // Listen to audio and transcribe
      // For real implementation, process audio file in chunks
      // This requires additional audio processing libraries
      
      // Placeholder: Return mock captions structure
      // In production, this should be handled by Cloud Functions
      return [
        {
          'index': 0,
          'text': 'Caption generation requires Cloud Speech-to-Text API',
          'startTime': 0.0,
          'endTime': 3.0,
          'words': [],
        },
      ];
    } catch (e) {
      print('Error transcribing audio: $e');
      return captions;
    }
  }

  /// Translate captions to another language
  Future<List<Map<String, dynamic>>?> translateCaptions({
    required String videoId,
    required String targetLanguage,
  }) async {
    try {
      final callable = _functions.httpsCallable('translateCaptions');
      final result = await callable.call({
        'videoId': videoId,
        'targetLanguage': targetLanguage,
      });

      if (result.data['success'] == true) {
        return List<Map<String, dynamic>>.from(result.data['captions']);
      }

      return null;
    } catch (e) {
      print('Error translating captions: $e');
      return null;
    }
  }

  /// Get captions for video
  Future<List<Map<String, dynamic>>> getCaptions(String videoId) async {
    try {
      final doc = await _firestore.collection('videos').doc(videoId).get();
      
      if (!doc.exists) {
        return [];
      }

      final data = doc.data();
      if (data?['captions'] != null) {
        return List<Map<String, dynamic>>.from(data!['captions']);
      }

      return [];
    } catch (e) {
      print('Error getting captions: $e');
      return [];
    }
  }

  /// Get translated captions
  Future<List<Map<String, dynamic>>> getTranslatedCaptions(
    String videoId,
    String language,
  ) async {
    try {
      final doc = await _firestore.collection('videos').doc(videoId).get();
      
      if (!doc.exists) {
        return [];
      }

      final data = doc.data();
      final translations = data?['captionTranslations'] as Map<String, dynamic>?;
      
      if (translations != null && translations[language] != null) {
        return List<Map<String, dynamic>>.from(translations[language]);
      }

      return [];
    } catch (e) {
      print('Error getting translated captions: $e');
      return [];
    }
  }

  /// Check if video has captions
  Future<bool> hasCaptions(String videoId) async {
    try {
      final doc = await _firestore.collection('videos').doc(videoId).get();
      final data = doc.data();
      return data?['captions'] != null && 
             (data!['captions'] as List).isNotEmpty;
    } catch (e) {
      print('Error checking captions: $e');
      return false;
    }
  }

  /// Get caption status
  Future<String?> getCaptionStatus(String videoId) async {
    try {
      final doc = await _firestore.collection('videos').doc(videoId).get();
      return doc.data()?['captionStatus'] as String?;
    } catch (e) {
      print('Error getting caption status: $e');
      return null;
    }
  }

  /// Stream caption status updates
  Stream<String?> watchCaptionStatus(String videoId) {
    return _firestore
        .collection('videos')
        .doc(videoId)
        .snapshots()
        .map((doc) => doc.data()?['captionStatus'] as String?);
  }

  /// Get available languages for speech recognition
  Future<List<stt.LocaleName>> getAvailableLanguages() async {
    try {
      if (!_isInitialized) {
        await initialize();
      }
      return await _speech.locales();
    } catch (e) {
      print('Error getting available languages: $e');
      return [];
    }
  }

  /// Get caption statistics
  Future<Map<String, dynamic>> getCaptionStatistics() async {
    try {
      final callable = _functions.httpsCallable('getCaptionStats');
      final result = await callable.call();
      return Map<String, dynamic>.from(result.data);
    } catch (e) {
      print('Error getting caption statistics: $e');
      return {};
    }
  }

  /// Format captions as SRT subtitle file
  String formatAsSRT(List<Map<String, dynamic>> captions) {
    final buffer = StringBuffer();
    
    for (int i = 0; i < captions.length; i++) {
      final caption = captions[i];
      final index = i + 1;
      final startTime = _formatSRTTime(caption['startTime'] as double);
      final endTime = _formatSRTTime(caption['endTime'] as double);
      final text = caption['text'] as String;

      buffer.writeln(index);
      buffer.writeln('$startTime --> $endTime');
      buffer.writeln(text);
      buffer.writeln();
    }

    return buffer.toString();
  }

  /// Format captions as VTT (WebVTT) subtitle file
  String formatAsVTT(List<Map<String, dynamic>> captions) {
    final buffer = StringBuffer();
    buffer.writeln('WEBVTT');
    buffer.writeln();
    
    for (final caption in captions) {
      final startTime = _formatVTTTime(caption['startTime'] as double);
      final endTime = _formatVTTTime(caption['endTime'] as double);
      final text = caption['text'] as String;

      buffer.writeln('$startTime --> $endTime');
      buffer.writeln(text);
      buffer.writeln();
    }

    return buffer.toString();
  }

  /// Format time for SRT (HH:MM:SS,mmm)
  String _formatSRTTime(double seconds) {
    final duration = Duration(milliseconds: (seconds * 1000).round());
    final hours = duration.inHours.toString().padLeft(2, '0');
    final minutes = (duration.inMinutes % 60).toString().padLeft(2, '0');
    final secs = (duration.inSeconds % 60).toString().padLeft(2, '0');
    final millis = (duration.inMilliseconds % 1000).toString().padLeft(3, '0');
    return '$hours:$minutes:$secs,$millis';
  }

  /// Format time for VTT (HH:MM:SS.mmm)
  String _formatVTTTime(double seconds) {
    final duration = Duration(milliseconds: (seconds * 1000).round());
    final hours = duration.inHours.toString().padLeft(2, '0');
    final minutes = (duration.inMinutes % 60).toString().padLeft(2, '0');
    final secs = (duration.inSeconds % 60).toString().padLeft(2, '0');
    final millis = (duration.inMilliseconds % 1000).toString().padLeft(3, '0');
    return '$hours:$minutes:$secs.$millis';
  }

  /// Save captions to file
  Future<String?> saveCaptionsToFile({
    required List<Map<String, dynamic>> captions,
    required String format, // 'srt' or 'vtt'
    required String videoId,
  }) async {
    try {
      final tempDir = await getTemporaryDirectory();
      final fileName = 'captions_${videoId}_${DateTime.now().millisecondsSinceEpoch}.$format';
      final filePath = '${tempDir.path}/$fileName';

      final content = format == 'srt' 
          ? formatAsSRT(captions) 
          : formatAsVTT(captions);

      final file = File(filePath);
      await file.writeAsString(content);

      return filePath;
    } catch (e) {
      print('Error saving captions to file: $e');
      return null;
    }
  }

  /// Get current caption at specific time
  Map<String, dynamic>? getCaptionAtTime(
    List<Map<String, dynamic>> captions,
    double currentTime,
  ) {
    try {
      return captions.firstWhere(
        (caption) =>
            currentTime >= (caption['startTime'] as double) &&
            currentTime <= (caption['endTime'] as double),
      );
    } catch (e) {
      return null;
    }
  }

  /// Dispose resources
  void dispose() {
    _speech.stop();
  }
}
