# 🎬 Spaktok - Modern Social Media Platform

<div align="center">

![Spaktok Logo](https://img.shields.io/badge/Spaktok-v1.0.0-purple?style=for-the-badge&logo=flutter)
![Flutter](https://img.shields.io/badge/Flutter-3.16.0-blue?style=for-the-badge&logo=flutter)
![Firebase](https://img.shields.io/badge/Firebase-Integrated-orange?style=for-the-badge&logo=firebase)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**A cutting-edge social media platform with live streaming, stories, reels, and advanced camera features**

[Features](#features) • [Installation](#installation) • [Usage](#usage) • [Contributing](#contributing)

</div>

---

## 📱 About Spaktok

Spaktok is a modern, feature-rich social media application built with Flutter, offering a unique blend of content creation, live streaming, and social interaction capabilities. Inspired by the best features of TikTok and Snapchat, but with a unique design and innovative features.

### ✨ Key Highlights

- 🎥 **HD Live Streaming** with Agora RTC integration
- 📸 **Advanced Camera** with professional filters and effects
- 🎭 **AR Filters & Stickers** for creative content
- 💝 **Virtual Gifts System** with in-app currency
- 🌍 **Multi-language Support** (100+ languages)
- 🔒 **Privacy & Security** focused design
- 📊 **Real-time Analytics** and engagement metrics
- 🎨 **Modern UI/UX** with dark theme

## 🚀 Getting Started

This guide will help you set up and run the Spaktok project on your local machine.

### المتطلبات الأساسية

تأكد من تثبيت ما يلي على جهازك:

*   [Flutter SDK](https://flutter.dev/docs/get-started/install)
*   [Android Studio](https://developer.android.com/studio) (لتطوير Android) أو [Xcode](https://developer.apple.com/xcode/) (لتطوير iOS)
*   [Firebase CLI](https://firebase.google.com/docs/cli) (إذا كنت تخطط لاستخدام Firebase)
*   [معرف تطبيق Agora](https://www.agora.io/en/)

### إعداد المشروع

1.  **استنساخ المستودع (إذا كان متاحًا):**
    ```bash
    git clone <رابط_المستودع_الخاص_بك>
    cd spaktok
    ```
    إذا لم يكن لديك مستودع، يمكنك إنشاء مشروع Flutter جديد ونسخ الملفات إليه:
    ```bash
    flutter create spaktok
    cd spaktok
    # انسخ الملفات المعدلة إلى هذا الدليل
    ```

2.  **تثبيت التبعيات:**
    انتقل إلى دليل المشروع وقم بتشغيل الأمر التالي لتثبيت جميع التبعيات:
    ```bash
    flutter pub get
    ```

3.  **تكوين Agora:**
    افتح ملف `lib/screens/live_stream_screen.dart` واستبدل `"YOUR_AGORA_APP_ID"` و `"YOUR_AGORA_TEMP_TOKEN"` بمعرف تطبيق Agora والرمز المميز المؤقت الخاص بك على التوالي.

    ```dart
    const appId = "YOUR_AGORA_APP_ID"; // استبدل بمعرف تطبيق Agora الخاص بك
    const token = "YOUR_AGORA_TEMP_TOKEN"; // استبدل بالرمز المميز المؤقت الخاص بك (للاختبار)
    ```

4.  **تكوين Firebase (اختياري ولكن موصى به):**
    إذا كنت تخطط لاستخدام Firebase (للمصادقة، قواعد البيانات، إلخ)، فستحتاج إلى تكوين مشروع Firebase الخاص بك.

    *   أنشئ مشروع Firebase جديدًا على [وحدة تحكم Firebase](https://console.firebase.google.com/).
    *   أضف تطبيقات Android و iOS إلى مشروع Firebase الخاص بك واتبع التعليمات لتنزيل ملفات التكوين (`google-services.json` لنظام Android و `GoogleService-Info.plist` لنظام iOS).
    *   ضع `google-services.json` في `android/app/`.
    *   ضع `GoogleService-Info.plist` في `ios/Runner/`.
    *   قم بتشغيل الأمر التالي لإنشاء `firebase_options.dart`:
        ```bash
        flutter pub add firebase_core
        flutterfire configure
        ```

### تشغيل التطبيق

لتشغيل التطبيق على جهاز متصل (محاكي أو جهاز فعلي):

```bash
flutter run
```

لتشغيل التطبيق على الويب:

```bash
flutter run -d web
```

لتشغيل التطبيق على سطح مكتب Linux (بعد تثبيت المتطلبات الأساسية مثل `cmake`, `ninja-build`, `clang`, `libgtk-3-dev`):

```bash
flutter run -d linux
```

## الميزات المنفذة حاليًا

*   **إعداد المشروع الأساسي:** مشروع Flutter جديد مع التبعيات الأساسية.
*   **التوثيق:** ملفات توثيق مفصلة للهندسة المعمارية، مخطط قاعدة البيانات، خطط التطوير الأمامية والخلفية، وتكامل الدفع.
*   **البث المباشر (أساسي):** شاشة بث مباشر أساسية باستخدام Agora RTC Engine، مع دعم الكاميرا والميكروفون.

## الخطوات التالية

1.  تطوير نظام الغرف متعددة المشاركين (2-4 مشاركين).
2.  تطوير نظام الهدايا مع تقسيم الإيرادات (40% للمذيعين).
3.  تنفيذ ميزات الكاميرا المتقدمة (فلاتر Snapchat/TikTok).
4.  بناء نظام الدردشة المتقدم (الرسائل المختفية، مكالمات الفيديو/الصوت).
5.  تكامل نظام الدفع العالمي.
6.  إضافة ميزات اجتماعية (القصص، Reels، الإعجابات، التعليقات).
7.  دعم اللغات المتعددة والميزات الخاصة بالمنطقة.

## المساهمة

نرحب بالمساهمات! يرجى قراءة `CONTRIBUTING.md` للحصول على إرشادات حول كيفية المساهمة في هذا المشروع.

## الترخيص

هذا المشروع مرخص بموجب ترخيص MIT. انظر ملف `LICENSE` للحصول على التفاصيل.
