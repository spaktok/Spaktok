import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:spaktok/models/user_location.dart';
import 'package:spaktok/services/location_service.dart';

class MapScreen extends StatefulWidget {
  const MapScreen({super.key});

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  final LocationService _locationService = LocationService();
  final Completer<GoogleMapController> _mapController = Completer();
  Map<String, Marker> _markers = {};

  @override
  void initState() {
    super.initState();
    _listenToLocationUpdates();
  }

  void _listenToLocationUpdates() {
    _locationService.getFriendsLocations().listen((locations) {
      _updateMarkers(locations);
    });
  }

  Future<void> _updateMarkers(List<UserLocation> locations) async {
    final newMarkers = <String, Marker>{};
    for (final location in locations) {
      final markerId = MarkerId(location.userId);
      // In a real app, you would create a custom marker widget with the user's avatar
      final marker = Marker(
        markerId: markerId,
        position: LatLng(location.position.latitude, location.position.longitude),
        infoWindow: InfoWindow(title: location.displayName ?? 'User'),
      );
      newMarkers[location.userId] = marker;
    }
    if(mounted){
        setState(() => _markers = newMarkers);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Spaktok Map'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      extendBodyBehindAppBar: true,
      body: GoogleMap(
        initialCameraPosition: const CameraPosition(target: LatLng(0, 0), zoom: 2),
        onMapCreated: (controller) => _mapController.complete(controller),
        markers: Set<Marker>.of(_markers.values),
        myLocationEnabled: true,
        myLocationButtonEnabled: true,
      ),
    );
  }
}
