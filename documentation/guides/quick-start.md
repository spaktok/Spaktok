# 🚀 Spaktok - Quick Start Guide

**Last Updated**: December 27, 2025

---

## ⚠️ **Important First Step: Start Docker Desktop**

### Step 1: Start Docker Desktop
```
1. Open Docker Desktop application
2. Wait until it's ready (icon turns green)
3. Verify it's running:
```powershell
# Before anything else, make sure Docker Desktop is running
# Then test:
docker ps

# You should see: "CONTAINER ID   IMAGE   ..."
# If you see an error, open Docker Desktop and wait until it's ready
```

---

## ⚡ Quick Start in 3 Steps

### 1. Clone Repository
```bash
git clone https://github.com/spaktok/Spaktok.git
cd Spaktok
```

### 2. Install Dependencies
**Build time:** 5-10 minutes on first run
```bash
# Backend (Node.js)
cd functions
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

---

## 🔥 Immediate Testing (Choose One Platform)

### Option 1: Test Flutter Web App
```bash
flutter run -d chrome
```

### Option 2: Test on Windows Desktop
```bash
flutter run -d windows
```

### Option 3: Test on Android Emulator
```bash
# Start Android emulator first (Android Studio → AVD Manager)
flutter run -d android
```

**All platforms are ready to test!** ✅

---

## 🔥 Cloud Functions - Start in 1 Minute

### Step 1: Download Firebase Service Account Key (30 seconds)
1. Go to: https://console.firebase.google.com/project/spaktok-e7866/settings/serviceaccounts/adminsdk
2. Click **"Generate new private key"**
3. Save as: `functions/serviceAccountKey.json`

### Step 2: Start Emulators (30 seconds)
```bash
cd functions
npm run serve
```

**Functions ready at**: http://localhost:5001

---

## 🎯 Full Development Environment

### Terminal 1: Flutter App
```bash
flutter run -d chrome
```

### Terminal 2: Firebase Functions (Optional)
```bash
cd functions
npm run serve
```

### Terminal 3: Backend Server (Optional)
```bash
cd backend
npm start
```

**You now have a complete local development environment!** 🎉

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

## 📱 Building for Production

### Android APK
```bash
flutter build apk --release \
  --dart-define=AGORA_APP_ID=a41807bba5c144b5b8e1fd5ee711707b \
  --dart-define=STRIPE_PUBLISHABLE_KEY=pk_test_51SDYFHRumpu3fxskjQggMnl7yLzUENBm41WWH0S8vuRgZj3Quu3C1agEyZyhCpCDT9W1FSLfzQLTKt6842b7UU3s00hCqsDHcJ

# Output: build/app/outputs/flutter-apk/app-release.apk
```

### Deploy to Firebase
```bash
firebase deploy
```

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

### "Firebase Service Account Key not found"
```bash
# Solution: Download the key from Firebase Console
# See: functions/SERVICE_ACCOUNT_KEY_README.md
```

### "Docker daemon not running"
```bash
# Solution: Start Docker Desktop
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
```

### "flutter command not found"
```bash
# Solution: Restart terminal to reload PATH
# Or add to PATH: C:\Users\A\develop\flutter\bin
```

---

## ✅ Verification Commands

```bash
# Check Flutter setup
flutter doctor

# Check Node.js
node --version  # Should show v24.11.0

# Check Firebase
firebase --version  # Should show 14.22.0

# Check Docker
docker --version  # Should show 28.5.1

# Run tests
flutter test
cd functions && npm test
```

---

## 📚 Key Files

| File | Purpose |
|------|---------|
| `lib/main.dart` | Flutter app entry point |
| `functions/index.js` | Cloud Functions exports |
| `functions/.env` | Environment configuration |
| `firebase.json` | Firebase project config |
| `pubspec.yaml` | Flutter dependencies |

---

## 📚 Full Documentation

- **Deployment:** See `documentation/reports/DEPLOYMENT_READY.md`
- **Security:** See `documentation/security/` folder
- **All Reports:** See `documentation/reports/` folder
- **Guides:** See `documentation/guides/` folder

---

## 🎓 Next Learning Steps

1. **Explore the code**: Start with `lib/main.dart`
2. **Test features**: Run the app and click around
3. **Modify UI**: Edit screens in `lib/screens/`
4. **Add functions**: Create new Cloud Functions in `functions/src/`
5. **Deploy**: When ready, run `firebase deploy`

---

## 🆘 Need Help?

- **Issues:** https://github.com/spaktok/Spaktok/issues
- **Discussions:** https://github.com/spaktok/Spaktok/discussions
- **Email:** support@spaktok.app

---

**Your Spaktok development environment is ready! Ready to build the next billion-user platform!** 🚀
