import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:spaktok/services/auth_service.dart';

class StreamService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final AuthService _authService = AuthService();

  // Create a new live stream
  Future<String> createStream({
    required String title,
    required String channelName,
    String? description,
    String? thumbnailUrl,
  }) async {
    try {
      final user = _authService.currentUser;
      if (user == null) {
        throw Exception('User must be logged in to create a stream');
      }

      final streamDoc = await _firestore.collection('streams').add({
        'title': title,
        'description': description ?? '',
        'channelName': channelName,
        'hostId': user.uid,
        'hostName': user.displayName ?? 'Anonymous',
        'hostPhotoUrl': user.photoURL,
        'thumbnailUrl': thumbnailUrl,
        'viewerCount': 0,
        'isLive': true,
        'createdAt': FieldValue.serverTimestamp(),
        'startedAt': FieldValue.serverTimestamp(),
        'endedAt': null,
      });

      return streamDoc.id;
    } catch (e) {
      throw Exception('Failed to create stream: $e');
    }
  }

  // End a live stream
  Future<void> endStream(String streamId) async {
    try {
      await _firestore.collection('streams').doc(streamId).update({
        'isLive': false,
        'endedAt': FieldValue.serverTimestamp(),
      });
    } catch (e) {
      throw Exception('Failed to end stream: $e');
    }
  }

  // Join a stream as a viewer
  Future<void> joinStream(String streamId) async {
    try {
      await _firestore.collection('streams').doc(streamId).update({
        'viewerCount': FieldValue.increment(1),
      });
    } catch (e) {
      throw Exception('Failed to join stream: $e');
    }
  }

  // Leave a stream
  Future<void> leaveStream(String streamId) async {
    try {
      await _firestore.collection('streams').doc(streamId).update({
        'viewerCount': FieldValue.increment(-1),
      });
    } catch (e) {
      throw Exception('Failed to leave stream: $e');
    }
  }

  // Get live streams
  Stream<QuerySnapshot> getLiveStreams() {
    return _firestore
        .collection('streams')
        .where('isLive', isEqualTo: true)
        .orderBy('startedAt', descending: true)
        .snapshots();
  }

  // Get stream by ID
  Future<DocumentSnapshot> getStream(String streamId) async {
    try {
      return await _firestore.collection('streams').doc(streamId).get();
    } catch (e) {
      throw Exception('Failed to get stream: $e');
    }
  }

  // Send a message in stream chat
  Future<void> sendStreamMessage({
    required String streamId,
    required String message,
  }) async {
    try {
      final user = _authService.currentUser;
      if (user == null) {
        throw Exception('User must be logged in to send messages');
      }

      await _firestore
          .collection('streams')
          .doc(streamId)
          .collection('messages')
          .add({
        'userId': user.uid,
        'userName': user.displayName ?? 'Anonymous',
        'userPhotoUrl': user.photoURL,
        'message': message,
        'timestamp': FieldValue.serverTimestamp(),
      });
    } catch (e) {
      throw Exception('Failed to send message: $e');
    }
  }

  // Get stream messages
  Stream<QuerySnapshot> getStreamMessages(String streamId) {
    return _firestore
        .collection('streams')
        .doc(streamId)
        .collection('messages')
        .orderBy('timestamp', descending: false)
        .snapshots();
  }

  // Send a gift
  Future<void> sendGift({
    required String streamId,
    required String giftId,
    required String giftName,
    required int giftValue,
  }) async {
    try {
      final user = _authService.currentUser;
      if (user == null) {
        throw Exception('User must be logged in to send gifts');
      }

      await _firestore
          .collection('streams')
          .doc(streamId)
          .collection('gifts')
          .add({
        'senderId': user.uid,
        'senderName': user.displayName ?? 'Anonymous',
        'giftId': giftId,
        'giftName': giftName,
        'giftValue': giftValue,
        'timestamp': FieldValue.serverTimestamp(),
      });

      // Update stream's total gifts value
      await _firestore.collection('streams').doc(streamId).update({
        'totalGiftsValue': FieldValue.increment(giftValue),
      });
    } catch (e) {
      throw Exception('Failed to send gift: $e');
    }
  }

  // Get stream gifts
  Stream<QuerySnapshot> getStreamGifts(String streamId) {
    return _firestore
        .collection('streams')
        .doc(streamId)
        .collection('gifts')
        .orderBy('timestamp', descending: true)
        .limit(50)
        .snapshots();
  }

  // Report a stream
  Future<void> reportStream({
    required String streamId,
    required String reason,
    String? description,
  }) async {
    try {
      final user = _authService.currentUser;
      if (user == null) {
        throw Exception('User must be logged in to report streams');
      }

      await _firestore.collection('reports').add({
        'type': 'stream',
        'streamId': streamId,
        'reporterId': user.uid,
        'reporterName': user.displayName ?? 'Anonymous',
        'reason': reason,
        'description': description ?? '',
        'status': 'pending',
        'createdAt': FieldValue.serverTimestamp(),
      });
    } catch (e) {
      throw Exception('Failed to report stream: $e');
    }
  }
}
