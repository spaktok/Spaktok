import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:agora_rtc_engine/agora_rtc_engine.dart';

/// Call types
enum CallType {
  audio,
  video,
}

/// Call model
class Call {
  final String id;
  final String channelName;
  final String initiatorId;
  final List<String> participantIds;
  final CallType type;
  final DateTime startTime;
  final DateTime? endTime;
  final String status; // 'active', 'ended'
  final int maxParticipants;

  Call({
    required this.id,
    required this.channelName,
    required this.initiatorId,
    required this.participantIds,
    required this.type,
    required this.startTime,
    this.endTime,
    required this.status,
    this.maxParticipants = 10,
  });

  factory Call.fromMap(Map<String, dynamic> map, String id) {
    return Call(
      id: id,
      channelName: map['channelName'] ?? '',
      initiatorId: map['initiatorId'] ?? '',
      participantIds: List<String>.from(map['participantIds'] ?? []),
      type: CallType.values.firstWhere(
        (e) => e.toString() == 'CallType.${map['type']}',
        orElse: () => CallType.video,
      ),
      startTime: (map['startTime'] as Timestamp).toDate(),
      endTime:
          map['endTime'] != null ? (map['endTime'] as Timestamp).toDate() : null,
      status: map['status'] ?? 'active',
      maxParticipants: map['maxParticipants'] ?? 10,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'channelName': channelName,
      'initiatorId': initiatorId,
      'participantIds': participantIds,
      'type': type.toString().split('.').last,
      'startTime': Timestamp.fromDate(startTime),
      'endTime': endTime != null ? Timestamp.fromDate(endTime!) : null,
      'status': status,
      'maxParticipants': maxParticipants,
    };
  }
}

