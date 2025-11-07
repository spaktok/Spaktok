import 'package:flutter/material.dart';
import 'package:agora_rtc_engine/agora_rtc_engine.dart';
import 'package:permission_handler/permission_handler.dart';



const appId = "a41807bba5c144b5b8e1fd5ee711707b"; // Replace with your Agora App ID
const token = "007eJxTYEiJ+bXuRdb2/+r1U3Kus0YXtponyjxlajd7rLFV9PmSjrMKDIkmhhYG5klJiabJhiYmSaZJFqmGaSmmqanmhobmQIn09HsZDYGMDGn7c5gYGSAQxGdl8E3MKy1mYAAAut8gzQ=="; // Replace with your temporary token (for testing)
const channel = "test_channel";

class LiveStreamScreen extends StatefulWidget {
  const LiveStreamScreen({super.key});

  @override
  State<LiveStreamScreen> createState() => _LiveStreamScreenState();
}

class _LiveStreamScreenState extends State<LiveStreamScreen> {
  int? _localUid = 0; // Local user ID (can be any non-zero number)
  final List<int> _remoteUids = []; // List of remote user IDs
  bool _localUserJoined = false; // Whether the local user has joined
  bool _isAudioMuted = false; // Local audio mute state
  late RtcEngine _engine; // RTC engine

  @override
  void initState() {
    super.initState();
    initAgora();
  }

  Future<void> initAgora() async {
    // Request camera and microphone permissions
    await [Permission.microphone, Permission.camera].request();

    // Create RTC engine
    _engine = createAgoraRtcEngine();
    await _engine.initialize(const RtcEngineContext(appId: appId));

    _engine.registerEventHandler(
      RtcEngineEventHandler(
        onJoinChannelSuccess: (RtcConnection connection, int elapsed) {
          debugPrint("local user ${connection.localUid} joined");
          setState(() {
            _localUserJoined = true;
            _localUid = connection.localUid; // Update local user ID
          });
        },
        onUserJoined: (RtcConnection connection, int remoteUid, int elapsed) {
          debugPrint("remote user $remoteUid joined");
          setState(() {
            _remoteUids.add(remoteUid); // Add remote user to the list
          });
        },
        onUserOffline: (RtcConnection connection, int remoteUid, UserOfflineReasonType reason) {
          debugPrint("remote user $remoteUid left channel");
          setState(() {
            _remoteUids.remove(remoteUid); // Remove remote user from the list
          });
        },
        onTokenPrivilegeWillExpire: (RtcConnection connection, String token) {
          debugPrint("[onTokenPrivilegeWillExpire] connection: ${connection.toJson()}, token: $token");
        },
        onError: (ErrorCodeType err, String msg) {
          debugPrint("[onError] err: $err, msg: $msg");
        },
      ),
    );

    await _engine.enableVideo();
    await _engine.startPreview();

    await _engine.joinChannel(
      token: token,
      channelId: channel,
      uid: _localUid ?? 0, // Use local user ID
      options: const ChannelMediaOptions(),
    );
  }

  @override
  void dispose() {
    super.dispose();
    _dispose();
  }

  Future<void> _dispose() async {
    await _engine.leaveChannel();
    await _engine.release();
  }

  // Display local video
  Widget _localVideoWidget() {
    if (_localUserJoined) {
      return AgoraVideoView(
        controller: VideoViewController(
          rtcEngine: _engine,
          canvas: VideoCanvas(uid: _localUid),
        ),
      );
    } else {
      return const Center(child: CircularProgressIndicator());
    }
  }

  // Display remote video
  Widget _remoteVideoWidget(int remoteUid) {
    return AgoraVideoView(
      controller: VideoViewController.remote(
        rtcEngine: _engine,
        canvas: VideoCanvas(uid: remoteUid),
        connection: const RtcConnection(channelId: channel),
      ),
    );
  }

  // Build video layout for all participants
  Widget _buildVideoLayout() {
    final List<Widget> videoWidgets = [];

    // Add local video
    if (_localUserJoined) {
      videoWidgets.add(Expanded(child: _localVideoWidget()));
    }

    // Add remote videos
    for (int uid in _remoteUids) {
      videoWidgets.add(Expanded(child: _remoteVideoWidget(uid)));
    }

    if (videoWidgets.isEmpty) {
      return const Center(
        child: Text(
          "Waiting for participants",
          textAlign: TextAlign.center,
          style: TextStyle(color: Colors.white, fontSize: 18),
        ),
      );
    } else if (videoWidgets.length == 1) {
      return videoWidgets.first; // Display single video in full screen
    } else {
      // Multi-participant view (2-4)
      return GridView.builder(
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2, // 2 columns for 2 or 4 participants
          childAspectRatio: 1.0,
          mainAxisSpacing: 10.0,
          crossAxisSpacing: 10.0,
        ),
        itemCount: videoWidgets.length,
        itemBuilder: (BuildContext context, int index) {
          return videoWidgets[index];
        },
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Live Stream")),
      body: Container(
        color: Colors.black, // Black background for video
        child: Stack(
          children: [
            Center(
              child: _buildVideoLayout(),
            ),
            Align(
              alignment: Alignment.bottomCenter,
              child: Padding(
                padding: const EdgeInsets.only(bottom: 20.0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    ElevatedButton(
                      onPressed: () async {
                        // Toggle audio mute
                        setState(() {
                          _isAudioMuted = !_isAudioMuted;
                          _engine.muteLocalAudioStream(_isAudioMuted);
                        }); // Update button state
                      },
                      child: const Text("Mute/Unmute Audio"),
                    ),
                    const SizedBox(width: 20),
                    ElevatedButton(
                      onPressed: () async {
                        // Toggle video on/off
                        await _engine.muteLocalVideoStream(!_localUserJoined);
                        setState(() {}); // Update button state
                      },
                      child: const Text("Stop/Start Video"),
                    ),
                    const SizedBox(width: 20),
                    ElevatedButton(
                      onPressed: () async {
                        await _engine.leaveChannel();
                        Navigator.pop(context);
                      },
                      child: const Text("Leave Stream"),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

