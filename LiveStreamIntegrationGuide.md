# دليل دمج ميزات البث المباشر المحسنة في Spaktok

هذا الدليل يوضح كيفية دمج التفاعلات المباشرة وإدارة المشرفين في نظام البث المباشر (Agora) باستخدام خدمة `LiveStreamService` التي تم إنشاؤها.

## 1. خدمة البث المباشر (`LiveStreamService`)

تم إنشاء الملف `lib/services/live_stream_service.dart` الذي يحتوي على المنطق اللازم لإدارة التفاعلات وصلاحيات المشرفين باستخدام Firebase Firestore.

## 2. دمج التفاعلات المباشرة (Live Reactions)

لجعل البث المباشر أكثر تفاعلية (مثل TikTok)، يجب على المشاهدين أن يكونوا قادرين على إرسال تفاعلات تظهر على الشاشة.

### 2.1. إرسال التفاعلات

في واجهة المشاهدة (Viewer UI)، قم بإضافة أزرار لإرسال التفاعلات:

```dart
import 'package:spaktok/services/live_stream_service.dart';

final liveService = LiveStreamService();
const String currentChannelId = 'YOUR_AGORA_CHANNEL_ID'; // يجب أن يكون معرف القناة متاحاً

// عند النقر على زر القلب
IconButton(
  icon: const Icon(Icons.favorite),
  onPressed: () {
    liveService.sendReaction(
      channelId: currentChannelId,
      reactionType: 'heart',
    );
  },
),
```

### 2.2. عرض التفاعلات

في واجهة البث المباشر (Host UI و Viewer UI)، يجب الاستماع إلى تدفق التفاعلات وعرضها بطريقة متحركة:

```dart
StreamBuilder<List<Map<String, dynamic>>>(
  stream: liveService.getReactionsStream(currentChannelId),
  builder: (context, snapshot) {
    if (snapshot.hasData) {
      // هنا يجب تطبيق منطق عرض التفاعلات كفقاعات أو قلوب متدفقة على الشاشة
      // مثال بسيط: عرض عدد التفاعلات الأخيرة
      return Text('التفاعلات الأخيرة: ${snapshot.data!.length}');
    }
    return const SizedBox.shrink();
  },
)
```

**ملاحظة فنية:** لعرض التفاعلات بشكل فني (مثل القلوب المتدفقة)، ستحتاج إلى استخدام حركات (Animations) في Flutter، مثل `AnimatedBuilder` أو حزم مخصصة مثل `confetti` أو `particle_animation`، لإنشاء تأثير بصري جذاب.

## 3. إدارة المشرفين (Moderator Management)

هذا المنطق مخصص لمالك القناة (Host) لتعيين وإزالة المشرفين.

### 3.1. تعيين مشرف

في قائمة المشاهدين (Viewer List)، يمكن للمالك تعيين مستخدم كمشرف:

```dart
// عند النقر على مستخدم في قائمة المشاهدين
void _assignUserAsModerator(String userId) {
  liveService.assignModerator(
    channelId: currentChannelId,
    userId: userId,
  );
}
```

### 3.2. حظر مستخدم

يمكن للمشرفين ومالك القناة حظر المستخدمين المخالفين:

```dart
// عند النقر على زر الحظر
void _banUser(String userId, String reason) {
  liveService.banUser(
    channelId: currentChannelId,
    userIdToBan: userId,
    reason: reason,
  );
}
```

### 3.3. عرض المشرفين

يمكن استخدام `getModeratorsStream` لعرض قائمة المشرفين في واجهة الإدارة:

```dart
StreamBuilder<List<String>>(
  stream: liveService.getModeratorsStream(currentChannelId),
  builder: (context, snapshot) {
    if (snapshot.hasData) {
      return Text('المشرفون: ${snapshot.data!.join(', ')}');
    }
    return const SizedBox.shrink();
  },
)
```

---
**الخطوة التالية:** معالجة النواقص التقنية العامة (L10n وأمان المفاتيح السرية).
