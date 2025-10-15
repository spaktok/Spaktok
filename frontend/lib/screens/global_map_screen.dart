import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:http/http.dart' as http;
import 'package:latlong2/latlong.dart';

class GlobalMapScreen extends StatefulWidget {
  const GlobalMapScreen({super.key});

  @override
  State<GlobalMapScreen> createState() => _GlobalMapScreenState();
}

class _GlobalMapScreenState extends State<GlobalMapScreen> {
  final MapController _mapController = MapController();
  bool _loading = true;
  String? _error;
  List<_LivePin> _pins = [];

  @override
  void initState() {
    super.initState();
    _fetchLiveSessions();
  }

  Future<void> _fetchLiveSessions() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final uri = Uri.parse('/api/live/active');
      final resp = await http.get(uri);
      if (resp.statusCode == 200) {
        final data = jsonDecode(resp.body) as Map<String, dynamic>;
        final sessions = (data['sessions'] as List<dynamic>?) ?? [];
        final pins = <_LivePin>[];
        for (final raw in sessions) {
          final m = raw as Map<String, dynamic>;
          final lat = (m['lat'] ?? m['latitude'])?.toDouble();
          final lng = (m['lng'] ?? m['longitude'])?.toDouble();
          if (lat != null && lng != null) {
            pins.add(
              _LivePin(
                point: LatLng(lat, lng),
                title: (m['title'] ?? 'Live').toString(),
                viewers: (m['viewerCount'] ?? 0) as int,
              ),
            );
          }
        }
        setState(() {
          _pins = pins;
        });
      } else {
        setState(() {
          _error = 'Failed to load: ${resp.statusCode}';
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Error: $e';
      });
    } finally {
      setState(() {
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Global Live Map'),
        actions: [
          IconButton(
            onPressed: _fetchLiveSessions,
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!, style: const TextStyle(color: Colors.red)))
              : FlutterMap(
                  mapController: _mapController,
                  options: MapOptions(
                    initialCenter: _pins.isNotEmpty ? _pins.first.point : const LatLng(20, 0),
                    initialZoom: 2,
                  ),
                  children: [
                    TileLayer(
                      urlTemplate: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                      subdomains: const ['a', 'b', 'c'],
                    ),
                    MarkerLayer(
                      markers: _pins
                          .map(
                            (p) => Marker(
                              width: 180,
                              height: 50,
                              point: p.point,
                              child: _LiveMarker(title: p.title, viewers: p.viewers),
                            ),
                          )
                          .toList(),
                    ),
                  ],
                ),
    );
  }
}

class _LivePin {
  final LatLng point;
  final String title;
  final int viewers;
  _LivePin({required this.point, required this.title, required this.viewers});
}

class _LiveMarker extends StatelessWidget {
  final String title;
  final int viewers;
  const _LiveMarker({required this.title, required this.viewers});

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          decoration: BoxDecoration(
            color: Colors.black.withOpacity(0.7),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.videocam, color: Colors.white, size: 16),
              const SizedBox(width: 6),
              Flexible(
                child: Text(
                  title,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(color: Colors.white),
                ),
              ),
              const SizedBox(width: 8),
              const Icon(Icons.remove_red_eye, color: Colors.white70, size: 14),
              const SizedBox(width: 2),
              Text('$viewers', style: const TextStyle(color: Colors.white70)),
            ],
          ),
        ),
        const Icon(Icons.location_on, color: Colors.redAccent, size: 28),
      ],
    );
  }
}
