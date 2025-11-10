import 'dart:async';
import 'package:flutter/material.dart';
import 'package:agora_rtc_engine/agora_rtc_engine.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:spaktok/config/app_config.dart';
import 'package:spaktok/services/live_stream_service.dart';
// ... other imports

class LiveStreamScreen extends StatefulWidget {
  final String channelName;
  final bool isBroadcaster;

  const LiveStreamScreen({super.key, required this.channelName, required this.isBroadcaster});

  @override
  State<LiveStreamScreen> createState() => _LiveStreamScreenState();
}

class _LiveStreamScreenState extends State<LiveStreamScreen> {
  late final RtcEngine _engine;
  late final LiveStreamService _liveStreamService;
  bool _isEngineInitialized = false;
  int? _opponentUid;

  @override
  void initState() {
    super.initState();
    _liveStreamService = LiveStreamService(channelName: widget.channelName);
    _initializeAgora();
  }

  Future<void> _initializeAgora() async {
    // ... (same Agora initialization logic as before)
    _engine = createAgoraRtcEngine();
    await _engine.initialize(const RtcEngineContext(appId: AppConfig.agoraAppId));
    _engine.registerEventHandler(RtcEngineEventHandler(
        onJoinChannelSuccess: (c, e) => setState(() => _isEngineInitialized = true),
        onUserJoined: (c, remoteUid, e) => setState(() => _opponentUid = remoteUid),
        onUserOffline: (c, remoteUid, r) => setState(() => _opponentUid = null),
    ));
    await _engine.enableVideo();
    await _engine.setClientRole(role: ClientRoleType.clientRoleBroadcaster);
    await _engine.joinChannel(token: "", channelId: widget.channelName, uid: 0, options: const ChannelMediaOptions());
  }

  @override
  void dispose() {
    _engine.release();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: !_isEngineInitialized
          ? const Center(child: CircularProgressIndicator())
          : StreamBuilder<DocumentSnapshot>(
              stream: _liveStreamService.getBattleStream(),
              builder: (context, snapshot) {
                final battleData = snapshot.data?.data() as Map<String, dynamic>?;
                final battleStatus = battleData?['battle']?['status'];

                return Stack(children: [
                  _buildVideoViews(battleStatus),
                  _buildOverlay(battleStatus, battleData),
                  if (widget.isBroadcaster && battleStatus == 'requested')
                    _buildBattleRequestDialog(battleData!),
                ]);
              },
            ),
    );
  }

  Widget _buildVideoViews(String? battleStatus) {
    if (battleStatus == 'active' && _opponentUid != null) {
      // Battle view with two videos
      return Row(
        children: [
          Expanded(child: AgoraVideoView(controller: VideoViewController(rtcEngine: _engine, canvas: const VideoCanvas(uid: 0)))),
          Expanded(child: AgoraVideoView(controller: VideoViewController.remote(rtcEngine: _engine, canvas: VideoCanvas(uid: _opponentUid!), connection: RtcConnection(channelId: widget.channelName)))),
        ],
      );
    }
    // Default view (broadcaster only)
    return AgoraVideoView(controller: VideoViewController(rtcEngine: _engine, canvas: const VideoCanvas(uid: 0)));
  }

  Widget _buildOverlay(String? battleStatus, Map<String, dynamic>? battleData) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        // ... Header
        if (battleStatus == 'active') _buildBattleUI(battleData!),
        // ... Footer with chat and gifts
      ],
    );
  }

  Widget _buildBattleUI(Map<String, dynamic> battleData) {
    // UI for battle progress bar, scores, timer, etc.
    return Container(
      padding: const EdgeInsets.all(8.0),
      color: Colors.black.withValues(alpha: 0.5),
      child: const Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [Text('You: 100', style: TextStyle(color: Colors.white)), Text('Opponent: 80', style: TextStyle(color: Colors.white))],
      ),
    );
  }

  Widget _buildBattleRequestDialog(Map<String, dynamic> battleData) {
    return AlertDialog(
      title: const Text('Battle Request'),
      content: Text('You have a battle request from ${battleData['battle']['requesterId']}'),
      actions: [
        TextButton(onPressed: () => _liveStreamService.declineBattle(), child: const Text('Decline')),
        TextButton(onPressed: () => _liveStreamService.acceptBattle(), child: const Text('Accept')),
      ],
    );
  }
}
