import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

class EphemeralChatService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;

  // 1. منطق المحادثات الزائلة (Ephemeral Messaging)
  // الرسائل الزائلة هي رسائل يتم حذفها تلقائيًا بعد فترة زمنية أو بعد المشاهدة.

  Future<void> sendEphemeralMessage({
    required String receiverId,
    required String message,
    required bool isEphemeral,
    required int lifespanSeconds, // كم ثانية ستبقى الرسالة قبل الحذف
  }) async {
    final String currentUserId = _auth.currentUser!.uid;
    final Timestamp timestamp = Timestamp.now();

    // إنشاء رسالة جديدة
    final messageData = {
      'senderId': currentUserId,
      'receiverId': receiverId,
      'message': message,
      'timestamp': timestamp,
      'isEphemeral': isEphemeral,
      'lifespanSeconds': isEphemeral ? lifespanSeconds : null,
      'isViewed': false,
      'deletedAt': isEphemeral ? timestamp.toDate().add(Duration(seconds: lifespanSeconds)) : null,
    };

    // حفظ الرسالة في مسار المحادثة بين المستخدمين
    List<String> ids = [currentUserId, receiverId];
    ids.sort();
    String chatRoomId = ids.join('_');

    await _firestore.collection('chat_rooms').doc(chatRoomId).collection('messages').add(messageData);
  }

  // دالة لحذف الرسائل المنتهية الصلاحية (يجب استدعاؤها من Cloud Function)
  // هنا نضع المنطق الذي يجب أن يتم تنفيذه على الخادم
  // Cloud Function: onMessageCreate -> Set a scheduled task to delete the message.
  // For the client-side, we'll only provide the read logic.

  // 2. منطق مؤشر الكتابة (Typing Indicator)
  // تحديث حالة المستخدم في الوقت الحقيقي

  Future<void> updateTypingStatus({
    required String receiverId,
    required bool isTyping,
  }) async {
    final String currentUserId = _auth.currentUser!.uid;

    // مسار حالة الدردشة (يمكن أن يكون في وثيقة واحدة لكل محادثة)
    List<String> ids = [currentUserId, receiverId];
    ids.sort();
    String chatRoomId = ids.join('_');

    await _firestore.collection('chat_rooms').doc(chatRoomId).set({
      'typingStatus': {
        currentUserId: isTyping,
      },
    }, SetOptions(merge: true));
  }

  // Stream للحصول على حالة الكتابة للطرف الآخر
  Stream<Map<String, dynamic>> getTypingStatusStream(String otherUserId) {
    final String currentUserId = _auth.currentUser!.uid;
    List<String> ids = [currentUserId, otherUserId];
    ids.sort();
    String chatRoomId = ids.join('_');

    return _firestore.collection('chat_rooms').doc(chatRoomId).snapshots().map((snapshot) {
      if (!snapshot.exists || snapshot.data() == null || snapshot.data()!['typingStatus'] == null) {
        return {};
      }
      final Map<String, dynamic> typingStatus = snapshot.data()!['typingStatus'];
      // إرجاع حالة الكتابة للطرف الآخر فقط
      return {
        'isTyping': typingStatus[otherUserId] ?? false,
      };
    });
  }

  // 3. منطق إشعار لقطة الشاشة (Screenshot Detection)
  // على الرغم من وجود حزمة `flutter_screenshot_detect`، يجب ربطها بخدمة الإشعارات.

  Future<void> notifyScreenshot({
    required String receiverId,
  }) async {
    final String currentUserId = _auth.currentUser!.uid;

    // إرسال إشعار فوري إلى الطرف الآخر عبر Firestore أو Cloud Messaging
    // هنا نستخدم Firestore كطريقة بسيطة للتخزين المؤقت للإشعار
    await _firestore.collection('user_notifications').doc(receiverId).collection('alerts').add({
      'type': 'screenshot_alert',
      'senderId': currentUserId,
      'timestamp': Timestamp.now(),
      'message': 'لقد التقط المستخدم $currentUserId لقطة شاشة للمحادثة!',
      'isRead': false,
    });
  }
}
