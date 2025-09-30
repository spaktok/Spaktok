import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:spaktok/models/chat_message.dart';

class ChatService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  // إرسال رسالة جديدة
  Future<void> sendMessage({
    required String senderId,
    required String receiverId,
    required String content,
    bool isDisappearing = false,
    int? disappearDuration, // بالثواني
  }) async {
    final String messageId = _firestore.collection('chats').doc().id;
    final ChatMessage message = ChatMessage(
      id: messageId,
      senderId: senderId,
      receiverId: receiverId,
      content: content,
      timestamp: Timestamp.now(),
      isDisappearing: isDisappearing,
      disappearDuration: disappearDuration,
    );

    await _firestore
        .collection('chats')
        .doc(messageId)
        .set(message.toJson());
  }

  // جلب رسائل الدردشة بين مستخدمين
  Stream<List<ChatMessage>> getChatMessages(String user1Id, String user2Id) {
    // لتبسيط الأمر، نفترض أن المحادثات بين مستخدمين يتم تخزينها في مجموعة واحدة
    // ويمكن فرزها بناءً على معرفات المرسل والمستقبل.
    // في تطبيق حقيقي، قد يكون لديك مجموعة فرعية لكل محادثة.
    return _firestore
        .collection('chats')
        .where('senderId', whereIn: [user1Id, user2Id])
        .where('receiverId', whereIn: [user1Id, user2Id])
        .orderBy('timestamp', descending: true)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => ChatMessage.fromJson(doc.data()))
            .toList());
  }

  // تحديث حالة الرسالة (مثلاً، تم قراءتها)
  Future<void> updateMessageStatus(String messageId, {bool? isRead}) async {
    final Map<String, dynamic> updates = {};
    if (isRead != null) {
      updates['isRead'] = isRead;
    }
    if (updates.isNotEmpty) {
      await _firestore.collection('chats').doc(messageId).update(updates);
    }
  }

  // حذف رسالة (خاصة بالرسائل المختفية بعد انتهاء المدة)
  Future<void> deleteMessage(String messageId) async {
    await _firestore.collection('chats').doc(messageId).delete();
  }
}

