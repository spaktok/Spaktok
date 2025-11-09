import 'package:flutter/material.dart';
import 'package:agora_rtc_engine/agora_rtc_engine.dart';
import 'package:spaktok/services/video_call_service.dart';
import 'package:spaktok/services/agora_token_service.dart';
import 'package:spaktok/config/app_config.dart';

class VideoCallScreen extends StatefulWidget {
  final String channelName;
  final String userId;
  final String callType; // 'one-on-one' or 'group'

  const VideoCallScreen({
    super.key,
    required this.channelName,
    required this.userId,
    this.callType = 'one-on-one',
  });

  @override
  State<VideoCallScreen> createState() => _VideoCallScreenState();
}

class _VideoCallScreenState extends State<VideoCallScreen> {
  late VideoCallService _videoCallService;
  late AgoraTokenService _tokenService;
  bool _isVideoEnabled = true;
  bool _isAudioEnabled = true;
  final List<int> _remoteUids = [];
  int? _localUserUid;

  @override
  void initState() {
    super.initState();
    _videoCallService = VideoCallService();
    _tokenService = AgoraTokenService();
    _initializeCall();
  }

  Future<void> _initializeCall() async {
    try {
      // Initialize Agora engine
      await _videoCallService.initialize();

      // Get token from backend
      final token = await _tokenService.getToken(
        channelName: widget.channelName,
        uid: widget.userId,
      );

      // Join channel with token
      await _videoCallService.joinChannel(
        token: token,
        channelName: widget.channelName,
        uid: widget.userId,
      );

      _localUserUid = int.tryParse(widget.userId);
    
      if (AppConfig.enableDebugLogging) {
        debugPrint('[VideoCall] Initialized and joined channel: \');
      }
    } catch (e) {
      _showError('Failed to initialize call: \');
    }
  }

  void _toggleVideo() {
    setState(() {
      _isVideoEnabled = !_isVideoEnabled;
    });
    _videoCallService.toggleVideo(_isVideoEnabled);
  }

  void _toggleAudio() {
    setState(() {
      _isAudioEnabled = !_isAudioEnabled;
    });
    _videoCallService.toggleAudio(_isAudioEnabled);
  }

  Future<void> _leaveChannel() async {
    await _videoCallService.leaveChannel();
    if (mounted) {
      Navigator.pop(context);
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: Colors.red),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black87,
        title: Text('Call - \'),
        elevation: 0,
      ),
      body: Stack(
        children: [
          // Main video view
          Center(
            child: _localUserUid != null
                ? AgoraVideoView(
                    controller: VideoViewController(
                      rtcEngine: _videoCallService.engine,
                      canvas: VideoCanvas(uid: 0),
                    ),
                  )
                : Container(
                    color: Colors.grey[900],
                    child: const Center(
                      child: CircularProgressIndicator(
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    ),
                  ),
          ),
          // Remote video views
          Positioned(
            top: 16,
            right: 16,
            child: SizedBox(
              width: 100,
              height: 150,
              child: _remoteUids.isNotEmpty
                  ? AgoraVideoView(
                      controller: VideoViewController.remote(
                        rtcEngine: _videoCallService.engine,
                        canvas: VideoCanvas(uid: _remoteUids.first),
                        connection: RtcConnection(
                          channelId: widget.channelName,
                        ),
                      ),
                    )
                  : Container(
                      color: Colors.grey[800],
                      child: const Icon(Icons.videocam_off, color: Colors.white54),
                    ),
            ),
          ),
          // Control buttons
          Positioned(
            bottom: 32,
            left: 0,
            right: 0,
            child: Center(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  // Microphone toggle
                  FloatingActionButton(
                    backgroundColor: _isAudioEnabled ? Colors.blue : Colors.red,
                    onPressed: _toggleAudio,
                    child: Icon(_isAudioEnabled ? Icons.mic : Icons.mic_off),
                  ),
                  // End call
                  FloatingActionButton(
                    backgroundColor: Colors.red,
                    onPressed: _leaveChannel,
                    child: const Icon(Icons.call_end),
                  ),
                  // Camera toggle
                  FloatingActionButton(
                    backgroundColor: _isVideoEnabled ? Colors.blue : Colors.red,
                    onPressed: _toggleVideo,
                    child: Icon(_isVideoEnabled ? Icons.videocam : Icons.videocam_off),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _videoCallService.dispose();
    super.dispose();
  }
}
