import 'package:cloud_firestore/cloud_firestore.dart';

class UserLocation {
  final String userId;
  final GeoPoint position;
  final Timestamp timestamp;

  // We can enrich this model with more data from the 'users' collection later
  final String? displayName;
  final String? photoURL;

  UserLocation({
    required this.userId,
    required this.position,
    required this.timestamp,
    this.displayName,
    this.photoURL,
  });

  factory UserLocation.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return UserLocation(
      userId: doc.id,
      position: data['position'] ?? const GeoPoint(0, 0),
      timestamp: data['timestamp'] ?? Timestamp.now(),
      // These fields would be populated by a separate query
      displayName: data['displayName'], 
      photoURL: data['photoURL'],
    );
  }
}
