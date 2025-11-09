import 'package:agora_rtc_engine/agora_rtc_engine.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:flutter/foundation.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:spaktok/services/auth_service.dart';
import 'package:spaktok/services/agora_token_service.dart';
import 'package:spaktok/config/app_config.dart';

// REMOVED: Hardcoded Agora App ID - Now managed by backend token service

enum CallType {
  audio,
  video,
}

class VideoCallService {
  static VideoCallService? _instance;
  static VideoCallService get instance {
    _instance ??= VideoCallService._();
    return _instance!;
  }

  VideoCallService._();

  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final AuthService _authService = AuthService();
  final AgoraTokenService _tokenService = AgoraTokenService.instance;

  RtcEngine? _engine;
  bool _isInitialized = false;
  final bool _isMuted = false;
  final bool _isVideoOff = false;
  final bool _isSpeakerOn = true;
  int? _localUid;
  final List<int> _remoteUids = [];

  // Getters
  bool get isInitialized => _isInitialized;
  bool get isMuted => _isMuted;
  bool get isVideoOff => _isVideoOff;
  bool get isSpeakerOn => _isSpeakerOn;
  int? get localUid => _localUid;
  List<int> get remoteUids => _remoteUids;
  RtcEngine? get engine => _engine;

  // Initialize Agora engine - NO LONGER REQUIRES HARDCODED CREDENTIALS
  Future<void> initialize() async {
    if (_isInitialized) return;

    try {
      await [Permission.microphone, Permission.camera].request();

      // Engine initialized with App ID provided via --dart-define (see AppConfig)
      _engine = createAgoraRtcEngine();
      if (AppConfig.agoraAppId.isEmpty) {
        debugPrint('[VideoCallService] Missing AGORA_APP_ID. Provide via --dart-define');
        throw Exception('Missing AGORA_APP_ID');
      }
      await _engine!.initialize(RtcEngineContext(appId: AppConfig.agoraAppId));

      _isInitialized = true;
      debugPrint('[VideoCallService] Initialized (tokens managed by backend)');
    } catch (e) {
      debugPrint('[VideoCallService] Init error: $e');
      rethrow;
    }
  }

  // Join channel with backend-provided token
  Future<void> joinChannel({
    required String channelName,
    required int uid,
    required bool isAudioOnly,
  }) async {
    if (!_isInitialized) await initialize();

    try {
      // Request token from backend service
      final token = await _tokenService.getToken(
        channelName: channelName,
        uid: uid,
        userId: _authService.currentUser?.uid ?? 'anonymous',
        role: 'publisher',
      );

      await _engine!.joinChannel(
        token: token,
        channelId: channelName,
        uid: uid,
        options: ChannelMediaOptions(
          autoSubscribeAudio: true,
          autoSubscribeVideo: !isAudioOnly,
          publishMicrophoneTrack: true,
          publishCameraTrack: !isAudioOnly,
        ),
      );

      debugPrint('[VideoCallService] Joined channel: $channelName');
    } catch (e) {
      debugPrint('[VideoCallService] Join error: $e');
      rethrow;
    }
  }

  void registerEventHandlers({
    required Function(int uid) onUserJoined,
    required Function(int uid) onUserOffline,
    required Function() onJoinChannelSuccess,
  }) {
    _engine?.registerEventHandler(
      RtcEngineEventHandler(
        onJoinChannelSuccess: (RtcConnection connection, int elapsed) {
          _localUid = connection.localUid;
          onJoinChannelSuccess();
        },
        onUserJoined: (RtcConnection connection, int remoteUid, int elapsed) {
          _remoteUids.add(remoteUid);
          onUserJoined(remoteUid);
        },
        onUserOffline: (RtcConnection connection, int remoteUid,
            UserOfflineReasonType reason) {
          _remoteUids.removeWhere((uid) => uid == remoteUid);
          onUserOffline(remoteUid);
        },
      ),
    );
  }

  Future<void> leaveChannel() async {
    await _engine?.leaveChannel();
    _remoteUids.clear();
  }

  void dispose() {
    _engine?.release();
    _isInitialized = false;
  }
}
