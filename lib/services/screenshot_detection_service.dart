import 'package:flutter_screenshot_detect/flutter_screenshot_detect.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'dart:developer' as developer;

/// Screenshot Detection Service
/// Detects when users take screenshots of stories, ephemeral messages, or sensitive content
/// and notifies content owners for privacy protection
class ScreenshotDetectionService {
  final ScreenshotDetect _detector = ScreenshotDetect();
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;

  String? _currentContentType;
  String? _currentContentId;
  String? _currentOwnerId;
  bool _isInitialized = false;

  /// Initialize screenshot detection for specific content
  void initialize({
    required String contentType, // 'story', 'message', 'video', 'profile'
    required String contentId,
    required String ownerId,
  }) {
    if (_isInitialized) {
      dispose();
    }

    _currentContentType = contentType;
    _currentContentId = contentId;
    _currentOwnerId = ownerId;

    _detector.initialize();
    _isInitialized = true;

    _detector.screenshotStream.listen((screenshotTaken) {
      if (screenshotTaken) {
        _handleScreenshot();
      }
    });

    developer.log(
      'Screenshot detection initialized for $contentType: $contentId',
      name: 'screenshot_detection_service',
    );
  }

  /// Handle screenshot detection event
  Future<void> _handleScreenshot() async {
    try {
      final currentUser = _auth.currentUser;
      if (currentUser == null) return;

      // Don't notify if user screenshots their own content
      if (currentUser.uid == _currentOwnerId) {
        developer.log('User screenshotted own content, no notification sent',
            name: 'screenshot_detection_service');
        return;
      }

      // Record screenshot event
      await _firestore.collection('screenshots').add({
        'contentType': _currentContentType,
        'contentId': _currentContentId,
        'ownerId': _currentOwnerId,
        'screenshotBy': currentUser.uid,
        'screenshotByUsername': currentUser.displayName ?? 'Unknown',
        'timestamp': FieldValue.serverTimestamp(),
        'notified': false,
      });

      // Send notification to content owner
      await _sendNotification(currentUser);

      // Update content stats
      await _updateContentStats();

      developer.log(
        'Screenshot detected and logged for $_currentContentType',
        name: 'screenshot_detection_service',
      );
    } catch (e) {
      developer.log('Error handling screenshot: $e',
          name: 'screenshot_detection_service');
    }
  }

  /// Send notification to content owner
  Future<void> _sendNotification(User screenshotUser) async {
    try {
      // Create in-app notification
      await _firestore.collection('notifications').add({
        'userId': _currentOwnerId,
        'type': 'screenshot',
        'contentType': _currentContentType,
        'contentId': _currentContentId,
        'triggeredBy': screenshotUser.uid,
        'triggeredByUsername': screenshotUser.displayName ?? 'Someone',
        'triggeredByPhoto': screenshotUser.photoURL,
        'title': 'Screenshot Taken',
        'message':
            '${screenshotUser.displayName ?? "Someone"} took a screenshot of your $_currentContentType',
        'isRead': false,
        'timestamp': FieldValue.serverTimestamp(),
        'actionUrl': '/content/$_currentContentId',
      });

      // Mark notification as sent
      final screenshotDocs = await _firestore
          .collection('screenshots')
          .where('contentId', isEqualTo: _currentContentId)
          .where('screenshotBy', isEqualTo: screenshotUser.uid)
          .orderBy('timestamp', descending: true)
          .limit(1)
          .get();

      if (screenshotDocs.docs.isNotEmpty) {
        await screenshotDocs.docs.first.reference.update({'notified': true});
      }
    } catch (e) {
      developer.log('Error sending notification: $e',
          name: 'screenshot_detection_service');
    }
  }

  /// Update content statistics
  Future<void> _updateContentStats() async {
    try {
      String collection;
      switch (_currentContentType) {
        case 'story':
          collection = 'stories';
          break;
        case 'message':
          collection = 'messages';
          break;
        case 'video':
          collection = 'videos';
          break;
        default:
          return;
      }

      await _firestore.collection(collection).doc(_currentContentId).update({
        'screenshotCount': FieldValue.increment(1),
      });
    } catch (e) {
      developer.log('Error updating content stats: $e',
          name: 'screenshot_detection_service');
    }
  }

