# 🔐 دليل إعداد أسرار GitHub - Spaktok

## نظرة عامة

هذا الدليل يشرح كيفية إعداد جميع الأسرار (Secrets) المطلوبة في GitHub Repository لتشغيل CI/CD Pipeline بنجاح.

---

## 📍 كيفية إضافة الأسرار

1. انتقل إلى مستودع GitHub الخاص بك
2. اذهب إلى: **Settings** → **Secrets and variables** → **Actions**
3. انقر على: **New repository secret**
4. أدخل الاسم والقيمة ثم احفظ

---

## 🎯 الأسرار المطلوبة

### 1️⃣ Agora Secrets (البث المباشر والدردشة)

#### `AGORA_APP_ID`
- **الوصف**: معرف تطبيق Agora الأساسي
- **كيفية الحصول عليه**:
  1. سجّل دخول إلى [Agora Console](https://console.agora.io/)
  2. اختر مشروعك
  3. انسخ App ID من لوحة التحكم
- **مثال**: `a1b2c3d4e5f6g7h8i9j0`
- **مستخدم في**:
  - Flutter build
  - Firebase Functions
  - Cloudflare Workers

#### `AGORA_APP_CERT`
- **الوصف**: شهادة التشفير لإنشاء التوكنات الآمنة
- **كيفية الحصول عليه**:
  1. Agora Console → Project Settings
  2. انقر على "Enable" بجانب Primary Certificate
  3. انسخ القيمة
- **تحذير**: ⚠️ لا تشاركه أبداً
- **مستخدم في**:
  - Firebase Functions (لإنشاء Access Tokens)
  - Cloudflare Workers (للتحقق)

#### `AGORA_CHAT_APP_KEY`
- **الوصف**: مفتاح Agora Chat للرسائل والدردشات
- **كيفية الحصول عليه**:
  1. Agora Console → Products → Chat
  2. أنشئ Chat App أو استخدم موجود
  3. انسخ App Key
- **مثال**: `41234567#890123`
- **مستخدم في**:
  - Flutter app (للدردشة)
  - Backend API

#### `AGORA_APP_NAME` (اختياري)
- **الوصف**: اسم المشروع في Agora
- **القيمة المقترحة**: `spaktok`
- **مستخدم في**: التوثيق والربط الداخلي

#### `AGORA_ORG_NAME` (اختياري)
- **الوصف**: اسم المنظمة في Agora
- **القيمة**: اسم منظمتك المسجل
- **مستخدم في**: SDK Configuration

#### `AGORA_TEMP_TOKEN` (للاختبار فقط)
- **الوصف**: توكن مؤقت للاختبارات
- **كيفية إنشائه**:
  1. Agora Console → Project → Tools
  2. Temp Token Generator
  3. أدخل Channel Name واحصل على Token
- **تحذير**: ⚠️ ينتهي خلال 24 ساعة
- **مستخدم في**: الاختبارات المحلية فقط

---

### 2️⃣ Firebase Secrets

#### `FIREBASE_TOKEN`
- **الوصف**: CI Token لنشر Firebase Functions تلقائياً
- **كيفية الحصول عليه**:
  ```bash
  firebase login:ci
  ```
  - سيفتح متصفح للمصادقة
  - انسخ الـ Token الذي يظهر في Terminal
- **مثال**: `1//0abcdefgHIJKLMnopqrstUVwxyz123456789`
- **مستخدم في**:
  - GitHub Actions: Deploy Firebase Functions
  - Automatic deployments

#### `FIREBASE_PROJECT_ID`
- **الوصف**: معرف مشروع Firebase
- **القيمة**: `spaktok-e7866` (أو معرف مشروعك)
- **كيفية التحقق**:
  ```bash
  firebase projects:list
  ```
- **مستخدم في**:
  - GitHub Actions deployment
  - Firebase CLI commands

#### `FIREBASE_SERVICE_ACCOUNT_SPAKTOK_F7866`
- **الوصف**: حساب الخدمة (Service Account) بصيغة JSON كاملة
- **كيفية الحصول عليه**:
  1. Firebase Console → Project Settings
  2. Service Accounts tab
  3. انقر "Generate new private key"
  4. احفظ الملف JSON
  5. **انسخ محتوى الملف كاملاً** وألصقه كـ Secret
- **تنسيق القيمة**: JSON كامل (مع الأقواس)
  ```json
  {
    "type": "service_account",
    "project_id": "spaktok-e7866",
    "private_key_id": "...",
    "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
    "client_email": "...",
    ...
  }
  ```
- **مستخدم في**:
  - GitHub Actions
  - Firebase Admin SDK initialization
  - Firestore/Storage access

---

### 3️⃣ Docker Secrets

#### `DOCKER_USER`
- **الوصف**: اسم المستخدم في Docker Hub
- **القيمة**: اسم المستخدم الخاص بك
- **مثال**: `spaktok` أو `yourusername`
- **مستخدم في**:
  - Docker login في CI/CD
  - Push images إلى Docker Hub

#### `DOCKER_PAT`
- **الوصف**: Personal Access Token من Docker Hub
- **كيفية إنشائه**:
  1. سجّل دخول إلى [Docker Hub](https://hub.docker.com/)
  2. Account Settings → Security
  3. New Access Token
  4. اختر "Read, Write, Delete" permissions
  5. انسخ الـ Token (يظهر مرة واحدة فقط!)
- **مثال**: `dckr_pat_abcdefghijklmnopqrstuvwxyz123456`
- **مستخدم في**:
  - Docker authentication في GitHub Actions
  - Push/Pull images

---

### 4️⃣ Stripe Secrets

#### `STRIPE_PUBLISHABLE_KEY`
- **الوصف**: المفتاح العام لـ Stripe (للواجهة)
- **كيفية الحصول عليه**:
  1. [Stripe Dashboard](https://dashboard.stripe.com/)
  2. Developers → API keys
  3. انسخ "Publishable key"
- **مثال**: `pk_live_51A1B2C3D4E5F6G7H8I9J0...`
- **مستخدم في**:
  - Flutter app (الدفع من الواجهة)
  - Public payment forms

#### `STRIPE_SECRET_KEY` (للـ Backend)
- **الوصف**: المفتاح السري لـ Stripe
- **كيفية الحصول عليه**:
  - نفس المكان → انسخ "Secret key"
- **مثال**: `sk_live_51A1B2C3D4E5F6G7H8I9J0...`
- **⚠️ تحذير**: لا تستخدمه في Flutter أبداً! فقط Backend
- **مستخدم في**:
  - Firebase Functions
  - Backend API
  - Cloudflare Workers

#### `STRIPE_WEBHOOK_SECRET`
- **الوصف**: سر Webhook للتحقق من أحداث Stripe
- **كيفية الحصول عليه**:
  1. Stripe Dashboard → Developers → Webhooks
  2. أضف endpoint جديد
  3. انسخ "Signing secret"
- **مثال**: `whsec_abc123def456ghi789jkl012`
- **مستخدم في**:
  - Firebase Functions (للتحقق من Webhooks)
  - Payment event processing

---

### 5️⃣ Cloudflare Secrets

#### `CLOUDFLARE_API_TOKEN`
- **الوصف**: API Token لنشر Workers تلقائياً
- **كيفية إنشائه**:
  1. Cloudflare Dashboard → My Profile → API Tokens
  2. Create Token
  3. استخدم template: "Edit Cloudflare Workers"
  4. أو أنشئ Custom Token مع الصلاحيات:
     - Account.Cloudflare Workers Scripts (Edit)
     - Account.Cloudflare Workers KV (Edit)
     - User.User Details (Read)
  5. انسخ الـ Token
- **مثال**: `abcdef1234567890ghijklmnopqrstuv`
- **مستخدم في**:
  - GitHub Actions (لنشر Workers)
  - Wrangler CLI

#### `CLOUDFLARE_ACCOUNT_ID`
- **الوصف**: معرف حسابك في Cloudflare
- **القيمة الحالية**: `b62ed7e1cf0e1dc886f363573bad4bdb`
- **كيفية العثور عليه**:
  - Cloudflare Dashboard → أي مجال → URL يحتوي على Account ID
  - أو: Workers & Pages → Overview → Account ID
- **مستخدم في**:
  - Workers deployment
  - R2/KV/D1 access

#### `CLOUDFLARE_R2_ACCESS_KEY_ID`
- **الوصف**: Access Key لـ R2 Storage
- **كيفية إنشائه**:
  1. Cloudflare Dashboard → R2
  2. Manage R2 API Tokens
  3. Create API Token
  4. انسخ Access Key ID
- **مستخدم في**:
  - Backend R2 access
  - Firebase Functions R2 integration

#### `CLOUDFLARE_R2_SECRET_ACCESS_KEY`
- **الوصف**: Secret Key لـ R2 Storage
- **القيمة**: تظهر مرة واحدة عند الإنشاء
- **⚠️ مهم**: احفظها فوراً، لن تظهر مرة أخرى
- **مستخدم في**:
  - Backend R2 authentication
  - S3-compatible client

#### `CLOUDFLARE_STREAM_API_TOKEN`
- **الوصف**: API Token لـ Cloudflare Stream
- **كيفية إنشائه**:
  1. Cloudflare Dashboard → Stream
  2. API Tokens
  3. Create Token مع Stream permissions
- **مستخدم في**:
  - Video upload
  - Stream playback URLs

---

### 6️⃣ Code Coverage & Quality

#### `CODECOV_TOKEN` (اختياري)
- **الوصف**: توكن لرفع تقارير Code Coverage
- **كيفية الحصول عليه**:
  1. [Codecov.io](https://codecov.io/)
  2. أضف المستودع
  3. انسخ الـ Token
- **مستخدم في**:
  - GitHub Actions (رفع coverage reports)
  - Code quality tracking

---

## 📋 قائمة مراجعة الأسرار

استخدم هذه القائمة للتأكد من إضافة جميع الأسرار:

### أساسية (مطلوبة للعمل):
- [ ] `AGORA_APP_ID`
- [ ] `AGORA_APP_CERT`
- [ ] `AGORA_CHAT_APP_KEY`
- [ ] `FIREBASE_TOKEN`
- [ ] `FIREBASE_PROJECT_ID`
- [ ] `FIREBASE_SERVICE_ACCOUNT_SPAKTOK_F7866`
- [ ] `DOCKER_USER`
- [ ] `DOCKER_PAT`
- [ ] `STRIPE_PUBLISHABLE_KEY`
- [ ] `STRIPE_SECRET_KEY`

### إضافية (موصى بها):
- [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] `CLOUDFLARE_API_TOKEN`
- [ ] `CLOUDFLARE_ACCOUNT_ID`
- [ ] `CLOUDFLARE_R2_ACCESS_KEY_ID`
- [ ] `CLOUDFLARE_R2_SECRET_ACCESS_KEY`
- [ ] `CLOUDFLARE_STREAM_API_TOKEN`

### اختيارية (للتحسينات):
- [ ] `AGORA_APP_NAME`
- [ ] `AGORA_ORG_NAME`
- [ ] `AGORA_TEMP_TOKEN`
- [ ] `CODECOV_TOKEN`

---

## 🔧 كيفية اختبار الأسرار

### 1. اختبار محلي (قبل الرفع)

أنشئ ملف `.env.test` محلياً:
```bash
# Agora
AGORA_APP_ID=your_app_id
AGORA_APP_CERT=your_cert
AGORA_CHAT_APP_KEY=your_chat_key

# Firebase
FIREBASE_PROJECT_ID=spaktok-e7866

# Stripe
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Cloudflare
CLOUDFLARE_ACCOUNT_ID=b62ed7e1cf0e1dc886f363573bad4bdb
```

### 2. اختبار GitHub Actions

بعد إضافة الأسرار:
1. اعمل Push لأي تغيير
2. راقب GitHub Actions tab
3. تحقق من أن الـ Jobs تعمل بنجاح

---

## 🚨 أمان الأسرار

### ✅ أفضل الممارسات:

1. **لا تكتب الأسرار في الكود أبداً**
   ```javascript
   // ❌ خطأ
   const apiKey = "sk_live_abc123"
   
   // ✅ صحيح
   const apiKey = process.env.STRIPE_SECRET_KEY
   ```

2. **استخدم أسرار مختلفة للتطوير والإنتاج**
   - `pk_test_...` للتطوير
   - `pk_live_...` للإنتاج

3. **دوّر (Rotate) الأسرار بانتظام**
   - كل 90 يوم للأسرار الحساسة
   - فوراً إذا تم تسريبها

4. **لا تشارك الأسرار عبر البريد أو Slack**
   - استخدم GitHub Secrets فقط
   - أو مدير كلمات السر آمن

5. **راجع الوصول بانتظام**
   - GitHub Settings → Actions → Check permissions

---

## 🔄 تحديث الأسرار

إذا احتجت لتحديث سر:

1. GitHub Repo → Settings → Secrets → Actions
2. اختر السر المراد تحديثه
3. انقر "Update secret"
4. أدخل القيمة الجديدة
5. احفظ

**ملاحظة**: GitHub Actions ستستخدم القيمة الجديدة في أول Run بعد التحديث.

---

## 🆘 استكشاف الأخطاء

### خطأ: "Secret not found"
- **السبب**: لم تضف السر في GitHub
- **الحل**: أضفه كما موضح أعلاه

### خطأ: "Authentication failed"
- **السبب**: القيمة غير صحيحة أو منتهية
- **الحل**: تحقق من القيمة وحدثها

### خطأ: "Permission denied"
- **السبب**: Token لا يملك الصلاحيات الكافية
- **الحل**: أنشئ token جديد مع الصلاحيات المطلوبة

### خطأ: Docker login failed
- **السبب**: `DOCKER_USER` أو `DOCKER_PAT` خاطئ
- **الحل**:
  1. تحقق من اسم المستخدم
  2. أنشئ PAT جديد من Docker Hub

### خطأ: Firebase deployment failed
- **السبب**: `FIREBASE_TOKEN` منتهي
- **الحل**:
  ```bash
  firebase login:ci
  # احصل على token جديد وحدثه في GitHub
  ```

---

## 📞 دعم إضافي

إذا واجهت مشاكل:

1. **تحقق من Logs في GitHub Actions**
   - Actions tab → اختر الـ Workflow الفاشل
   - اقرأ الأخطاء بدقة

2. **راجع الوثائق الرسمية**:
   - [GitHub Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
   - [Agora Docs](https://docs.agora.io/)
   - [Firebase Docs](https://firebase.google.com/docs)
   - [Stripe Docs](https://stripe.com/docs)
   - [Cloudflare Docs](https://developers.cloudflare.com/)

3. **تحقق من ملفات `.env.example`**
   - `backend/.env.example`
   - `functions/.env` (موجود بالفعل)
   - `cloudflare/workers/.dev.vars.example`

---

## ✅ بعد إعداد جميع الأسرار

1. **اختبر CI/CD Pipeline**:
   ```bash
   git add .
   git commit -m "test: verify secrets configuration"
   git push
   ```

2. **راقب GitHub Actions**:
   - يجب أن تمر جميع الـ Jobs بنجاح ✅

3. **تحقق من النشر**:
   - Firebase Functions deployed ✅
   - Docker image pushed ✅
   - Tests passed ✅

---

**آخر تحديث**: نوفمبر 15, 2025  
**الحالة**: 🟢 جاهز للاستخدام

🎉 بعد إعداد جميع الأسرار، سيعمل CI/CD Pipeline تلقائياً!
