import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

class LiveStreamService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;

  // 1. منطق تفاعلات البث المباشر (Live Reactions/Gifts)

  // إرسال تفاعل (مثل قلب، إيموجي، إلخ)
  Future<void> sendReaction({
    required String channelId,
    required String reactionType, // مثال: 'heart', 'laugh', 'gift'
  }) async {
    final String currentUserId = _auth.currentUser!.uid;
    final Timestamp timestamp = Timestamp.now();

    final reactionData = {
      'senderId': currentUserId,
      'reactionType': reactionType,
      'timestamp': timestamp,
    };

    // إضافة التفاعل إلى مجموعة التفاعلات الخاصة بالقناة
    await _firestore
        .collection('live_streams')
        .doc(channelId)
        .collection('reactions')
        .add(reactionData);
  }

  // Stream للحصول على التفاعلات الجديدة في الوقت الحقيقي
  Stream<List<Map<String, dynamic>>> getReactionsStream(String channelId) {
    return _firestore
        .collection('live_streams')
        .doc(channelId)
        .collection('reactions')
        .orderBy('timestamp', descending: true)
        .limit(50) // للحد من عدد التفاعلات المعروضة
        .snapshots()
        .map((snapshot) {
      return snapshot.docs.map((doc) => doc.data()).toList();
    });
  }

  // 2. منطق إدارة المشرفين (Moderator Management)

  // تعيين مشرف للقناة
  Future<void> assignModerator({
    required String channelId,
    required String userId,
  }) async {
    // يجب التحقق من أن المستخدم الحالي هو مالك القناة قبل تنفيذ هذا
    await _firestore.collection('live_streams').doc(channelId).update({
      'moderators': FieldValue.arrayUnion([userId]),
    });
  }

  // إزالة مشرف من القناة
  Future<void> removeModerator({
    required String channelId,
    required String userId,
  }) async {
    await _firestore.collection('live_streams').doc(channelId).update({
      'moderators': FieldValue.arrayRemove([userId]),
    });
  }

  // حظر مستخدم من القناة (للمشرفين ومالك القناة)
  Future<void> banUser({
    required String channelId,
    required String userIdToBan,
    required String reason,
  }) async {
    // يجب التحقق من صلاحيات المستخدم الحالي (المشرف أو المالك)
    final banData = {
      'userId': userIdToBan,
      'bannedBy': _auth.currentUser!.uid,
      'reason': reason,
      'timestamp': Timestamp.now(),
    };

    await _firestore
        .collection('live_streams')
        .doc(channelId)
        .collection('banned_users')
        .add(banData);
    
    // يمكن أيضًا إرسال أمر إلى Agora لطرده من القناة (يتطلب دمج Agora RTM)
  }

  // Stream للحصول على قائمة المشرفين
  Stream<List<String>> getModeratorsStream(String channelId) {
    return _firestore.collection('live_streams').doc(channelId).snapshots().map((snapshot) {
      if (!snapshot.exists || snapshot.data() == null || snapshot.data()!['moderators'] == null) {
        return [];
      }
      return List<String>.from(snapshot.data()!['moderators']);
    });
  }
}