  /// Get screenshot history for specific content
  Stream<List<Map<String, dynamic>>> getScreenshots(String contentId) {
    return _firestore
        .collection('screenshots')
        .where('contentId', isEqualTo: contentId)
        .orderBy('timestamp', descending: true)
        .snapshots()
        .map((snapshot) =>
            snapshot.docs.map((doc) => {'id': doc.id, ...doc.data()}).toList());
  }

  /// Get screenshot count for content
  Future<int> getScreenshotCount(String contentId) async {
    try {
      final snapshot = await _firestore
          .collection('screenshots')
          .where('contentId', isEqualTo: contentId)
          .get();

      return snapshot.docs.length;
    } catch (e) {
      developer.log('Error getting screenshot count: $e',
          name: 'screenshot_detection_service');
      return 0;
    }
  }

  /// Get users who took screenshots
  Future<List<Map<String, dynamic>>> getScreenshotUsers(
      String contentId) async {
    try {
      final snapshot = await _firestore
          .collection('screenshots')
          .where('contentId', isEqualTo: contentId)
          .orderBy('timestamp', descending: true)
          .get();

      final users = <Map<String, dynamic>>[];
      for (var doc in snapshot.docs) {
        final data = doc.data();
        users.add({
          'userId': data['screenshotBy'],
          'username': data['screenshotByUsername'],
          'timestamp': data['timestamp'],
        });
      }

      return users;
    } catch (e) {
      developer.log('Error getting screenshot users: $e',
          name: 'screenshot_detection_service');
      return [];
    }
  }

  /// Check if user has screenshotted content
  Future<bool> hasUserScreenshotted(String contentId, String userId) async {
    try {
      final snapshot = await _firestore
          .collection('screenshots')
          .where('contentId', isEqualTo: contentId)
          .where('screenshotBy', isEqualTo: userId)
          .limit(1)
          .get();

      return snapshot.docs.isNotEmpty;
    } catch (e) {
      developer.log('Error checking screenshot status: $e',
          name: 'screenshot_detection_service');
      return false;
    }
  }

  /// Dispose screenshot detector
  void dispose() {
    if (_isInitialized) {
      _detector.dispose();
      _isInitialized = false;
      _currentContentType = null;
      _currentContentId = null;
      _currentOwnerId = null;

      developer.log('Screenshot detection disposed',
          name: 'screenshot_detection_service');
    }
  }

  /// Get analytics for user's content
  Future<Map<String, dynamic>> getScreenshotAnalytics(String userId) async {
    try {
      // Get total screenshots of user's content
      final screenshotsSnapshot = await _firestore
          .collection('screenshots')
          .where('ownerId', isEqualTo: userId)
          .get();

      final totalScreenshots = screenshotsSnapshot.docs.length;

      // Group by content type
      final byType = <String, int>{};
      for (var doc in screenshotsSnapshot.docs) {
        final type = doc.data()['contentType'] as String;
        byType[type] = (byType[type] ?? 0) + 1;
      }

      // Get most screenshotted content
      final contentScreenshots = <String, int>{};
      for (var doc in screenshotsSnapshot.docs) {
        final contentId = doc.data()['contentId'] as String;
        contentScreenshots[contentId] =
            (contentScreenshots[contentId] ?? 0) + 1;
      }

      final sortedContent = contentScreenshots.entries.toList()
        ..sort((a, b) => b.value.compareTo(a.value));

      final topContent = sortedContent
          .take(5)
          .map((e) => {
                'contentId': e.key,
                'screenshotCount': e.value,
              })
          .toList();

      return {
        'totalScreenshots': totalScreenshots,
        'byType': byType,
        'topContent': topContent,
        'lastUpdated': DateTime.now().toIso8601String(),
      };
    } catch (e) {
      developer.log('Error getting screenshot analytics: $e',
          name: 'screenshot_detection_service');
      return {
        'totalScreenshots': 0,
        'byType': {},
        'topContent': [],
      };
    }
  }
}
