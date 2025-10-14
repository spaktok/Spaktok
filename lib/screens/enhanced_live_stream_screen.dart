import 'package:flutter/material.dart';
import 'package:agora_rtc_engine/agora_rtc_engine.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:spaktok/services/stream_service.dart';
import 'package:spaktok/services/auth_service.dart';

const appId = "a41807bba5c144b5b8e1fd5ee711707b";

class EnhancedLiveStreamScreen extends StatefulWidget {
  final String streamId;
  final String channelName;
  final bool isHost;
  final String? token;

  const EnhancedLiveStreamScreen({
    Key? key,
    required this.streamId,
    required this.channelName,
    required this.isHost,
    this.token,
  }) : super(key: key);

  @override
  State<EnhancedLiveStreamScreen> createState() => _EnhancedLiveStreamScreenState();
}

class _EnhancedLiveStreamScreenState extends State<EnhancedLiveStreamScreen> {
  final StreamService _streamService = StreamService();
  final AuthService _authService = AuthService();
  final TextEditingController _messageController = TextEditingController();

  late RtcEngine _engine;
  bool _localUserJoined = false;
  bool _isMuted = false;
  bool _isCameraOff = false;
  bool _isFrontCamera = true;
  int _viewerCount = 0;
  int? _localUid;
  List<int> _remoteUids = [];

  @override
  void initState() {
    super.initState();
    _initAgora();
    if (!widget.isHost) {
      _streamService.joinStream(widget.streamId);
    }
  }

  Future<void> _initAgora() async {
    // Request permissions
    await [Permission.microphone, Permission.camera].request();

    // Create RTC engine
    _engine = createAgoraRtcEngine();
    await _engine.initialize(const RtcEngineContext(appId: appId));

    // Register event handlers
    _engine.registerEventHandler(
      RtcEngineEventHandler(
        onJoinChannelSuccess: (RtcConnection connection, int elapsed) {
          debugPrint("Local user ${connection.localUid} joined");
          setState(() {
            _localUserJoined = true;
            _localUid = connection.localUid;
          });
        },
        onUserJoined: (RtcConnection connection, int remoteUid, int elapsed) {
          debugPrint("Remote user $remoteUid joined");
          setState(() {
            _remoteUids.add(remoteUid);
          });
        },
        onUserOffline: (RtcConnection connection, int remoteUid, UserOfflineReasonType reason) {
          debugPrint("Remote user $remoteUid left");
          setState(() {
            _remoteUids.remove(remoteUid);
          });
        },
      ),
    );

    // Enable video
    await _engine.enableVideo();
    
    // Set channel profile
    await _engine.setChannelProfile(ChannelProfileType.channelProfileLiveBroadcasting);
    
    // Set client role
    if (widget.isHost) {
      await _engine.setClientRole(role: ClientRoleType.clientRoleBroadcaster);
      await _engine.startPreview();
    } else {
      await _engine.setClientRole(role: ClientRoleType.clientRoleAudience);
    }

    // Join channel
    await _engine.joinChannel(
      token: widget.token ?? "",
      channelId: widget.channelName,
      uid: 0,
      options: const ChannelMediaOptions(),
    );
  }

  @override
  void dispose() {
    _messageController.dispose();
    _dispose();
    super.dispose();
  }

  Future<void> _dispose() async {
    if (!widget.isHost) {
      await _streamService.leaveStream(widget.streamId);
    }
    await _engine.leaveChannel();
    await _engine.release();
  }

  Future<void> _toggleMute() async {
    setState(() {
      _isMuted = !_isMuted;
    });
    await _engine.muteLocalAudioStream(_isMuted);
  }

  Future<void> _toggleCamera() async {
    setState(() {
      _isCameraOff = !_isCameraOff;
    });
    await _engine.muteLocalVideoStream(_isCameraOff);
  }

  Future<void> _switchCamera() async {
    await _engine.switchCamera();
    setState(() {
      _isFrontCamera = !_isFrontCamera;
    });
  }

  Future<void> _endStream() async {
    if (widget.isHost) {
      await _streamService.endStream(widget.streamId);
    }
    if (mounted) {
      Navigator.of(context).pop();
    }
  }

  void _sendMessage() {
    if (_messageController.text.trim().isNotEmpty) {
      _streamService.sendStreamMessage(
        streamId: widget.streamId,
        message: _messageController.text.trim(),
      );
      _messageController.clear();
    }
  }

