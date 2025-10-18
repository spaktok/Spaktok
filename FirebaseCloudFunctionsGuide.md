# دليل دمج وظائف Firebase السحابية (Cloud Functions)

تم إنشاء وظيفة Firebase Cloud Function لمعالجة منطق حذف الرسائل الزائلة بشكل آمن على الخادم.

## 1. الوظيفة المنشأة

تم إنشاء الملف `functions/index.js` الذي يحتوي على وظيفتين:

1.  `scheduleEphemeralMessageDeletion`: يتم تشغيلها عند إنشاء رسالة جديدة. مهمتها الأساسية هي وضع علامة على الرسالة للحذف.
2.  `cleanupEphemeralMessages`: هي وظيفة HTTP تقوم بفحص جميع الرسائل الزائلة التي انتهت صلاحيتها وتحذفها.

## 2. خطوات النشر

لجعل هذه الوظيفة تعمل، يجب عليك نشرها على Firebase:

1.  **التأكد من تهيئة Firebase CLI:**
    ```bash
    firebase login
    firebase use --add
    ```
2.  **الانتقال إلى مجلد الوظائف:**
    ```bash
    cd Spaktok/functions
    ```
3.  **نشر الوظائف:**
    ```bash
    firebase deploy --only functions
    ```

## 3. إعداد مهمة Cron لحذف الرسائل

بما أننا استخدمنا وظيفة HTTP (`cleanupEphemeralMessages`) لحذف الرسائل، يجب عليك إعداد مهمة Cron خارجية لتشغيل هذه الوظيفة بانتظام (مثل كل 5 دقائق).

**الخطوات المقترحة:**

1.  **الحصول على عنوان URL للوظيفة:** بعد النشر، ستحصل على عنوان URL للوظيفة `cleanupEphemeralMessages` (مثال: `https://YOUR_REGION-YOUR_PROJECT_ID.cloudfunctions.net/cleanupEphemeralMessages`).
2.  **استخدام خدمة جدولة خارجية:** استخدم خدمة مثل **Google Cloud Scheduler** أو **Cron-job.org** أو **UptimeRobot** لجدولة طلب HTTP (GET أو POST) إلى عنوان URL هذا كل فترة زمنية محددة (مثل كل 5 دقائق).

---
**الخطوة التالية:** تنفيذ منطق تحرير الفيديو الفعلي (القص والتحويل) باستخدام FFmpeg.
