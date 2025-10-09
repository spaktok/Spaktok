# Phase 14.1: Push Notifications (FCM) Implementation Plan - Continued

This document outlines the remaining steps to integrate Firebase Cloud Messaging (FCM) for push notifications in the Spaktok application.

## 1. Android Specific Configuration

- **Manifest Permissions:** Verify `AndroidManifest.xml` contains necessary permissions for FCM.
- **Notification Icon:** Ensure a notification icon is configured in `AndroidManifest.xml` and exists in drawable folders.
- **Service for Background Messages:** Verify `AndroidManifest.xml` includes the FCM service for background message handling.

## 2. iOS Specific Configuration

- **Capabilities:** Verify `Runner.xcodeproj` has Push Notifications and Background Modes (Remote notifications) capabilities enabled.
- **APNs Authentication Key:** Ensure the APNs Authentication Key is uploaded to Firebase.
- **Info.plist:** Verify `Info.plist` contains necessary entries for FCM.

## 3. Implementation Details

- **FCM Token Storage:** Implement logic to send the FCM token to the backend and associate it with the user.
- **Background Message Handler:** Refine `_firebaseMessagingBackgroundHandler` to process messages and potentially store them locally or trigger UI updates.
- **Notification Display Customization:** Customize local notification display based on message content (e.g., chat messages, live events, AR gifts).
- **Navigation on Notification Tap:** Implement navigation logic when a notification is tapped, directing the user to the relevant part of the app.

## 4. Testing

- **Comprehensive Testing:** Test on various Android and iOS devices and simulators.
- **Edge Cases:** Test notification delivery in different network conditions and app states (foreground, background, terminated).
- **Feature Integration:** Verify notifications are correctly triggered and linked for chat, live sessions, and AR gift events.

