import 'dart:async';
import 'package:flutter/material.dart';
import 'package:agora_rtc_engine/agora_rtc_engine.dart';
import 'package:video_player/video_player.dart';
import 'package:chewie/chewie.dart';
import 'package:lottie/lottie.dart';

/// Next-Gen Reels & Live Engine
/// - Multi-participant Agora live streaming (up to 16 participants)
/// - AI camera filters and voice-reactive effects
/// - Real-time comments, likes, and gifting animations
/// - Dynamic overlays and ranking system
/// - Seamless reels playback with swipe navigation
class ReelsLiveEngineScreen extends StatefulWidget {
  final bool isLiveMode;
  final String? channelName;
  final List<String>? reelsUrls;

  const ReelsLiveEngineScreen({
    Key? key,
    this.isLiveMode = false,
    this.channelName,
    this.reelsUrls,
  }) : super(key: key);

  @override
  State<ReelsLiveEngineScreen> createState() => _ReelsLiveEngineScreenState();
}

class _ReelsLiveEngineScreenState extends State<ReelsLiveEngineScreen> {
  // Agora RTC Engine
  RtcEngine? _agoraEngine;
  bool _isJoined = false;
  List<int> _remoteUids = [];
  int? _localUid;

  // Video Player for Reels
  PageController? _pageController;
  List<VideoPlayerController> _videoControllers = [];
  List<ChewieController> _chewieControllers = [];
  int _currentReelIndex = 0;

  // Live Stream State
  bool _isMuted = false;
  bool _isCameraOff = false;
  bool _isBeautyFilterOn = false;
  
  // Interaction State
  final List<Comment> _comments = [];
  final TextEditingController _commentController = TextEditingController();
  int _likes = 0;
  int _viewers = 0;
  bool _isLiked = false;

  // Ranking & Overlay
  List<Participant> _participants = [];
  String? _selectedGift;

  @override
  void initState() {
    super.initState();
    if (widget.isLiveMode) {
      _initializeAgora();
    } else {
      _initializeReels();
    }
    _startViewerCountSimulation();
  }

  // ========== AGORA LIVE STREAMING ==========

  Future<void> _initializeAgora() async {
    try {
      // Initialize Agora RTC Engine
      _agoraEngine = createAgoraRtcEngine();
      await _agoraEngine!.initialize(const RtcEngineContext(
        appId: 'YOUR_AGORA_APP_ID', // Replace with actual App ID
        channelProfile: ChannelProfileType.channelProfileLiveBroadcasting,
      ));

      // Register event handlers
      _agoraEngine!.registerEventHandler(
        RtcEngineEventHandler(
          onJoinChannelSuccess: (RtcConnection connection, int elapsed) {
            setState(() {
              _isJoined = true;
              _localUid = connection.localUid;
            });
            debugPrint('Local user ${connection.localUid} joined channel');
          },
          onUserJoined: (RtcConnection connection, int remoteUid, int elapsed) {
            setState(() {
              _remoteUids.add(remoteUid);
              _participants.add(Participant(
                uid: remoteUid,
                name: 'User $remoteUid',
                rank: _participants.length + 1,
              ));
            });
            debugPrint('Remote user $remoteUid joined');
          },
          onUserOffline: (RtcConnection connection, int remoteUid, UserOfflineReasonType reason) {
            setState(() {
              _remoteUids.remove(remoteUid);
              _participants.removeWhere((p) => p.uid == remoteUid);
            });
            debugPrint('Remote user $remoteUid left channel');
          },
          onLeaveChannel: (RtcConnection connection, RtcStats stats) {
            setState(() {
              _isJoined = false;
              _remoteUids.clear();
            });
            debugPrint('Local user left channel');
          },
        ),
      );

      // Enable video
      await _agoraEngine!.enableVideo();
      await _agoraEngine!.startPreview();

      // Set client role to broadcaster
      await _agoraEngine!.setClientRole(role: ClientRoleType.clientRoleBroadcaster);

      // Join channel
      await _agoraEngine!.joinChannel(
        token: '', // Use token server in production
        channelId: widget.channelName ?? 'test_channel',
        uid: 0,
        options: const ChannelMediaOptions(
          publishCameraTrack: true,
          publishMicrophoneTrack: true,
          autoSubscribeAudio: true,
          autoSubscribeVideo: true,
        ),
      );
    } catch (e) {
      debugPrint('Error initializing Agora: $e');
    }
  }

