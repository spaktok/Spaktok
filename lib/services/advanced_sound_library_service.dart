import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:spaktok/services/auth_service.dart';
import 'dart:io';
import 'dart:developer' as developer;

/// Model for Sound/Music
class Sound {
  final String id;
  final String name;
  final String artist;
  final String audioUrl;
  final String? coverImageUrl;
  final int duration; // in seconds
  final String category; // 'trending', 'original', 'popular', 'new'
  final List<String> genres;
  final int usageCount;
  final bool isOriginal;
  final String? uploaderId;
  final DateTime createdAt;

  Sound({
    required this.id,
    required this.name,
    required this.artist,
    required this.audioUrl,
    this.coverImageUrl,
    required this.duration,
    required this.category,
    required this.genres,
    this.usageCount = 0,
    this.isOriginal = false,
    this.uploaderId,
    required this.createdAt,
  });

  factory Sound.fromMap(Map<String, dynamic> map, String id) {
    return Sound(
      id: id,
      name: map['name'] ?? '',
      artist: map['artist'] ?? 'Unknown',
      audioUrl: map['audioUrl'] ?? '',
      coverImageUrl: map['coverImageUrl'],
      duration: map['duration'] ?? 0,
      category: map['category'] ?? 'popular',
      genres: List<String>.from(map['genres'] ?? []),
      usageCount: map['usageCount'] ?? 0,
      isOriginal: map['isOriginal'] ?? false,
      uploaderId: map['uploaderId'],
      createdAt: (map['createdAt'] as Timestamp).toDate(),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'name': name,
      'artist': artist,
      'audioUrl': audioUrl,
      'coverImageUrl': coverImageUrl,
      'duration': duration,
      'category': category,
      'genres': genres,
      'usageCount': usageCount,
      'isOriginal': isOriginal,
      'uploaderId': uploaderId,
      'createdAt': Timestamp.fromDate(createdAt),
    };
  }
}

