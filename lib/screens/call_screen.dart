import 'package:flutter/material.dart';
import 'package:agora_rtc_engine/agora_rtc_engine.dart';
import 'package:spaktok/config/app_config.dart';
import 'dart:async';

class CallScreen extends StatefulWidget {
  final String channelName;
  final String token;
  final ClientRoleType role;

  const CallScreen({
    super.key,
    required this.channelName,
    required this.token,
    required this.role,
  });

  @override
  State<CallScreen> createState() => _CallScreenState();
}

class _CallScreenState extends State<CallScreen> {
  late final RtcEngine _engine;
  int? _remoteUid;
  bool _isMuted = false;
  bool _isSpeakerOn = true;

  @override
  void initState() {
    super.initState();
    _initializeAgora();
  }

  @override
  void dispose() {
    _engine.leaveChannel();
    _engine.release();
    super.dispose();
  }

  Future<void> _initializeAgora() async {
    _engine = createAgoraRtcEngine();
    await _engine.initialize(const RtcEngineContext(appId: AppConfig.agoraAppId));

    _engine.registerEventHandler(RtcEngineEventHandler(
      onJoinChannelSuccess: (connection, elapsed) {},
      onUserJoined: (connection, remoteUid, elapsed) {
        setState(() => _remoteUid = remoteUid);
      },
      onUserOffline: (connection, remoteUid, reason) {
        setState(() => _remoteUid = null);
        Navigator.of(context).pop();
      },
    ));

    await _engine.enableVideo();
    await _engine.setClientRole(role: widget.role);
    await _engine.joinChannel(token: widget.token, channelId: widget.channelName, uid: 0, options: const ChannelMediaOptions());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          Center(child: _buildVideoViews()),
          _buildControls(),
        ],
      ),
    );
  }

  Widget _buildVideoViews() {
    if (_remoteUid != null) {
      // Remote user view
      return AgoraVideoView(
        controller: VideoViewController.remote(
          rtcEngine: _engine,
          canvas: VideoCanvas(uid: _remoteUid!),
          connection: RtcConnection(channelId: widget.channelName),
        ),
      );
    }
    // Local user view (or waiting message)
    return const Center(
        child: Text('Waiting for user to join...', style: TextStyle(color: Colors.white)));
  }

  Widget _buildControls() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        const SizedBox.shrink(), // Placeholder for top controls
        // Local user preview
        Align(
            alignment: Alignment.topRight,
            child: SizedBox(
                width: 100, height: 150,
                child: AgoraVideoView(controller: VideoViewController(rtcEngine: _engine, canvas: const VideoCanvas(uid: 0))))
        ),
        // Bottom controls
        Container(
          padding: const EdgeInsets.symmetric(vertical: 30, horizontal: 20),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildControlButton(icon: _isMuted ? Icons.mic_off : Icons.mic, onTap: _toggleMute, color: _isMuted ? Colors.red : Colors.white),
              _buildControlButton(icon: Icons.call_end, onTap: () => Navigator.of(context).pop(), color: Colors.red, isLarge: true),
              _buildControlButton(icon: Icons.flip_camera_ios, onTap: () => _engine.switchCamera()),
              _buildControlButton(icon: _isSpeakerOn ? Icons.volume_up : Icons.volume_off, onTap: _toggleSpeaker),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildControlButton({required IconData icon, required VoidCallback onTap, Color color = Colors.white, bool isLarge = false}) {
    return FloatingActionButton(
      onPressed: onTap,
      backgroundColor: isLarge ? color : Colors.white.withOpacity(0.3),
      heroTag: null, // To allow multiple FABs
      child: Icon(icon, color: isLarge ? Colors.white : color, size: isLarge ? 36 : 24),
    );
  }

  void _toggleMute() {
    setState(() => _isMuted = !_isMuted);
    _engine.muteLocalAudioStream(_isMuted);
  }

  void _toggleSpeaker() {
    setState(() => _isSpeakerOn = !_isSpeakerOn);
    _engine.setEnableSpeakerphone(_isSpeakerOn);
  }
}
