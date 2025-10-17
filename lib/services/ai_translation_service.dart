import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

/// AI Translation Service
/// Handles automatic translation of comments and messages using AI
class AITranslationService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;

  // You can use Google Cloud Translation API, DeepL API, or OpenAI API
  // For this example, we'll use a generic API structure
  static const String _apiKey = 'YOUR_TRANSLATION_API_KEY'; // Replace with actual key
  static const String _apiUrl = 'https://translation.googleapis.com/language/translate/v2';

  /// Supported languages
  static const Map<String, String> supportedLanguages = {
    'en': 'English',
    'ar': 'Arabic',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'zh': 'Chinese',
    'ja': 'Japanese',
    'ko': 'Korean',
    'hi': 'Hindi',
    'tr': 'Turkish',
  };

  /// Translation cache model
  class TranslationCache {
    final String originalText;
    final String translatedText;
    final String sourceLang;
    final String targetLang;
    final DateTime timestamp;

    TranslationCache({
      required this.originalText,
      required this.translatedText,
      required this.sourceLang,
      required this.targetLang,
      required this.timestamp,
    });

    factory TranslationCache.fromMap(Map<String, dynamic> map) {
      return TranslationCache(
        originalText: map['originalText'] ?? '',
        translatedText: map['translatedText'] ?? '',
        sourceLang: map['sourceLang'] ?? '',
        targetLang: map['targetLang'] ?? '',
        timestamp: (map['timestamp'] as Timestamp).toDate(),
      );
    }

    Map<String, dynamic> toMap() {
      return {
        'originalText': originalText,
        'translatedText': translatedText,
        'sourceLang': sourceLang,
        'targetLang': targetLang,
        'timestamp': Timestamp.fromDate(timestamp),
      };
    }
  }

  /// Translate text
  Future<String> translateText(
    String text,
    String targetLang, {
    String? sourceLang,
  }) async {
    // Check cache first
    final cachedTranslation = await _getCachedTranslation(text, targetLang);
    if (cachedTranslation != null) {
      return cachedTranslation;
    }

    try {
      // Call translation API
      final response = await http.post(
        Uri.parse(_apiUrl),
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'q': text,
          'target': targetLang,
          if (sourceLang != null) 'source': sourceLang,
          'key': _apiKey,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final translatedText =
            data['data']['translations'][0]['translatedText'];

        // Cache the translation
        await _cacheTranslation(
          text,
          translatedText,
          sourceLang ?? 'auto',
          targetLang,
        );

        return translatedText;
      } else {
        throw Exception('Translation failed: ${response.statusCode}');
      }
    } catch (e) {
      print('Translation error: $e');
      return text; // Return original text if translation fails
    }
  }

  /// Detect language
  Future<String> detectLanguage(String text) async {
    try {
      final response = await http.post(
        Uri.parse('https://translation.googleapis.com/language/translate/v2/detect'),
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'q': text,
          'key': _apiKey,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['data']['detections'][0][0]['language'];
      } else {
        throw Exception('Language detection failed: ${response.statusCode}');
      }
    } catch (e) {
      print('Language detection error: $e');
      return 'en'; // Default to English
    }
  }

  /// Translate message
  Future<void> translateMessage(String messageId, String targetLang) async {
    final messageDoc =
        await _firestore.collection('messages').doc(messageId).get();
    if (!messageDoc.exists) return;

    final originalText = messageDoc.data()?['text'] ?? '';
    final translatedText = await translateText(originalText, targetLang);

    await _firestore.collection('messages').doc(messageId).update({
      'translations.$targetLang': translatedText,
    });
  }

  /// Translate comment
  Future<void> translateComment(String commentId, String targetLang) async {
    final commentDoc =
        await _firestore.collection('comments').doc(commentId).get();
    if (!commentDoc.exists) return;

    final originalText = commentDoc.data()?['text'] ?? '';
    final translatedText = await translateText(originalText, targetLang);

    await _firestore.collection('comments').doc(commentId).update({
      'translations.$targetLang': translatedText,
    });
  }

  /// Get user's preferred language
  Future<String> getUserPreferredLanguage() async {
    final userId = _auth.currentUser?.uid;
    if (userId == null) return 'en';

    final userDoc = await _firestore.collection('users').doc(userId).get();
    return userDoc.data()?['preferredLanguage'] ?? 'en';
  }

  /// Set user's preferred language
  Future<void> setUserPreferredLanguage(String languageCode) async {
    final userId = _auth.currentUser?.uid;
    if (userId == null) throw Exception('User not authenticated');

    await _firestore.collection('users').doc(userId).update({
      'preferredLanguage': languageCode,
    });
  }

  /// Enable auto-translation for user
  Future<void> enableAutoTranslation(bool enabled) async {
    final userId = _auth.currentUser?.uid;
    if (userId == null) throw Exception('User not authenticated');

    await _firestore.collection('users').doc(userId).update({
      'autoTranslationEnabled': enabled,
    });
  }

  /// Check if auto-translation is enabled
  Future<bool> isAutoTranslationEnabled() async {
    final userId = _auth.currentUser?.uid;
    if (userId == null) return false;

    final userDoc = await _firestore.collection('users').doc(userId).get();
    return userDoc.data()?['autoTranslationEnabled'] ?? false;
  }

  /// Get cached translation
  Future<String?> _getCachedTranslation(String text, String targetLang) async {
    final cacheKey = _generateCacheKey(text, targetLang);
    final cacheDoc =
        await _firestore.collection('translation_cache').doc(cacheKey).get();

    if (cacheDoc.exists) {
      final cache = TranslationCache.fromMap(cacheDoc.data()!);
      // Check if cache is still valid (e.g., less than 30 days old)
      if (DateTime.now().difference(cache.timestamp).inDays < 30) {
        return cache.translatedText;
      }
    }

    return null;
  }

  /// Cache translation
  Future<void> _cacheTranslation(
    String originalText,
    String translatedText,
    String sourceLang,
    String targetLang,
  ) async {
    final cacheKey = _generateCacheKey(originalText, targetLang);
    final cache = TranslationCache(
      originalText: originalText,
      translatedText: translatedText,
      sourceLang: sourceLang,
      targetLang: targetLang,
      timestamp: DateTime.now(),
    );

    await _firestore
        .collection('translation_cache')
        .doc(cacheKey)
        .set(cache.toMap());
  }

  /// Generate cache key
  String _generateCacheKey(String text, String targetLang) {
    return '${text.hashCode}_$targetLang';
  }

  /// Translate multiple texts in batch
  Future<List<String>> translateBatch(
    List<String> texts,
    String targetLang, {
    String? sourceLang,
  }) async {
    final translations = <String>[];

    for (var text in texts) {
      final translation = await translateText(text, targetLang,
          sourceLang: sourceLang);
      translations.add(translation);
    }

    return translations;
  }

  /// Get translation statistics
  Future<Map<String, dynamic>> getTranslationStats() async {
    final userId = _auth.currentUser?.uid;
    if (userId == null) throw Exception('User not authenticated');

    final snapshot = await _firestore
        .collection('translation_cache')
        .where('userId', isEqualTo: userId)
        .get();

    final stats = {
      'totalTranslations': snapshot.docs.length,
      'languagesUsed': <String>{},
    };

    for (var doc in snapshot.docs) {
      final data = doc.data();
      stats['languagesUsed'].add(data['targetLang']);
    }

    return stats;
  }

  /// Clear translation cache
  Future<void> clearTranslationCache() async {
    final userId = _auth.currentUser?.uid;
    if (userId == null) throw Exception('User not authenticated');

    final snapshot = await _firestore
        .collection('translation_cache')
        .where('userId', isEqualTo: userId)
        .get();

    for (var doc in snapshot.docs) {
      await doc.reference.delete();
    }
  }
}
