import 'package:flutter/material.dart';
// Updated import to reference snap map visibility enum
import 'package:spaktok/services/snap_map_service.dart';

class LocationSharingBottomSheet extends StatefulWidget {
  final Function(LocationVisibility privacy, List<String>? sharedWithFriends,
      bool isLive, DateTime? liveExpiresAt) onShareLocation;

  const LocationSharingBottomSheet({super.key, required this.onShareLocation});

  @override
  State<LocationSharingBottomSheet> createState() =>
      _LocationSharingBottomSheetState();
}

class _LocationSharingBottomSheetState
    extends State<LocationSharingBottomSheet> {
  LocationVisibility _selectedPrivacy = LocationVisibility.ghost;
  final List<String> _selectedFriends = []; // Placeholder for selected friends
  bool _isLiveLocationSharing = false;
  DateTime? _liveLocationExpiresAt;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Share My Location',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 16),
          ListTile(
            title: const Text('Ghost Mode (Hidden)'),
            leading: Radio<LocationVisibility>(
              value: LocationVisibility.ghost,
              groupValue: _selectedPrivacy,
              onChanged: (LocationVisibility? value) {
                setState(() {
                  _selectedPrivacy = value!;
                  _isLiveLocationSharing = false;
                  _liveLocationExpiresAt = null;
                });
              },
            ),
          ),
          ListTile(
            title: const Text('Friends'),
            leading: Radio<LocationVisibility>(
              value: LocationVisibility.friends,
              groupValue: _selectedPrivacy,
              onChanged: (LocationVisibility? value) {
                setState(() {
                  _selectedPrivacy = value!;
                  _isLiveLocationSharing = false;
                  _liveLocationExpiresAt = null;
                });
              },
            ),
          ),
          // Placeholder for selected friends privacy (not supported by enum yet)
          if (_selectedPrivacy == LocationVisibility.friends &&
              _selectedFriends.isNotEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: ElevatedButton(
                onPressed: () {
                  // TODO: Implement friend selection logic
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                        content: Text("Friend selection not yet implemented.")),
                  );
                },
                child: const Text('Select Friends'),
              ),
            ),
          // Live location toggle simulated by separate switch instead of enum variant
          SwitchListTile(
            title: const Text('Share Live Location (1h)'),
            value: _isLiveLocationSharing,
            onChanged: (val) {
              setState(() {
                _isLiveLocationSharing = val;
                _liveLocationExpiresAt =
                    val ? DateTime.now().add(const Duration(hours: 1)) : null;
              });
            },
          ),
          const SizedBox(height: 16),
          Center(
            child: ElevatedButton(
              onPressed: () {
                widget.onShareLocation(
                  _selectedPrivacy,
                  _selectedFriends.isNotEmpty ? _selectedFriends : null,
                  _isLiveLocationSharing,
                  _liveLocationExpiresAt,
                );
              },
              child: const Text('Save Settings'),
            ),
          ),
        ],
      ),
    );
  }
}
