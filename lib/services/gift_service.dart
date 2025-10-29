import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';
import 'package:spaktok/models/gift.dart';
import 'package:spaktok/models/gift_category.dart';
import 'package:spaktok/services/auth_service.dart';

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
        .map((snapshot) => snapshot.docs
            .map((doc) => Gift.fromFirestore(doc))
            .toList());
  }

  /// Get a single gift by its ID
  Future<Gift?> getGiftById(String giftId) async {
    try {
      final doc = await _firestore.collection('gifts').doc(giftId).get();
      if (doc.exists) {
        return Gift.fromFirestore(doc);
      }
    } catch (e) {
      debugPrint('Error getting gift by ID: $e');
    }
    return null;
  }

  // --- Send Gift --- 

  Future<bool> sendGift({
    required String receiverId,
    required Gift gift,
    required String contextType, // e.g., 'live_stream', 'direct_message'
    String? contextId, // e.g., streamId
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

    return _firestore.runTransaction((transaction) async {
      final senderSnapshot = await transaction.get(senderRef);

      if (!senderSnapshot.exists) {
        throw Exception('Sender not found.');
      }

      final senderBalance = (senderSnapshot.data()! as Map<String, dynamic>)['coins'] ?? 0;

      if (senderBalance < gift.coinCost) {
        throw Exception('Insufficient coins.');
      }
      
      // 1. Deduct coins from sender
      transaction.update(senderRef, {'coins': FieldValue.increment(-gift.coinCost)});
      
      // 2. Add revenue to receiver (e.g., 70% of the value)
      final revenue = (gift.coinCost * 0.7).toInt();
      transaction.update(receiverRef, {'coins': FieldValue.increment(revenue)});
      
      // 3. Log the gift transaction for the live stream or context
      transaction.set(_firestore.collection('gifts_log').doc(), {
        'giftId': gift.id,
        'senderId': currentUser.uid,
        'receiverId': receiverId,
        'timestamp': FieldValue.serverTimestamp(),
        'contextType': contextType,
        'contextId': contextId, 
        'coinCost': gift.coinCost,
        'revenue': revenue,
      });

      return true;
    }).catchError((error) {
      debugPrint("Failed to send gift: $error");
      return false;
    });
  }
}