/// Group Calls Service
/// Handles multi-participant voice/video calls using Agora
class GroupCallsService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;

  static const String agoraAppId = "a41807bba5c144b5b8e1fd5ee711707b";
  static const String agoraToken = "007eJxTYEiJ+bXuRdb2/+r1U3Kus0YXtponyjxlajd7rLFV9PmSjrMKDIkmhhYG5klJiabJhiYmSaZJFqmGaSmmqanmhobmQIn09HsZDYGMDGn7c5gYGSAQxGdl8E3MKy1mYAAAut8gzQ==";

  /// Start a group call
  Future<String> startGroupCall(
    List<String> participantIds,
    CallType type, {
    int maxParticipants = 10,
  }) async {
    final userId = _auth.currentUser?.uid;
    if (userId == null) throw Exception('User not authenticated');

    // Generate unique channel name
    final channelName = 'group_call_${DateTime.now().millisecondsSinceEpoch}';

    final call = Call(
      id: '',
      channelName: channelName,
      initiatorId: userId,
      participantIds: [userId, ...participantIds],
      type: type,
      startTime: DateTime.now(),
      status: 'active',
      maxParticipants: maxParticipants,
    );

    final callRef = await _firestore.collection('group_calls').add(call.toMap());

    // Send notifications to all participants
    for (var participantId in participantIds) {
      await _firestore.collection('notifications').add({
        'userId': participantId,
        'type': 'call_invitation',
        'callId': callRef.id,
        'callType': type.toString().split('.').last,
        'fromUserId': userId,
        'timestamp': Timestamp.now(),
        'read': false,
      });
    }

    return callRef.id;
  }

  /// Join a group call
  Future<void> joinGroupCall(String callId) async {
    final userId = _auth.currentUser?.uid;
    if (userId == null) throw Exception('User not authenticated');

    await _firestore.collection('group_calls').doc(callId).update({
      'participantIds': FieldValue.arrayUnion([userId]),
    });
  }

  /// Leave a group call
  Future<void> leaveGroupCall(String callId) async {
    final userId = _auth.currentUser?.uid;
    if (userId == null) throw Exception('User not authenticated');

    await _firestore.collection('group_calls').doc(callId).update({
      'participantIds': FieldValue.arrayRemove([userId]),
    });

    // Check if call should be ended (no participants left)
    final callDoc = await _firestore.collection('group_calls').doc(callId).get();
    if (callDoc.exists) {
      final participantIds = List<String>.from(callDoc.data()?['participantIds'] ?? []);
      if (participantIds.isEmpty) {
        await endGroupCall(callId);
      }
    }
  }

  /// End a group call
  Future<void> endGroupCall(String callId) async {
    await _firestore.collection('group_calls').doc(callId).update({
      'status': 'ended',
      'endTime': Timestamp.now(),
    });
  }

  /// Get active call
  Stream<Call?> getCall(String callId) {
    return _firestore.collection('group_calls').doc(callId).snapshots().map((doc) {
      if (doc.exists) {
        return Call.fromMap(doc.data()!, doc.id);
      }
      return null;
    });
  }

  /// Get user's active calls
  Stream<List<Call>> getUserActiveCalls() {
    final userId = _auth.currentUser?.uid;
    if (userId == null) throw Exception('User not authenticated');

    return _firestore
        .collection('group_calls')
        .where('participantIds', arrayContains: userId)
        .where('status', isEqualTo: 'active')
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => Call.fromMap(doc.data(), doc.id))
            .toList());
  }

  /// Get call history
  Stream<List<Call>> getCallHistory({int limit = 20}) {
    final userId = _auth.currentUser?.uid;
    if (userId == null) throw Exception('User not authenticated');

    return _firestore
        .collection('group_calls')
        .where('participantIds', arrayContains: userId)
        .orderBy('startTime', descending: true)
        .limit(limit)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => Call.fromMap(doc.data(), doc.id))
            .toList());
  }

  /// Mute/unmute audio
  Future<void> toggleAudio(RtcEngine engine, bool mute) async {
    await engine.muteLocalAudioStream(mute);
  }

  /// Enable/disable video
  Future<void> toggleVideo(RtcEngine engine, bool enable) async {
    await engine.muteLocalVideoStream(!enable);
  }

  /// Switch camera
  Future<void> switchCamera(RtcEngine engine) async {
    await engine.switchCamera();
  }

  /// Set audio profile
  Future<void> setAudioProfile(RtcEngine engine) async {
    await engine.setAudioProfile(
      profile: AudioProfileType.audioProfileMusicHighQuality,
      scenario: AudioScenarioType.audioScenarioChatroom,
    );
  }

  /// Enable speaker
  Future<void> enableSpeaker(RtcEngine engine, bool enable) async {
    await engine.setEnableSpeakerphone(enable);
  }

  /// Get call duration
  Duration getCallDuration(Call call) {
    if (call.endTime != null) {
      return call.endTime!.difference(call.startTime);
    }
    return DateTime.now().difference(call.startTime);
  }

  /// Get call statistics
  Future<Map<String, dynamic>> getCallStatistics(String callId) async {
    final callDoc = await _firestore.collection('group_calls').doc(callId).get();
    if (!callDoc.exists) return {};

    final call = Call.fromMap(callDoc.data()!, callId);
    final duration = getCallDuration(call);

    return {
      'callId': callId,
      'duration': duration.inSeconds,
      'participantCount': call.participantIds.length,
      'type': call.type.toString().split('.').last,
      'startTime': call.startTime.toIso8601String(),
      'endTime': call.endTime?.toIso8601String(),
    };
  }

  /// Record call (if enabled)
  Future<void> startCallRecording(String callId) async {
    await _firestore.collection('group_calls').doc(callId).update({
      'recording': true,
      'recordingStartTime': Timestamp.now(),
    });
  }

  /// Stop call recording
  Future<void> stopCallRecording(String callId) async {
    await _firestore.collection('group_calls').doc(callId).update({
      'recording': false,
      'recordingEndTime': Timestamp.now(),
    });
  }

  /// Invite user to ongoing call
  Future<void> inviteToCall(String callId, String userId) async {
    await _firestore.collection('notifications').add({
      'userId': userId,
      'type': 'call_invitation',
      'callId': callId,
      'fromUserId': _auth.currentUser?.uid,
      'timestamp': Timestamp.now(),
      'read': false,
    });
  }

  /// Block user from call
  Future<void> blockUserFromCall(String callId, String userId) async {
    await _firestore.collection('group_calls').doc(callId).update({
      'participantIds': FieldValue.arrayRemove([userId]),
      'blockedUsers': FieldValue.arrayUnion([userId]),
    });
  }
}
