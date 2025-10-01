import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:spaktok/services/auth_service.dart';
import 'package:spaktok/services/enhanced_payment_service.dart';
import 'package:flutter/foundation.dart';

class Gift {
  final String id;
  final String name;
  final String iconUrl;
  final String? animationUrl;
  final int coinCost;
  final String category;
  final bool isAnimated;
  final bool isPopular;

  Gift({
    required this.id,
    required this.name,
    required this.iconUrl,
    this.animationUrl,
    required this.coinCost,
    required this.category,
    this.isAnimated = false,
    this.isPopular = false,
  });

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'iconUrl': iconUrl,
      'animationUrl': animationUrl,
      'coinCost': coinCost,
      'category': category,
      'isAnimated': isAnimated,
      'isPopular': isPopular,
    };
  }

  factory Gift.fromJson(Map<String, dynamic> json) {
    return Gift(
      id: json['id'],
      name: json['name'],
      iconUrl: json['iconUrl'],
      animationUrl: json['animationUrl'],
      coinCost: json['coinCost'],
      category: json['category'],
      isAnimated: json['isAnimated'] ?? false,
      isPopular: json['isPopular'] ?? false,
    );
  }
}

class GiftsService {
  static GiftsService? _instance;
  static GiftsService get instance {
    _instance ??= GiftsService._();
    return _instance!;
  }

  GiftsService._();

  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final AuthService _authService = AuthService();
  final EnhancedPaymentService _paymentService = EnhancedPaymentService.instance;

  // Get available gifts
  List<Gift> getAvailableGifts() {
    return [
      // Basic gifts (10-50 coins)
      Gift(
        id: 'heart',
        name: 'Heart',
        iconUrl: '❤️',
        coinCost: 10,
        category: 'basic',
        isPopular: true,
      ),
      Gift(
        id: 'rose',
        name: 'Rose',
        iconUrl: '🌹',
        coinCost: 20,
        category: 'basic',
      ),
      Gift(
        id: 'star',
        name: 'Star',
        iconUrl: '⭐',
        coinCost: 30,
        category: 'basic',
      ),
      Gift(
        id: 'fire',
        name: 'Fire',
        iconUrl: '🔥',
        coinCost: 40,
        category: 'basic',
        isPopular: true,
      ),
      Gift(
        id: 'clap',
        name: 'Clap',
        iconUrl: '👏',
        coinCost: 50,
        category: 'basic',
      ),

      // Premium gifts (100-500 coins)
      Gift(
        id: 'diamond',
        name: 'Diamond',
        iconUrl: '💎',
        coinCost: 100,
        category: 'premium',
        isPopular: true,
      ),
      Gift(
        id: 'crown',
        name: 'Crown',
        iconUrl: '👑',
        coinCost: 150,
        category: 'premium',
      ),
      Gift(
        id: 'trophy',
        name: 'Trophy',
        iconUrl: '🏆',
        coinCost: 200,
        category: 'premium',
      ),
      Gift(
        id: 'rocket',
        name: 'Rocket',
        iconUrl: '🚀',
        coinCost: 300,
        category: 'premium',
        isAnimated: true,
      ),
      Gift(
        id: 'unicorn',
        name: 'Unicorn',
        iconUrl: '🦄',
        coinCost: 500,
        category: 'premium',
        isAnimated: true,
        isPopular: true,
      ),

      // Luxury gifts (1000+ coins)
      Gift(
        id: 'sports_car',
        name: 'Sports Car',
        iconUrl: '🏎️',
        coinCost: 1000,
        category: 'luxury',
        isAnimated: true,
      ),
      Gift(
        id: 'yacht',
        name: 'Yacht',
        iconUrl: '🛥️',
        coinCost: 2000,
        category: 'luxury',
        isAnimated: true,
      ),
      Gift(
        id: 'private_jet',
        name: 'Private Jet',
        iconUrl: '✈️',
        coinCost: 5000,
        category: 'luxury',
        isAnimated: true,
        isPopular: true,
      ),
      Gift(
        id: 'castle',
        name: 'Castle',
        iconUrl: '🏰',
        coinCost: 10000,
        category: 'luxury',
        isAnimated: true,
      ),
    ];
  }

  // Get gifts by category
  List<Gift> getGiftsByCategory(String category) {
    return getAvailableGifts().where((gift) => gift.category == category).toList();
  }

