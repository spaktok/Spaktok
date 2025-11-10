import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:geolocator/geolocator.dart';

/// Snap Map Service
/// Handles location-based map integration and friend location sharing
// Extracted enum and model from inside class (Dart does not allow nested class/enum declarations)
enum LocationVisibility {
  ghost, // Invisible to everyone
  friends, // Visible to friends only
  public, // Visible to everyone
  selected, // Only selected friends
  friendsExcept, // All friends except excluded list
}

class UserLocation {
  final String userId;
  final double latitude;
  final double longitude;
  final DateTime timestamp;
  final String? status; // Optional status message
  final LocationVisibility visibility;
  final int? liveShareMinutes; // live share duration remaining
  final List<String>? selectedFriendIds; // for selected visibility
  final List<String>? excludedFriendIds; // for friendsExcept visibility

  UserLocation({
    required this.userId,
    required this.latitude,
    required this.longitude,
    required this.timestamp,
    this.status,
    required this.visibility,
    this.liveShareMinutes,
    this.selectedFriendIds,
    this.excludedFriendIds,
  });

  factory UserLocation.fromMap(Map<String, dynamic> map) {
    return UserLocation(
      userId: map['userId'] ?? '',
      latitude: (map['latitude'] ?? 0).toDouble(),
      longitude: (map['longitude'] ?? 0).toDouble(),
      timestamp: (map['timestamp'] is Timestamp)
          ? (map['timestamp'] as Timestamp).toDate()
          : DateTime.tryParse(map['timestamp']?.toString() ?? '') ??
              DateTime.now(),
      status: map['status'],
      visibility: LocationVisibility.values.firstWhere(
        (e) => e.toString().split('.').last == (map['visibility'] ?? 'ghost'),
        orElse: () => LocationVisibility.ghost,
      ),
      liveShareMinutes: map['liveShareMinutes'],
      selectedFriendIds: map['selectedFriendIds'] != null
          ? List<String>.from(map['selectedFriendIds'])
          : null,
      excludedFriendIds: map['excludedFriendIds'] != null
          ? List<String>.from(map['excludedFriendIds'])
          : null,
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
      'liveShareMinutes': liveShareMinutes,
      'selectedFriendIds': selectedFriendIds,
      'excludedFriendIds': excludedFriendIds,
    };
  }
}

class SnapMapService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;

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

    // Get current position (modern API with settings)
    return await Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
    );
  }

  /// Update user location
  Future<void> updateLocation(
    double latitude,
    double longitude, {
    String? status,
    LocationVisibility visibility = LocationVisibility.friends,
    int? liveShareMinutes, // if set, indicates temporary live location share
    List<String>? selectedFriendIds,
    List<String>? excludedFriendIds,
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
      liveShareMinutes: liveShareMinutes,
      selectedFriendIds: selectedFriendIds,
      excludedFriendIds: excludedFriendIds,
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
          if (_canShowLocationForViewer(location, userId)) {
            locations.add(location);
          }
        }
      }

      return locations;
    });
  }

  /// Internal visibility logic
  bool _canShowLocationForViewer(UserLocation loc, String viewerId) {
    switch (loc.visibility) {
      case LocationVisibility.ghost:
        return false;
      case LocationVisibility.friends:
        return true; // Already filtered by friend list outside
      case LocationVisibility.public:
        return true;
      case LocationVisibility.selected:
        return loc.selectedFriendIds?.contains(viewerId) ?? false;
      case LocationVisibility.friendsExcept:
        return !(loc.excludedFriendIds?.contains(viewerId) ?? false);
    }
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

  /// Advanced ghost mode toggle (with animated state flag)
  Future<void> setGhostMode(bool enabled) async {
    final userId = _auth.currentUser?.uid;
    if (userId == null) throw Exception('User not authenticated');
    await _firestore.collection('user_locations').doc(userId).update({
      'visibility': enabled ? 'ghost' : 'friends',
      'ghostAnimationState': enabled ? 'fade_out' : 'pulse_in',
      'ghostUpdatedAt': Timestamp.now(),
    });
  }

  /// Start a timed live location share (e.g. 15, 60, 480 minutes)
  Future<void> startLiveLocationShare(int minutes) async {
    final userId = _auth.currentUser?.uid;
    if (userId == null) throw Exception('User not authenticated');
    await _firestore.collection('user_locations').doc(userId).update({
      'liveShareMinutes': minutes,
      'liveShareStartedAt': Timestamp.now(),
    });
  }

  /// Decrement live share timer (called periodically via client or Cloud Function)
  Future<void> tickLiveShareTimer() async {
    final userId = _auth.currentUser?.uid;
    if (userId == null) return;
    final doc = await _firestore.collection('user_locations').doc(userId).get();
    if (!doc.exists) return;
    final data = doc.data()!;
    final minutes = (data['liveShareMinutes'] ?? 0) as int;
    if (minutes <= 1) {
      await _firestore.collection('user_locations').doc(userId).update({
        'liveShareMinutes': null,
      });
    } else {
      await _firestore.collection('user_locations').doc(userId).update({
        'liveShareMinutes': minutes - 1,
      });
    }
  }

  /// Link a story pin to map (refined pin type)
  Future<void> pinStoryToMap(
      String storyId, double latitude, double longitude) async {
    await addLocationStory(storyId, latitude, longitude);
    await _firestore.collection('map_story_pins').add({
      'storyId': storyId,
      'latitude': latitude,
      'longitude': longitude,
      'pinnedAt': Timestamp.now(),
      'expiresAt':
          Timestamp.fromDate(DateTime.now().add(const Duration(hours: 24))),
    });
  }

  /// Proximity events (simple implementation - could be optimized by geo queries)
  Future<List<Map<String, dynamic>>> getProximityEvents(
      double latitude, double longitude,
      {double radiusKm = 2.0}) async {
    final snap = await _firestore
        .collection('user_locations')
        .where('visibility', isNotEqualTo: 'ghost')
        .get();
    final events = <Map<String, dynamic>>[];
    for (final d in snap.docs) {
      final loc = UserLocation.fromMap(d.data());
      final dist = Geolocator.distanceBetween(
              latitude, longitude, loc.latitude, loc.longitude) /
          1000.0;
      if (dist <= radiusKm) {
        events.add({
          'userId': loc.userId,
          'distanceKm': dist,
          'timestamp': loc.timestamp,
          'visibility': loc.visibility.toString().split('.').last,
        });
      }
    }
    return events;
  }

  /// Get user's location visibility
  Future<LocationVisibility> getLocationVisibility() async {
    final userId = _auth.currentUser?.uid;
    if (userId == null) throw Exception('User not authenticated');

    final doc = await _firestore.collection('user_locations').doc(userId).get();
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
        .map((snapshot) =>
            snapshot.docs.map((doc) => {'id': doc.id, ...doc.data()}).toList());
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
