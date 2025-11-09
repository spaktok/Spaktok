import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:spaktok/services/auth_service.dart';

/// Avatar Style
enum AvatarStyle {
  snapchat,
  cartoon,
  anime,
  realistic,
  minimalist,
  custom,
}

/// Avatar Expression
enum AvatarExpression {
  neutral,
  happy,
  sad,
  angry,
  surprised,
  excited,
  laughing,
  crying,
  winking,
  thinking,
  sleeping,
  love,
  cool,
  party,
  dancing,
}

/// Avatar Accessory Type
enum AccessoryType {
  hair,
  glasses,
  hat,
  outfit,
  background,
  props,
}

/// Bitmoji Avatar Model
class BitmojiAvatar {
  final String id;
  final String userId;
  final String username;
  final AvatarStyle style;
  final Map<String, dynamic>
      features; // Hair, eyes, nose, mouth, skin tone, etc.
  final List<String> outfits;
  final List<String> accessories;
  final String? defaultOutfit;
  final String? defaultAccessory;
  final DateTime createdAt;
  final DateTime updatedAt;

  BitmojiAvatar({
    required this.id,
    required this.userId,
    required this.username,
    required this.style,
    required this.features,
    required this.outfits,
    required this.accessories,
    this.defaultOutfit,
    this.defaultAccessory,
    required this.createdAt,
    required this.updatedAt,
  });

  factory BitmojiAvatar.fromMap(Map<String, dynamic> map, String id) {
    return BitmojiAvatar(
      id: id,
      userId: map['userId'] ?? '',
      username: map['username'] ?? '',
      style: AvatarStyle.values.firstWhere(
        (e) => e.toString().split('.').last == map['style'],
        orElse: () => AvatarStyle.snapchat,
      ),
      features: Map<String, dynamic>.from(map['features'] ?? {}),
      outfits: List<String>.from(map['outfits'] ?? []),
      accessories: List<String>.from(map['accessories'] ?? []),
      defaultOutfit: map['defaultOutfit'],
      defaultAccessory: map['defaultAccessory'],
      createdAt: (map['createdAt'] as Timestamp).toDate(),
      updatedAt: (map['updatedAt'] as Timestamp).toDate(),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'userId': userId,
      'username': username,
      'style': style.toString().split('.').last,
      'features': features,
      'outfits': outfits,
      'accessories': accessories,
      'defaultOutfit': defaultOutfit,
      'defaultAccessory': defaultAccessory,
      'createdAt': Timestamp.fromDate(createdAt),
      'updatedAt': Timestamp.fromDate(updatedAt),
    };
  }
}

/// Avatar Sticker Model
class AvatarSticker {
  final String id;
  final String avatarId;
  final AvatarExpression expression;
  final String imageUrl;
  final String? caption;
  final DateTime createdAt;

  AvatarSticker({
    required this.id,
    required this.avatarId,
    required this.expression,
    required this.imageUrl,
    this.caption,
    required this.createdAt,
  });

  factory AvatarSticker.fromMap(Map<String, dynamic> map, String id) {
    return AvatarSticker(
      id: id,
      avatarId: map['avatarId'] ?? '',
      expression: AvatarExpression.values.firstWhere(
        (e) => e.toString().split('.').last == map['expression'],
        orElse: () => AvatarExpression.neutral,
      ),
      imageUrl: map['imageUrl'] ?? '',
      caption: map['caption'],
      createdAt: (map['createdAt'] as Timestamp).toDate(),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'avatarId': avatarId,
      'expression': expression.toString().split('.').last,
      'imageUrl': imageUrl,
      'caption': caption,
      'createdAt': Timestamp.fromDate(createdAt),
    };
  }
}

