import 'package:agora_rtc_engine/agora_rtc_engine.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:flutter/foundation.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:spaktok/services/auth_service.dart';

const String agoraAppId = "a41807bba5c144b5b8e1fd5ee711707b";

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
  
  RtcEngine? _engine;
  bool _isInitialized = false;
  bool _isMuted = false;
  bool _isVideoOff = false;
  bool _isSpeakerOn = true;
  int? _localUid;
  List<int> _remoteUids = [];

  // Getters
  bool get isInitialized => _isInitialized;
  bool get isMuted => _isMuted;
  bool get isVideoOff => _isVideoOff;
  bool get isSpeakerOn => _isSpeakerOn;
  int? get localUid => _localUid;
  List<int> get remoteUids => _remoteUids;
  RtcEngine? get engine => _engine;

  // Initialize Agora engine
  Future<void> initialize() async {
    if (_isInitialized) return;

    try {
      // Request permissions
      await [Permission.microphone, Permission.camera].request();

      // Create engine
      _engine = createAgoraRtcEngine();
      await _engine!.initialize(const RtcEngineContext(appId: agoraAppId));

      _isInitialized = true;
    } catch (e) {
      debugPrint('Error initializing Agora: $e');
      rethrow;
    }
  }

  // Register event handlers
  void registerEventHandlers({
    required Function(int uid) onUserJoined,
    required Function(int uid) onUserOffline,
    required Function() onJoinChannelSuccess,
  }) {
    _engine?.registerEventHandler(
      RtcEngineEventHandler(
        onJoinChannelSuccess: (RtcConnection connection, int elapsed) {
          debugPrint("Local user ${connection.localUid} joined");
          _localUid = connection.localUid;
          onJoinChannelSuccess();
        },
        onUserJoined: (RtcConnection connection, int remoteUid, int elapsed) {
          debugPrint("Remote user $remoteUid joined");
          _remoteUids.add(remoteUid);
          onUserJoined(remoteUid);
        },
        onUserOffline: (RtcConnection connection, int remoteUid, UserOfflineReasonType reason) {
          debugPrint("Remote user $remoteUid left");
          _remoteUids.remove(remoteUid);
          onUserOffline(remoteUid);
        },
        onError: (ErrorCodeType err, String msg) {
          debugPrint("[onError] err: $err, msg: $msg");
        },
      ),
    );
  }

  // Start a call
  Future<String> startCall({
    required String receiverId,
    required String receiverName,
    required CallType callType,
  }) async {
    try {
      final user = _authService.currentUser;
      if (user == null) {
        throw Exception('User must be logged in to start a call');
      }

      // Generate channel name
      final channelName = 'call_${DateTime.now().millisecondsSinceEpoch}';

      // Create call document in Firestore
      final callDoc = await _firestore.collection('calls').add({
        'channelName': channelName,
        'callerId': user.uid,
        'callerName': user.displayName ?? 'Anonymous',
        'callerPhotoUrl': user.photoURL,
        'receiverId': receiverId,
        'receiverName': receiverName,
        'callType': callType.toString(),
        'status': 'calling',
        'startedAt': FieldValue.serverTimestamp(),
        'endedAt': null,
      });

      return callDoc.id;
    } catch (e) {
      throw Exception('Failed to start call: $e');
    }
  }

  // Answer a call
  Future<void> answerCall(String callId) async {
    try {
      await _firestore.collection('calls').doc(callId).update({
        'status': 'ongoing',
        'answeredAt': FieldValue.serverTimestamp(),
      });
    } catch (e) {
      throw Exception('Failed to answer call: $e');
    }
  }

  // Reject a call
  Future<void> rejectCall(String callId) async {
    try {
      await _firestore.collection('calls').doc(callId).update({
        'status': 'rejected',
        'endedAt': FieldValue.serverTimestamp(),
      });
    } catch (e) {
      throw Exception('Failed to reject call: $e');
    }
  }

  // End a call
  Future<void> endCall(String callId) async {
    try {
      await _firestore.collection('calls').doc(callId).update({
        'status': 'ended',
        'endedAt': FieldValue.serverTimestamp(),
      });
    } catch (e) {
      throw Exception('Failed to end call: $e');
    }
  }

  // Join a channel
  Future<void> joinChannel({
    required String channelName,
    required CallType callType,
    String? token,
  }) async {
    if (!_isInitialized) {
      await initialize();
    }

    try {
      // Enable video if video call
      if (callType == CallType.video) {
        await _engine!.enableVideo();
        await _engine!.startPreview();
      } else {
        await _engine!.disableVideo();
      }

      // Join channel
      await _engine!.joinChannel(
        token: token ?? "",
        channelId: channelName,
        uid: 0,
        options: const ChannelMediaOptions(
          channelProfile: ChannelProfileType.channelProfileCommunication,
          clientRoleType: ClientRoleType.clientRoleBroadcaster,
        ),
      );
    } catch (e) {
      debugPrint('Error joining channel: $e');
      rethrow;
    }
  }

  // Leave channel
  Future<void> leaveChannel() async {
    try {
      await _engine?.leaveChannel();
      _remoteUids.clear();
      _localUid = null;
    } catch (e) {
      debugPrint('Error leaving channel: $e');
      rethrow;
    }
  }

  // Toggle mute
  Future<void> toggleMute() async {
    try {
      _isMuted = !_isMuted;
      await _engine?.muteLocalAudioStream(_isMuted);
    } catch (e) {
      debugPrint('Error toggling mute: $e');
      rethrow;
    }
  }

  // Toggle video
  Future<void> toggleVideo() async {
    try {
      _isVideoOff = !_isVideoOff;
      await _engine?.muteLocalVideoStream(_isVideoOff);
    } catch (e) {
      debugPrint('Error toggling video: $e');
      rethrow;
    }
  }

  // Switch camera
  Future<void> switchCamera() async {
    try {
      await _engine?.switchCamera();
    } catch (e) {
      debugPrint('Error switching camera: $e');
      rethrow;
    }
  }

  // Toggle speaker
  Future<void> toggleSpeaker() async {
    try {
      _isSpeakerOn = !_isSpeakerOn;
      await _engine?.setEnableSpeakerphone(_isSpeakerOn);
    } catch (e) {
      debugPrint('Error toggling speaker: $e');
      rethrow;
    }
  }

  // Enable/disable beauty effect
  Future<void> setBeautyEffect({
    double lighteningLevel = 0.7,
    double smoothnessLevel = 0.5,
    double rednessLevel = 0.1,
  }) async {
    try {
      await _engine?.setBeautyEffectOptions(
        true,
        BeautyOptions(
          lighteningLevel: lighteningLevel,
          smoothnessLevel: smoothnessLevel,
          rednessLevel: rednessLevel,
        ),
      );
    } catch (e) {
      debugPrint('Error setting beauty effect: $e');
      rethrow;
    }
  }

  // Disable beauty effect
  Future<void> disableBeautyEffect() async {
    try {
      await _engine?.setBeautyEffectOptions(false, const BeautyOptions());
    } catch (e) {
      debugPrint('Error disabling beauty effect: $e');
      rethrow;
    }
  }

  // Get call history
  Stream<QuerySnapshot> getCallHistory() {
    final user = _authService.currentUser;
    if (user == null) {
      throw Exception('User must be logged in');
    }

    return _firestore
        .collection('calls')
        .where('callerId', isEqualTo: user.uid)
        .orderBy('startedAt', descending: true)
        .limit(50)
        .snapshots();
  }

  // Dispose
  Future<void> dispose() async {
    try {
      await _engine?.leaveChannel();
      await _engine?.release();
      _engine = null;
      _isInitialized = false;
      _remoteUids.clear();
      _localUid = null;
    } catch (e) {
      debugPrint('Error disposing video call service: $e');
    }
  }
}
