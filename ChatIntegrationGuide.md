# دليل دمج ميزات المحادثات الزائلة والمؤشرات في Spaktok

هذا الدليل يوضح كيفية دمج ميزات المحادثات الزائلة (Ephemeral Messaging) ومؤشرات الكتابة (Typing Indicators) وإشعارات لقطة الشاشة (Screenshot Detection) في تطبيق Spaktok، بالاعتماد على خدمة `EphemeralChatService` التي تم إنشاؤها.

## 1. خدمة المحادثات الزائلة (`EphemeralChatService`)

تم إنشاء الملف `lib/services/ephemeral_chat_service.dart` الذي يحتوي على المنطق اللازم لإدارة هذه الميزات باستخدام Firebase Firestore.

### 1.1. إرسال رسالة زائلة

لاستخدام هذه الميزة، يجب استدعاء الدالة `sendEphemeralMessage` من داخل واجهة الدردشة:

```dart
import 'package:spaktok/services/ephemeral_chat_service.dart';

final chatService = EphemeralChatService();

// مثال على إرسال رسالة نصية زائلة تختفي بعد 10 ثوانٍ
chatService.sendEphemeralMessage(
  receiverId: 'TARGET_USER_ID',
  message: 'هذه رسالة ستختفي!',
  isEphemeral: true,
  lifespanSeconds: 10,
);
```

**ملاحظة هامة:** لضمان حذف الرسائل من قاعدة بيانات Firestore بشكل فعلي بعد انتهاء صلاحيتها، يجب عليك إعداد **Firebase Cloud Function** تعمل بشكل دوري (Cron Job) أو يتم تشغيلها عند إنشاء الرسالة لمراقبة حقل `deletedAt` وحذف الوثائق المنتهية الصلاحية.

## 2. مؤشرات الكتابة (Typing Indicators)

لإضافة ميزة "يكتب الآن..."، يجب استخدام دالتين:

### 2.1. تحديث حالة الكتابة

يجب استدعاء الدالة `updateTypingStatus` عند تغيير حقل إدخال النص في الدردشة:

```dart
// عند بدء الكتابة
chatService.updateTypingStatus(
  receiverId: 'TARGET_USER_ID',
  isTyping: true,
);

// عند التوقف عن الكتابة أو إرسال الرسالة
chatService.updateTypingStatus(
  receiverId: 'TARGET_USER_ID',
  isTyping: false,
);
```

### 2.2. عرض مؤشر الكتابة

لعرض المؤشر، يجب الاستماع إلى تدفق الحالة باستخدام `getTypingStatusStream`:

```dart
StreamBuilder<Map<String, dynamic>>(
  stream: chatService.getTypingStatusStream('TARGET_USER_ID'),
  builder: (context, snapshot) {
    if (snapshot.hasData && snapshot.data!['isTyping'] == true) {
      return const Text('يكتب الآن...', style: TextStyle(color: Colors.green));
    }
    return const SizedBox.shrink();
  },
)
```

## 3. إشعار لقطة الشاشة (Screenshot Detection)

لقد تم بالفعل تضمين حزمة `flutter_screenshot_detect` في المشروع. يجب ربط هذه الحزمة بخدمة الإشعارات التي تم إنشاؤها:

### 3.1. دمج الكشف عن لقطة الشاشة

في واجهة الدردشة (Chat Screen)، قم بتهيئة مستمع لقطة الشاشة واستدعاء الدالة `notifyScreenshot`:

```dart
import 'package:flutter_screenshot_detect/flutter_screenshot_detect.dart';

// ... داخل حالة واجهة الدردشة (StatefulWidget)

@override
void initState() {
  super.initState();
  FlutterScreenshotDetect.detectScreenshot.listen((isDetected) {
    if (isDetected) {
      _handleScreenshotDetected();
    }
  });
}

void _handleScreenshotDetected() {
  // استدعاء خدمة الإشعارات
  EphemeralChatService().notifyScreenshot(
    receiverId: 'TARGET_USER_ID',
  );
  
  // يمكن إضافة تنبيه للمستخدم الحالي
  ScaffoldMessenger.of(context).showSnackBar(
    const SnackBar(content: Text('تم إرسال تنبيه للطرف الآخر بالتقاط لقطة شاشة!')),
  );
}
```

**تنبيه:** يجب التأكد من أن الطرف الآخر لديه آلية للاستماع إلى تنبيهات لقطة الشاشة عبر تدفق Firestore في مسار `user_notifications`.

---
**الخطوة التالية:** الانتقال إلى تحسينات البث المباشر (Agora).
