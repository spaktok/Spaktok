# Snapchat-like Chat and Location Features Design for Spaktok

This document outlines the data models and architectural considerations for implementing Snapchat-like chat and location sharing features in the Spaktok application.

## 1. Chat Data Model

To support ephemeral and rich media messaging, the chat system will involve several Firestore collections:

### 1.1. `conversations` Collection

This collection will store metadata for each chat conversation (one-on-one or group).

| Field         | Type       | Description                                                                 |
|---------------|------------|-----------------------------------------------------------------------------|
| `id`          | `String`   | Unique ID of the conversation.                                              |
| `participants`| `Array<String>` | Array of user UIDs participating in the conversation.                       |
| `lastMessage` | `Map`      | Details of the last message (sender, text, timestamp, type).                |
| `createdAt`   | `Timestamp`| Timestamp of conversation creation.                                         |
| `updatedAt`   | `Timestamp`| Timestamp of the last message or update.                                    |
| `type`        | `String`   | `one-on-one` or `group`.                                                    |
| `groupName`   | `String`   | (Optional) Name of the group chat.                                          |

### 1.2. `messages` Subcollection (under `conversations/{conversationId}`)

Each conversation document will have a `messages` subcollection storing individual messages.

| Field         | Type       | Description                                                                 |
|---------------|------------|-----------------------------------------------------------------------------|
| `senderId`    | `String`   | UID of the message sender.                                                  |
| `text`        | `String`   | (Optional) Text content of the message.                                     |
| `mediaUrl`    | `String`   | (Optional) URL to image/video media (for Snaps).                            |
| `mediaType`   | `String`   | (Optional) `image` or `video`.                                              |
| `isEphemeral` | `Boolean`  | True if the message should disappear after viewing.                         |
| `viewedBy`    | `Array<String>` | Array of user UIDs who have viewed the message.                             |
| `timestamp`   | `Timestamp`| Timestamp when the message was sent.                                        |
| `type`        | `String`   | `text`, `snap`, `audioNote`, `videoNote`, `call` (for call notifications).|

### 1.3. `userChats` Subcollection (under `users/{userId}`)

To quickly retrieve a user's conversations, a subcollection will store references to conversations they are part of.

| Field         | Type       | Description                                                                 |
|---------------|------------|-----------------------------------------------------------------------------|
| `conversationId`| `String`   | Reference to the conversation document.                                     |
| `lastViewed`  | `Timestamp`| Timestamp of the last time the user viewed this conversation.               |
| `unreadCount` | `Number`   | Number of unread messages in this conversation for the user.                |

## 2. Location Data Model (`users` Collection Extension)

User location data will be stored within the existing `users` collection or a dedicated `userLocations` collection for real-time updates.

### 2.1. `users` Collection Fields

Existing `users` collection will be extended with location-related fields:

| Field             | Type       | Description                                                                 |
|-------------------|------------|-----------------------------------------------------------------------------|
| `lastKnownLocation`| `GeoPoint` | Last known geographical coordinates of the user.                            |
| `locationUpdatedAt`| `Timestamp`| Timestamp of the last location update.                                      |
| `locationPrivacy` | `String`   | `ghost`, `friends`, `selectedFriends`, `friendsExcept`.                     |
| `sharedWithFriends`| `Array<String>` | (Optional) UIDs of friends with whom location is explicitly shared.         |
| `excludedFriends` | `Array<String>` | (Optional) UIDs of friends from whom location is explicitly hidden.         |
| `isLiveLocationSharing`| `Boolean`  | True if user is sharing live location (more frequent updates).              |
| `liveLocationExpiresAt`| `Timestamp`| (Optional) Timestamp when live location sharing expires.                    |

## 3. Friendship Model (`users` Collection Extension and `friends` Subcollection)

Friendship status is crucial for both chat and location sharing.

### 3.1. `users` Collection Fields

Existing `users` collection will be extended with friendship-related fields:

| Field             | Type       | Description                                                                 |
|-------------------|------------|-----------------------------------------------------------------------------|
| `friends`         | `Array<String>` | Array of UIDs of users who are friends with this user.                      |
| `sentFriendRequests`| `Array<String>` | Array of UIDs of users to whom this user has sent friend requests.          |
| `receivedFriendRequests`| `Array<String>` | Array of UIDs of users from whom this user has received friend requests.    |

### 3.2. `friendRequests` Collection

This collection will manage pending friend requests.

| Field         | Type       | Description                                                                 |
|---------------|------------|-----------------------------------------------------------------------------|
| `senderId`    | `String`   | UID of the user who sent the request.                                       |
| `receiverId`  | `String`   | UID of the user who received the request.                                   |
| `status`      | `String`   | `pending`, `accepted`, `declined`.                                          |
| `createdAt`   | `Timestamp`| Timestamp of when the request was sent.                                     |

## 4. Firestore Security Rules

Security rules will be updated to ensure:

*   Users can only read/write their own `userChats` and `messages` in conversations they are a part of.
*   Users can only update their own location data.
*   Location data is only readable by friends, respecting `locationPrivacy` settings.
*   Friend requests can only be sent to valid users and accepted/declined by the receiver.

## 5. Cloud Functions for Chat and Location

*   **`sendMessage`**: A callable function to send messages, handling ephemeral logic and updating `lastMessage` in `conversations`.
*   **`updateLocation`**: A callable function to update a user's `lastKnownLocation` and `locationUpdatedAt`.
*   **`sendFriendRequest`**: A callable function to create a `friendRequest` document.
*   **`acceptFriendRequest`**: A callable function to update `friendRequest` status and add UIDs to both users' `friends` arrays.
*   **`declineFriendRequest`**: A callable function to update `friendRequest` status.
*   **`deleteMessage`**: A function triggered by message view to delete ephemeral messages.

This design provides a robust foundation for implementing the requested features, focusing on data integrity, privacy, and real-time capabilities.
