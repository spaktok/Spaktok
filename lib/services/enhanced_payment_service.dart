import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_stripe/flutter_stripe.dart';
import 'package:spaktok/services/auth_service.dart';
import 'package:flutter/foundation.dart';

class CoinPackage {
  final String id;
  final String name;
  final int coins;
  final double price;
  final String? bonus;
  final bool isPopular;

  CoinPackage({
    required this.id,
    required this.name,
    required this.coins,
    required this.price,
    this.bonus,
    this.isPopular = false,
  });

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'coins': coins,
      'price': price,
      'bonus': bonus,
      'isPopular': isPopular,
    };
  }

  factory CoinPackage.fromJson(Map<String, dynamic> json) {
    return CoinPackage(
      id: json['id'],
      name: json['name'],
      coins: json['coins'],
      price: json['price'],
      bonus: json['bonus'],
      isPopular: json['isPopular'] ?? false,
    );
  }
}

class EnhancedPaymentService {
  static EnhancedPaymentService? _instance;
  static EnhancedPaymentService get instance {
    _instance ??= EnhancedPaymentService._();
    return _instance!;
  }

  EnhancedPaymentService._();

  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final AuthService _authService = AuthService();

  // Initialize Stripe
  Future<void> initializeStripe(String publishableKey) async {
    try {
      Stripe.publishableKey = publishableKey;
      await Stripe.instance.applySettings();
    } catch (e) {
      debugPrint('Error initializing Stripe: $e');
      rethrow;
    }
  }

  // Get available coin packages
  List<CoinPackage> getCoinPackages() {
    return [
      CoinPackage(
        id: 'coins_100',
        name: '100 Coins',
        coins: 100,
        price: 0.99,
      ),
      CoinPackage(
        id: 'coins_500',
        name: '500 Coins',
        coins: 500,
        price: 4.99,
        bonus: '+50 Bonus',
      ),
      CoinPackage(
        id: 'coins_1000',
        name: '1,000 Coins',
        coins: 1000,
        price: 9.99,
        bonus: '+150 Bonus',
        isPopular: true,
      ),
      CoinPackage(
        id: 'coins_5000',
        name: '5,000 Coins',
        coins: 5000,
        price: 49.99,
        bonus: '+1000 Bonus',
      ),
      CoinPackage(
        id: 'coins_10000',
        name: '10,000 Coins',
        coins: 10000,
        price: 99.99,
        bonus: '+2500 Bonus',
      ),
    ];
  }

  // Get user's coin balance
  Future<int> getCoinBalance() async {
    try {
      final user = _authService.currentUser;
      if (user == null) {
        throw Exception('User must be logged in');
      }

      final doc = await _firestore.collection('users').doc(user.uid).get();
      if (doc.exists) {
        final data = doc.data() as Map<String, dynamic>;
        return data['coinBalance'] ?? 0;
      }
      return 0;
    } catch (e) {
      debugPrint('Error getting coin balance: $e');
      return 0;
    }
  }

  // Add coins to user's balance
  Future<void> addCoins(int amount, {String? reason}) async {
    try {
      final user = _authService.currentUser;
      if (user == null) {
        throw Exception('User must be logged in');
      }

      await _firestore.collection('users').doc(user.uid).update({
        'coinBalance': FieldValue.increment(amount),
      });

      // Log transaction
      await _logTransaction(
        type: 'credit',
        amount: amount,
        reason: reason ?? 'Coins added',
      );
    } catch (e) {
      throw Exception('Failed to add coins: $e');
    }
  }

  // Deduct coins from user's balance
  Future<bool> deductCoins(int amount, {String? reason}) async {
    try {
      final user = _authService.currentUser;
      if (user == null) {
        throw Exception('User must be logged in');
      }

      final currentBalance = await getCoinBalance();
      if (currentBalance < amount) {
        return false; // Insufficient balance
      }

      await _firestore.collection('users').doc(user.uid).update({
        'coinBalance': FieldValue.increment(-amount),
      });

      // Log transaction
      await _logTransaction(
        type: 'debit',
        amount: amount,
        reason: reason ?? 'Coins deducted',
      );

      return true;
    } catch (e) {
      debugPrint('Error deducting coins: $e');
      return false;
    }
  }

