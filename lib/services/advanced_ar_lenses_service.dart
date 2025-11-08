import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:spaktok/services/auth_service.dart';
import 'dart:io';

/// AR Lens Types
enum ARLensType {
  faceTracking, // Face filters, beauty effects
  worldTracking, // Surface detection, AR objects
  imageTracking, // Marker-based AR
  bodyTracking, // Full body tracking
  handTracking, // Hand gesture tracking
}

/// AR Lens Category
enum ARLensCategory {
  beauty,
  funny,
  animals,
  accessories,
  backgrounds,
  games,
  branded,
  seasonal,
  trending,
}

/// AR Lens Model
class ARLens {
  final String id;
  final String name;
  final String description;
  final String thumbnailUrl;
  final String? previewVideoUrl;
  final ARLensType type;
  final ARLensCategory category;
  final String creatorId;
  final String? creatorName;
  final int usageCount;
  final double rating;
  final List<String> tags;
  final bool isFeatured;
  final bool isPremium;
  final Map<String, dynamic> parameters;
  final DateTime createdAt;
  final DateTime updatedAt;

  ARLens({
    required this.id,
    required this.name,
    required this.description,
    required this.thumbnailUrl,
    this.previewVideoUrl,
    required this.type,
    required this.category,
    required this.creatorId,
    this.creatorName,
    this.usageCount = 0,
    this.rating = 0.0,
    required this.tags,
    this.isFeatured = false,
    this.isPremium = false,
    required this.parameters,
    required this.createdAt,
    required this.updatedAt,
  });

  factory ARLens.fromMap(Map<String, dynamic> map, String id) {
    return ARLens(
      id: id,
      name: map['name'] ?? '',
      description: map['description'] ?? '',
      thumbnailUrl: map['thumbnailUrl'] ?? '',
      previewVideoUrl: map['previewVideoUrl'],
      type: ARLensType.values.firstWhere(
        (e) => e.toString().split('.').last == map['type'],
        orElse: () => ARLensType.faceTracking,
      ),
      category: ARLensCategory.values.firstWhere(
        (e) => e.toString().split('.').last == map['category'],
        orElse: () => ARLensCategory.funny,
      ),
      creatorId: map['creatorId'] ?? '',
      creatorName: map['creatorName'],
      usageCount: map['usageCount'] ?? 0,
      rating: (map['rating'] ?? 0.0).toDouble(),
      tags: List<String>.from(map['tags'] ?? []),
      isFeatured: map['isFeatured'] ?? false,
      isPremium: map['isPremium'] ?? false,
      parameters: Map<String, dynamic>.from(map['parameters'] ?? {}),
      createdAt: (map['createdAt'] as Timestamp).toDate(),
      updatedAt: (map['updatedAt'] as Timestamp).toDate(),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'name': name,
      'description': description,
      'thumbnailUrl': thumbnailUrl,
      'previewVideoUrl': previewVideoUrl,
      'type': type.toString().split('.').last,
      'category': category.toString().split('.').last,
      'creatorId': creatorId,
      'creatorName': creatorName,
      'usageCount': usageCount,
      'rating': rating,
      'tags': tags,
      'isFeatured': isFeatured,
      'isPremium': isPremium,
      'parameters': parameters,
      'createdAt': Timestamp.fromDate(createdAt),
      'updatedAt': Timestamp.fromDate(updatedAt),
    };
  }
}