/// Bitmoji Integration Service
/// Snapchat-style personalized avatar system with expressions and stickers
class BitmojiIntegrationService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseStorage _storage = FirebaseStorage.instance;
  final AuthService _authService = AuthService();

  /// Create new avatar
  Future<BitmojiAvatar> createAvatar({
    required AvatarStyle style,
    required Map<String, dynamic> features,
    List<String>? outfits,
    List<String>? accessories,
  }) async {
    try {
      final user = _authService.currentUser;
      if (user == null) throw Exception('User not authenticated');

      final String avatarId = _firestore.collection('avatars').doc().id;

      final avatar = BitmojiAvatar(
        id: avatarId,
        userId: user.uid,
        username: user.displayName ?? 'Unknown',
        style: style,
        features: features,
        outfits: outfits ?? [],
        accessories: accessories ?? [],
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      await _firestore.collection('avatars').doc(avatarId).set(avatar.toMap());

      // Set as user's default avatar
      await _firestore.collection('users').doc(user.uid).update({
        'avatarId': avatarId,
      });

      return avatar;
    } catch (e) {
      print('Error creating avatar: $e');
      rethrow;
    }
  }

  /// Get user's avatar
  Future<BitmojiAvatar?> getUserAvatar([String? userId]) async {
    try {
      final targetUserId = userId ?? _authService.currentUser?.uid;
      if (targetUserId == null) return null;

      // Get avatar ID from user document
      final userDoc =
          await _firestore.collection('users').doc(targetUserId).get();

      if (!userDoc.exists) return null;

      final avatarId = userDoc.data()?['avatarId'];
      if (avatarId == null) return null;

      // Get avatar document
      final avatarDoc =
          await _firestore.collection('avatars').doc(avatarId).get();

      if (!avatarDoc.exists) return null;

      return BitmojiAvatar.fromMap(avatarDoc.data()!, avatarDoc.id);
    } catch (e) {
      print('Error getting user avatar: $e');
      return null;
    }
  }

  /// Update avatar features
  Future<void> updateAvatarFeatures(
    String avatarId,
    Map<String, dynamic> features,
  ) async {
    try {
      final user = _authService.currentUser;
      if (user == null) throw Exception('User not authenticated');

      // Verify ownership
      final avatarDoc =
          await _firestore.collection('avatars').doc(avatarId).get();
      if (!avatarDoc.exists) throw Exception('Avatar not found');

      if (avatarDoc.data()!['userId'] != user.uid) {
        throw Exception('Unauthorized');
      }

      await _firestore.collection('avatars').doc(avatarId).update({
        'features': features,
        'updatedAt': FieldValue.serverTimestamp(),
      });
    } catch (e) {
      print('Error updating avatar features: $e');
      rethrow;
    }
  }

  /// Change avatar style
  Future<void> changeAvatarStyle(String avatarId, AvatarStyle style) async {
    try {
      final user = _authService.currentUser;
      if (user == null) throw Exception('User not authenticated');

      // Verify ownership
      final avatarDoc =
          await _firestore.collection('avatars').doc(avatarId).get();
      if (!avatarDoc.exists) throw Exception('Avatar not found');

      if (avatarDoc.data()!['userId'] != user.uid) {
        throw Exception('Unauthorized');
      }

      await _firestore.collection('avatars').doc(avatarId).update({
        'style': style.toString().split('.').last,
        'updatedAt': FieldValue.serverTimestamp(),
      });
    } catch (e) {
      print('Error changing avatar style: $e');
      rethrow;
    }
  }

  /// Add outfit to avatar
  Future<void> addOutfit(String avatarId, String outfitId) async {
    try {
      final user = _authService.currentUser;
      if (user == null) throw Exception('User not authenticated');

      await _firestore.collection('avatars').doc(avatarId).update({
        'outfits': FieldValue.arrayUnion([outfitId]),
        'updatedAt': FieldValue.serverTimestamp(),
      });
    } catch (e) {
      print('Error adding outfit: $e');
      rethrow;
    }
  }

  /// Add accessory to avatar
  Future<void> addAccessory(String avatarId, String accessoryId) async {
    try {
      final user = _authService.currentUser;
      if (user == null) throw Exception('User not authenticated');

      await _firestore.collection('avatars').doc(avatarId).update({
        'accessories': FieldValue.arrayUnion([accessoryId]),
        'updatedAt': FieldValue.serverTimestamp(),
      });
    } catch (e) {
      print('Error adding accessory: $e');
      rethrow;
    }
  }

  /// Set default outfit
  Future<void> setDefaultOutfit(String avatarId, String outfitId) async {
    try {
      final user = _authService.currentUser;
      if (user == null) throw Exception('User not authenticated');

      await _firestore.collection('avatars').doc(avatarId).update({
        'defaultOutfit': outfitId,
        'updatedAt': FieldValue.serverTimestamp(),
      });
    } catch (e) {
      print('Error setting default outfit: $e');
      rethrow;
    }
  }

  /// Generate avatar sticker for expression
  Future<AvatarSticker> generateSticker(
    String avatarId,
    AvatarExpression expression, {
    String? caption,
  }) async {
    try {
      final user = _authService.currentUser;
      if (user == null) throw Exception('User not authenticated');

      // Get avatar
      final avatarDoc =
          await _firestore.collection('avatars').doc(avatarId).get();
      if (!avatarDoc.exists) throw Exception('Avatar not found');

      final avatar = BitmojiAvatar.fromMap(avatarDoc.data()!, avatarDoc.id);

      // Generate sticker image URL (in production, this would call an AI service)
      // For now, we'll create a placeholder
      final stickerImageUrl = await _generateStickerImage(avatar, expression);

      final String stickerId = _firestore.collection('avatarStickers').doc().id;

      final sticker = AvatarSticker(
        id: stickerId,
        avatarId: avatarId,
        expression: expression,
        imageUrl: stickerImageUrl,
        caption: caption,
        createdAt: DateTime.now(),
      );

      await _firestore
          .collection('avatarStickers')
          .doc(stickerId)
          .set(sticker.toMap());

      // Save to user's sticker collection
      await _firestore
          .collection('users')
          .doc(user.uid)
          .collection('avatarStickers')
          .doc(stickerId)
          .set({
        'stickerId': stickerId,
        'createdAt': FieldValue.serverTimestamp()
      });

      return sticker;
    } catch (e) {
      print('Error generating sticker: $e');
      rethrow;
    }
  }

  /// Get all stickers for avatar
  Future<List<AvatarSticker>> getAvatarStickers(String avatarId) async {
    try {
      final querySnapshot = await _firestore
          .collection('avatarStickers')
          .where('avatarId', isEqualTo: avatarId)
          .orderBy('createdAt', descending: true)
          .get();

      return querySnapshot.docs
          .map((doc) => AvatarSticker.fromMap(doc.data(), doc.id))
          .toList();
    } catch (e) {
      print('Error getting avatar stickers: $e');
      return [];
    }
  }

  /// Get user's favorite stickers
  Future<List<AvatarSticker>> getFavoriteStickers({int limit = 50}) async {
    try {
      final user = _authService.currentUser;
      if (user == null) throw Exception('User not authenticated');

      final userStickersSnapshot = await _firestore
          .collection('users')
          .doc(user.uid)
          .collection('avatarStickers')
          .orderBy('createdAt', descending: true)
          .limit(limit)
          .get();

      final stickers = <AvatarSticker>[];
      for (var doc in userStickersSnapshot.docs) {
        final stickerId = doc.data()['stickerId'];
        final stickerDoc =
            await _firestore.collection('avatarStickers').doc(stickerId).get();

        if (stickerDoc.exists) {
          stickers
              .add(AvatarSticker.fromMap(stickerDoc.data()!, stickerDoc.id));
        }
      }

      return stickers;
    } catch (e) {
      print('Error getting favorite stickers: $e');
      return [];
    }
  }

  /// Send avatar sticker in chat
  Future<void> sendStickerInChat(
    String chatId,
    String stickerId,
    String receiverId,
  ) async {
    try {
      final user = _authService.currentUser;
      if (user == null) throw Exception('User not authenticated');

      // Get sticker
      final stickerDoc =
          await _firestore.collection('avatarStickers').doc(stickerId).get();

      if (!stickerDoc.exists) throw Exception('Sticker not found');

      final sticker = AvatarSticker.fromMap(stickerDoc.data()!, stickerDoc.id);

      // Send as message
      await _firestore
          .collection('chats')
          .doc(chatId)
          .collection('messages')
          .add({
        'senderId': user.uid,
        'senderName': user.displayName ?? 'Unknown',
        'receiverId': receiverId,
        'type': 'avatar_sticker',
        'stickerId': stickerId,
        'stickerUrl': sticker.imageUrl,
        'caption': sticker.caption,
        'timestamp': FieldValue.serverTimestamp(),
        'isRead': false,
      });

      // Update chat's last message
      await _firestore.collection('chats').doc(chatId).update({
        'lastMessage': 'Sent a sticker',
        'lastMessageTime': FieldValue.serverTimestamp(),
        'lastMessageSender': user.uid,
      });
    } catch (e) {
      print('Error sending sticker in chat: $e');
      rethrow;
    }
  }

  /// Add avatar to story
  Future<void> addAvatarToStory(
    String storyId,
    String stickerId, {
    double x = 0.5,
    double y = 0.5,
    double scale = 1.0,
    double rotation = 0.0,
  }) async {
    try {
      final user = _authService.currentUser;
      if (user == null) throw Exception('User not authenticated');

      // Get sticker
      final stickerDoc =
          await _firestore.collection('avatarStickers').doc(stickerId).get();

      if (!stickerDoc.exists) throw Exception('Sticker not found');

      final sticker = AvatarSticker.fromMap(stickerDoc.data()!, stickerDoc.id);

      // Add sticker overlay to story
      await _firestore.collection('stories').doc(storyId).update({
        'overlays': FieldValue.arrayUnion([
          {
            'type': 'avatar_sticker',
            'stickerId': stickerId,
            'stickerUrl': sticker.imageUrl,
            'position': {'x': x, 'y': y},
            'scale': scale,
            'rotation': rotation,
          }
        ]),
      });
    } catch (e) {
      print('Error adding avatar to story: $e');
      rethrow;
    }
  }

  /// Get available outfits
  Future<List<Map<String, dynamic>>> getAvailableOutfits() async {
    try {
      final querySnapshot = await _firestore
          .collection('avatarOutfits')
          .orderBy('category')
          .get();

      return querySnapshot.docs
          .map((doc) => {
                'id': doc.id,
                ...doc.data(),
              })
          .toList();
    } catch (e) {
      print('Error getting available outfits: $e');
      return [];
    }
  }

  /// Get available accessories
  Future<List<Map<String, dynamic>>> getAvailableAccessories(
    AccessoryType type,
  ) async {
    try {
      final querySnapshot = await _firestore
          .collection('avatarAccessories')
          .where('type', isEqualTo: type.toString().split('.').last)
          .get();

      return querySnapshot.docs
          .map((doc) => {
                'id': doc.id,
                ...doc.data(),
              })
          .toList();
    } catch (e) {
      print('Error getting available accessories: $e');
      return [];
    }
  }

  /// Generate all expression stickers for avatar
  Future<List<AvatarSticker>> generateAllExpressions(String avatarId) async {
    try {
      final stickers = <AvatarSticker>[];

      for (var expression in AvatarExpression.values) {
        final sticker = await generateSticker(avatarId, expression);
        stickers.add(sticker);
      }

      return stickers;
    } catch (e) {
      print('Error generating all expressions: $e');
      return [];
    }
  }

  /// Delete avatar
  Future<void> deleteAvatar(String avatarId) async {
    try {
      final user = _authService.currentUser;
      if (user == null) throw Exception('User not authenticated');

      // Verify ownership
      final avatarDoc =
          await _firestore.collection('avatars').doc(avatarId).get();
      if (!avatarDoc.exists) throw Exception('Avatar not found');

      if (avatarDoc.data()!['userId'] != user.uid) {
        throw Exception('Unauthorized');
      }

      // Delete avatar
      await _firestore.collection('avatars').doc(avatarId).delete();

      // Remove from user's profile
      await _firestore.collection('users').doc(user.uid).update({
        'avatarId': FieldValue.delete(),
      });
    } catch (e) {
      print('Error deleting avatar: $e');
      rethrow;
    }
  }

  /// Helper: Generate sticker image (placeholder - would use AI service in production)
  Future<String> _generateStickerImage(
    BitmojiAvatar avatar,
    AvatarExpression expression,
  ) async {
    // In production, this would:
    // 1. Call an AI service (like DALL-E, Midjourney, or custom model)
    // 2. Generate avatar image with specific expression
    // 3. Upload to Firebase Storage
    // 4. Return download URL

    // For now, return a placeholder URL
    return 'https://placeholder.com/avatar_${avatar.id}_${expression.toString().split('.').last}.png';
  }

  /// Get all available avatar styles
  List<AvatarStyle> getAllStyles() {
    return AvatarStyle.values;
  }

  /// Get all available expressions
  List<AvatarExpression> getAllExpressions() {
    return AvatarExpression.values;
  }

  /// Get all accessory types
  List<AccessoryType> getAllAccessoryTypes() {
    return AccessoryType.values;
  }
}
