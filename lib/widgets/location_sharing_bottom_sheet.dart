
import 'package:flutter/material.dart';
import 'package:spaktok/services/location_service.dart';

class LocationSharingBottomSheet extends StatefulWidget {
  final Function(LocationPrivacy privacy, List<String>? sharedWithFriends, bool isLive, DateTime? liveExpiresAt) onShareLocation;

  const LocationSharingBottomSheet({Key? key, required this.onShareLocation}) : super(key: key);

  @override
  State<LocationSharingBottomSheet> createState() => _LocationSharingBottomSheetState();
}

class _LocationSharingBottomSheetState extends State<LocationSharingBottomSheet> {
  LocationPrivacy _selectedPrivacy = LocationPrivacy.off;
  List<String> _selectedFriends = []; // Placeholder for selected friends
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
            title: const Text('Off'),
            leading: Radio<LocationPrivacy>(
              value: LocationPrivacy.off,
              groupValue: _selectedPrivacy,
              onChanged: (LocationPrivacy? value) {
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
            leading: Radio<LocationPrivacy>(
              value: LocationPrivacy.friends,
              groupValue: _selectedPrivacy,
              onChanged: (LocationPrivacy? value) {
                setState(() {
                  _selectedPrivacy = value!;
                  _isLiveLocationSharing = false;
                  _liveLocationExpiresAt = null;
                });
              },
            ),
          ),
          ListTile(
            title: const Text('Selected Friends'),
            leading: Radio<LocationPrivacy>(
              value: LocationPrivacy.selectedFriends,
              groupValue: _selectedPrivacy,
              onChanged: (LocationPrivacy? value) {
                setState(() {
                  _selectedPrivacy = value!;
                  _isLiveLocationSharing = false;
                  _liveLocationExpiresAt = null;
                });
              },
            ),
          ),
          if (_selectedPrivacy == LocationPrivacy.selectedFriends)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: ElevatedButton(
                onPressed: () async {
                  final selected = await showDialog<List<String>>(
                    context: context,
                    builder: (context) {
                      final friends = <String>["friend_1","friend_2","friend_3"]; // placeholder list
                      final tempSelected = Set<String>.from(_selectedFriends);
                      return AlertDialog(
                        title: const Text('Select Friends'),
                        content: SizedBox(
                          width: 400,
                          child: ListView(
                            shrinkWrap: true,
                            children: [
                              for (final f in friends)
                                CheckboxListTile(
                                  value: tempSelected.contains(f),
                                  onChanged: (v) {
                                    if (v == true) {
                                      tempSelected.add(f);
                                    } else {
                                      tempSelected.remove(f);
                                    }
                                    // force rebuild
                                    (context as Element).markNeedsBuild();
                                  },
                                  title: Text(f),
                                ),
                            ],
                          ),
                        ),
                        actions: [
                          TextButton(
                            onPressed: () => Navigator.of(context).pop(_selectedFriends),
                            child: const Text('Cancel'),
                          ),
                          ElevatedButton(
                            onPressed: () => Navigator.of(context).pop(tempSelected.toList()),
                            child: const Text('Done'),
                          ),
                        ],
                      );
                    },
                  );
                  if (selected != null) {
                    setState(() => _selectedFriends = selected);
                  }
                },
                child: const Text('Select Friends'),
              ),
            ),
          ListTile(
            title: const Text('Live Location (Temporary)'),
            leading: Radio<LocationPrivacy>(
              value: LocationPrivacy.live,
              groupValue: _selectedPrivacy,
              onChanged: (LocationPrivacy? value) {
                setState(() {
                  _selectedPrivacy = value!;
                  _isLiveLocationSharing = true;
                  // Set a default expiry, e.g., 1 hour from now
                  _liveLocationExpiresAt = DateTime.now().add(const Duration(hours: 1));
                });
              },
            ),
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

