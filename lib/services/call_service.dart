import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:spaktok/services/auth_service.dart';
import 'package:spaktok/services/agora_token_service.dart';
import 'package:spaktok/screens/call_screen.dart';
import 'package:agora_rtc_engine/agora_rtc_engine.dart';
import 'dart:developer' as developer;

class CallService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final AuthService _authService = AuthService();
  final AgoraTokenService _tokenService = AgoraTokenService();

  /// Make a call to a target user
  Future<void> makeCall(BuildContext context, {required String targetUserId}) async {
    final currentUser = _authService.currentUser;
    if (currentUser == null) return;

    try {
      final channelName = 'call_${currentUser.uid}_$targetUserId';
      final token = await _tokenService.getToken(channelName);

      final callDoc = _firestore.collection('calls').doc(channelName);
      await callDoc.set({
        'callerId': currentUser.uid,
        'receiverId': targetUserId,
        'channelName': channelName,
        'status': 'dialing',
        'timestamp': FieldValue.serverTimestamp(),
      });

      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => CallScreen(
            channelName: channelName,
            token: token,
            role: ClientRoleType.clientRoleBroadcaster,
          ),
        ),
      );

    } catch (e) {
      // Handle error
      developer.log('Error making call: $e', name: 'call_service');
    }
  }

  /// Listen for incoming calls
  void listenForIncomingCalls(BuildContext context) {
    final currentUser = _authService.currentUser;
    if (currentUser == null) return;

    _firestore
        .collection('calls')
        .where('receiverId', isEqualTo: currentUser.uid)
        .where('status', isEqualTo: 'dialing')
        .snapshots()
        .listen((snapshot) {
      if (snapshot.docs.isNotEmpty) {
        final callData = snapshot.docs.first.data();
        _showIncomingCallDialog(context, callData);
      }
    });
  }

  void _showIncomingCallDialog(BuildContext context, Map<String, dynamic> callData) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        title: const Text('Incoming Call'),
        content: Text('Incoming call from ${callData['callerId']}'),
        actions: [
          TextButton(
            child: const Text('Decline'),
            onPressed: () {
              _firestore.collection('calls').doc(callData['channelName']).update({'status': 'declined'});
              Navigator.of(ctx).pop();
            },
          ),
          TextButton(
            child: const Text('Accept'),
            onPressed: () async {
               Navigator.of(ctx).pop();
               try {
                  final token = await _tokenService.getToken(callData['channelName']);
                   await _firestore.collection('calls').doc(callData['channelName']).update({'status': 'active'});

                   Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => CallScreen(
                        channelName: callData['channelName'],
                        token: token,
                        role: ClientRoleType.clientRoleBroadcaster, // Both are broadcasters in a 1-on-1 call
                      ),
                    ),
                  );
               } catch (e) {
                   developer.log('Error accepting call: $e', name: 'call_service');
               }
            },
          ),
        ],
      ),
    );
  }
}
