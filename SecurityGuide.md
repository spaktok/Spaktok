# دليل الأمان واللغات المتعددة (L10n) في Spaktok

هذا الدليل يوضح كيفية معالجة النواقص التقنية العامة المتمثلة في أمان المفاتيح السرية وإعادة تفعيل دعم اللغات المتعددة (Internationalization).

## 1. أمان المفاتيح السرية (Secret Key Management)

لقد تم تحديد أن المفاتيح السرية (مثل مفتاح Stripe السري) يتم تخزينها في ملفات البيئة المحلية (`backend/.env`) أو قد تكون موجودة في الكود المصدري، وهو ما يمثل خطراً أمنياً كبيراً.

**التوصيات والحلول:**

### 1.1. تخزين المفاتيح في الخلفية (Backend)

*   **المفاتيح السرية (مثل Stripe Secret Key):**
    *   **يجب** أن تبقى في بيئة الخادم (Backend) فقط، مثل **Firebase Cloud Functions** أو خادمك الخاص.
    *   **يجب** عدم إرسالها إلى تطبيق العميل (Flutter App) تحت أي ظرف.
    *   **الحل:** يجب أن تتم جميع المعاملات الحساسة (مثل إنشاء قصد الدفع) على الخادم (Cloud Functions) الذي يستخدم المفتاح السري، ويتم تمرير المفتاح العام (Publishable Key) فقط إلى تطبيق Flutter.

### 1.2. تخزين المفاتيح العامة (Public Keys)

*   **المفاتيح العامة (مثل Agora App ID, Stripe Publishable Key):**
    *   يمكن تخزينها بأمان نسبي في تطبيق Flutter.
    *   **الحل الأفضل:** استخدام حزمة `flutter_secure_storage` لتخزينها في مساحة تخزين آمنة على الجهاز (Keychain في iOS، و Keystore في Android).

**مثال على استخدام `flutter_secure_storage`:**

```dart
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureStorage {
  final _storage = const FlutterSecureStorage();

  // حفظ مفتاح Agora App ID
  Future<void> saveAgoraAppId(String id) async {
    await _storage.write(key: 'agora_app_id', value: id);
  }

  // قراءة مفتاح Agora App ID
  Future<String?> getAgoraAppId() async {
    return await _storage.read(key: 'agora_app_id');
  }
}
```

## 2. إعادة تفعيل دعم اللغات المتعددة (L10n)

أشار تقريرك السابق إلى أن دعم اللغات المتعددة قد تم تعطيله بسبب مشاكل في `AppLocalizations`. لإعادة تفعيل هذه الميزة بشكل صحيح، يجب اتباع الخطوات التالية:

### 2.1. تفعيل أدوات التوليد

تأكد من تفعيل توليد ملفات التعريب في `pubspec.yaml`:

```yaml
flutter:
  generate: true # تأكد من أن هذا السطر موجود ومفعل
```

### 2.2. إعداد ملفات ARB

1.  **إنشاء ملفات التعريب:** قم بإنشاء مجلد `l10n` في جذر المشروع.
2.  **ملف اللغة الافتراضية (الإنجليزية):** أنشئ ملف `app_en.arb` وقم بتعريف السلاسل النصية:

    ```json
    {
      "@@locale": "en",
      "appName": "Spaktok",
      "@appName": {
        "description": "The name of the application"
      },
      "welcomeMessage": "Welcome to Spaktok!",
      "@welcomeMessage": {
        "description": "A welcome message for the user"
      }
    }
    ```

3.  **ملف اللغة العربية:** أنشئ ملف `app_ar.arb` وقم بترجمة السلاسل النصية:

    ```json
    {
      "@@locale": "ar",
      "appName": "سباكتوك",
      "welcomeMessage": "أهلاً بك في سباكتوك!",
      "liveStream": "بث مباشر"
    }
    ```

### 2.3. توليد الكود

بعد إنشاء الملفات، قم بتشغيل:

```bash
flutter gen-l10n
```

سيقوم هذا الأمر بتوليد ملف `app_localizations.dart` الذي يحتوي على فئة `AppLocalizations` التي يمكنك استخدامها في جميع أنحاء تطبيقك.

### 2.4. استخدام التعريب في الكود

استخدم الكود المولد في واجهات التطبيق:

```dart
import 'package:flutter_gen/gen_l10n/app_localizations.dart';

// ...

Text(AppLocalizations.of(context)!.welcomeMessage),
// سيظهر النص: "Welcome to Spaktok!" أو "أهلاً بك في سباكتوك!" بناءً على لغة الجهاز.
```

---
**الخطوة النهائية:** تجميع جميع التغييرات والتعليمات وتقديمها للمستخدم.
