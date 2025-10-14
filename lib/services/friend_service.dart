
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth';

class FriendService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;

  Future<void> sendFriendRequest(String recipientUserId) async {
    final currentUserId = _auth.currentUser?.uid;
    if (currentUserId == null) throw Exception('User not authenticated');

    if (currentUserId == recipientUserId) {
      throw Exception('Cannot send friend request to yourself');
    }

    // Check if a request already exists or if they are already friends
    final existingRequest = await _firestore
        .collection('friend_requests')
        .where('senderId', isEqualTo: currentUserId)
        .where('recipientId', isEqualTo: recipientUserId)
        .get();

    final existingFriendship = await _firestore
        .collection('friends')
        .doc(currentUserId)
        .collection('user_friends')
        .doc(recipientUserId)
        .get();

    if (existingRequest.docs.isNotEmpty || existingFriendship.exists) {
      throw Exception('Friend request already sent or users are already friends');
    }

    await _firestore.collection('friend_requests').add({
      'senderId': currentUserId,
      'recipientId': recipientUserId,
      'status': 'pending',
      'timestamp': Timestamp.now(),
    });
  }

  Stream<List<Map<String, dynamic>>> getPendingFriendRequests() {
    final currentUserId = _auth.currentUser?.uid;
    if (currentUserId == null) throw Exception('User not authenticated');

    return _firestore
        .collection('friend_requests')
        .where('recipientId', isEqualTo: currentUserId)
        .where('status', isEqualTo: 'pending')
        .snapshots()
        .map((snapshot) => snapshot.docs.map((doc) => {
              'id': doc.id,
              'senderId': doc['senderId'],
              'timestamp': doc['timestamp'],
            }).toList());
  }

  Future<void> acceptFriendRequest(String requestId, String senderId) async {
    final currentUserId = _auth.currentUser?.uid;
    if (currentUserId == null) throw Exception('User not authenticated');

    // Update request status
    await _firestore.collection('friend_requests').doc(requestId).update({
      'status': 'accepted',
      'acceptedAt': Timestamp.now(),
    });

    // Add to friends list for both users
    await _firestore.collection('friends').doc(currentUserId).collection('user_friends').doc(senderId).set({
      'friendId': senderId,
      'addedAt': Timestamp.now(),
    });
    await _firestore.collection('friends').doc(senderId).collection('user_friends').doc(currentUserId).set({
      'friendId': currentUserId,
      'addedAt': Timestamp.now(),
    });
  }

  Future<void> declineFriendRequest(String requestId) async {
    await _firestore.collection('friend_requests').doc(requestId).update({
      'status': 'declined',
      'declinedAt': Timestamp.now(),
    });
  }

  Stream<List<Map<String, dynamic>>> getFriends() {
    final currentUserId = _auth.currentUser?.uid;
    if (currentUserId == null) throw Exception('User not authenticated');

    return _firestore
        .collection('friends')
        .doc(currentUserId)
        .collection('user_friends')
        .snapshots()
        .map((snapshot) => snapshot.docs.map((doc) => {
              'id': doc.id,
              'friendId': doc['friendId'],
              'addedAt': doc['addedAt'],
            }).toList());
  }
}

