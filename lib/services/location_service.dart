
import 'package:cloud_functions/cloud_functions.dart';
import 'package:geolocator/geolocator.dart';
import 'package:spaktok/services/auth_service.dart';

enum LocationPrivacy {
  off, friends, selectedFriends, live
}

class LocationService {
  static LocationService? _instance;
  static LocationService get instance {
    _instance ??= LocationService._();
    return _instance!;
  }

  LocationService._();

  final FirebaseFunctions _functions = FirebaseFunctions.instance;
  final AuthService _authService = AuthService();

  Future<Position> _getCurrentLocation() async {
    bool serviceEnabled;
    LocationPermission permission;

    serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      return Future.error('Location services are disabled.');
    }

    permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        return Future.error('Location permissions are denied');
      }
    }

    if (permission == LocationPermission.deniedForever) {
      return Future.error(
          'Location permissions are permanently denied, we cannot request permissions.');
    }

    return await Geolocator.getCurrentPosition();
  }

  Future<void> updateUserLocation({
    required double latitude,
    required double longitude,
    LocationPrivacy locationPrivacy = LocationPrivacy.off,
    List<String>? sharedWithFriends,
    bool isLiveLocationSharing = false,
    DateTime? liveLocationExpiresAt,
  }) async {
    final user = _authService.currentUser;
    if (user == null) {
      throw Exception('User must be logged in to update location.');
    }

    try {
      final HttpsCallable callable = _functions.httpsCallable('updateLocation');
      final result = await callable.call<Map<String, dynamic>>({
        'latitude': latitude,
        'longitude': longitude,
        'locationPrivacy': locationPrivacy.toString().split('.').last,
        'sharedWithFriends': sharedWithFriends,
        'isLiveLocationSharing': isLiveLocationSharing,
        'liveLocationExpiresAt': liveLocationExpiresAt?.toIso8601String(),
      });
      print('Location update result: ${result.data}');
    } on FirebaseFunctionsException catch (e) {
      print('Firebase Functions Error: ${e.code} - ${e.message}');
      throw Exception('Failed to update location: ${e.message}');
    } catch (e) {
      print('Error updating location: $e');
      throw Exception('Failed to update location: $e');
    }
  }

  // Method to get the current user's location and update it
  Future<void> shareCurrentLocation({
    LocationPrivacy locationPrivacy = LocationPrivacy.off,
    List<String>? sharedWithFriends,
    bool isLiveLocationSharing = false,
    DateTime? liveLocationExpiresAt,
  }) async {
    try {
      final position = await _getCurrentLocation();
      await updateUserLocation(
        latitude: position.latitude,
        longitude: position.longitude,
        locationPrivacy: locationPrivacy,
        sharedWithFriends: sharedWithFriends,
        isLiveLocationSharing: isLiveLocationSharing,
        liveLocationExpiresAt: liveLocationExpiresAt,
      );
      print('Current location shared successfully.');
    } catch (e) {
      print('Error sharing current location: $e');
      rethrow;
    }
  }

  // Placeholder for getting friends' locations (would involve Firestore queries)
  Stream<List<Map<String, dynamic>>> getFriendsLocations() {
    // This would query Firestore for friends' lastKnownLocation based on privacy settings
    // For now, return an empty stream or mock data
    return Stream.value([]);
  }
}

