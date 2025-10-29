import 'package:flutter/material.dart';
import 'package:spaktok/services/auth_service.dart';
import 'package:spaktok/services/call_service.dart';
import 'package:spaktok/models/user.dart'; // Import UserData

class ProfileScreen extends StatefulWidget {
  final String? userId;
  const ProfileScreen({super.key, this.userId});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final AuthService _authService = AuthService();
  final CallService _callService = CallService();
  UserData? _userData;
  bool _isCurrentUser = false;

  @override
  void initState() {
    super.initState();
    _loadProfileData();
  }

  Future<void> _loadProfileData() async {
    final currentUserId = _authService.currentUser?.uid;
    final profileUserId = widget.userId ?? currentUserId;
    if (profileUserId == null) return;

    setState(() => _isCurrentUser = profileUserId == currentUserId);

    final userData = await _authService.getUserDataById(profileUserId);
    if (mounted) setState(() => _userData = userData);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(_userData?.displayName ?? 'Profile')),
      body: _userData == null
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                children: [
                  _buildProfileHeader(),
                  if (!_isCurrentUser) _buildActionButtons(),
                  // ... Other profile content
                ],
              ),
            ),
    );
  }

  Widget _buildProfileHeader() {
    return Column(
      children: [
        CircleAvatar(radius: 50, backgroundImage: _userData?.photoURL != null ? NetworkImage(_userData!.photoURL!) : null),
        const SizedBox(height: 12),
        Text(_userData!.displayName, style: Theme.of(context).textTheme.headlineSmall),
        Text('@${_userData!.username}', style: Theme.of(context).textTheme.titleMedium),
      ],
    );
  }

  Widget _buildActionButtons() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: [
        ElevatedButton.icon(onPressed: () {}, icon: const Icon(Icons.message), label: const Text('Message')),
        ElevatedButton.icon(
          onPressed: () => _callService.makeCall(context, targetUserId: widget.userId!),
          icon: const Icon(Icons.videocam), 
          label: const Text('Video Call'),
        ),
      ],
    );
  }
}
