import 'package:flutter/material.dart';
import 'package:spaktok/models/reel.dart';
import 'package:spaktok/services/reel_service.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:video_player/video_player.dart';
import 'package:visibility_detector/visibility_detector.dart';

class ReelScreen extends StatefulWidget {
  const ReelScreen({super.key});

  @override
  State<ReelScreen> createState() => _ReelScreenState();
}

class _ReelScreenState extends State<ReelScreen> {
  final ReelService _reelService = ReelService();
  final FirebaseAuth _auth = FirebaseAuth.instance;
  User? _currentUser;
  final Map<String, VideoPlayerController> _controllers = {};
  final Map<String, bool> _isPlaying = {};

  @override
  void initState() {
    super.initState();
    _currentUser = _auth.currentUser;
    if (_currentUser == null) {
      _signInAnonymously();
    }
  }

  Future<void> _signInAnonymously() async {
    try {
      await _auth.signInAnonymously();
      setState(() {
        _currentUser = _auth.currentUser;
      });
      print(
          "Signed in anonymously for ReelScreen with UID: ${_currentUser?.uid}");
    } catch (e) {
      print("Error signing in anonymously for ReelScreen: $e");
    }
  }

  @override
  void dispose() {
    _controllers.forEach((key, controller) {
      controller.dispose();
    });
    super.dispose();
  }

  Future<void> _initializeController(String reelId, String videoUrl) async {
    if (_controllers.containsKey(reelId)) return;

    final controller = VideoPlayerController.network(videoUrl);
    _controllers[reelId] = controller;
    _isPlaying[reelId] = false;

    await controller.initialize();
    controller.setLooping(true);
  }

  void _togglePlayPause(String reelId) {
    final controller = _controllers[reelId];
    if (controller == null) return;

    setState(() {
      if (controller.value.isPlaying) {
        controller.pause();
        _isPlaying[reelId] = false;
      } else {
        controller.play();
        _isPlaying[reelId] = true;
      }
    });
  }

  void _onVisibilityChanged(VisibilityInfo info, String reelId) {
    final controller = _controllers[reelId];
    if (controller == null) return;

    if (info.visibleFraction < 0.5) {
      controller.pause();
      setState(() {
        _isPlaying[reelId] = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_currentUser == null) {
      return Scaffold(
        appBar: AppBar(title: const Text("Reels")),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text("Reels")),
      body: StreamBuilder<List<Reel>>(
        stream: _reelService.getAllReels(),
        builder: (context, snapshot) {
          if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          }
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          final reels = snapshot.data ?? [];
          if (reels.isEmpty) {
            return Center(child: const Text("No reels available"));
          }
          return ListView.builder(
            itemCount: reels.length,
            itemBuilder: (context, index) {
              final reel = reels[index];
              return FutureBuilder(
                future: _initializeController(reel.id, reel.videoUrl),
                builder: (context, snapshot) {
                  final controller = _controllers[reel.id];
                  final isPlaying = _isPlaying[reel.id] ?? false;

                  return Card(
                    margin: const EdgeInsets.all(8.0),
                    child: Padding(
                      padding: const EdgeInsets.all(8.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('User ID: ${reel.userId}'),
                          Text('Description: ${reel.description}'),
                          // Video Player with controls
                          VisibilityDetector(
                            key: Key(reel.id),
                            onVisibilityChanged: (info) =>
                                _onVisibilityChanged(info, reel.id),
                            child: Container(
                              height: 200,
                              color: Colors.black,
                              child: controller != null &&
                                      controller.value.isInitialized
                                  ? Stack(
                                      alignment: Alignment.center,
                                      children: [
                                        VideoPlayer(controller),
                                        // Play/Pause overlay
                                        GestureDetector(
                                          onTap: () =>
                                              _togglePlayPause(reel.id),
                                          child: Container(
                                            color: Colors.transparent,
                                            child: Center(
                                              child: Icon(
                                                isPlaying
                                                    ? Icons.pause
                                                    : Icons.play_arrow,
                                                color: Colors.white,
                                                size: 50,
                                              ),
                                            ),
                                          ),
                                        ),
                                        // Progress bar
                                        Positioned(
                                          bottom: 0,
                                          left: 0,
                                          right: 0,
                                          child: VideoProgressIndicator(
                                            controller,
                                            allowScrubbing: true,
                                            colors: const VideoProgressColors(
                                              playedColor: Colors.red,
                                              bufferedColor: Colors.grey,
                                              backgroundColor: Colors.black,
                                            ),
                                          ),
                                        ),
                                      ],
                                    )
                                  : const Center(
                                      child: CircularProgressIndicator()),
                            ),
                          ),
                          Row(
                            children: [
                              IconButton(
                                icon: const Icon(Icons.thumb_up),
                                onPressed: () {
                                  _reelService.likeReel(
                                      reel.id, _currentUser!.uid);
                                },
                              ),
                              Text("Likes: ${reel.likesCount}"),
                              const SizedBox(width: 20),
                              IconButton(
                                icon: const Icon(Icons.comment),
                                onPressed: () {
                                  // TODO: Implement comment functionality
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                        content: Text(
                                            "Comments: 0")), // Placeholder for comment functionality
                                  );
                                },
                              ),
                              Text("Comments: ${reel.commentsCount}"),
                              const SizedBox(width: 20),
                              IconButton(
                                icon: const Icon(Icons.bookmark_border),
                                onPressed: () async {
                                  final isSaved = await _reelService
                                      .isReelSaved(reel.id, _currentUser!.uid);
                                  if (isSaved) {
                                    await _reelService.unsaveReel(
                                        reel.id, _currentUser!.uid);
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(
                                          content:
                                              Text("Removed from favorites")),
                                    );
                                  } else {
                                    await _reelService.saveReel(
                                        reel.id, _currentUser!.uid);
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(
                                          content: Text("Added to favorites")),
                                    );
                                  }
                                },
                              ),
                            ],
                          ),
                          Text('Timestamp: ${reel.timestamp.toDate()}'),
                        ],
                      ),
                    ),
                  );
                },
              );
            },
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          // TODO: Implement reel upload functionality
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: const Text("Upload reel not implemented")),
          );
        },
        child: const Icon(Icons.video_call),
      ),
    );
  }
}
