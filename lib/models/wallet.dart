import 'package:cloud_firestore/cloud_firestore.dart';

class Wallet {
  final String userId;
  final double balance;
  final int coins;

  Wallet({
    required this.userId,
    this.balance = 0.0,
    this.coins = 0,
  });

  factory Wallet.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return Wallet(
      userId: doc.id,
      balance: (data['balance'] as num?)?.toDouble() ?? 0.0,
      coins: (data['coins'] as num?)?.toInt() ?? 0,
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'balance': balance,
      'coins': coins,
    };
  }
}
