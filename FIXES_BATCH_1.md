# Systematic Fixes - Batch 1

## Issues to Fix

### 1. login_screen.dart (Lines 280, 292, 304)
**Problem:** `_handleSocialLogin` returns Future but not being awaited
**Fix:** Add await keyword

```dart
// Current (wrong):
onPressed: () {
  _handleSocialLogin(() async {
    await _authService.signInWithGoogle();
  });
},

// Fixed:
onPressed: () async {
  await _handleSocialLogin(() async {
    await _authService.signInWithGoogle();
  });
},
```

### 2. disappearing_messages_service.dart (Line 239)
**Problem:** Undefined name '_firestore'
**Fix:** Already defined at top, likely just need to check the actual line

### 3. ai_translation_service.dart (Line 302)
**Problem:** The method 'add' can't be unconditionally invoked because the receiver can be 'null'
**Fix:** Add null check before calling add

### 4. payment_service.dart (Line 12)
**Problem:** The getter 'stripePublishableKey' isn't defined for AppConfig
**Fix:** Add missing getter to AppConfig

### 5. performance_optimization_service.dart (Lines 254, 267, 279)
**Problem:** Return type mismatches
**Fix:** Add null coalescing or proper type casting

### 6. Test files (multiple)
**Problem:** Missing required arguments chatBgService and themeService
**Fix:** Add mock services to test setup
