import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:spaktok/models/chat_message.dart';
import 'package:spaktok/services/auth_service.dart';

class LiveStreamService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final AuthService _authService = AuthService();
  final String channelName;

  LiveStreamService({required this.channelName});

  DocumentReference get _streamDocRef => _firestore.collection('live_streams').doc(channelName);

  // --- Stream Management ---
  Future<void> createStream({required String title}) async { /* ... */ }
  Future<void> joinStream() async { /* ... */ }
  Future<void> leaveStream() async { /* ... */ }
  Stream<int> getViewersCount() { /* ... */ return _streamDocRef.snapshots().map((s) => (s.data() as Map<String, dynamic>)?['viewers'] ?? 0); }

  // --- Chat Management ---
  Stream<List<ChatMessage>> getChatMessages() { /* ... */ return Stream.value([]); }
  Future<void> sendChatMessage(String text) async { /* ... */ }

  // --- Battle Management ---

  /// Request a battle with another broadcaster
  Future<void> requestBattle(String opponentId) async {
    await _streamDocRef.update({
      'battle.opponentId': opponentId,
      'battle.status': 'requested',
      'battle.requesterId': _authService.currentUser?.uid,
    });
  }

  /// Accept a battle request
  Future<void> acceptBattle() async {
    await _streamDocRef.update({
      'battle.status': 'active',
      'battle.startTime': FieldValue.serverTimestamp(),
    });
  }

  /// Decline a battle request
  Future<void> declineBattle() async {
    await _streamDocRef.update({'battle': FieldValue.delete()});
  }

  /// End a battle
  Future<void> endBattle() async {
    // In a real app, you would calculate the winner here based on gifts
    await _streamDocRef.update({
        'battle.status': 'ended',
        'battle.endTime': FieldValue.serverTimestamp(),
    });
  }
  
  /// Get the current battle state stream
  Stream<DocumentSnapshot> getBattleStream() {
      return _streamDocRef.snapshots();
  }
}
