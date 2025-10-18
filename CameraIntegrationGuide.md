# دليل دمج الكاميرا المتقدمة والفلاتر في Spaktok

هذا الدليل يقدم الإرشادات اللازمة لدمج ميزات الكاميرا المتقدمة ومعالجة الفيديو في تطبيق Spaktok، باستخدام حزمتي `camerawesome` و `media_kit`.

## 1. تحديث التبعيات (pubspec.yaml)

تأكد من أن ملف `pubspec.yaml` يحتوي على التبعيات التالية (تم إجراؤها تلقائياً):

```yaml
dependencies:
  # ... التبعيات الحالية
  camera: ^0.11.0+1
  camerawesome: ^2.5.0 # للتحكم المتقدم بالكاميرا والفلاتر
  media_kit: ^1.1.10 # لتشغيل ومعالجة الفيديو
  # ... التبعيات الأخرى
```

بعد التحديث، يجب تشغيل الأمر:

```bash
flutter pub get
```

## 2. دمج شاشة الكاميرا المتقدمة

تم إنشاء الملف `lib/screens/filtered_camera_screen.dart` الذي يحتوي على منطق الكاميرا الأساسي مع تطبيق فلتر أبيض وأسود بسيط (`AwesomeFilter.BlackAndWhite`).

**الخطوات:**

1.  **استبدال شاشة الكاميرا الحالية:** قم بتحديد المكان الذي يتم فيه استدعاء شاشة الكاميرا في تطبيقك (على الأغلب في ملف `main.dart` أو شاشة التنقل الرئيسية) واستبدالها بالآتي:

    ```dart
    // استبدل الاستدعاء القديم لشاشة الكاميرا بـ:
    Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => const FilteredCameraScreen()),
    );
    ```

2.  **تخصيص الفلاتر:** يمكنك تغيير الفلتر المطبق في `FilteredCameraScreen` عن طريق تعديل السطر:

    ```dart
    // في ملف lib/screens/filtered_camera_screen.dart
    filter: AwesomeFilter.BlackAndWhite, // غيّر هذا إلى فلتر آخر
    ```

    يمكنك استخدام فلاتر مدمجة أخرى مثل: `AwesomeFilter.AddictiveRed`, `AwesomeFilter.OldMovie`, `AwesomeFilter.Sepia`.

## 3. دمج شاشة محرر الفيديو

تم إنشاء الملف `lib/screens/video_editor_screen.dart` الذي يحتوي على واجهة محرر فيديو بسيطة باستخدام `media_kit`.

**الخطوات:**

1.  **الربط بعد التسجيل:** بعد أن يقوم المستخدم بتسجيل فيديو في `FilteredCameraScreen`، يجب تمرير مسار الفيديو المسجل إلى شاشة المحرر.

    في دالة `PhotoUI` أو `VideoRecordingUI` داخل `filtered_camera_screen.dart`، يجب تعديل منطق الحفظ لفتح شاشة المحرر:

    ```dart
    // مثال على تعديل في FilteredCameraScreen (بعد التقاط الصورة/الفيديو)
    // يجب تعديل منطق حفظ الصورة/الفيديو لفتح شاشة المحرر:

    // مثال على كيفية فتح شاشة المحرر بعد تسجيل الفيديو:
    // (هذا يحتاج إلى تحديث في منطق Camerawesome)
    
    // في VideoRecordingUI أو PhotoUI، بعد انتهاء عملية الالتقاط:
    final result = await state.when(
      onVideoRecordingMode: (state) => state.stopRecordingAndSave(),
      onPhotoMode: (state) => state.takePhoto(),
      // ...
    );

    if (result != null && result.filePath.endsWith('.mp4')) {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => VideoEditorScreen(videoPath: result.filePath),
        ),
      );
    }
    ```

2.  **تطبيق معالجة الفيديو (FFmpeg):** لتطبيق القص والدمج والفلاتر المتقدمة (كما هو مطلوب لمنافسة TikTok)، ستحتاج إلى استخدام `flutter_ffmpeg` (أو حزمة أخرى) داخل `VideoEditorScreen`.

    *   **مثال على استخدام FFmpeg (يتطلب تثبيت الحزمة المناسبة):**

    ```dart
    // داخل VideoEditorScreenState
    void _applyFilterWithFFmpeg() async {
      // مثال على تطبيق فلتر Sepia باستخدام FFmpeg
      final output = '/path/to/filtered_video.mp4';
      final command = '-i ${widget.videoPath} -vf "colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131" $output';
      
      // يجب استدعاء FFmpegKit.execute(command) هنا
      // (هذا يتطلب تثبيت حزمة FFmpeg المناسبة وإعدادها)
    }
    ```

## 4. متطلبات إضافية

*   **iOS:** تأكد من إضافة إذن استخدام الكاميرا والميكروفون في ملف `Info.plist`:

    ```xml
    <key>NSCameraUsageDescription</key>
    <string>Spaktok needs access to your camera to take photos and videos.</string>
    <key>NSMicrophoneUsageDescription</key>
    <string>Spaktok needs access to your microphone to record videos and for live streaming.</string>
    ```

*   **Android:** تأكد من تحديث `minSdkVersion` في `android/app/build.gradle` إلى 21 أو أعلى.

---
**ملاحظة:** دمج فلاتر الواقع المعزز (AR) يتطلب مكتبات مثل **Google's Sceneform** أو **Apple's ARKit**، والتي تتطلب دمجاً أعمق على مستوى الكود الأصلي (Native Code) أو استخدام حزم Flutter مخصصة للواقع المعزز، وهو خارج نطاق التعديلات البسيطة على ملفات Dart. يوصى باستخدام حلول متكاملة مثل **DeepAR** أو **Banuba SDK** إذا كان التركيز على فلاتر AR المتقدمة.
