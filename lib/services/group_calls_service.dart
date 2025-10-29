import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:agora_rtc_engine/agora_rtc_engine.dart';
import 'package:spaktok/services/agora_token_service.dart';
import 'package:spaktok/config/app_config.dart';

// REMOVED: Hardcoded Agora App ID and Token - Now managed by backend

class GroupCallsService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final AgoraTokenService _tokenService = AgoraTokenService.instance;

  enum CallType {
    audio,
    video,
  }

  static class Call {
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
          (e) => e.toString() == 'CallType.' + (map['type'] ?? 'audio'),
          orElse: () => CallType.audio,
        ),
        startTime: DateTime.parse(map['startTime'] ?? DateTime.now().toIso8601String()),
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

  Future<String> initiateGroupCall({
    required List<String> participantIds,
    required CallType type,
  }) async {
    try {
      final callId = _firestore.collection('calls').doc().id;
      final channelName = 'group_call_\';
      
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
      print('[GroupCallsService] Error initiating call: \');
      rethrow;
    }
  }

  Future<String> getTokenForCall({
    required String channelName,
    required int uid,
  }) async {
    try {
      // Request token from backend - ensures secure token generation
      final token = await _tokenService.getToken(
        channelName: channelName,
        uid: uid,
        userId: _auth.currentUser?.uid ?? 'anonymous',
        role: 'publisher',
      );
      return token;
    } catch (e) {
      print('[GroupCallsService] Error getting token: \');
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
      print('[GroupCallsService] Error ending call: \');
      rethrow;
    }
  }
}
