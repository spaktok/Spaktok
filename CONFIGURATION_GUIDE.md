'''
# 🔧 Spaktok Configuration Guide

This guide will help you configure all the necessary services for Spaktok to work properly.

---

## 📋 Prerequisites

Before you begin, make sure you have accounts for:
- [Firebase](https://console.firebase.google.com/)
- [Agora](https://www.agora.io/)
- [Stripe](https://stripe.com/)
- [Google Cloud Platform](https://console.cloud.google.com/) (for Google Maps and Translation APIs)

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
rules_version = "2";
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write for authenticated users only
    match /{document=**} {
      allow read, write: if request.auth != null;
    }

    // Public read for reels and stories (for unauthenticated viewing)
    match /reels/{reelId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == resource.data.userId;
    }

    match /stories/{storyId} {
      allow read: if resource.data.privacy == 'public' || (request.auth != null && request.auth.uid == resource.data.userId);
      allow write: if request.auth != null && request.auth.uid == resource.data.userId;
    }

    // Comments: authenticated users can read and write to comments on reels
    match /reels/{reelId}/comments/{commentId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }

    // Disappearing Messages: only participants can read/write
    match /chats/{chatId} {
      allow read, write: if request.auth != null && resource.data.participants.contains(request.auth.uid);
    }

    // Friend Requests: authenticated users can send and manage their own requests
    match /friendRequests/{requestId} {
      allow read, write: if request.auth != null && (request.auth.uid == resource.data.fromUserId || request.auth.uid == resource.data.toUserId);
    }

    // AR Shopping Products: public read, only authenticated sellers can write
    match /ar_products/{productId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == request.resource.data.sellerId;
    }

    // AR Shopping Carts: only the user can read/write their own cart
    match /carts/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // AR Shopping Orders: only the user can read/write their own orders
    match /orders/{orderId} {
      allow read: if request.auth != null && request.auth.uid == resource.data.userId;
      allow write: if request.auth != null && request.auth.uid == resource.data.userId;
    }

    // AR Try-on History: only the user can read/write their own history
    match /ar_tryons/{tryOnId} {
      allow read: if request.auth != null && request.auth.uid == resource.data.userId;
      allow write: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }

    // User profiles: public read, users can write their own profile
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
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

Open `lib/config/api_config.dart` and update:

```dart
class ApiConfig {
  static const String agoraAppId = "YOUR_AGORA_APP_ID";
  static const String agoraToken = "YOUR_AGORA_TOKEN";
  // ... other keys
}
```

### Step 4: Token Server (Production)

For production, you should set up a token server:

1. Create a Cloud Function in Firebase
2. Use Agora's token generation library
3. Return tokens dynamically based on user authentication

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

Open `lib/config/api_config.dart` and update:

```dart
class ApiConfig {
  // ... other keys
  static const String stripePublishableKey = "YOUR_STRIPE_PUBLISHABLE_KEY";
  static const String stripeSecretKey = "YOUR_STRIPE_SECRET_KEY";
}
```

---

## 🗺️ Google Maps & Translation Configuration

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project

### Step 2: Enable APIs

1. In the Google Cloud Console, go to "APIs & Services" → "Library"
2. Enable the following APIs:
   - **Maps SDK for Android**
   - **Maps SDK for iOS**
   - **Cloud Translation API**

### Step 3: Get API Keys

1. In the Google Cloud Console, go to "APIs & Services" → "Credentials"
2. Create a new API key
3. Restrict the key to the enabled APIs

### Step 4: Configure in Code

Open `lib/config/api_config.dart` and update:

```dart
class ApiConfig {
  // ... other keys
  static const String googleMapsApiKey = "YOUR_GOOGLE_MAPS_API_KEY";
  static const String translationApiKey = "YOUR_TRANSLATION_API_KEY";
}
```

---

## 🤖 AR SDK Configuration

### Step 1: Choose an AR SDK

Spaktok uses `ar_flutter_plugin`. You can find more information [here](https://pub.dev/packages/ar_flutter_plugin).

### Step 2: Configure for Android

1.  Add the following to `android/app/src/main/AndroidManifest.xml`:

    ```xml
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-feature android:name="android.hardware.camera.ar" android:required="true" />
    ```

2.  Add the following to `android/build.gradle`:

    ```gradle
    dependencies {
        classpath 'com.google.ar.sceneform:plugin:1.15.0'
    }
    ```

3.  Add the following to `android/app/build.gradle`:

    ```gradle
    apply plugin: 'com.google.ar.sceneform.plugin'

    dependencies {
        implementation "com.google.ar.sceneform.ux:sceneform-ux:1.15.0"
        implementation "com.google.ar:core:1.15.0"
    }
    ```

### Step 3: Configure for iOS

1.  Add the following to `ios/Runner/Info.plist`:

    ```xml
    <key>NSCameraUsageDescription</key>
    <string>This app needs camera access to show AR content</string>
    ```

### Step 4: Configure in Code

Open `lib/config/api_config.dart` and update:

```dart
class ApiConfig {
  // ... other keys
  static const String arSdkKey = "YOUR_AR_SDK_KEY"; // If applicable
}
```

---

## 🔐 Environment Variables

Create a `.env` file in the project root or manage keys in `lib/config/api_config.dart`.

**⚠️ Important:** Add `lib/config/api_config.dart` to `.gitignore` to keep your secrets safe!

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
- [ ] Google Maps and Translation API keys obtained
- [ ] AR SDK configured
- [ ] All keys are stored securely

---

**Last Updated:** October 3, 2025
'''
