import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:spaktok/models/reel.dart';
import 'package:spaktok/services/hashtag_service.dart';
import 'package:spaktok/services/music_library_service.dart';
import 'package:spaktok/services/challenge_service.dart';
import 'package:spaktok/services/ai_recommendation_service.dart';
import 'dart:io';
import 'dart:math' as math;
import 'dart:developer' as developer;

class ReelService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseStorage _storage = FirebaseStorage.instance;

  // ... (other methods remain the same)
    Future<void> uploadReel({
    required String userId,
    required File videoFile,
    String description = '',
    List<String> hashtags = const [],
    String? musicId,
    String? musicTitle,
    String? musicArtist,
    String? challengeId,
    String? duetWithId,
    String? stitchWithId,
    bool isDuet = false,
    bool isStitch = false,
    Map<String, dynamic>? location,
  }) async {
    try {
      final String reelId = _firestore.collection('reels').doc().id;
      final String filePath =
          'reels/$userId/$reelId-${DateTime.now().millisecondsSinceEpoch}.mp4';
      final UploadTask uploadTask =
          _storage.ref().child(filePath).putFile(videoFile);
      final TaskSnapshot snapshot = await uploadTask.whenComplete(() => null);
      final String videoUrl = await snapshot.ref.getDownloadURL();

      final Reel reel = Reel(
        id: reelId,
        userId: userId,
        videoUrl: videoUrl,
        description: description,
        timestamp: Timestamp.now(),
        hashtags: hashtags,
        musicId: musicId,
        musicTitle: musicTitle,
        musicArtist: musicArtist,
        challengeId: challengeId,
        duetWithId: duetWithId,
        stitchWithId: stitchWithId,
        isDuet: isDuet,
        isStitch: isStitch,
        location: location,
      );

      await _firestore.collection('reels').doc(reelId).set(reel.toJson());

      // Update hashtag counts
      if (hashtags.isNotEmpty) {
        final hashtagService = HashtagService();
        await hashtagService.saveHashtags(reelId, hashtags);
      }

      // Update music usage count
      if (musicId != null) {
        final musicService = MusicLibraryService();
        await musicService.incrementMusicUsage(musicId);
      }

      // Update challenge stats
      if (challengeId != null) {
        final challengeService = ChallengeService();
        await challengeService.joinChallenge(challengeId, userId, reelId);
      }

      developer.log('Reel uploaded successfully: $reelId', name: 'reel_service');
    } catch (e) {
      developer.log('Error uploading reel: $e', name: 'reel_service');
      rethrow;
    }
  }

  // جلب جميع Reels
  Stream<List<Reel>> getAllReels() {
    return _firestore
        .collection('reels')
        .orderBy('timestamp', descending: true)
        .snapshots()
        .map((snapshot) =>
            snapshot.docs.map((doc) => Reel.fromJson(doc.data())).toList());
  }

  // New method to check if a user has liked a reel
  Future<bool> hasUserLikedReel(String reelId, String userId) async {
    final DocumentSnapshot likeSnapshot = await _firestore
        .collection('reels')
        .doc(reelId)
        .collection('likes')
        .doc(userId)
        .get();
    return likeSnapshot.exists;
  }

  // Updated likeReel method for robustness
  Future<void> likeReel(String reelId, String userId) async {
    final DocumentReference reelRef = _firestore.collection('reels').doc(reelId);
    final DocumentReference likeRef = reelRef.collection('likes').doc(userId);

    await _firestore.runTransaction((transaction) async {
      final DocumentSnapshot likeSnapshot = await transaction.get(likeRef);
      if (!likeSnapshot.exists) {
        final DocumentSnapshot reelSnapshot = await transaction.get(reelRef);
        if (reelSnapshot.exists) {
          final int currentLikes = (reelSnapshot.data() as Map<String, dynamic>)['likesCount'] ?? 0;
          transaction.update(reelRef, {'likesCount': currentLikes + 1});
          transaction.set(likeRef, {'userId': userId, 'timestamp': FieldValue.serverTimestamp()});
        }
      }
    });
  }

  // Updated unlikeReel method for robustness
  Future<void> unlikeReel(String reelId, String userId) async {
    final DocumentReference reelRef = _firestore.collection('reels').doc(reelId);
    final DocumentReference likeRef = reelRef.collection('likes').doc(userId);

    await _firestore.runTransaction((transaction) async {
      final DocumentSnapshot likeSnapshot = await transaction.get(likeRef);
      if (likeSnapshot.exists) {
        final DocumentSnapshot reelSnapshot = await transaction.get(reelRef);
        if (reelSnapshot.exists) {
          final int currentLikes = (reelSnapshot.data() as Map<String, dynamic>)['likesCount'] ?? 0;
          if (currentLikes > 0) {
            transaction.update(reelRef, {'likesCount': currentLikes - 1});
          }
          transaction.delete(likeRef);
        }
      }
    });
  }

  // ... (other methods remain the same)
    // جلب Reels للصفحة الرئيسية (For You) مع التوصيات
  Stream<List<Reel>> getForYouReels(String userId) async* {
    final aiService = AIRecommendationService();
    final recommendedIds =
        await aiService.getForYouRecommendations(userId: userId);

    if (recommendedIds.isEmpty) {
      // Fallback to regular feed
      yield* getAllReels();
      return;
    }

    final reelIds = recommendedIds
        .whereType<Map<String, dynamic>>()
        .where((r) => r.containsKey('id') && r['id'] != null)
        .map((r) => r['id'] as String)
        .toList();

    if (reelIds.isEmpty) {
      yield* getAllReels();
      return;
    }

    // Get reels in recommended order
    yield* _firestore
        .collection('reels')
        .where(FieldPath.documentId, whereIn: reelIds.take(10).toList())
        .snapshots()
        .map((snapshot) {
      final reels =
          snapshot.docs.map((doc) => Reel.fromJson(doc.data())).toList();
      // Sort by recommendation order
      reels.sort(
          (a, b) => reelIds.indexOf(a.id).compareTo(reelIds.indexOf(b.id)));
      return reels;
    });
  }

  // جلب Reels حسب الهاشتاج
  Stream<List<Reel>> getReelsByHashtag(String hashtag) async* {
    final hashtagService = HashtagService();
    final postsStream = hashtagService.getPostsByHashtag(hashtag.toLowerCase());

    await for (final postsSnapshot in postsStream) {
      final postIds = postsSnapshot.docs.map((doc) => doc.id).toList();
      if (postIds.isEmpty) {
        yield [];
        continue;
      }

      final reelsSnapshot = await _firestore
          .collection('reels')
          .where(FieldPath.documentId, whereIn: postIds.take(10).toList())
          .get();

      yield reelsSnapshot.docs.map((doc) => Reel.fromJson(doc.data())).toList();
    }
  }

  // جلب Reels حسب التحدي
  Stream<List<Reel>> getReelsByChallenge(String challengeId) async* {
    final challengeService = ChallengeService();
    final participantsStream =
        challengeService.getChallengeParticipants(challengeId);

    await for (final participantsSnapshot in participantsStream) {
      final postIds = participantsSnapshot.docs
          .map((doc) =>
              (doc.data() as Map<String, dynamic>)['postId'] as String?)
          .where((id) => id != null)
          .cast<String>()
          .toList();

      if (postIds.isEmpty) {
        yield [];
        continue;
      }

      final reelsSnapshot = await _firestore
          .collection('reels')
          .where(FieldPath.documentId, whereIn: postIds.take(10).toList())
          .get();

      yield reelsSnapshot.docs.map((doc) => Reel.fromJson(doc.data())).toList();
    }
  }

  // جلب Reels حسب الموسيقى
  Stream<List<Reel>> getReelsByMusic(String musicId) {
    return _firestore
        .collection('reels')
        .where('musicId', isEqualTo: musicId)
        .orderBy('timestamp', descending: true)
        .snapshots()
        .map((snapshot) =>
            snapshot.docs.map((doc) => Reel.fromJson(doc.data())).toList());
  }

  // جلب Reels حسب الموقع
  Stream<List<Reel>> getReelsByLocation(
      double lat, double lng, double radiusKm) {
    // Note: This is a simplified implementation
    // In production, you'd use GeoFire or similar for proper geospatial queries
    return _firestore
        .collection('reels')
        .where('location', isNotEqualTo: null)
        .orderBy('timestamp', descending: true)
        .snapshots()
        .map((snapshot) {
      final reels =
          snapshot.docs.map((doc) => Reel.fromJson(doc.data())).toList();
      // Filter by distance (simplified)
      return reels.where((reel) {
        if (reel.location == null) return false;
        final reelLat = reel.location!['latitude'] as double?;
        final reelLng = reel.location!['longitude'] as double?;
        if (reelLat == null || reelLng == null) return false;

        // Simple distance calculation (in km)
        final distance = _calculateDistance(lat, lng, reelLat, reelLng);
        return distance <= radiusKm;
      }).toList();
    });
  }

  // حساب المسافة بين نقطتين (نموذج مبسط)
  double _calculateDistance(
      double lat1, double lng1, double lat2, double lng2) {
    const double earthRadius = 6371; // كيلومتر
    final double dLat = (lat2 - lat1) * (math.pi / 180);
    final double dLng = (lng2 - lng1) * (math.pi / 180);
    final double a = math.sin(dLat / 2) * math.sin(dLat / 2) +
        math.cos(lat1 * math.pi / 180) *
            math.cos(lat2 * math.pi / 180) *
            math.sin(dLng / 2) *
            math.sin(dLng / 2);
    final double c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a));
    return earthRadius * c;
  }

  // مشاركة Reel
  Future<void> shareReel(String reelId, String userId) async {
    final DocumentReference reelRef =
        _firestore.collection('reels').doc(reelId);

    await _firestore.runTransaction((transaction) async {
      final DocumentSnapshot reelSnapshot = await transaction.get(reelRef);
      if (reelSnapshot.exists) {
        final int currentShares =
            (reelSnapshot.data() as Map<String, dynamic>)['sharesCount'] ?? 0;
        transaction.update(reelRef, {'sharesCount': currentShares + 1});
      }
    });

    // Track share interaction
    final aiService = AIRecommendationService();
    await aiService.trackVideoInteraction(
      userId: userId,
      videoId: reelId,
      interactionType: 'share',
    );
  }

  // تتبع مشاهدة Reel
  Future<void> trackReelView(
    String reelId,
    String userId, {
    double? watchTime,
    double? completionRate,
  }) async {
    // Track view interaction
    final aiService = AIRecommendationService();
    await aiService.trackVideoInteraction(
      userId: userId,
      videoId: reelId,
      interactionType: 'view',
      watchTime: watchTime,
      completionRate: completionRate,
    );
  }
  
    // إضافة تعليق لـ Reel
  Future<void> addComment(
      String reelId, String userId, String commentText) async {
    final DocumentReference reelRef =
        _firestore.collection('reels').doc(reelId);
    final DocumentReference commentRef = reelRef.collection('comments').doc();

    await _firestore.runTransaction((transaction) async {
      final DocumentSnapshot reelSnapshot = await transaction.get(reelRef);
      if (reelSnapshot.exists) {
        final int currentComments =
            (reelSnapshot.data() as Map<String, dynamic>)['commentsCount'] ?? 0;
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
      developer.log('Reel deleted successfully: $reelId', name: 'reel_service');
    } catch (e) {
      developer.log('Error deleting reel: $e', name: 'reel_service');
      rethrow;
    }
  }

  // حفظ Reel في المفضلة
  Future<void> saveReel(String reelId, String userId) async {
    final DocumentReference saveRef = _firestore
        .collection('users')
        .doc(userId)
        .collection('saved_reels')
        .doc(reelId);

    await _firestore.runTransaction((transaction) async {
      final DocumentSnapshot saveSnapshot = await transaction.get(saveRef);
      if (!saveSnapshot.exists) {
        transaction.set(saveRef, {
          'reelId': reelId,
          'savedAt': FieldValue.serverTimestamp(),
        });
      }
    });
  }

  // إزالة Reel من المفضلة
  Future<void> unsaveReel(String reelId, String userId) async {
    final DocumentReference saveRef = _firestore
        .collection('users')
        .doc(userId)
        .collection('saved_reels')
        .doc(reelId);

    await _firestore.runTransaction((transaction) async {
      final DocumentSnapshot saveSnapshot = await transaction.get(saveRef);
      if (saveSnapshot.exists) {
        transaction.delete(saveRef);
      }
    });
  }

  // جلب Reels المحفوظة للمستخدم
  Stream<List<Reel>> getSavedReels(String userId) {
    return _firestore
        .collection('users')
        .doc(userId)
        .collection('saved_reels')
        .orderBy('savedAt', descending: true)
        .snapshots()
        .asyncMap((savedSnapshot) async {
      final reelIds = savedSnapshot.docs
          .map((doc) => doc.data()['reelId'] as String?)
          .where((id) => id != null)
          .cast<String>()
          .toList();
      if (reelIds.isEmpty) return [];

      final reelsSnapshot = await _firestore
          .collection('reels')
          .where(FieldPath.documentId, whereIn: reelIds)
          .get();
      return reelsSnapshot.docs
          .map((doc) => Reel.fromJson(doc.data()))
          .toList();
    });
  }

  // التحقق من حفظ Reel
  Future<bool> isReelSaved(String reelId, String userId) async {
    final DocumentSnapshot saveSnapshot = await _firestore
        .collection('users')
        .doc(userId)
        .collection('saved_reels')
        .doc(reelId)
        .get();
    return saveSnapshot.exists;
  }
}
