
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:geolocator/geolocator.dart';
import 'package:spaktok/config/api_config.dart'; // Import ApiConfig

/// Snap Map Service
/// Handles location-based map integration and friend location sharing
class SnapMapService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;

  /// Location visibility modes
  enum LocationVisibility {
    ghost, // Invisible to everyone
    friends, // Visible to friends only
    public, // Visible to everyone
  }

  /// User location model
  class UserLocation {
    final String userId;
    final double latitude;
    final double longitude;
    final DateTime timestamp;
    final String? status; // Optional status message
    final LocationVisibility visibility;

    UserLocation({
      required this.userId,
      required this.latitude,
      required this.longitude,
      required this.timestamp,
      this.status,
      required this.visibility,
    });

    factory UserLocation.fromMap(Map<String, dynamic> map) {
      return UserLocation(
        userId: map['userId'] ?? '',
        latitude: (map['latitude'] ?? 0).toDouble(),
        longitude: (map['longitude'] ?? 0).toDouble(),
        timestamp: (map['timestamp'] as Timestamp).toDate(),
        status: map['status'],
        visibility: LocationVisibility.values.firstWhere(
          (e) => e.toString() == 'LocationVisibility.${map['visibility']}',
          orElse: () => LocationVisibility.ghost,
        ),
      );
    }

    Map<String, dynamic> toMap() {
      return {
        'userId': userId,
        'latitude': latitude,
        'longitude': longitude,
        'timestamp': Timestamp.fromDate(timestamp),
        'status': status,
        'visibility': visibility.toString().split('.').last,
      };
    }
  }

  /// Get current location
  Future<Position> getCurrentLocation() async {
    bool serviceEnabled;
    LocationPermission permission;

    // Check if location services are enabled
    serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      throw Exception('Location services are disabled.');
    }

    // Check location permissions
    permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        throw Exception('Location permissions are denied');
      }
    }

    if (permission == LocationPermission.deniedForever) {
      throw Exception('Location permissions are permanently denied');
    }

    // Get current position
    return await Geolocator.getCurrentPosition(
      desiredAccuracy: LocationAccuracy.high,
    );
  }

  /// Update user location
  Future<void> updateLocation(
    double latitude,
    double longitude, {
    String? status,
    LocationVisibility visibility = LocationVisibility.friends,
  }) async {
    final userId = _auth.currentUser?.uid;
    if (userId == null) throw Exception('User not authenticated');

    final location = UserLocation(
      userId: userId,
      latitude: latitude,
      longitude: longitude,
      timestamp: DateTime.now(),
      status: status,
      visibility: visibility,
    );

    await _firestore
        .collection('user_locations')
        .doc(userId)
        .set(location.toMap());
  }

  /// Get friends' locations
  Stream<List<UserLocation>> getFriendsLocations() {
    final userId = _auth.currentUser?.uid;
    if (userId == null) throw Exception('User not authenticated');

    return _firestore
        .collection('friends')
        .doc(userId)
        .snapshots()
        .asyncMap((doc) async {
      if (!doc.exists) return [];

      final friendIds = List<String>.from(doc.data()?['friendIds'] ?? []);
      if (friendIds.isEmpty) return [];

      final locations = <UserLocation>[];
      for (var friendId in friendIds) {
        final locationDoc =
            await _firestore.collection('user_locations').doc(friendId).get();
        if (locationDoc.exists) {
          final location = UserLocation.fromMap(locationDoc.data()!);
          // Only show if visibility is friends or public
          if (location.visibility != LocationVisibility.ghost) {
            locations.add(location);
          }
        }
      }

      return locations;
    });
  }

  /// Get nearby users (public locations only)
  Future<List<UserLocation>> getNearbyUsers(
    double latitude,
    double longitude,
    double radiusInKm,
  ) async {
    // Get all public locations
    final snapshot = await _firestore
        .collection('user_locations')
        .where('visibility', isEqualTo: 'public')
        .get();

    final nearbyUsers = <UserLocation>[];

    for (var doc in snapshot.docs) {
      final location = UserLocation.fromMap(doc.data());

      // Calculate distance
      final distance = Geolocator.distanceBetween(
        latitude,
        longitude,
        location.latitude,
        location.longitude,
      );

      // Convert to km and check if within radius
      if (distance / 1000 <= radiusInKm) {
        nearbyUsers.add(location);
      }
    }

    return nearbyUsers;
  }

  /// Set location visibility
  Future<void> setLocationVisibility(LocationVisibility visibility) async {
    final userId = _auth.currentUser?.uid;
    if (userId == null) throw Exception('User not authenticated');

    await _firestore.collection('user_locations').doc(userId).update({
      'visibility': visibility.toString().split('.').last,
    });
  }

  /// Get user's location visibility
  Future<LocationVisibility> getLocationVisibility() async {
    final userId = _auth.currentUser?.uid;
    if (userId == null) throw Exception('User not authenticated');

    final doc =
        await _firestore.collection('user_locations').doc(userId).get();
    if (!doc.exists) return LocationVisibility.ghost;

    final visibility = doc.data()?['visibility'] ?? 'ghost';
    return LocationVisibility.values.firstWhere(
      (e) => e.toString() == 'LocationVisibility.$visibility',
      orElse: () => LocationVisibility.ghost,
    );
  }

  /// Share location with specific user
  Future<void> shareLocationWith(String friendId) async {
    final userId = _auth.currentUser?.uid;
    if (userId == null) throw Exception('User not authenticated');

    await _firestore.collection('location_shares').add({
      'fromUserId': userId,
      'toUserId': friendId,
      'timestamp': Timestamp.now(),
      'expiresAt': Timestamp.fromDate(
        DateTime.now().add(const Duration(hours: 24)),
      ),
    });
  }

  /// Get location shares
  Stream<List<Map<String, dynamic>>> getLocationShares() {
    final userId = _auth.currentUser?.uid;
    if (userId == null) throw Exception('User not authenticated');

    return _firestore
        .collection('location_shares')
        .where('toUserId', isEqualTo: userId)
        .where('expiresAt', isGreaterThan: Timestamp.now())
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => {'id': doc.id, ...doc.data()})
            .toList());
  }

  /// Add location-based story
  Future<void> addLocationStory(
    String storyId,
    double latitude,
    double longitude,
  ) async {
    final userId = _auth.currentUser?.uid;
    if (userId == null) throw Exception('User not authenticated');

    await _firestore.collection('location_stories').add({
      'userId': userId,
      'storyId': storyId,
      'latitude': latitude,
      'longitude': longitude,
      'timestamp': Timestamp.now(),
      'expiresAt': Timestamp.fromDate(
        DateTime.now().add(const Duration(hours: 24)),
      ),
    });
  }

  /// Get location-based stories nearby
  Future<List<Map<String, dynamic>>> getNearbyStories(
    double latitude,
    double longitude,
    double radiusInKm,
  ) async {
    final snapshot = await _firestore
        .collection('location_stories')
        .where('expiresAt', isGreaterThan: Timestamp.now())
        .get();

    final nearbyStories = <Map<String, dynamic>>[];

    for (var doc in snapshot.docs) {
      final data = doc.data();
      final storyLat = (data['latitude'] ?? 0).toDouble();
      final storyLng = (data['longitude'] ?? 0).toDouble();

      // Calculate distance
      final distance = Geolocator.distanceBetween(
        latitude,
        longitude,
        storyLat,
        storyLng,
      );

      // Convert to km and check if within radius
      if (distance / 1000 <= radiusInKm) {
        nearbyStories.add({'id': doc.id, ...data});
      }
    }

    return nearbyStories;
  }

  /// Delete old location data (cleanup)
  Future<void> cleanupOldLocations() async {
    final cutoffDate = DateTime.now().subtract(const Duration(days: 7));
    final snapshot = await _firestore
        .collection('user_locations')
        .where('timestamp', isLessThan: Timestamp.fromDate(cutoffDate))
        .get();

    for (var doc in snapshot.docs) {
      await doc.reference.delete();
    }
  }
}

