import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:spaktok/models/gift.dart';
import 'package:spaktok/models/gift_category.dart';
import 'package:spaktok/services/auth_service.dart';
import 'dart:developer' as developer;

class GiftService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final AuthService _authService = AuthService();

  // --- Gift Catalog ---

  /// Get all gift categories from Firestore
  Stream<List<GiftCategory>> getGiftCategories() {
    return _firestore
        .collection('giftCategories')
        .orderBy('priority', descending: true)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => GiftCategory.fromFirestore(doc))
            .toList());
  }

  /// Get all gifts for a specific category from Firestore
  Stream<List<Gift>> getGiftsByCategory(String categoryId) {
    return _firestore
        .collection('gifts')
        .where('categoryId', isEqualTo: categoryId)
        .orderBy('coinCost', descending: false)
        .snapshots()
        .map((snapshot) =>
            snapshot.docs.map((doc) => Gift.fromFirestore(doc)).toList());
  }

  /// Get a single gift by its ID
  Future<Gift?> getGiftById(String giftId) async {
    try {
      final doc = await _firestore.collection('gifts').doc(giftId).get();
      if (doc.exists) {
        return Gift.fromFirestore(doc);
      }
    } catch (e) {
      developer.log('Error getting gift by ID: $e', name: 'gift_service');
    }
    return null;
  }

  // --- Send Gift ---
  Future<bool> sendGift({
    required String receiverId,
    required Gift gift,
    required String contextType, // 'live_stream', 'video', 'profile', 'direct_message'
    String? contextId, // e.g., streamId or videoId
    int quantity = 1, // support combos/multiple
    bool anonymous = false,
    String? message,
  }) async {
    final currentUser = _authService.currentUser;
    if (currentUser == null) {
      throw Exception('User not logged in');
    }
    if (currentUser.uid == receiverId) {
      throw Exception('You cannot send a gift to yourself.');
    }

    final senderRef = _firestore.collection('users').doc(currentUser.uid);
    final receiverRef = _firestore.collection('users').doc(receiverId);
    final settingsRef = _firestore.collection('settings').doc('payouts');

    // Helper to safely read double values
    double _asDouble(dynamic v, [double d = 0.0]) {
      if (v == null) return d;
      if (v is int) return v.toDouble();
      if (v is double) return v;
      return d;
    }

    return _firestore.runTransaction((transaction) async {
      // Load sender/receiver
      final senderSnap = await transaction.get(senderRef);
      if (!senderSnap.exists) {
        throw Exception('Sender not found.');
      }
      final receiverSnap = await transaction.get(receiverRef);
      if (!receiverSnap.exists) {
        throw Exception('Receiver not found.');
      }

      // Load payout settings (with sensible defaults)
      double standardPayout = 0.50; // 50%
      double premiumPayout = 0.90; // 90%
      double coinToUsdRate = 0.01; // $0.01 per coin (default)
      try {
        final settingsSnap = await transaction.get(settingsRef);
        if (settingsSnap.exists) {
          final data = settingsSnap.data() as Map<String, dynamic>;
          standardPayout = _asDouble(data['standardPayoutPercentage'], 0.50);
          premiumPayout = _asDouble(data['premiumPayoutPercentage'], 0.90);
          coinToUsdRate = _asDouble(data['coinToUsdRate'], 0.01);
        }
      } catch (_) {
        // use defaults
      }

      // Validate sender balance
      final senderData = senderSnap.data() as Map<String, dynamic>;
      final currentCoins = (senderData['coins'] ?? 0) as int;
      final totalCoinCost = gift.coinCost * quantity;
      if (currentCoins < totalCoinCost) {
        throw Exception('Insufficient coins.');
      }

      // Determine receiver payout share
      final receiverData = receiverSnap.data() as Map<String, dynamic>;
      final isPremium = (receiverData['isPremiumAccount'] ?? false) as bool;
      final payoutPct = isPremium ? premiumPayout : standardPayout;

      // Monetary calculations (USD)
      final double unitUsd = gift.realValueUSD != null
          ? _asDouble(gift.realValueUSD)
          : gift.coinCost * coinToUsdRate;
      final double totalUsd = unitUsd * quantity;
      final double receiverShareUsd = totalUsd * payoutPct;
      final double platformShareUsd = totalUsd - receiverShareUsd;

      // 1) Deduct coins from sender
      transaction.update(senderRef, {
        'coins': FieldValue.increment(-totalCoinCost),
        'userGiftStats.totalGiftsSent': FieldValue.increment(quantity),
        'userGiftStats.totalCoinsSpent': FieldValue.increment(totalCoinCost),
        'userGiftStats.lastGiftSent': FieldValue.serverTimestamp(),
      });

      // 2) Credit receiver BALANCE in USD (withdrawable), not coins
      transaction.update(receiverRef, {
        'balance': FieldValue.increment(receiverShareUsd),
        'userGiftStats.totalGiftsReceived': FieldValue.increment(quantity),
        'userGiftStats.totalRevenueEarned': FieldValue.increment(receiverShareUsd),
        'userGiftStats.lastGiftReceived': FieldValue.serverTimestamp(),
      });

      // 3) Record gift transaction rich document
      final txRef = _firestore.collection('giftTransactions').doc();
      transaction.set(txRef, {
        'transactionId': txRef.id,
        'giftId': gift.id,
        'giftName': gift.name,
        'giftImageUrl': gift.imageUrl,
        'giftAnimationUrl': gift.animationUrl,
        'senderId': currentUser.uid,
        'receiverId': receiverId,
        'context': contextType,
        'contextId': contextId,
        'quantity': quantity,
        'coinCost': totalCoinCost,
        'realValueUSD': totalUsd,
        'broadcasterShare': receiverShareUsd,
        'platformShare': platformShareUsd,
        'isPremiumReceiver': isPremium,
        'revenueSharePercentage': payoutPct,
        'message': message ?? '',
        'isAnonymous': anonymous,
        'status': 'completed',
        'timestamp': FieldValue.serverTimestamp(),
        'processedAt': FieldValue.serverTimestamp(),
      });

      // 4) Context-specific side channel (e.g., show gift in live chat feed)
      if (contextType == 'live_stream' && contextId != null) {
        final streamGiftRef = _firestore.collection('streamGifts').doc();
        transaction.set(streamGiftRef, {
          'streamId': contextId,
          'giftId': gift.id,
          'senderId': currentUser.uid,
          'receiverId': receiverId,
          'giftName': gift.name,
          'giftImageUrl': gift.imageUrl,
          'giftAnimationUrl': gift.animationUrl,
          'coinCost': totalCoinCost,
          'realValueUSD': totalUsd,
          'timestamp': FieldValue.serverTimestamp(),
          'isCombo': quantity > 1,
          'comboCount': quantity,
        });
      }

      return true;
    }).catchError((error, st) {
      developer.log('Failed to send gift', error: error, stackTrace: st, name: 'gift_service');
      return false;
    });
  }
}
