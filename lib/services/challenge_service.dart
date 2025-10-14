import 'package:cloud_firestore/cloud_firestore.dart';

class ChallengeService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  // Create a new challenge
  Future<String> createChallenge({
    required String title,
    required String description,
    required String creatorId,
    required String hashtag,
    String? musicId,
    DateTime? endDate,
  }) async {
    try {
      final challengeRef = await _firestore.collection('challenges').add({
        'title': title,
        'description': description,
        'creatorId': creatorId,
        'hashtag': hashtag.toLowerCase(),
        'musicId': musicId,
        'participantCount': 0,
        'viewCount': 0,
        'likeCount': 0,
        'createdAt': FieldValue.serverTimestamp(),
        'endDate': endDate,
        'isActive': true,
      });

      return challengeRef.id;
    } catch (e) {
      print('Error creating challenge: $e');
      rethrow;
    }
  }

  // Join a challenge
  Future<void> joinChallenge(String challengeId, String userId, String postId) async {
    try {
      final batch = _firestore.batch();

      // Add user to challenge participants
      final participantRef = _firestore
          .collection('challenges')
          .doc(challengeId)
          .collection('participants')
          .doc(userId);

      batch.set(participantRef, {
        'userId': userId,
        'postId': postId,
        'joinedAt': FieldValue.serverTimestamp(),
      });

      // Update challenge participant count
      final challengeRef = _firestore.collection('challenges').doc(challengeId);
      batch.update(challengeRef, {
        'participantCount': FieldValue.increment(1),
      });

      await batch.commit();
    } catch (e) {
      print('Error joining challenge: $e');
      rethrow;
    }
  }

  // Get trending challenges
  Future<List<Map<String, dynamic>>> getTrendingChallenges({int limit = 20}) async {
    try {
      final querySnapshot = await _firestore
          .collection('challenges')
          .where('isActive', isEqualTo: true)
          .orderBy('participantCount', descending: true)
          .limit(limit)
          .get();

      return querySnapshot.docs
          .map((doc) => {
                'id': doc.id,
                ...doc.data(),
              })
          .toList();
    } catch (e) {
      print('Error getting trending challenges: $e');
      return [];
    }
  }

  // Get challenge details
  Future<Map<String, dynamic>?> getChallengeDetails(String challengeId) async {
    try {
      final doc = await _firestore.collection('challenges').doc(challengeId).get();

      if (doc.exists) {
        return {
          'id': doc.id,
          ...doc.data()!,
        };
      }
      return null;
    } catch (e) {
      print('Error getting challenge details: $e');
      return null;
    }
  }

  // Get challenge participants
  Stream<QuerySnapshot> getChallengeParticipants(String challengeId) {
    return _firestore
        .collection('challenges')
        .doc(challengeId)
        .collection('participants')
        .orderBy('joinedAt', descending: true)
        .snapshots();
  }

  // Update challenge stats
  Future<void> updateChallengeStats(
    String challengeId, {
    int? viewIncrement,
    int? likeIncrement,
  }) async {
    try {
      final updates = <String, dynamic>{};

      if (viewIncrement != null) {
        updates['viewCount'] = FieldValue.increment(viewIncrement);
      }

      if (likeIncrement != null) {
        updates['likeCount'] = FieldValue.increment(likeIncrement);
      }

      if (updates.isNotEmpty) {
        await _firestore.collection('challenges').doc(challengeId).update(updates);
      }
    } catch (e) {
      print('Error updating challenge stats: $e');
    }
  }

  // End a challenge
  Future<void> endChallenge(String challengeId) async {
    try {
      await _firestore.collection('challenges').doc(challengeId).update({
        'isActive': false,
        'endedAt': FieldValue.serverTimestamp(),
      });
    } catch (e) {
      print('Error ending challenge: $e');
      rethrow;
    }
  }

  // Search challenges
  Future<List<Map<String, dynamic>>> searchChallenges(String query) async {
    try {
      final querySnapshot = await _firestore
          .collection('challenges')
          .where('isActive', isEqualTo: true)
          .where('title', isGreaterThanOrEqualTo: query)
          .where('title', isLessThanOrEqualTo: query + '\uf8ff')
          .limit(10)
          .get();

      return querySnapshot.docs
          .map((doc) => {
                'id': doc.id,
                ...doc.data(),
              })
          .toList();
    } catch (e) {
      print('Error searching challenges: $e');
      return [];
    }
  }
}
