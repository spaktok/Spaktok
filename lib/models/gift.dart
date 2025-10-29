import 'package:cloud_firestore/cloud_firestore.dart';

class Gift {
  final String id;
  final String name;
  final String categoryId;
  final int coinCost;
  final String? animationUrl; // For Lottie animations
  final String? soundUrl; 

  Gift({
    required this.id,
    required this.name,
    required this.categoryId,
    required this.coinCost,
    this.animationUrl,
    this.soundUrl,
  });

  factory Gift.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return Gift(
      id: doc.id,
      name: data['name'] ?? '',
      categoryId: data['categoryId'] ?? '',
      coinCost: data['coinCost'] ?? 0,
      animationUrl: data['animationUrl'],
      soundUrl: data['soundUrl'],
    );
  }
}