  Widget _buildVideoView() {
    if (widget.isHost) {
      if (_localUserJoined) {
        return AgoraVideoView(
          controller: VideoViewController(
            rtcEngine: _engine,
            canvas: VideoCanvas(uid: _localUid),
          ),
        );
      } else {
        return const Center(
          child: CircularProgressIndicator(color: Colors.white),
        );
      }
    } else {
      if (_remoteUids.isNotEmpty) {
        return AgoraVideoView(
          controller: VideoViewController.remote(
            rtcEngine: _engine,
            canvas: VideoCanvas(uid: _remoteUids.first),
            connection: RtcConnection(channelId: widget.channelName),
          ),
        );
      } else {
        return const Center(
          child: Text(
            'Waiting for host...',
            style: TextStyle(color: Colors.white, fontSize: 18),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Video view
          Container(
            color: Colors.black,
            child: _buildVideoView(),
          ),

          // Top bar with viewer count and close button
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Viewer count
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.5),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.visibility, color: Colors.white, size: 16),
                        const SizedBox(width: 4),
                        StreamBuilder(
                          stream: _streamService.getStream(widget.streamId).asStream(),
                          builder: (context, snapshot) {
                            if (snapshot.hasData && snapshot.data!.exists) {
                              final data = snapshot.data!.data() as Map<String, dynamic>;
                              _viewerCount = data['viewerCount'] ?? 0;
                            }
                            return Text(
                              '$_viewerCount',
                              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                            );
                          },
                        ),
                      ],
                    ),
                  ),

                  // Close button
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white),
                    onPressed: _endStream,
                  ),
                ],
              ),
            ),
          ),

          // Bottom controls
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.bottomCenter,
                  end: Alignment.topCenter,
                  colors: [
                    Colors.black.withOpacity(0.8),
                    Colors.transparent,
                  ],
                ),
              ),
              child: SafeArea(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Chat messages
                    Container(
                      height: 200,
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: StreamBuilder(
                        stream: _streamService.getStreamMessages(widget.streamId),
                        builder: (context, snapshot) {
                          if (!snapshot.hasData) {
                            return const SizedBox();
                          }

                          final messages = snapshot.data!.docs;
                          return ListView.builder(
                            reverse: false,
                            itemCount: messages.length,
                            itemBuilder: (context, index) {
                              final message = messages[index].data() as Map<String, dynamic>;
                              return Padding(
                                padding: const EdgeInsets.only(bottom: 8.0),
                                child: Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color: Colors.black.withOpacity(0.5),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: RichText(
                                    text: TextSpan(
                                      children: [
                                        TextSpan(
                                          text: '${message['userName']}: ',
                                          style: const TextStyle(
                                            color: Colors.blue,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                        TextSpan(
                                          text: message['message'],
                                          style: const TextStyle(color: Colors.white),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              );
                            },
                          );
                        },
                      ),
                    ),

                    // Controls row
                    Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Row(
                        children: [
                          // Message input
                          Expanded(
                            child: TextField(
                              controller: _messageController,
                              style: const TextStyle(color: Colors.white),
                              decoration: InputDecoration(
                                hintText: 'Send a message...',
                                hintStyle: TextStyle(color: Colors.white.withOpacity(0.5)),
                                filled: true,
                                fillColor: Colors.white.withOpacity(0.2),
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(25),
                                  borderSide: BorderSide.none,
                                ),
                                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                                suffixIcon: IconButton(
                                  icon: const Icon(Icons.send, color: Colors.white),
                                  onPressed: _sendMessage,
                                ),
                              ),
                              onSubmitted: (_) => _sendMessage(),
                            ),
                          ),

                          if (widget.isHost) ...[
                            const SizedBox(width: 8),
                            // Mute button
                            IconButton(
                              icon: Icon(
                                _isMuted ? Icons.mic_off : Icons.mic,
                                color: Colors.white,
                              ),
                              onPressed: _toggleMute,
                            ),
                            // Camera toggle
                            IconButton(
                              icon: Icon(
                                _isCameraOff ? Icons.videocam_off : Icons.videocam,
                                color: Colors.white,
                              ),
                              onPressed: _toggleCamera,
                            ),
                            // Switch camera
                            IconButton(
                              icon: const Icon(Icons.flip_camera_ios, color: Colors.white),
                              onPressed: _switchCamera,
                            ),
                          ],
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