/// Advanced AR Lenses Service
/// Handles Snapchat-style AR lenses with face tracking, world AR, and custom effects
class AdvancedARLensesService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseStorage _storage = FirebaseStorage.instance;
  final AuthService _authService = AuthService();

  /// Get featured AR lenses
  Future<List<ARLens>> getFeaturedLenses({int limit = 20}) async {
    try {
      final querySnapshot = await _firestore
          .collection('arLenses')
          .where('isFeatured', isEqualTo: true)
          .orderBy('usageCount', descending: true)
          .limit(limit)
          .get();

      return querySnapshot.docs
          .map((doc) => ARLens.fromMap(doc.data(), doc.id))
          .toList();
    } catch (e) {
      print('Error getting featured lenses: $e');
      return [];
    }
  }

  /// Get trending AR lenses
  Future<List<ARLens>> getTrendingLenses({int limit = 50}) async {
    try {
      final querySnapshot = await _firestore
          .collection('arLenses')
          .orderBy('usageCount', descending: true)
          .limit(limit)
          .get();

      return querySnapshot.docs
          .map((doc) => ARLens.fromMap(doc.data(), doc.id))
          .toList();
    } catch (e) {
      print('Error getting trending lenses: $e');
      return [];
    }
  }

  /// Get lenses by category
  Future<List<ARLens>> getLensesByCategory(
    ARLensCategory category, {
    int limit = 50,
  }) async {
    try {
      final querySnapshot = await _firestore
          .collection('arLenses')
          .where('category', isEqualTo: category.toString().split('.').last)
          .orderBy('usageCount', descending: true)
          .limit(limit)
          .get();

      return querySnapshot.docs
          .map((doc) => ARLens.fromMap(doc.data(), doc.id))
          .toList();
    } catch (e) {
      print('Error getting lenses by category: $e');
      return [];
    }
  }

  /// Get lenses by type
  Future<List<ARLens>> getLensesByType(
    ARLensType type, {
    int limit = 50,
  }) async {
    try {
      final querySnapshot = await _firestore
          .collection('arLenses')
          .where('type', isEqualTo: type.toString().split('.').last)
          .orderBy('usageCount', descending: true)
          .limit(limit)
          .get();

      return querySnapshot.docs
          .map((doc) => ARLens.fromMap(doc.data(), doc.id))
          .toList();
    } catch (e) {
      print('Error getting lenses by type: $e');
      return [];
    }
  }

  /// Search AR lenses
  Future<List<ARLens>> searchLenses(String query) async {
    try {
      if (query.isEmpty) return [];

      final queryLower = query.toLowerCase();

      final querySnapshot = await _firestore
          .collection('arLenses')
          .where('nameLower', isGreaterThanOrEqualTo: queryLower)
          .where('nameLower', isLessThanOrEqualTo: '$queryLower\uf8ff')
          .limit(30)
          .get();

      return querySnapshot.docs
          .map((doc) => ARLens.fromMap(doc.data(), doc.id))
          .toList();
    } catch (e) {
      print('Error searching lenses: $e');
      return [];
    }
  }

  /// Apply AR lens to content
  Future<void> applyLens({
    required String contentId,
    required String lensId,
    String contentType = 'photo', // photo, video, story
  }) async {
    try {
      final user = _authService.currentUser;
      if (user == null) throw Exception('User not authenticated');

      // Get lens data
      final lensDoc = await _firestore.collection('arLenses').doc(lensId).get();

      if (!lensDoc.exists) throw Exception('Lens not found');

      final lensData = lensDoc.data()!;

      // Update content with lens
      String collection;
      switch (contentType) {
        case 'video':
          collection = 'videos';
          break;
        case 'story':
          collection = 'stories';
          break;
        default:
          collection = 'photos';
      }

      await _firestore.collection(collection).doc(contentId).update({
        'arLens': {
          'lensId': lensId,
          'lensName': lensData['name'],
          'lensType': lensData['type'],
          'parameters': lensData['parameters'],
        },
        'hasARLens': true,
      });

      // Increment lens usage count
      await _firestore.collection('arLenses').doc(lensId).update({
        'usageCount': FieldValue.increment(1),
        'lastUsed': FieldValue.serverTimestamp(),
      });

      // Add to user's recent lenses
      await _addToRecentLenses(lensId);
    } catch (e) {
      print('Error applying lens: $e');
      rethrow;
    }
  }

  /// Create custom AR lens
  Future<ARLens> createCustomLens({
    required String name,
    required String description,
    required ARLensType type,
    required ARLensCategory category,
    required File thumbnailFile,
    File? previewVideo,
    required Map<String, dynamic> parameters,
    List<String>? tags,
  }) async {
    try {
      final user = _authService.currentUser;
      if (user == null) throw Exception('User not authenticated');

      final String lensId = _firestore.collection('arLenses').doc().id;

      // Upload thumbnail
      final String thumbPath = 'ar-lenses/$lensId/thumbnail.jpg';
      final thumbUpload =
          _storage.ref().child(thumbPath).putFile(thumbnailFile);
      final thumbSnapshot = await thumbUpload;
      final String thumbnailUrl = await thumbSnapshot.ref.getDownloadURL();

      // Upload preview video if provided
      String? previewVideoUrl;
      if (previewVideo != null) {
        final String videoPath = 'ar-lenses/$lensId/preview.mp4';
        final videoUpload =
            _storage.ref().child(videoPath).putFile(previewVideo);
        final videoSnapshot = await videoUpload;
        previewVideoUrl = await videoSnapshot.ref.getDownloadURL();
      }

      // Create lens
      final lens = ARLens(
        id: lensId,
        name: name,
        description: description,
        thumbnailUrl: thumbnailUrl,
        previewVideoUrl: previewVideoUrl,
        type: type,
        category: category,
        creatorId: user.uid,
        creatorName: user.displayName,
        usageCount: 0,
        rating: 0.0,
        tags: tags ?? [],
        isFeatured: false,
        isPremium: false,
        parameters: parameters,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      await _firestore.collection('arLenses').doc(lensId).set({
        ...lens.toMap(),
        'nameLower': name.toLowerCase(),
      });

      return lens;
    } catch (e) {
      print('Error creating custom lens: $e');
      rethrow;
    }
  }

  /// Get user's favorite lenses
  Future<List<ARLens>> getFavoriteLenses() async {
    try {
      final user = _authService.currentUser;
      if (user == null) throw Exception('User not authenticated');

      final favoritesSnapshot = await _firestore
          .collection('users')
          .doc(user.uid)
          .collection('favoriteLenses')
          .orderBy('addedAt', descending: true)
          .get();

      final lensIds = favoritesSnapshot.docs
          .map((doc) => doc.data()['lensId'] as String)
          .toList();

      if (lensIds.isEmpty) return [];

      final lenses = <ARLens>[];
      for (String lensId in lensIds) {
        final lensDoc =
            await _firestore.collection('arLenses').doc(lensId).get();

        if (lensDoc.exists) {
          lenses.add(ARLens.fromMap(lensDoc.data()!, lensDoc.id));
        }
      }

      return lenses;
    } catch (e) {
      print('Error getting favorite lenses: $e');
      return [];
    }
  }

  /// Add lens to favorites
  Future<void> addToFavorites(String lensId) async {
    try {
      final user = _authService.currentUser;
      if (user == null) throw Exception('User not authenticated');

      await _firestore
          .collection('users')
          .doc(user.uid)
          .collection('favoriteLenses')
          .doc(lensId)
          .set({
        'lensId': lensId,
        'addedAt': FieldValue.serverTimestamp(),
      });
    } catch (e) {
      print('Error adding to favorites: $e');
      rethrow;
    }
  }

  /// Remove lens from favorites
  Future<void> removeFromFavorites(String lensId) async {
    try {
      final user = _authService.currentUser;
      if (user == null) throw Exception('User not authenticated');

      await _firestore
          .collection('users')
          .doc(user.uid)
          .collection('favoriteLenses')
          .doc(lensId)
          .delete();
    } catch (e) {
      print('Error removing from favorites: $e');
      rethrow;
    }
  }

  /// Get recent lenses
  Future<List<ARLens>> getRecentLenses({int limit = 20}) async {
    try {
      final user = _authService.currentUser;
      if (user == null) throw Exception('User not authenticated');

      final recentSnapshot = await _firestore
          .collection('users')
          .doc(user.uid)
          .collection('recentLenses')
          .orderBy('usedAt', descending: true)
          .limit(limit)
          .get();

      final lensIds = recentSnapshot.docs
          .map((doc) => doc.data()['lensId'] as String)
          .toList();

      if (lensIds.isEmpty) return [];

      final lenses = <ARLens>[];
      for (String lensId in lensIds) {
        final lensDoc =
            await _firestore.collection('arLenses').doc(lensId).get();

        if (lensDoc.exists) {
          lenses.add(ARLens.fromMap(lensDoc.data()!, lensDoc.id));
        }
      }

      return lenses;
    } catch (e) {
      print('Error getting recent lenses: $e');
      return [];
    }
  }

  /// Rate AR lens
  Future<void> rateLens(String lensId, double rating) async {
    try {
      final user = _authService.currentUser;
      if (user == null) throw Exception('User not authenticated');

      if (rating < 0 || rating > 5) {
        throw Exception('Rating must be between 0 and 5');
      }

      // Add user rating
      await _firestore
          .collection('arLenses')
          .doc(lensId)
          .collection('ratings')
          .doc(user.uid)
          .set({
        'userId': user.uid,
        'rating': rating,
        'ratedAt': FieldValue.serverTimestamp(),
      });

      // Update lens average rating
      final ratingsSnapshot = await _firestore
          .collection('arLenses')
          .doc(lensId)
          .collection('ratings')
          .get();

      final totalRating = ratingsSnapshot.docs.fold<double>(
        0.0,
        (sum, doc) => sum + (doc.data()['rating'] as num).toDouble(),
      );

      final avgRating = totalRating / ratingsSnapshot.docs.length;

      await _firestore.collection('arLenses').doc(lensId).update({
        'rating': avgRating,
        'ratingCount': ratingsSnapshot.docs.length,
      });
    } catch (e) {
      print('Error rating lens: $e');
      rethrow;
    }
  }

  /// Get recommended lenses based on user activity
  Future<List<ARLens>> getRecommendedLenses({int limit = 20}) async {
    try {
      final user = _authService.currentUser;
      if (user == null) return getTrendingLenses(limit: limit);

      // Get user's recent lens categories
      final recentLenses = await getRecentLenses(limit: 10);
      final categoryCount = <ARLensCategory, int>{};

      for (var lens in recentLenses) {
        categoryCount[lens.category] = (categoryCount[lens.category] ?? 0) + 1;
      }

      // Get top categories
      final topCategories = categoryCount.entries.toList()
        ..sort((a, b) => b.value.compareTo(a.value));

      if (topCategories.isEmpty) {
        return getTrendingLenses(limit: limit);
      }

      // Get lenses from top categories
      final recommendedLenses = <ARLens>[];
      for (var entry in topCategories.take(2)) {
        final lenses = await getLensesByCategory(entry.key, limit: 10);
        recommendedLenses.addAll(lenses);
      }

      // Remove duplicates and limit
      final uniqueLenses = {for (var lens in recommendedLenses) lens.id: lens};
      return uniqueLenses.values.take(limit).toList();
    } catch (e) {
      print('Error getting recommended lenses: $e');
      return getTrendingLenses(limit: limit);
    }
  }

  /// Helper method to add lens to recent list
  Future<void> _addToRecentLenses(String lensId) async {
    try {
      final user = _authService.currentUser;
      if (user == null) return;

      await _firestore
          .collection('users')
          .doc(user.uid)
          .collection('recentLenses')
          .doc(lensId)
          .set({
        'lensId': lensId,
        'usedAt': FieldValue.serverTimestamp(),
      }, SetOptions(merge: true));
    } catch (e) {
      print('Error adding to recent lenses: $e');
    }
  }

  /// Get all available categories
  List<ARLensCategory> getAllCategories() {
    return ARLensCategory.values;
  }

  /// Get all available types
  List<ARLensType> getAllTypes() {
    return ARLensType.values;
  }
}
