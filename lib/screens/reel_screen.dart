
import 'package:flutter/material.dart';
import 'package:spaktok/models/reel.dart';
import 'package:spaktok/services/reel_service.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:video_player/video_player.dart';
import 'package:chewie/chewie.dart';
import 'package:spaktok/screens/comments_screen.dart';

class ReelScreen extends StatefulWidget {
  const ReelScreen({Key? key}) : super(key: key);

  @override
  State<ReelScreen> createState() => _ReelScreenState();
}

class _ReelScreenState extends State<ReelScreen> {
  final ReelService _reelService = ReelService();
  final FirebaseAuth _auth = FirebaseAuth.instance;
  User? _currentUser;
  Map<String, bool> _savedStatus = {};

  @override
  void initState() {
    super.initState();
    _currentUser = _auth.currentUser;
    if (_currentUser == null) {
      _signInAnonymously();
    }
  }

  Future<void> _loadSavedStatus(List<Reel> reels) async {
    if (_currentUser == null) return;
    final Map<String, bool> status = {};
    for (var reel in reels) {
      status[reel.id] = await _reelService.isReelSaved(reel.id, _currentUser!.uid);
    }
    setState(() {
      _savedStatus = status;
    });
  }

  Future<void> _toggleSaveReel(String reelId) async {
    if (_currentUser == null) return;

    final bool currentlySaved = _savedStatus[reelId] ?? false;
    if (currentlySaved) {
      await _reelService.unsaveReel(reelId, _currentUser!.uid);
    } else {
      await _reelService.saveReel(reelId, _currentUser!.uid);
    }
    setState(() {
      _savedStatus[reelId] = !currentlySaved;
    });
  }

  Future<void> _signInAnonymously() async {
    try {
      await _auth.signInAnonymously();
      setState(() {
        _currentUser = _auth.currentUser;
      });
      print("Signed in anonymously for ReelScreen with UID: ${_currentUser?.uid}");
    } catch (e) {
      print("Error signing in anonymously for ReelScreen: $e");
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
            return const Center(child: Text("No reels available"));
          }
          // Load saved status for all reels once they are available
          WidgetsBinding.instance.addPostFrameCallback((_) {
            _loadSavedStatus(reels);
          });
          return ListView.builder(
            itemCount: reels.length,
            itemBuilder: (context, index) {
              final reel = reels[index];
              return Card(
                margin: const EdgeInsets.all(8.0),
                child: Padding(
                  padding: const EdgeInsets.all(8.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('User ID: ${reel.userId}'),
                      Text('Description: ${reel.description}'),
                      // Video Player
                      ReelVideoPlayer(videoUrl: reel.videoUrl),
                      Row(
                        children: [
                          IconButton(
                            icon: const Icon(Icons.thumb_up),
                            onPressed: () {
                              _reelService.likeReel(reel.id, _currentUser!.uid);
                            },
                          ),
                          Text("Likes: ${reel.likesCount}"),
                          const SizedBox(width: 20),
                          IconButton(
                            icon: const Icon(Icons.comment),
                            onPressed: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) => CommentsScreen(reelId: reel.id),
                                ),
                              );
                            },
                          ),
                          Text("Comments: ${reel.commentsCount}"),
                          const SizedBox(width: 20),
                          IconButton(
                            icon: Icon(
                              _savedStatus[reel.id] == true ? Icons.bookmark : Icons.bookmark_border,
                              color: _savedStatus[reel.id] == true ? Colors.blue : null,
                            ),
                            onPressed: () {
                              _toggleSaveReel(reel.id);
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

class ReelVideoPlayer extends StatefulWidget {
  final String videoUrl;

  const ReelVideoPlayer({Key? key, required this.videoUrl}) : super(key: key);

  @override
  State<ReelVideoPlayer> createState() => _ReelVideoPlayerState();
}

class _ReelVideoPlayerState extends State<ReelVideoPlayer> {
  late VideoPlayerController _videoPlayerController;
  ChewieController? _chewieController;

  @override
  void initState() {
    super.initState();
    _initializePlayer();
  }

  Future<void> _initializePlayer() async {
    _videoPlayerController = VideoPlayerController.networkUrl(Uri.parse(widget.videoUrl));
    await Future.wait([_videoPlayerController.initialize()]);
    _chewieController = ChewieController(
      videoPlayerController: _videoPlayerController,
      autoPlay: true,
      looping: true,
      showControls: true,
      // Optional: Add more Chewie options here
    );
    setState(() {});
  }

  @override
  void dispose() {
    _videoPlayerController.dispose();
    _chewieController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return _chewieController != null &&
            _chewieController!.videoPlayerController.value.isInitialized
        ? AspectRatio(
            aspectRatio: _videoPlayerController.value.aspectRatio,
            child: Chewie(
              controller: _chewieController!,
            ),
          )
        : Container(
            height: 200,
            color: Colors.black12,
            child: const Center(
              child: CircularProgressIndicator(),
            ),
          );
  }
}

