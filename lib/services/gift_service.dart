import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:spaktok/lib/models/gift.dart';

class GiftService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  // جلب قائمة الهدايا المتاحة
  Future<List<Gift>> getAvailableGifts() async {
    try {
      final QuerySnapshot snapshot = await _firestore.collection('gifts').get();
      return snapshot.docs.map((doc) => Gift.fromJson(doc.data() as Map<String, dynamic>)).toList();
    } catch (e) {
      print('Error getting gifts: $e');
      return [];
    }
  }

  // إرسال هدية (هذه الوظيفة ستتطلب تكاملًا مع Firebase Functions لمعالجة تقسيم الإيرادات)
  Future<void> sendGift({
    required String senderUid,
    required String receiverUid,
    required Gift gift,
  }) async {
    try {
      // هنا، سنقوم باستدعاء Firebase Function لمعالجة منطق إرسال الهدية وتقسيم الإيرادات
      // هذا مجرد مثال، ستحتاج إلى تنفيذ وظيفة Firebase الفعلية
      await _firestore.collection('giftTransactions').add({
        'senderUid': senderUid,
        'receiverUid': receiverUid,
        'giftId': gift.id,
        'giftValue': gift.value,
        'timestamp': FieldValue.serverTimestamp(),
        'status': 'pending_processing', // سيتم تحديثه بواسطة Firebase Function
      });
      print('Gift sent successfully to $receiverUid');
    } catch (e) {
      print('Error sending gift: $e');
      rethrow;
    }
  }
}

