import 'package:flutter/material.dart';
import 'package:spaktok/models/reel.dart';
import 'package:spaktok/models/user.dart'; // Import UserData
import 'package:spaktok/services/reel_service.dart';
import 'package:spaktok/services/auth_service.dart';
import 'package:video_player/video_player.dart';
import 'package:visibility_detector/visibility_detector.dart';
import 'package:cached_network_image/cached_network_image.dart';

// Main screen that holds the PageView
class ReelScreen extends StatefulWidget {
  const ReelScreen({super.key});

  @override
  State<ReelScreen> createState() => _ReelScreenState();
}

class _ReelScreenState extends State<ReelScreen> {
  final ReelService _reelService = ReelService();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: StreamBuilder<List<Reel>>(
        stream: _reelService.getAllReels(),
        builder: (context, snapshot) {
          if (snapshot.hasError) return const Center(child: Text('Error loading reels.', style: TextStyle(color: Colors.white)));
          if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());
          final reels = snapshot.data!;
          return PageView.builder(
            scrollDirection: Axis.vertical,
            itemCount: reels.length,
            itemBuilder: (context, index) => ReelPlayer(reel: reels[index]),
          );
        },
      ),
    );
  }
}

// Widget for a single reel
class ReelPlayer extends StatefulWidget {
  final Reel reel;
  const ReelPlayer({super.key, required this.reel});

  @override
  State<ReelPlayer> createState() => _ReelPlayerState();
}

class _ReelPlayerState extends State<ReelPlayer> {
  late VideoPlayerController _controller;
  final AuthService _authService = AuthService();
  UserData? _userData;
  // ... other state variables

  @override
  void initState() {
    super.initState();
    _controller = VideoPlayerController.network(widget.reel.videoUrl)
      ..initialize().then((_) => setState(() {}))
      ..setLooping(true);
    _fetchUserData();
  }

  Future<void> _fetchUserData() async {
    final userData = await _authService.getUserDataById(widget.reel.userId);
    if (mounted) setState(() => _userData = userData);
  }
  
  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return VisibilityDetector(
        key: Key(widget.reel.id),
        onVisibilityChanged: (info) {
            if (info.visibleFraction > 0.8) _controller.play();
            else _controller.pause();
        },
        child: Stack(
            fit: StackFit.expand,
            children: [
                if (_controller.value.isInitialized)
                    FittedBox(fit: BoxFit.cover, child: SizedBox(width: _controller.value.size.width, height: _controller.value.size.height, child: VideoPlayer(_controller)))
                else 
                    const Center(child: CircularProgressIndicator()),
                _buildOverlay(),
            ],
        ),
    );
  }

  Widget _buildOverlay() {
    return Container(
        // ... gradient decoration
        child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                    Row(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                            Expanded(child: _buildVideoInfo()),
                            // ... action buttons
                        ],
                    ),
                ],
            ),
        ),
    );
  }

  Widget _buildVideoInfo() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(children: [
          CircleAvatar(
            radius: 16,
            backgroundImage: _userData?.photoURL != null ? CachedNetworkImageProvider(_userData!.photoURL!) : null,
            child: _userData?.photoURL == null ? const Icon(Icons.person) : null,
          ),
          const SizedBox(width: 8),
          Text(_userData?.displayName ?? 'Loading...', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        ]),
        const SizedBox(height: 8),
        Text(widget.reel.description, style: const TextStyle(color: Colors.white)),
      ],
    );
  }
}