/// Advanced Sound Library Service
/// Handles sound discovery, search, trending, and usage tracking
class AdvancedSoundLibraryService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseStorage _storage = FirebaseStorage.instance;
  final AuthService _authService = AuthService();

  /// Search sounds by name, artist, or genre
  Future<List<Sound>> searchSounds(String query) async {
    try {
      if (query.isEmpty) return [];

      final queryLower = query.toLowerCase();

      // Search in name
      final nameQuery = await _firestore
          .collection('sounds')
          .where('nameLower', isGreaterThanOrEqualTo: queryLower)
          .where('nameLower', isLessThanOrEqualTo: '$queryLower\uf8ff')
          .limit(20)
          .get();

      // Search in artist
      final artistQuery = await _firestore
          .collection('sounds')
          .where('artistLower', isGreaterThanOrEqualTo: queryLower)
          .where('artistLower', isLessThanOrEqualTo: '$queryLower\uf8ff')
          .limit(20)
          .get();

      // Combine results and remove duplicates
      final soundMap = <String, Sound>{};

      for (var doc in nameQuery.docs) {
        soundMap[doc.id] = Sound.fromMap(doc.data(), doc.id);
      }

      for (var doc in artistQuery.docs) {
        soundMap[doc.id] = Sound.fromMap(doc.data(), doc.id);
      }

      return soundMap.values.toList();
    } catch (e) {
      developer.log('Error searching sounds: $e', name: 'advanced_sound_library_service');
      return [];
    }
  }

  /// Get trending sounds
  Future<List<Sound>> getTrendingSounds({int limit = 50}) async {
    try {
      final querySnapshot = await _firestore
          .collection('sounds')
          .where('category', isEqualTo: 'trending')
          .orderBy('usageCount', descending: true)
          .limit(limit)
          .get();

      return querySnapshot.docs
          .map((doc) => Sound.fromMap(doc.data(), doc.id))
          .toList();
    } catch (e) {
      developer.log('Error getting trending sounds: $e', name: 'advanced_sound_library_service');
      return [];
    }
  }

  /// Get popular sounds
  Future<List<Sound>> getPopularSounds({int limit = 50}) async {
    try {
      final querySnapshot = await _firestore
          .collection('sounds')
          .orderBy('usageCount', descending: true)
          .limit(limit)
          .get();

      return querySnapshot.docs
          .map((doc) => Sound.fromMap(doc.data(), doc.id))
          .toList();
    } catch (e) {
      developer.log('Error getting popular sounds: $e', name: 'advanced_sound_library_service');
      return [];
    }
  }

  /// Get new/recent sounds
  Future<List<Sound>> getNewSounds({int limit = 50}) async {
    try {
      final querySnapshot = await _firestore
          .collection('sounds')
          .orderBy('createdAt', descending: true)
          .limit(limit)
          .get();

      return querySnapshot.docs
          .map((doc) => Sound.fromMap(doc.data(), doc.id))
          .toList();
    } catch (e) {
      developer.log('Error getting new sounds: $e', name: 'advanced_sound_library_service');
      return [];
    }
  }

  /// Get sounds by genre
  Future<List<Sound>> getSoundsByGenre(String genre, {int limit = 50}) async {
    try {
      final querySnapshot = await _firestore
          .collection('sounds')
          .where('genres', arrayContains: genre)
          .orderBy('usageCount', descending: true)
          .limit(limit)
          .get();

      return querySnapshot.docs
          .map((doc) => Sound.fromMap(doc.data(), doc.id))
          .toList();
    } catch (e) {
      developer.log('Error getting sounds by genre: $e', name: 'advanced_sound_library_service');
      return [];
    }
  }

  /// Get all available genres
  Future<List<String>> getGenres() async {
    try {
      final querySnapshot =
          await _firestore.collection('soundGenres').orderBy('name').get();

      return querySnapshot.docs
          .map((doc) => doc.data()['name'] as String)
          .toList();
    } catch (e) {
      developer.log('Error getting genres: $e', name: 'advanced_sound_library_service');
      return [
        'Pop',
        'Rock',
        'Hip Hop',
        'Electronic',
        'R&B',
        'Country',
        'Jazz',
        'Classical'
      ];
    }
  }

  /// Upload custom sound (original audio)
  Future<Sound> uploadCustomSound({
    required File audioFile,
    required String name,
    required String artist,
    File? coverImage,
    List<String>? genres,
    int? duration,
  }) async {
    try {
      final user = _authService.currentUser;
      if (user == null) throw Exception('User not authenticated');

      // Generate sound ID
      final String soundId = _firestore.collection('sounds').doc().id;

      // Upload audio file
      final String audioPath =
          'sounds/${user.uid}/$soundId-${DateTime.now().millisecondsSinceEpoch}.mp3';
      final UploadTask audioUploadTask =
          _storage.ref().child(audioPath).putFile(audioFile);
      final TaskSnapshot audioSnapshot = await audioUploadTask;
      final String audioUrl = await audioSnapshot.ref.getDownloadURL();

      // Upload cover image if provided
      String? coverImageUrl;
      if (coverImage != null) {
        final String imagePath = 'sounds/${user.uid}/$soundId-cover.jpg';
        final UploadTask imageUploadTask =
            _storage.ref().child(imagePath).putFile(coverImage);
        final TaskSnapshot imageSnapshot = await imageUploadTask;
        coverImageUrl = await imageSnapshot.ref.getDownloadURL();
      }

      // Create sound document
      final sound = Sound(
        id: soundId,
        name: name,
        artist: artist,
        audioUrl: audioUrl,
        coverImageUrl: coverImageUrl,
        duration: duration ?? 30,
        category: 'original',
        genres: genres ?? ['Original'],
        usageCount: 0,
        isOriginal: true,
        uploaderId: user.uid,
        createdAt: DateTime.now(),
      );

      await _firestore.collection('sounds').doc(soundId).set({
        ...sound.toMap(),
        'nameLower': name.toLowerCase(),
        'artistLower': artist.toLowerCase(),
      });

      return sound;
    } catch (e) {
      developer.log('Error uploading custom sound: $e', name: 'advanced_sound_library_service');
      rethrow;
    }
  }

  /// Apply sound to video
  Future<void> applySoundToVideo(String videoId, String soundId) async {
    try {
      final user = _authService.currentUser;
      if (user == null) throw Exception('User not authenticated');

      // Get sound data
      final soundDoc = await _firestore.collection('sounds').doc(soundId).get();

      if (!soundDoc.exists) {
        throw Exception('Sound not found');
      }

      final soundData = soundDoc.data()!;

      // Update video with sound
      await _firestore.collection('videos').doc(videoId).update({
        'soundId': soundId,
        'soundName': soundData['name'],
        'soundArtist': soundData['artist'],
        'soundUrl': soundData['audioUrl'],
      });

      // Increment sound usage count
      await _firestore.collection('sounds').doc(soundId).update({
        'usageCount': FieldValue.increment(1),
        'lastUsed': FieldValue.serverTimestamp(),
      });

      // Add to trending if usage exceeds threshold
      if ((soundData['usageCount'] ?? 0) > 100) {
        await _firestore
            .collection('sounds')
            .doc(soundId)
            .update({'category': 'trending'});
      }
    } catch (e) {
      developer.log('Error applying sound to video: $e', name: 'advanced_sound_library_service');
      rethrow;
    }
  }

  /// Get videos using a specific sound
  Future<List<Map<String, dynamic>>> getVideosWithSound(String soundId,
      {int limit = 50}) async {
    try {
      final querySnapshot = await _firestore
          .collection('videos')
          .where('soundId', isEqualTo: soundId)
          .orderBy('createdAt', descending: true)
          .limit(limit)
          .get();

      return querySnapshot.docs
          .map((doc) => {'id': doc.id, ...doc.data()})
          .toList();
    } catch (e) {
      developer.log('Error getting videos with sound: $e', name: 'advanced_sound_library_service');
      return [];
    }
  }

  /// Get user's favorite sounds
  Future<List<Sound>> getFavoriteSounds() async {
    try {
      final user = _authService.currentUser;
      if (user == null) throw Exception('User not authenticated');

      final favoritesSnapshot = await _firestore
          .collection('users')
          .doc(user.uid)
          .collection('favoriteSounds')
          .orderBy('addedAt', descending: true)
          .get();

      final soundIds = favoritesSnapshot.docs
          .map((doc) => doc.data()['soundId'] as String)
          .toList();

      if (soundIds.isEmpty) return [];

      final sounds = <Sound>[];
      for (String soundId in soundIds) {
        final soundDoc =
            await _firestore.collection('sounds').doc(soundId).get();

        if (soundDoc.exists) {
          sounds.add(Sound.fromMap(soundDoc.data()!, soundDoc.id));
        }
      }

      return sounds;
    } catch (e) {
      developer.log('Error getting favorite sounds: $e', name: 'advanced_sound_library_service');
      return [];
    }
  }

  /// Add sound to favorites
  Future<void> addToFavorites(String soundId) async {
    try {
      final user = _authService.currentUser;
      if (user == null) throw Exception('User not authenticated');

      await _firestore
          .collection('users')
          .doc(user.uid)
          .collection('favoriteSounds')
          .doc(soundId)
          .set({
        'soundId': soundId,
        'addedAt': FieldValue.serverTimestamp(),
      });
    } catch (e) {
      developer.log('Error adding to favorites: $e', name: 'advanced_sound_library_service');
      rethrow;
    }
  }

  /// Remove sound from favorites
  Future<void> removeFromFavorites(String soundId) async {
    try {
      final user = _authService.currentUser;
      if (user == null) throw Exception('User not authenticated');

      await _firestore
          .collection('users')
          .doc(user.uid)
          .collection('favoriteSounds')
          .doc(soundId)
          .delete();
    } catch (e) {
      developer.log('Error removing from favorites: $e', name: 'advanced_sound_library_service');
      rethrow;
    }
  }

  /// Get recommended sounds based on user activity
  Future<List<Sound>> getRecommendedSounds({int limit = 20}) async {
    try {
      final user = _authService.currentUser;
      if (user == null) return getPopularSounds(limit: limit);

      // Get user's recently used sounds to understand preferences
      final recentVideos = await _firestore
          .collection('videos')
          .where('userId', isEqualTo: user.uid)
          .orderBy('createdAt', descending: true)
          .limit(10)
          .get();

      final usedGenres = <String>{};
      for (var video in recentVideos.docs) {
        final soundId = video.data()['soundId'];
        if (soundId != null) {
          final soundDoc =
              await _firestore.collection('sounds').doc(soundId).get();

          if (soundDoc.exists) {
            final genres = List<String>.from(soundDoc.data()!['genres'] ?? []);
            usedGenres.addAll(genres);
          }
        }
      }

      // If no genre preferences, return popular sounds
      if (usedGenres.isEmpty) {
        return getPopularSounds(limit: limit);
      }

      // Get sounds from preferred genres
      final recommendedSounds = <Sound>[];
      for (String genre in usedGenres.take(3)) {
        final sounds = await getSoundsByGenre(genre, limit: 10);
        recommendedSounds.addAll(sounds);
      }

      // Remove duplicates and limit
      final uniqueSounds = {
        for (var sound in recommendedSounds) sound.id: sound
      };
      return uniqueSounds.values.take(limit).toList();
    } catch (e) {
      developer.log('Error getting recommended sounds: $e', name: 'advanced_sound_library_service');
      return getPopularSounds(limit: limit);
    }
  }
}
