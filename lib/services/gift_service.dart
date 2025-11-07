import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:spaktok/models/gift.dart';

class GiftService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  // Fetch available gifts list
  Future<List<Gift>> getAvailableGifts() async {
    try {
      final QuerySnapshot snapshot = await _firestore.collection('gifts').get();
      return snapshot.docs.map((doc) => Gift.fromJson(doc.data() as Map<String, dynamic>)).toList();
    } catch (e) {
      print('Error getting gifts: $e');
      return [];
    }
  }

  // Send gift (this function will require integration with Firebase Functions to handle revenue splitting)
  Future<void> sendGift({
    required String senderUid,
    required String receiverUid,
    required Gift gift,
  }) async {
    try {
      // Here, we will call Firebase Function to handle gift sending logic and revenue splitting
      // This is just an example, you will need to implement the actual Firebase Function
      await _firestore.collection('giftTransactions').add({
        'senderUid': senderUid,
        'receiverUid': receiverUid,
        'giftId': gift.id,
        'giftValue': gift.value,
        'timestamp': FieldValue.serverTimestamp(),
        'status': 'pending_processing', // Will be updated by Firebase Function
      });
      print('Gift sent successfully to $receiverUid');
    } catch (e) {
      print('Error sending gift: $e');
      rethrow;
    }
  }
}