  // Log transaction
  Future<void> _logTransaction({
    required String type,
    required int amount,
    required String reason,
  }) async {
    try {
      final user = _authService.currentUser;
      if (user == null) return;

      await _firestore.collection('transactions').add({
        'userId': user.uid,
        'type': type,
        'amount': amount,
        'reason': reason,
        'timestamp': FieldValue.serverTimestamp(),
      });
    } catch (e) {
      debugPrint('Error logging transaction: $e');
    }
  }

  // Get transaction history
  Stream<QuerySnapshot> getTransactionHistory() {
    final user = _authService.currentUser;
    if (user == null) {
      throw Exception('User must be logged in');
    }

    return _firestore
        .collection('transactions')
        .where('userId', isEqualTo: user.uid)
        .orderBy('timestamp', descending: true)
        .limit(50)
        .snapshots();
  }

  // Purchase coins with Stripe
  Future<bool> purchaseCoins(CoinPackage package) async {
    try {
      final user = _authService.currentUser;
      if (user == null) {
        throw Exception('User must be logged in');
      }

      // Create payment intent (this should be done on your backend)
      // For now, we'll simulate a successful payment
      
      // Add coins to user's balance
      int totalCoins = package.coins;
      if (package.bonus != null) {
        // Extract bonus amount from string (e.g., "+50 Bonus" -> 50)
        final bonusMatch = RegExp(r'\d+').firstMatch(package.bonus!);
        if (bonusMatch != null) {
          totalCoins += int.parse(bonusMatch.group(0)!);
        }
      }

      await addCoins(totalCoins, reason: 'Purchased ${package.name}');

      // Log purchase
      await _firestore.collection('purchases').add({
        'userId': user.uid,
        'packageId': package.id,
        'packageName': package.name,
        'coins': totalCoins,
        'price': package.price,
        'timestamp': FieldValue.serverTimestamp(),
      });

      return true;
    } catch (e) {
      debugPrint('Error purchasing coins: $e');
      return false;
    }
  }

  // Transfer coins to another user
  Future<bool> transferCoins({
    required String receiverId,
    required int amount,
    String? message,
  }) async {
    try {
      final user = _authService.currentUser;
      if (user == null) {
        throw Exception('User must be logged in');
      }

      // Check if sender has enough coins
      final senderBalance = await getCoinBalance();
      if (senderBalance < amount) {
        return false;
      }

      // Deduct from sender
      final deducted = await deductCoins(
        amount,
        reason: 'Transferred to user $receiverId',
      );

      if (!deducted) {
        return false;
      }

      // Add to receiver
      await _firestore.collection('users').doc(receiverId).update({
        'coinBalance': FieldValue.increment(amount),
      });

      // Log receiver's transaction
      await _firestore.collection('transactions').add({
        'userId': receiverId,
        'type': 'credit',
        'amount': amount,
        'reason': 'Received from ${user.uid}',
        'senderId': user.uid,
        'message': message,
        'timestamp': FieldValue.serverTimestamp(),
      });

      return true;
    } catch (e) {
      debugPrint('Error transferring coins: $e');
      return false;
    }
  }

  // Redeem coins for rewards
  Future<bool> redeemCoins({
    required String rewardId,
    required int coinCost,
  }) async {
    try {
      final user = _authService.currentUser;
      if (user == null) {
        throw Exception('User must be logged in');
      }

      // Deduct coins
      final success = await deductCoins(
        coinCost,
        reason: 'Redeemed reward $rewardId',
      );

      if (success) {
        // Log redemption
        await _firestore.collection('redemptions').add({
          'userId': user.uid,
          'rewardId': rewardId,
          'coinCost': coinCost,
          'timestamp': FieldValue.serverTimestamp(),
        });
      }

      return success;
    } catch (e) {
      debugPrint('Error redeeming coins: $e');
      return false;
    }
  }
}
