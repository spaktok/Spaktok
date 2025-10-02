import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';

/// Service for managing global music and audio library
class MusicLibraryService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseStorage _storage = FirebaseStorage.instance;

  /// Get trending music tracks
  Stream<List<Map<String, dynamic>>> getTrendingMusic({int limit = 20}) {
    return _firestore
        .collection('music')
        .where('isActive', isEqualTo: true)
        .orderBy('usageCount', descending: true)
        .limit(limit)
        .snapshots()
        .map((snapshot) => snapshot.docs.map((doc) => {
              ...doc.data(),
              'id': doc.id,
            }).toList());
  }

  /// Search music by title or artist
  Future<List<Map<String, dynamic>>> searchMusic(String query) async {
    final snapshot = await _firestore
        .collection('music')
        .where('isActive', isEqualTo: true)
        .get();

    final results = snapshot.docs
        .where((doc) {
          final data = doc.data();
          final title = (data['title'] as String? ?? '').toLowerCase();
          final artist = (data['artist'] as String? ?? '').toLowerCase();
          final searchQuery = query.toLowerCase();
          return title.contains(searchQuery) || artist.contains(searchQuery);
        })
        .map((doc) => {
              ...doc.data(),
              'id': doc.id,
            })
        .toList();

    return results;
  }

  /// Get music by category
  Stream<List<Map<String, dynamic>>> getMusicByCategory({
    required String category,
    int limit = 20,
  }) {
    return _firestore
        .collection('music')
        .where('category', isEqualTo: category)
        .where('isActive', isEqualTo: true)
        .orderBy('usageCount', descending: true)
        .limit(limit)
        .snapshots()
        .map((snapshot) => snapshot.docs.map((doc) => {
              ...doc.data(),
              'id': doc.id,
            }).toList());
  }

  /// Get all music categories
  Future<List<String>> getMusicCategories() async {
    final snapshot = await _firestore
        .collection('music')
        .where('isActive', isEqualTo: true)
        .get();

    final categories = <String>{};
    for (var doc in snapshot.docs) {
      final category = doc.data()['category'] as String?;
      if (category != null) {
        categories.add(category);
      }
    }

    return categories.toList()..sort();
  }

  /// Get music details
  Future<Map<String, dynamic>?> getMusicDetails(String musicId) async {
    final doc = await _firestore.collection('music').doc(musicId).get();
    if (doc.exists) {
      return {
        ...doc.data()!,
        'id': doc.id,
      };
    }
    return null;
  }

  /// Increment music usage count (when used in a video)
  Future<void> incrementMusicUsage(String musicId) async {
    await _firestore.collection('music').doc(musicId).update({
      'usageCount': FieldValue.increment(1),
      'lastUsed': FieldValue.serverTimestamp(),
    });
  }

  /// Add music to favorites
  Future<void> addToFavorites(String userId, String musicId) async {
    await _firestore
        .collection('users')
        .doc(userId)
        .collection('favorite_music')
        .doc(musicId)
        .set({
      'musicId': musicId,
      'timestamp': FieldValue.serverTimestamp(),
    });
  }

  /// Remove music from favorites
  Future<void> removeFromFavorites(String userId, String musicId) async {
    await _firestore
        .collection('users')
        .doc(userId)
        .collection('favorite_music')
        .doc(musicId)
        .delete();
  }

  /// Get user's favorite music
  Stream<List<Map<String, dynamic>>> getFavoriteMusic(String userId) async* {
    // Get favorite music IDs
    final favoritesSnapshot = await _firestore
        .collection('users')
        .doc(userId)
        .collection('favorite_music')
        .get();

    final musicIds = favoritesSnapshot.docs.map((doc) => doc.id).toList();

    if (musicIds.isEmpty) {
      yield [];
      return;
    }

    // Get music details for favorites
    // Note: Firestore 'whereIn' has a limit of 10 items
    final chunks = <List<String>>[];
    for (var i = 0; i < musicIds.length; i += 10) {
      chunks.add(musicIds.sublist(
        i,
        i + 10 > musicIds.length ? musicIds.length : i + 10,
      ));
    }

    final allMusic = <Map<String, dynamic>>[];
    for (var chunk in chunks) {
      final snapshot = await _firestore
          .collection('music')
          .where(FieldPath.documentId, whereIn: chunk)
          .get();

      allMusic.addAll(snapshot.docs.map((doc) => {
            ...doc.data(),
            'id': doc.id,
          }));
    }

    yield allMusic;
  }

  /// Get recently used music by user
  Future<List<Map<String, dynamic>>> getRecentlyUsedMusic(String userId) async {
    // Get user's videos
    final videosSnapshot = await _firestore
        .collection('videos')
        .where('userId', isEqualTo: userId)
        .where('musicId', isNotEqualTo: null)
        .orderBy('musicId')
        .orderBy('timestamp', descending: true)
        .limit(20)
        .get();

    // Extract unique music IDs
    final musicIds = <String>{};
    for (var doc in videosSnapshot.docs) {
      final musicId = doc.data()['musicId'] as String?;
      if (musicId != null) {
        musicIds.add(musicId);
      }
    }

    if (musicIds.isEmpty) {
      return [];
    }

    // Get music details
    final chunks = <List<String>>[];
    final musicIdsList = musicIds.toList();
    for (var i = 0; i < musicIdsList.length; i += 10) {
      chunks.add(musicIdsList.sublist(
        i,
        i + 10 > musicIdsList.length ? musicIdsList.length : i + 10,
      ));
    }

    final allMusic = <Map<String, dynamic>>[];
    for (var chunk in chunks) {
      final snapshot = await _firestore
          .collection('music')
          .where(FieldPath.documentId, whereIn: chunk)
          .get();

      allMusic.addAll(snapshot.docs.map((doc) => {
            ...doc.data(),
            'id': doc.id,
          }));
    }

    return allMusic;
  }

  /// Add a new music track (admin function)
  Future<String> addMusicTrack({
    required String title,
    required String artist,
    required String audioUrl,
    required String coverImageUrl,
    required int durationSeconds,
    required String category,
    String? album,
    int? releaseYear,
  }) async {
    final musicData = {
      'title': title,
      'artist': artist,
      'audioUrl': audioUrl,
      'coverImageUrl': coverImageUrl,
      'durationSeconds': durationSeconds,
      'category': category,
      'album': album,
      'releaseYear': releaseYear,
      'usageCount': 0,
      'isActive': true,
      'createdAt': FieldValue.serverTimestamp(),
      'lastUsed': null,
    };

    final docRef = await _firestore.collection('music').add(musicData);
    return docRef.id;
  }

  /// Update music track (admin function)
  Future<void> updateMusicTrack(String musicId, Map<String, dynamic> updates) async {
    await _firestore.collection('music').doc(musicId).update(updates);
  }

  /// Deactivate music track (admin function)
  Future<void> deactivateMusicTrack(String musicId) async {
    await _firestore.collection('music').doc(musicId).update({
      'isActive': false,
    });
  }

  /// Get music used in a specific video
  Future<Map<String, dynamic>?> getMusicForVideo(String videoId) async {
    final videoDoc = await _firestore.collection('videos').doc(videoId).get();
    
    if (!videoDoc.exists) {
      return null;
    }

    final musicId = videoDoc.data()?['musicId'] as String?;
    if (musicId == null) {
      return null;
    }

    return await getMusicDetails(musicId);
  }
}
