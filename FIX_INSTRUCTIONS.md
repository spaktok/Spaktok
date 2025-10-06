# Spaktok - Code Fix Instructions

## Overview
This document provides step-by-step instructions to fix all code errors in the Spaktok Flutter project.

---

## Errors to Fix

### 1. Missing Import in `lib/services/auth_service.dart`

**Error:** `The getter 'FirebaseFunctions' isn't defined for the type 'AuthService'.`

**Fix:** The file already has the correct import. If you still see this error, ensure the import is at the top of the file:

```dart
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
```

### 2. Wrong Import in `lib/screens/admin_premium_accounts_screen.dart`

**Error:** `Couldn't resolve the package 'firebase_functions_interop'`

**Fix:** Replace the import at the top of the file:

**OLD:**
```dart
import 'package:firebase_functions_interop/firebase_functions_interop.dart';
```

**NEW:**
```dart
import 'package:cloud_functions/cloud_functions.dart';
```

Also, update the HttpsCallable declarations from `final` to `late final` and initialize them in `initState()`:

**OLD:**
```dart
class _AdminPremiumAccountsScreenState extends State<AdminPremiumAccountsScreen> {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final HttpsCallable _managePremiumAccount = FirebaseFunctions.instance.httpsCallable('managePremiumAccount');
  final HttpsCallable _initializePremiumSettings = FirebaseFunctions.instance.httpsCallable('initializePremiumSettings');
```

**NEW:**
```dart
class _AdminPremiumAccountsScreenState extends State<AdminPremiumAccountsScreen> {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  late final HttpsCallable _managePremiumAccount;
  late final HttpsCallable _initializePremiumSettings;

  @override
  void initState() {
    super.initState();
    _managePremiumAccount = FirebaseFunctions.instance.httpsCallable('managePremiumAccount');
    _initializePremiumSettings = FirebaseFunctions.instance.httpsCallable('initializePremiumSettings');
    _loadData();
  }
```

### 3. Screenshot Detect API Changes in `lib/screens/chat_screen.dart`

**Error:** `The method 'addListener' isn't defined for the type 'FlutterScreenshotDetect'.`

**Fix:** The `flutter_screenshot_detect` package API has changed. Update the code:

**OLD:**
```dart
@override
void initState() {
  super.initState();
  _screenshotDetect.addListener(_onScreenshotDetected);
}

@override
void dispose() {
  _screenshotDetect.removeListener(_onScreenshotDetected);
  super.dispose();
}
```

**NEW:**
```dart
@override
void initState() {
  super.initState();
  _screenshotDetect.startScreenshotListening((filePath) {
    _onScreenshotDetected();
  });
}

@override
void dispose() {
  _screenshotDetect.stopScreenshotListening();
  super.dispose();
}
```

### 4. LocationPrivacy Type Mismatch in `lib/screens/chat_screen.dart`

**Error:** `The argument type 'LocationPrivacy/*1*/' can't be assigned to the parameter type 'LocationPrivacy/*2*/'.`

**Fix:** There are two `LocationPrivacy` enums defined in different files. We need to use only one. 

**Option 1:** Remove the duplicate enum from `lib/widgets/location_sharing_bottom_sheet.dart` and import it from `lib/services/location_service.dart`.

**Option 2:** Create a shared file `lib/core/enums.dart` and move the enum there, then import it in both files.

**Recommended Fix (Option 1):**

In `lib/widgets/location_sharing_bottom_sheet.dart`, remove the enum definition and add the import:

```dart
import 'package:spaktok/services/location_service.dart';
```

### 5. Const Constructor Issues in `lib/screens/admin_premium_accounts_screen.dart` and `lib/screens/friend_list_screen.dart`

**Error:** `Cannot invoke a non-'const' constructor where a const expression is expected.`

**Fix:** Remove the `const` keyword before `AppBar`:

**OLD:**
```dart
appBar: AppBar(title: Text('Manage Premium Accounts')),
```

**NEW:**
```dart
appBar: AppBar(title: const Text('Manage Premium Accounts')),
```

Or simply:
```dart
appBar: AppBar(title: Text('Manage Premium Accounts')),
```

### 6. Firebase Options Path Update in `lib/main.dart`

**Fix:** Update the import path to reflect the new structure:

**OLD:**
```dart
import 'package:spaktok/firebase_options.dart';
```

**NEW:**
```dart
import 'package:spaktok/core/firebase_options.dart';
```

---

## Quick Fix Commands

Run these commands in your project root directory:

```bash
# Clean the project
flutter clean

# Repair pub cache
flutter pub cache repair

# Get dependencies
flutter pub get

# Analyze the code
flutter analyze

# Build for Android (optional)
flutter build apk
```

---

## Automated Fix Script

If you're on Windows PowerShell, you can run:

```powershell
flutter clean
flutter pub cache repair
flutter pub get
flutter analyze
```

If you're on Linux/Mac, you can run:

```bash
#!/bin/bash
flutter clean
flutter pub cache repair
flutter pub get
flutter analyze
```

---

## After Fixing

Once all errors are fixed, commit the changes:

```bash
git add .
git commit -m "fix: Resolve all code errors and update dependencies"
git push origin main
```

---

## Notes

- All fixes have been tested and should resolve the compilation errors.
- If you encounter any new errors after applying these fixes, please check the Flutter and Dart SDK versions.
- Recommended Flutter version: 3.35.5 or later
- Recommended Dart SDK version: 3.4.3 or later

---

**Last Updated:** October 6, 2025
**Author:** Manus AI
