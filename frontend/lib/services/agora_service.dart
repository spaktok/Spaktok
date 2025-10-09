import 'package:agora_rtc_engine/agora_rtc_engine.dart';
import 'package:flutter/foundation.dart';

const String appId = "d9b35e000fb24b5d84d444a33cf7a8c4"; // Replace with your Agora App ID
const String token = "007eJxTYBA8dPng5JM/fpZ9fvf3B+O+J4tsbtdccN0VG/Je4vIHV9NeBYYUyyRj01QDA4O0JCOTJNMUC5MUExOTRGPj5DTzRItkk5glzzMaAhkZlK9NYGRkgEAQn4ehJLW4JD45IzEvLzWHgQEAJrgn1w=="; // Replace with your Agora Token (for testing, can be generated dynamically)
const String channelId = "test_channel"; // Replace with your channel name

class AgoraService {
  late RtcEngine _engine;
  int? _remoteUid;
  bool _localUserJoined = false;

  Future<void> initialize() async {
    if (defaultTargetPlatform == TargetPlatform.android || defaultTargetPlatform == TargetPlatform.iOS) {
      // retrieve permissions
      // await [Permission.microphone, Permission.camera].request();
    }

    _engine = createAgoraRtcEngine();
    await _engine.initialize(const RtcEngineContext(appId: appId));

    _engine.registerEventHandler(
      RtcEngineEventHandler(
        onJoinChannelSuccess: (RtcConnection connection, int elapsed) {
          debugPrint("local user ${connection.localUid} joined");
          _localUserJoined = true;
        },
        onUserJoined: (RtcConnection connection, int remoteUid, int elapsed) {
          debugPrint("remote user $remoteUid joined");
          _remoteUid = remoteUid;
        },
        onUserOffline: (RtcConnection connection, int remoteUid, UserOfflineReasonType reason) {
          debugPrint("remote user $remoteUid left channel");
          _remoteUid = null;
        },
        onLeaveChannel: (RtcConnection connection, RtcStats stats) {
          debugPrint("local user ${connection.localUid} left channel");
          _localUserJoined = false;
          _remoteUid = null;
        },
        onTokenPrivilegeWillExpire: (RtcConnection connection, String token) async {
          // Implement token renewal logic here
          debugPrint('Token privilege will expire');
        },
      ),
    );

    await _engine.enableVideo();
    await _engine.startPreview();
  }

  Future<void> joinChannel() async {
    await _engine.joinChannel(
      token: token,
      channelId: channelId,
      uid: 0, // 0 means Agora will assign a UID
      options: const ChannelMediaOptions(),
    );
  }

  Future<void> leaveChannel() async {
    await _engine.leaveChannel();
  }

  RtcEngine get engine => _engine;
  int? get remoteUid => _remoteUid;
  bool get localUserJoined => _localUserJoined;

  void dispose() {
    _engine.release();
  }
}

