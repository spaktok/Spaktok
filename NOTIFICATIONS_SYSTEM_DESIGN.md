# Notifications System Design for Spaktok

## 1. Overview
This document outlines the design for a real-time notification system within Spaktok. The system will deliver instant notifications to users for various events such as likes, comments, follows, gifts, messages, and new stories. Notifications will be stored in Firestore and delivered via Firebase Cloud Messaging (FCM).

## 2. Core Features
*   **Real-time Delivery:** Instant notifications for user interactions.
*   **In-App Notifications:** Display notifications within the application.
*   **Push Notifications:** Deliver notifications to users' devices even when the app is closed.
*   **Notification History:** Store a log of notifications for each user.
*   **Read/Unread Status:** Track which notifications have been viewed by the user.

## 3. Data Models (Firestore)

### 3.1. `notifications` Collection
This collection will store individual notification records for each user.

| Field Name        | Type           | Description                                                                 | Example Value                                  |
| :---------------- | :------------- | :-------------------------------------------------------------------------- | :--------------------------------------------- |
| `notificationId`  | String         | Unique ID for the notification (document ID)                                | `not_123xyz`                                   |
| `userId`          | String         | ID of the user who receives the notification                                | `user_abc`                                     |
| `senderId`        | String         | ID of the user who triggered the notification (e.g., liker, commenter)      | `user_def`                                     |
| `type`            | String         | Type of notification (`like`, `comment`, `follow`, `gift`, `message`, `story_upload`, `report_status`, `payout_status`)| `like`                                         |
| `message`         | String         | The notification message text                                               | `user_def liked your video.`                   |
| `entityId`        | String         | ID of the entity related to the notification (video, comment, story, etc.)  | `vid_ghi789`                                   |
| `entityType`      | String         | Type of entity related to the notification (`video`, `comment`, `story`, `user`)| `video`                                        |
| `isRead`          | Boolean        | Whether the user has read the notification                                  | `false`                                        |
| `createdAt`       | Timestamp      | Timestamp of notification creation                                          | `Timestamp(2025, 1, 15, 10, 00)`               |
| `imageUrl`        | String         | Optional: URL of an image related to the notification (e.g., sender's profile pic, video thumbnail) | `https://storage.firebase.com/profile_def.jpg` |

### 3.2. `users` Collection (Updated Fields)
Additional field in the existing `users` collection to store FCM tokens.

| Field Name        | Type           | Description                                                                 | Example Value                                  |
| :---------------- | :------------- | :-------------------------------------------------------------------------- | :--------------------------------------------- |
| `fcmTokens`       | Array of Strings | List of Firebase Cloud Messaging tokens for the user's devices              | `['token123', 'token456']`                     |

## 4. Firestore Security Rules

Rules will be updated to:
*   Allow authenticated users to read and update their own `notifications`.
*   Allow Cloud Functions to create `notifications`.
*   Allow authenticated users to update their `fcmTokens` in their own user document.

```firestore
match /notifications/{notificationId} {
  allow read, update: if request.auth != null && request.auth.uid == resource.data.userId;
  allow create: if request.auth != null; // Cloud Functions will handle creation, but allow for now
}

match /users/{userId} {
  // Existing rules...
  // Add rule for fcmTokens
  allow update: if request.auth != null && request.auth.uid == userId &&
               (request.resource.data.diff(resource.data).affectedKeys().hasOnly(["fcmTokens"]));
}
```

## 5. Firebase Cloud Functions

### 5.1. `sendNotification` (Internal Helper Function)
*   **Description:** A reusable function to send both in-app and push notifications.
*   **Input:** `userId`, `senderId`, `type`, `message`, `entityId`, `entityType`, `imageUrl`.
*   **Logic:**
    1.  Create a new document in the `notifications` collection.
    2.  Retrieve `fcmTokens` for the `userId` from the `users` collection.
    3.  Use `admin.messaging().sendToDevice()` to send push notifications to all tokens.

### 5.2. `onNewLike` (Firestore Trigger - `onDocumentCreated` for `likes`)
*   **Description:** Triggers a notification when a user likes a video/comment.
*   **Trigger:** `onDocumentCreated` for `likes/{likeId}`.
*   **Logic:**
    1.  Get `likerId` and `entityId` (video/comment) from the new like document.
    2.  Get `ownerId` of the `entityId`.
    3.  Call `sendNotification` to notify the `ownerId`.

### 5.3. `onNewComment` (Firestore Trigger - `onDocumentCreated` for `comments`)
*   **Description:** Triggers a notification when a user comments on a video.
*   **Trigger:** `onDocumentCreated` for `comments/{commentId}`.
*   **Logic:**
    1.  Get `commenterId` and `videoId` from the new comment document.
    2.  Get `ownerId` of the `videoId`.
    3.  Call `sendNotification` to notify the `ownerId`.

### 5.4. `onNewFollow` (Firestore Trigger - `onDocumentCreated` for `follows`)
*   **Description:** Triggers a notification when a user follows another user.
*   **Trigger:** `onDocumentCreated` for `follows/{followId}`.
*   **Logic:**
    1.  Get `followerId` and `followedId` from the new follow document.
    2.  Call `sendNotification` to notify the `followedId`.

### 5.5. `onNewGift` (Firestore Trigger - `onDocumentCreated` for `sentGifts`)
*   **Description:** Triggers a notification when a user receives a gift.
*   **Trigger:** `onDocumentCreated` for `sentGifts/{sentGiftId}`.
*   **Logic:**
    1.  Get `senderId`, `receiverId`, `giftName` from the new gift document.
    2.  Call `sendNotification` to notify the `receiverId`.

### 5.6. `onNewMessage` (Firestore Trigger - `onDocumentCreated` for `conversations/{conversationId}/messages/{messageId}`)
*   **Description:** Triggers a notification when a user receives a new message.
*   **Trigger:** `onDocumentCreated` for `conversations/{conversationId}/messages/{messageId}`.
*   **Logic:**
    1.  Get `senderId`, `conversationId`, `messageText` from the new message document.
    2.  Get `participants` of the `conversationId`.
    3.  For each participant (excluding sender), call `sendNotification`.

### 5.7. `onNewStory` (Firestore Trigger - `onDocumentCreated` for `stories`)
*   **Description:** Triggers a notification when a user posts a new story.
*   **Trigger:** `onDocumentCreated` for `stories/{storyId}`.
*   **Logic:**
    1.  Get `storyCreatorId` from the new story document.
    2.  Get `followers` of the `storyCreatorId`.
    3.  For each follower, call `sendNotification`.

### 5.8. `onReportStatusUpdate` (Firestore Trigger - `onDocumentUpdated` for `reports`)
*   **Description:** Notifies the reporter when the status of their report changes.
*   **Trigger:** `onDocumentUpdated` for `reports/{reportId}`.
*   **Logic:**
    1.  Check if `status` field has changed.
    2.  Get `reporterId` from the report document.
    3.  Call `sendNotification` to notify the `reporterId` about the status update.

### 5.9. `onPayoutStatusUpdate` (Firestore Trigger - `onDocumentUpdated` for `payoutRequests`)
*   **Description:** Notifies the user when the status of their payout request changes.
*   **Trigger:** `onDocumentUpdated` for `payoutRequests/{payoutRequestId}`.
*   **Logic:**
    1.  Check if `status` field has changed.
    2.  Get `userId` from the payout request document.
    3.  Call `sendNotification` to notify the `userId` about the status update.

## 6. Flutter Services (Backend Interaction)

### 6.1. `NotificationService`
*   **Methods:**
    *   `updateFcmToken({required String token})`: Updates the user's FCM token in Firestore.
    *   `markNotificationAsRead({required String notificationId})`: Marks a notification as read.
    *   `getNotifications()`: Retrieves a stream of notifications for the current user.

## 7. Integration with Existing Systems
*   **User System:** Uses `users` collection for `fcmTokens` and user details.
*   **Firebase Cloud Messaging:** Core technology for push notifications.
*   **All other systems:** Will trigger notifications via their respective Firestore triggers.

## 8. Future Enhancements
*   Notification preferences (allow users to customize which notifications they receive).
*   Notification grouping and summaries.
*   Rich notifications with images and action buttons.
*   In-app notification badge/counter.
