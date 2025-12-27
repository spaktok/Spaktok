# 🚀 Quick Start Guide - Spaktok

**Last Updated:** November 8, 2025

---

## ⚠️ **خطوة مهمة أولاً: تشغيل Docker Desktop**

### الخطوة 1: تشغيل Docker Desktop
```
1. افتح تطبيق Docker Desktop
2. انتظر حتى يصبح جاهزاً (الأيقونة تتحول للون الأخضر)
3. تأكد من التشغيل:
```powershell
# قبل أي شيء، تأكد من تشغيل Docker Desktop
# ثم اختبر:
docker ps

# يجب أن ترى: "CONTAINER ID   IMAGE   ..."
# إذا رأيت خطأ، افتح Docker Desktop وانتظر حتى يصبح جاهزاً
```

---

## ⚡ البدء في 3 خطوات

### ✅ الخطوة 1: تأكد من تشغيل Docker

### 1. Clone Repository
```bash
**يجب أن يعمل بدون أخطاء**
git clone https://github.com/spaktok/Spaktok.git
cd Spaktok
```

### 2. Install Dependencies
**مدة البناء:** 5-10 دقائق في المرة الأولى
```bash
### الخطوة 3: افتح التطبيق
**بعد ظهور رسالة "Services are running":**
npm install
cd ..

# Frontend (Flutter)
flutter pub get
```

### 3. Configure Environment
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your credentials
# Or use the defaults for testing
```

### 4. Start Development Servers
```bash
# Terminal 1: Firebase Emulators
firebase emulators:start --only functions,firestore

# Terminal 2: Flutter App
flutter run -d chrome
```

### 5. Test Everything
```bash
# Test Cloud Functions
cd functions
npm test

# Test Flutter App
cd ..
flutter test
```

---

## 🎯 What Works Right Now

✅ **Payment System** - Create PaymentIntent, process webhooks  
✅ **Live Streaming** - Generate Agora tokens, join channels  
✅ **Gift System** - View catalog, send gifts with coins  
✅ **Authentication** - Firebase Auth with email/social  
✅ **Storage** - Firebase Storage for media  
✅ **Database** - Firestore with security rules  

---

## 📱 Test Features

### Payment Flow
1. Open app → Navigate to coins purchase
2. Select a coin package
3. Complete test payment (use Stripe test cards)
4. Coins credited automatically

**Test Card:** `4242 4242 4242 4242`, any future date, any CVC

### Live Streaming
1. Click "Go Live" button
2. Enter stream title
3. Start streaming (camera permission required)
4. Share stream link with viewers
5. Send/receive gifts during stream

### Gift System
1. Open any live stream
2. Click gift icon
3. Browse 3D gift catalog
4. Select gift and send
5. See animation + sound effect

---

## 🐛 Troubleshooting

### Functions Won't Start
```bash
cd functions
npm install
firebase emulators:start --only functions
```

### Flutter App Errors
```bash
flutter clean
flutter pub get
flutter run
```

### Agora Token Fails
Check that `AGORA_APP_ID` is set:
```bash
flutter run --dart-define=AGORA_APP_ID=a41807bba5c144b5b8e1fd5ee711707b
```

### Payment Fails
Ensure Stripe keys are configured in `.env`:
```
STRIPE_SECRET_KEY=sk_test_51SDYFH...
```

---

## 📚 Full Documentation

- **Deployment:** [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- **Security:** [SECURITY_COMPLIANCE.md](SECURITY_COMPLIANCE.md)
- **Architecture:** [REALTIME_EVENT_ARCHITECTURE.md](REALTIME_EVENT_ARCHITECTURE.md)
- **Media Processing:** [MEDIA_PROCESSING_ARCHITECTURE.md](MEDIA_PROCESSING_ARCHITECTURE.md)

---

## 🆘 Need Help?

- **Issues:** https://github.com/spaktok/Spaktok/issues
- **Discussions:** https://github.com/spaktok/Spaktok/discussions
- **Email:** support@spaktok.app

---

**Ready to build the next billion-user platform!** 🚀
