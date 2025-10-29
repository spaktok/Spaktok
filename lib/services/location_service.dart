import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:geolocator/geolocator.dart';
import 'package:spaktok/models/user_location.dart';
import 'package:spaktok/services/auth_service.dart';

class LocationService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final AuthService _authService = AuthService();
  StreamSubscription<Position>? _positionStream;

  /// Start updating user's location in the background
  void startLocationUpdates() {
    final currentUserId = _authService.currentUser?.uid;
    if (currentUserId == null) return;

    // Check for permissions first
    Geolocator.checkPermission().then((permission) {
      if (permission == LocationPermission.always || permission == LocationPermission.whileInUse) {
        _positionStream = Geolocator.getPositionStream().listen((Position position) {
          _updateUserLocationInFirestore(currentUserId, position);
        });
      }
    });
  }

  /// Stop updating user's location
  void stopLocationUpdates() {
    _positionStream?.cancel();
  }

  Future<void> _updateUserLocationInFirestore(String userId, Position position) async {
    await _firestore.collection('user_locations').doc(userId).set({
      'position': GeoPoint(position.latitude, position.longitude),
      'timestamp': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true));
  }

  /// Get a stream of friends' locations
  Stream<List<UserLocation>> getFriendsLocations() {
    final currentUserId = _authService.currentUser?.uid;
    if (currentUserId == null) return Stream.value([]);

    // This is a simplified model. A real app would get a friend list first.
    // Then, it would query the 'user_locations' collection for those friend IDs.
    return _firestore.collection('user_locations').snapshots().map((snapshot) {
      return snapshot.docs
          .where((doc) => doc.id != currentUserId) // Don't show self
          .map((doc) => UserLocation.fromFirestore(doc))
          .toList();
    });
  }

  /// Update privacy settings for location sharing
  Future<void> updatePrivacySettings(String privacyMode) async {
    final currentUserId = _authService.currentUser?.uid;
    if (currentUserId == null) return;

    await _firestore.collection('users').doc(currentUserId).update({
      'locationSettings': {
        'privacyMode': privacyMode, // e.g., 'all_friends', 'selected_friends', 'ghost_mode'
      }
    });
  }
}
