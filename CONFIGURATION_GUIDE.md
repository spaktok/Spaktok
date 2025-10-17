# 🔧 Spaktok Configuration Guide

This guide will help you configure all the necessary services for Spaktok to work properly.

---

## 📋 Prerequisites

Before you begin, make sure you have accounts for:
- [Firebase](https://console.firebase.google.com/)
- [Agora](https://www.agora.io/)
- [Stripe](https://stripe.com/)

---

## 🔥 Firebase Configuration

### Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: `Spaktok`
4. Enable Google Analytics (optional)
5. Click "Create project"

### Step 2: Add Apps to Firebase

#### For Android:
1. Click the Android icon in Firebase Console
2. Enter package name: `com.spaktok.app` (or your package name)
3. Download `google-services.json`
4. Place it in `android/app/`

#### For iOS:
1. Click the iOS icon in Firebase Console
2. Enter bundle ID: `com.spaktok.app` (or your bundle ID)
3. Download `GoogleService-Info.plist`
4. Place it in `ios/Runner/`

#### For Web:
1. Click the Web icon in Firebase Console
2. Register your app
3. Copy the Firebase configuration

### Step 3: Enable Firebase Services

In Firebase Console, enable:
- ✅ **Authentication** → Email/Password
- ✅ **Firestore Database** → Create database in production mode
- ✅ **Storage** → Create default bucket
- ✅ **Cloud Messaging** → Enable FCM

### Step 4: Generate firebase_options.dart

```bash
# Install FlutterFire CLI
dart pub global activate flutterfire_cli

# Configure Firebase
flutterfire configure
```

This will automatically generate `lib/firebase_options.dart`.

### Step 5: Firestore Security Rules

Go to Firestore Database → Rules and add:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    
    // Messages collection
    match /messages/{messageId} {
      allow read, write: if request.auth != null;
    }
    
    // Posts collection
    match /posts/{postId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Gifts collection
    match /gifts/{giftId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Reports collection
    match /reports/{reportId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

### Step 6: Storage Security Rules

Go to Storage → Rules and add:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

---

## 🎥 Agora Configuration

### Step 1: Create Agora Account

1. Go to [Agora Console](https://console.agora.io/)
2. Sign up or log in
3. Create a new project

### Step 2: Get App ID and Token

1. In Agora Console, go to "Projects"
2. Click on your project
3. Copy the **App ID**
4. Go to "Config" → "Features" → Enable "App Certificate"
5. For testing, you can use temporary tokens from the console

### Step 3: Configure in Code

Open `lib/screens/live_stream_screen.dart` and update:

```dart
const appId = "YOUR_AGORA_APP_ID"; // Replace with your Agora App ID
const token = "YOUR_AGORA_TOKEN"; // Replace with your token (for testing)
```

### Step 4: Token Server (Production)

For production, you should set up a token server:

1. Create a Cloud Function in Firebase
2. Use Agora's token generation library
3. Return tokens dynamically based on user authentication

Example Cloud Function:

```javascript
const functions = require('firebase-functions');
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

exports.generateAgoraToken = functions.https.onCall((data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const appId = 'YOUR_AGORA_APP_ID';
  const appCertificate = 'YOUR_AGORA_APP_CERTIFICATE';
  const channelName = data.channelName;
  const uid = data.uid || 0;
  const role = RtcRole.PUBLISHER;
  const expirationTimeInSeconds = 3600;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  const token = RtcTokenBuilder.buildTokenWithUid(
    appId,
    appCertificate,
    channelName,
    uid,
    role,
    privilegeExpiredTs
  );

  return { token };
});
```

---

## 💳 Stripe Configuration

### Step 1: Create Stripe Account

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Sign up or log in
3. Activate your account

### Step 2: Get API Keys

1. In Stripe Dashboard, go to "Developers" → "API keys"
2. Copy your **Publishable key** and **Secret key**
3. For testing, use the test keys

### Step 3: Configure in Code

Create a `.env` file in the project root:

```env
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY
```

### Step 4: Update Payment Service

Open `lib/services/enhanced_payment_service.dart` and update:

```dart
class EnhancedPaymentService {
  static const String _publishableKey = 'YOUR_STRIPE_PUBLISHABLE_KEY';
  
  // ... rest of the code
}
```

### Step 5: Set Up Webhooks (Production)

1. In Stripe Dashboard, go to "Developers" → "Webhooks"
2. Add endpoint: `https://your-domain.com/webhook`
3. Select events to listen to:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.succeeded`

### Step 6: Create Products and Prices

1. In Stripe Dashboard, go to "Products"
2. Create products for your virtual currency packages:
   - 100 Coins - $0.99
   - 500 Coins - $4.99
   - 1000 Coins - $9.99
   - 5000 Coins - $49.99
   - 10000 Coins - $99.99

---

## 🔐 Environment Variables

Create a `.env` file in the project root:

```env
# Firebase
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id

# Agora
AGORA_APP_ID=your_agora_app_id
AGORA_APP_CERTIFICATE=your_agora_certificate

# Stripe
STRIPE_PUBLISHABLE_KEY=pk_test_your_key
STRIPE_SECRET_KEY=sk_test_your_secret_key

# Other
APP_ENV=development
API_BASE_URL=https://api.spaktok.com
```

**⚠️ Important:** Add `.env` to `.gitignore` to keep your secrets safe!

---

## 🔒 Security Best Practices

### 1. Never Commit Secrets
Add to `.gitignore`:
```
.env
*.key
*.pem
google-services.json
GoogleService-Info.plist
```

### 2. Use Environment Variables
Use `flutter_dotenv` package to load environment variables:

```yaml
dependencies:
  flutter_dotenv: ^5.1.0
```

```dart
import 'package:flutter_dotenv/flutter_dotenv.dart';

Future<void> main() async {
  await dotenv.load(fileName: ".env");
  runApp(MyApp());
}
```

### 3. Implement Token Refresh
For Agora tokens, implement automatic refresh before expiration.

### 4. Validate Payments Server-Side
Always validate Stripe payments on your backend, never trust client-side validation alone.

### 5. Enable App Check (Firebase)
1. Go to Firebase Console → App Check
2. Enable App Check for all platforms
3. This prevents unauthorized access to your Firebase resources

---

## 📱 Platform-Specific Configuration

### Android

1. Update `android/app/build.gradle`:
```gradle
android {
    defaultConfig {
        minSdkVersion 21
        targetSdkVersion 33
    }
}
```

2. Add permissions in `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.INTERNET"/>
<uses-permission android:name="android.permission.CAMERA"/>
<uses-permission android:name="android.permission.RECORD_AUDIO"/>
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
```

### iOS

1. Update `ios/Runner/Info.plist`:
```xml
<key>NSCameraUsageDescription</key>
<string>We need camera access for video calls and content creation</string>
<key>NSMicrophoneUsageDescription</key>
<string>We need microphone access for audio in videos and calls</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>We need photo library access to let you share photos</string>
```

2. Update `ios/Podfile`:
```ruby
platform :ios, '12.0'
```

---

## ✅ Verification Checklist

Before running the app, verify:

- [ ] Firebase project created
- [ ] `google-services.json` in `android/app/`
- [ ] `GoogleService-Info.plist` in `ios/Runner/`
- [ ] `firebase_options.dart` generated
- [ ] Firestore and Storage rules configured
- [ ] Agora App ID obtained
- [ ] Agora token generation set up
- [ ] Stripe account activated
- [ ] Stripe API keys obtained
- [ ] `.env` file created with all keys
- [ ] `.env` added to `.gitignore`
- [ ] Permissions added to AndroidManifest.xml
- [ ] Permissions added to Info.plist

---

## 🚀 Testing

After configuration, test each feature:

1. **Authentication:** Sign up and log in
2. **Live Streaming:** Start a live stream
3. **Chat:** Send messages
4. **Payments:** Purchase virtual currency (use test mode)
5. **Camera:** Take photos/videos with filters
6. **Notifications:** Receive push notifications

---

## 🆘 Troubleshooting

### Firebase Issues
- **Error:** "Default FirebaseApp is not initialized"
  - **Solution:** Make sure `Firebase.initializeApp()` is called in `main()`

### Agora Issues
- **Error:** "Join channel failed"
  - **Solution:** Check App ID and token, ensure token is not expired

### Stripe Issues
- **Error:** "Invalid API key"
  - **Solution:** Verify you're using the correct publishable key

---

## 📞 Support

If you encounter issues:
1. Check the [Firebase documentation](https://firebase.google.com/docs)
2. Check the [Agora documentation](https://docs.agora.io/)
3. Check the [Stripe documentation](https://stripe.com/docs)
4. Open an issue on [GitHub](https://github.com/spaktok/Spaktok/issues)

---

**Last Updated:** October 2, 2025