  // Get popular gifts
  List<Gift> getPopularGifts() {
    return getAvailableGifts().where((gift) => gift.isPopular).toList();
  }

  // Send a gift
  Future<bool> sendGift({
    required String receiverId,
    required Gift gift,
    String? message,
    String? streamId,
  }) async {
    try {
      final user = _authService.currentUser;
      if (user == null) {
        throw Exception('User must be logged in');
      }

      // Check if user has enough coins
      final balance = await _paymentService.getCoinBalance();
      if (balance < gift.coinCost) {
        return false; // Insufficient coins
      }

      // Deduct coins from sender
      final deducted = await _paymentService.deductCoins(
        gift.coinCost,
        reason: 'Sent ${gift.name} to $receiverId',
      );

      if (!deducted) {
        return false;
      }

      // Create gift document
      await _firestore.collection('gifts').add({
        'senderId': user.uid,
        'senderName': user.displayName ?? 'Anonymous',
        'senderPhotoUrl': user.photoURL,
        'receiverId': receiverId,
        'giftId': gift.id,
        'giftName': gift.name,
        'giftIcon': gift.iconUrl,
        'giftCost': gift.coinCost,
        'message': message,
        'streamId': streamId,
        'timestamp': FieldValue.serverTimestamp(),
      });

      // Add coins to receiver (70% of gift value)
      final receiverCoins = (gift.coinCost * 0.7).toInt();
      await _firestore.collection('users').doc(receiverId).update({
        'coinBalance': FieldValue.increment(receiverCoins),
      });

      // Log receiver's transaction
      await _firestore.collection('transactions').add({
        'userId': receiverId,
        'type': 'credit',
        'amount': receiverCoins,
        'reason': 'Received ${gift.name} from ${user.uid}',
        'senderId': user.uid,
        'timestamp': FieldValue.serverTimestamp(),
      });

      return true;
    } catch (e) {
      debugPrint('Error sending gift: $e');
      return false;
    }
  }

  // Get received gifts
  Stream<QuerySnapshot> getReceivedGifts() {
    final user = _authService.currentUser;
    if (user == null) {
      throw Exception('User must be logged in');
    }

    return _firestore
        .collection('gifts')
        .where('receiverId', isEqualTo: user.uid)
        .orderBy('timestamp', descending: true)
        .limit(50)
        .snapshots();
  }

  // Get sent gifts
  Stream<QuerySnapshot> getSentGifts() {
    final user = _authService.currentUser;
    if (user == null) {
      throw Exception('User must be logged in');
    }

    return _firestore
        .collection('gifts')
        .where('senderId', isEqualTo: user.uid)
        .orderBy('timestamp', descending: true)
        .limit(50)
        .snapshots();
  }

  // Get total gifts value received
  Future<int> getTotalGiftsValueReceived() async {
    try {
      final user = _authService.currentUser;
      if (user == null) {
        throw Exception('User must be logged in');
      }

      final gifts = await _firestore
          .collection('gifts')
          .where('receiverId', isEqualTo: user.uid)
          .get();

      int total = 0;
      for (var doc in gifts.docs) {
        final data = doc.data() as Map<String, dynamic>;
        total += (data['giftCost'] as int?) ?? 0;
      }

      return total;
    } catch (e) {
      debugPrint('Error getting total gifts value: $e');
      return 0;
    }
  }

  // Get total gifts value sent
  Future<int> getTotalGiftsValueSent() async {
    try {
      final user = _authService.currentUser;
      if (user == null) {
        throw Exception('User must be logged in');
      }

      final gifts = await _firestore
          .collection('gifts')
          .where('senderId', isEqualTo: user.uid)
          .get();

      int total = 0;
      for (var doc in gifts.docs) {
        final data = doc.data() as Map<String, dynamic>;
        total += (data['giftCost'] as int?) ?? 0;
      }

      return total;
    } catch (e) {
      debugPrint('Error getting total gifts value sent: $e');
      return 0;
    }
  }

  // Get gift leaderboard for a stream
  Stream<QuerySnapshot> getStreamGiftLeaderboard(String streamId) {
    return _firestore
        .collection('gifts')
        .where('streamId', isEqualTo: streamId)
        .orderBy('giftCost', descending: true)
        .limit(10)
        .snapshots();
  }
}
