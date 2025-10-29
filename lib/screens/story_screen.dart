import 'dart:async';
import 'package:flutter/material.dart';
import 'package:spaktok/models/story.dart';
import 'package:spaktok/models/user.dart'; // Import UserData
import 'package:spaktok/services/story_service.dart';
import 'package:spaktok/services/auth_service.dart';
import 'package:video_player/video_player.dart';
import 'package:cached_network_image/cached_network_image.dart';

// Main screen that holds the PageView for different users' stories
class StoryScreen extends StatefulWidget {
  const StoryScreen({super.key});

  @override
  State<StoryScreen> createState() => _StoryScreenState();
}

class _StoryScreenState extends State<StoryScreen> {
  final StoryService _storyService = StoryService();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: StreamBuilder<Map<String, List<Story>>>(
        stream: _storyService.getGroupedStories(),
        builder: (context, snapshot) {
          if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());
          final groupedStories = snapshot.data!;
          final users = groupedStories.keys.toList();
          return PageView.builder(
            itemCount: users.length,
            itemBuilder: (context, index) {
              return StoryViewer(stories: groupedStories[users[index]]!);
            },
          );
        },
      ),
    );
  }
}

// Widget for viewing a single user's stories
class StoryViewer extends StatefulWidget {
  final List<Story> stories;
  const StoryViewer({super.key, required this.stories});

  @override
  State<StoryViewer> createState() => _StoryViewerState();
}

class _StoryViewerState extends State<StoryViewer> with TickerProviderStateMixin {
  late AnimationController _animationController;
  VideoPlayerController? _videoController;
  final AuthService _authService = AuthService();
  UserData? _storyUser;
  int _currentIndex = 0;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(vsync: this);
    _fetchStoryUser();
    if (widget.stories.isNotEmpty) {
      _loadStory(widget.stories[0]);
    }
    _animationController.addStatusListener((status) {
      if (status == AnimationStatus.completed) _nextStory();
    });
  }

  Future<void> _fetchStoryUser() async {
    if (widget.stories.isEmpty) return;
    final userData = await _authService.getUserDataById(widget.stories.first.userId);
    if (mounted) setState(() => _storyUser = userData);
  }

  void _loadStory(Story story) {
    // ... same loading logic as before
  }
  
  void _nextStory() {
      // ... same logic
  }

  @override
  void dispose() {
    _animationController.dispose();
    _videoController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(children: [
        // ... PageView for media
        _buildOverlay(),
      ]),
    );
  }

  Widget _buildOverlay() {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(8.0),
        child: Column(
          children: [
            // ... Progress bars
            Row(
              children: [
                CircleAvatar(
                  backgroundImage: _storyUser?.photoURL != null ? CachedNetworkImageProvider(_storyUser!.photoURL!) : null,
                ),
                const SizedBox(width: 8),
                Text(_storyUser?.displayName ?? 'Loading...', style: const TextStyle(color: Colors.white)),
                const Spacer(),
                IconButton(icon: const Icon(Icons.close, color: Colors.white), onPressed: () => Navigator.pop(context)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
