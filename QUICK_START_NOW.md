# 🚀 Spaktok - Quick Start Guide

**Last Updated**: November 14, 2025

---

## ⚡ Immediate Testing (3 Commands)

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

### Terminal 2: Firebase Functions
```bash
cd functions
npm run serve
```

### Terminal 3: Backend Server (optional)
```bash
cd backend
npm start
```

**You now have a complete local development environment!** 🎉

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

## 🆘 Troubleshooting

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

## 🎓 Next Learning Steps

1. **Explore the code**: Start with `lib/main.dart`
2. **Test features**: Run the app and click around
3. **Modify UI**: Edit screens in `lib/screens/`
4. **Add functions**: Create new Cloud Functions in `functions/src/`
5. **Deploy**: When ready, run `firebase deploy`

---

**Your Spaktok development environment is ready!** 🚀

For detailed information, see `PROJECT_REMEDIATION_COMPLETE.md`
