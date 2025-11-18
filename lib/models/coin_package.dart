// Removed: cloud_firestore

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

  factory CoinPackage.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return CoinPackage(
      id: doc.id,
      name: data['name'] ?? '',
      coins: data['coins'] ?? 0,
      price: (data['price'] ?? 0.0).toDouble(),
      bonus: data['bonus'],
      isPopular: data['isPopular'] ?? false,
    );
  }
}
