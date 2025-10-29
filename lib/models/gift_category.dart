import 'package:cloud_firestore/cloud_firestore.dart';

class GiftCategory {
  final String id;
  final String name;
  final int priority;

  GiftCategory({required this.id, required this.name, required this.priority});

  factory GiftCategory.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return GiftCategory(
      id: doc.id,
      name: data['name'] ?? '',
      priority: data['priority'] ?? 0,
    );
  }
}