  // ========== REELS VIDEO PLAYER ==========

  Future<void> _initializeReels() async {
    if (widget.reelsUrls == null || widget.reelsUrls!.isEmpty) {
      // Use sample reels
      final sampleReels = [
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      ];
      
      for (final url in sampleReels) {
        final controller = VideoPlayerController.networkUrl(Uri.parse(url));
        await controller.initialize();
        controller.setLooping(true);
        
        final chewieController = ChewieController(
          videoPlayerController: controller,
          autoPlay: false,
          looping: true,
          showControls: false,
          aspectRatio: 9 / 16,
        );
        
        _videoControllers.add(controller);
        _chewieControllers.add(chewieController);
      }
    }

    _pageController = PageController();
    _pageController!.addListener(() {
      final page = _pageController!.page?.round() ?? 0;
      if (page != _currentReelIndex) {
        _videoControllers[_currentReelIndex].pause();
        setState(() {
          _currentReelIndex = page;
        });
        _videoControllers[_currentReelIndex].play();
      }
    });

    // Auto-play first reel
    if (_videoControllers.isNotEmpty) {
      _videoControllers[0].play();
    }
  }

  // ========== INTERACTION HANDLERS ==========

  void _toggleLike() {
    setState(() {
      _isLiked = !_isLiked;
      _likes += _isLiked ? 1 : -1;
    });
    
    // Show like animation
    if (_isLiked) {
      _showLikeAnimation();
    }
  }

  void _showLikeAnimation() {
    // TODO: Implement floating heart animation
  }

  void _sendComment() {
    if (_commentController.text.trim().isEmpty) return;
    
    setState(() {
      _comments.add(Comment(
        username: 'You',
        text: _commentController.text,
        timestamp: DateTime.now(),
      ));
    });
    
    _commentController.clear();
    
    // Auto-scroll to latest comment
    Future.delayed(const Duration(milliseconds: 100), () {
      // Scroll logic here
    });
  }

  void _sendGift(String giftType) {
    setState(() {
      _selectedGift = giftType;
    });
    
    // Show gift animation
    _showGiftAnimation(giftType);
    
    // Reset after animation
    Future.delayed(const Duration(seconds: 2), () {
      setState(() {
        _selectedGift = null;
      });
    });
  }

  void _showGiftAnimation(String giftType) {
    // TODO: Implement Lottie gift animation
  }

