import 'package:cloud_firestore/cloud_firestore.dart';
import 'dart:developer' as developer;
import 'package:firebase_auth/firebase_auth.dart';
import 'package:spaktok/services/agora_token_service.dart';

// REMOVED: Hardcoded Agora App ID and Token - Now managed by backend

enum CallType {
  audio,
  video,
}

class Call {
  final String id;
  final String channelName;
  final String initiatorId;
  final List<String> participantIds;
  final CallType type;
  final DateTime startTime;
  final DateTime? endTime;
  final String status;
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
        (e) => e.toString() == 'CallType.${map['type'] ?? 'audio'}',
        orElse: () => CallType.audio,
      ),
      startTime:
          DateTime.parse(map['startTime'] ?? DateTime.now().toIso8601String()),
      endTime: map['endTime'] != null ? DateTime.parse(map['endTime']) : null,
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
      'startTime': startTime.toIso8601String(),
      'endTime': endTime?.toIso8601String(),
      'status': status,
      'maxParticipants': maxParticipants,
    };
  }
}

class GroupCallsService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final AgoraTokenService _tokenService = AgoraTokenService.instance;

  Future<String> initiateGroupCall({
    required List<String> participantIds,
    required CallType type,
  }) async {
    try {
      final callId = _firestore.collection('calls').doc().id;
      final channelName = 'group_call_$callId';

      final call = Call(
        id: callId,
        channelName: channelName,
        initiatorId: _auth.currentUser?.uid ?? '',
        participantIds: participantIds,
        type: type,
        startTime: DateTime.now(),
        status: 'active',
      );

      await _firestore.collection('calls').doc(callId).set(call.toMap());
      return callId;
    } catch (e) {
      developer.log('[GroupCallsService] Error initiating call: $e',
          name: 'group_calls_service');
      rethrow;
    }
  }

  Future<String> getTokenForCall({
    required String channelName,
    required int uid,
  }) async {
    try {
      // Request token from backend - ensures secure token generation
      final token = await _tokenService.getToken(channelName);
      return token;
    } catch (e) {
      developer.log('[GroupCallsService] Error getting token: $e',
          name: 'group_calls_service');
      rethrow;
    }
  }

  Future<void> endCall(String callId) async {
    try {
      await _firestore.collection('calls').doc(callId).update({
        'status': 'ended',
        'endTime': DateTime.now().toIso8601String(),
      });
    } catch (e) {
      developer.log('[GroupCallsService] Error ending call: $e',
          name: 'group_calls_service');
      rethrow;
    }
  }
}