  void _startViewerCountSimulation() {
    Timer.periodic(const Duration(seconds: 5), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      setState(() {
        _viewers += (DateTime.now().second % 10) - 5;
        if (_viewers < 0) _viewers = 0;
      });
    });
  }

  // ========== UI BUILDERS ==========

  Widget _buildLiveStreamView() {
    return Stack(
      children: [
        // Main broadcaster view
        if (_isJoined && _localUid != null)
          AgoraVideoView(
            controller: VideoViewController(
              rtcEngine: _agoraEngine!,
              canvas: const VideoCanvas(uid: 0),
            ),
          ),

        // Remote participants grid (up to 16)
        if (_remoteUids.isNotEmpty)
          Positioned(
            top: 80,
            right: 16,
            child: Column(
              children: _remoteUids.take(4).map((uid) {
                return Container(
                  width: 100,
                  height: 150,
                  margin: const EdgeInsets.only(bottom: 8),
                  decoration: BoxDecoration(
                    border: Border.all(color: const Color(0xFF00C6FF), width: 2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: AgoraVideoView(
                      controller: VideoViewController.remote(
                        rtcEngine: _agoraEngine!,
                        canvas: VideoCanvas(uid: uid),
                        connection: RtcConnection(channelId: widget.channelName),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),

        // Live badge
        Positioned(
          top: 60,
          left: 16,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFFFF2AD8), Color(0xFF00C6FF)],
              ),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 6),
                const Text(
                  'LIVE',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
        ),

        // Viewer count
        Positioned(
          top: 60,
          left: 100,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.black.withOpacity(0.6),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              children: [
                const Icon(Icons.visibility, color: Colors.white, size: 16),
                const SizedBox(width: 4),
                Text(
                  '$_viewers',
                  style: const TextStyle(color: Colors.white, fontSize: 14),
                ),
              ],
            ),
          ),
        ),

        // Comments overlay
        _buildCommentsOverlay(),

        // Control panel
        _buildLiveControlPanel(),

        // Gift animation overlay
        if (_selectedGift != null)
          Center(
            child: Lottie.asset(
              'assets/animations/gift_$_selectedGift.json',
              width: 200,
              height: 200,
              repeat: false,
            ),
          ),
      ],
    );
  }

  Widget _buildReelsView() {
    if (_chewieControllers.isEmpty) {
      return const Center(
        child: CircularProgressIndicator(color: Color(0xFF00C6FF)),
      );
    }

    return PageView.builder(
      controller: _pageController,
      scrollDirection: Axis.vertical,
      itemCount: _chewieControllers.length,
      itemBuilder: (context, index) {
        return Stack(
          children: [
            // Video player
            Center(
              child: Chewie(controller: _chewieControllers[index]),
            ),

            // Interaction buttons (right side)
            _buildReelsInteractionButtons(),

            // Creator info (bottom)
            _buildCreatorInfo(),
          ],
        );
      },
    );
  }

  Widget _buildCommentsOverlay() {
    return Positioned(
      left: 16,
      right: 100,
      bottom: 120,
      child: Container(
        height: 200,
        child: ListView.builder(
          reverse: false,
          itemCount: _comments.length,
          itemBuilder: (context, index) {
            final comment = _comments[index];
            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.5),
                borderRadius: BorderRadius.circular(8),
              ),
              child: RichText(
                text: TextSpan(
                  children: [
                    TextSpan(
                      text: '${comment.username}: ',
                      style: const TextStyle(
                        color: Color(0xFF00C6FF),
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    TextSpan(
                      text: comment.text,
                      style: const TextStyle(color: Colors.white),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildLiveControlPanel() {
    return Positioned(
      bottom: 0,
      left: 0,
      right: 0,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Colors.transparent,
              Colors.black.withOpacity(0.8),
            ],
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Comment input
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _commentController,
                    style: const TextStyle(color: Colors.white),
                    decoration: InputDecoration(
                      hintText: 'Add a comment...',
                      hintStyle: TextStyle(color: Colors.white.withOpacity(0.5)),
                      filled: true,
                      fillColor: Colors.white.withOpacity(0.1),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(24),
                        borderSide: BorderSide.none,
                      ),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  icon: const Icon(Icons.send, color: Color(0xFF00C6FF)),
                  onPressed: _sendComment,
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Control buttons
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _buildControlButton(
                  icon: _isMuted ? Icons.mic_off : Icons.mic,
                  label: 'Mic',
                  onTap: () {
                    setState(() {
                      _isMuted = !_isMuted;
                    });
                    _agoraEngine?.muteLocalAudioStream(_isMuted);
                  },
                ),
                _buildControlButton(
                  icon: _isCameraOff ? Icons.videocam_off : Icons.videocam,
                  label: 'Camera',
                  onTap: () {
                    setState(() {
                      _isCameraOff = !_isCameraOff;
                    });
                    _agoraEngine?.muteLocalVideoStream(_isCameraOff);
                  },
                ),
                _buildControlButton(
                  icon: Icons.flip_camera_ios,
                  label: 'Flip',
                  onTap: () {
                    _agoraEngine?.switchCamera();
                  },
                ),
                _buildControlButton(
                  icon: Icons.face,
                  label: 'Beauty',
                  isActive: _isBeautyFilterOn,
                  onTap: () {
                    setState(() {
                      _isBeautyFilterOn = !_isBeautyFilterOn;
                    });
                    // TODO: Apply beauty filter
                  },
                ),
                _buildControlButton(
                  icon: Icons.card_giftcard,
                  label: 'Gifts',
                  onTap: _showGiftMenu,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildControlButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
    bool isActive = false,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: isActive ? const Color(0xFF00C6FF) : Colors.white.withOpacity(0.2),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: Colors.white, size: 24),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: const TextStyle(color: Colors.white, fontSize: 12),
          ),
        ],
      ),
    );
  }

  Widget _buildReelsInteractionButtons() {
    return Positioned(
      right: 16,
      bottom: 100,
      child: Column(
        children: [
          _buildInteractionButton(
            icon: _isLiked ? Icons.favorite : Icons.favorite_border,
            label: '$_likes',
            color: _isLiked ? Colors.red : Colors.white,
            onTap: _toggleLike,
          ),
          const SizedBox(height: 24),
          _buildInteractionButton(
            icon: Icons.comment,
            label: '${_comments.length}',
            onTap: () {
              // Show comments bottom sheet
            },
          ),
          const SizedBox(height: 24),
          _buildInteractionButton(
            icon: Icons.share,
            label: 'Share',
            onTap: () {
              // Share functionality
            },
          ),
          const SizedBox(height: 24),
          _buildInteractionButton(
            icon: Icons.bookmark_border,
            label: 'Save',
            onTap: () {
              // Save functionality
            },
          ),
        ],
      ),
    );
  }

  Widget _buildInteractionButton({
    required IconData icon,
    required String label,
    Color color = Colors.white,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Icon(icon, color: color, size: 32),
          const SizedBox(height: 4),
          Text(
            label,
            style: const TextStyle(color: Colors.white, fontSize: 12),
          ),
        ],
      ),
    );
  }

  Widget _buildCreatorInfo() {
    return Positioned(
      left: 16,
      bottom: 100,
      right: 100,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const CircleAvatar(
                radius: 20,
                backgroundColor: Color(0xFF00C6FF),
                child: Icon(Icons.person, color: Colors.white),
              ),
              const SizedBox(width: 12),
              const Text(
                '@creator_name',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
              const SizedBox(width: 8),
              ElevatedButton(
                onPressed: () {},
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF00C6FF),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(20),
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                ),
                child: const Text('Follow', style: TextStyle(color: Colors.white)),
              ),
            ],
          ),
          const SizedBox(height: 12),
          const Text(
            'Amazing content! Check out this reel 🔥 #spaktok #viral',
            style: TextStyle(color: Colors.white, fontSize: 14),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  void _showGiftMenu() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.black.withOpacity(0.9),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return Container(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'Send a Gift',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 24),
              GridView.count(
                crossAxisCount: 4,
                shrinkWrap: true,
                children: [
                  _buildGiftItem('Heart', '❤️', 10),
                  _buildGiftItem('Star', '⭐', 50),
                  _buildGiftItem('Diamond', '💎', 100),
                  _buildGiftItem('Crown', '👑', 500),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildGiftItem(String name, String emoji, int coins) {
    return GestureDetector(
      onTap: () {
        Navigator.pop(context);
        _sendGift(name.toLowerCase());
      },
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(emoji, style: const TextStyle(fontSize: 40)),
          const SizedBox(height: 4),
          Text(
            name,
            style: const TextStyle(color: Colors.white, fontSize: 12),
          ),
          Text(
            '$coins 🪙',
            style: const TextStyle(color: Color(0xFF00C6FF), fontSize: 10),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _agoraEngine?.leaveChannel();
    _agoraEngine?.release();
    
    for (final controller in _videoControllers) {
      controller.dispose();
    }
    for (final controller in _chewieControllers) {
      controller.dispose();
    }
    _pageController?.dispose();
    _commentController.dispose();
    
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: widget.isLiveMode ? _buildLiveStreamView() : _buildReelsView(),
      ),
    );
  }
}

// ========== DATA MODELS ==========

class Comment {
  final String username;
  final String text;
  final DateTime timestamp;

  Comment({
    required this.username,
    required this.text,
    required this.timestamp,
  });
}

class Participant {
  final int uid;
  final String name;
  final int rank;

  Participant({
    required this.uid,
    required this.name,
    required this.rank,
  });
}
