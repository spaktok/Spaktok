# Spaktok Messaging System Design

This document outlines the comprehensive design for the Messaging System in Spaktok, providing users with real-time chat, media sharing, and ephemeral messaging capabilities similar to Snapchat and Instagram Direct.

## 1. Core Concepts

**Messaging** enables users to communicate privately through text, photos, videos, voice messages, and other media. The system supports both persistent and ephemeral messages, group chats, and rich media sharing.

**Key Features:**
- One-on-one and group chats
- Text, photo, video, voice messages
- Ephemeral messages (disappearing)
- Message reactions and replies
- Read receipts and typing indicators
- Media gallery and shared content
- Message search and filtering
- Voice and video calls
- Location sharing
- Story replies
- Message forwarding
- Chat themes and customization
- Message encryption (end-to-end)

## 2. Firestore Data Models

### 2.1. `conversations` Collection

Stores conversation metadata.

**Document ID:** Auto-generated `conversationId`

| Field Name | Type | Description |
|:-----------|:-----|:------------|
| `conversationId` | `string` | Unique conversation identifier |
| `type` | `string` | Type: `direct`, `group` |
| `participants` | `array<string>` | Array of participant userIds |
| `participantData` | `array<map>` | Participant details (denormalized) |
| `participantData[].userId` | `string` | User ID |
| `participantData[].username` | `string` | Username |
| `participantData[].profileImage` | `string` | Profile image URL |
| `groupName` | `string` | Group name (for group chats) |
| `groupImage` | `string` | Group image URL |
| `groupDescription` | `string` | Group description |
| `adminIds` | `array<string>` | Array of admin userIds (for groups) |
| `lastMessage` | `map` | Last message details |
| `lastMessage.senderId` | `string` | Sender ID |
| `lastMessage.text` | `string` | Message preview text |
| `lastMessage.type` | `string` | Message type |
| `lastMessage.timestamp` | `timestamp` | Message timestamp |
| `createdAt` | `timestamp` | Conversation creation time |
| `createdBy` | `string` | Creator userId |
| `updatedAt` | `timestamp` | Last update timestamp |
| `isArchived` | `boolean` | Whether conversation is archived |
| `isMuted` | `boolean` | Whether notifications are muted |
| `theme` | `string` | Chat theme/color |
| `emoji` | `string` | Chat emoji |
| `disappearingMode` | `string` | Mode: `off`, `24h`, `7d`, `after_view` |
| `encryptionEnabled` | `boolean` | Whether end-to-end encryption is enabled |

### 2.2. `messages` Collection (Subcollection under conversations)

Stores individual messages.

**Path:** `conversations/{conversationId}/messages/{messageId}`

| Field Name | Type | Description |
|:-----------|:-----|:------------|
| `messageId` | `string` | Unique message identifier |
| `conversationId` | `string` | Parent conversation ID |
| `senderId` | `string` | Sender userId |
| `senderUsername` | `string` | Sender username (denormalized) |
| `senderProfileImage` | `string` | Sender profile image (denormalized) |
| `type` | `string` | Type: `text`, `photo`, `video`, `voice`, `location`, `story_reply`, `video_share`, `gift`, `call` |
| `text` | `string` | Message text content |
| `mediaUrl` | `string` | Media file URL |
| `mediaType` | `string` | Media type: `image`, `video`, `audio` |
| `mediaDuration` | `number` | Media duration in seconds (for video/audio) |
| `thumbnailUrl` | `string` | Thumbnail URL (for videos) |
| `location` | `map` | Location data |
| `location.latitude` | `number` | Latitude |
| `location.longitude` | `number` | Longitude |
| `location.name` | `string` | Location name |
| `sharedContent` | `map` | Shared content details |
| `sharedContent.type` | `string` | Type: `video`, `story`, `profile`, `live_stream` |
| `sharedContent.id` | `string` | Content ID |
| `sharedContent.thumbnailUrl` | `string` | Content thumbnail |
| `sharedContent.title` | `string` | Content title |
| `replyTo` | `string` | Message ID being replied to |
| `replyToData` | `map` | Reply message data (denormalized) |
| `reactions` | `map` | Reactions map (emoji -> array of userIds) |
| `isEphemeral` | `boolean` | Whether message disappears |
| `expiresAt` | `timestamp` | Expiration timestamp |
| `viewedBy` | `array<string>` | Array of userIds who viewed |
| `deliveredTo` | `array<string>` | Array of userIds message was delivered to |
| `readBy` | `array<string>` | Array of userIds who read message |
| `readTimestamps` | `map` | Map of userId -> read timestamp |
| `isDeleted` | `boolean` | Whether message is deleted |
| `deletedFor` | `array<string>` | UserIds who deleted message |
| `isEdited` | `boolean` | Whether message was edited |
| `editedAt` | `timestamp` | Edit timestamp |
| `timestamp` | `timestamp` | Message creation timestamp |
| `status` | `string` | Status: `sending`, `sent`, `delivered`, `read`, `failed` |

### 2.3. `userConversations` Collection (Subcollection under users)

Quick access to user's conversations.

**Path:** `users/{userId}/conversations/{conversationId}`

| Field Name | Type | Description |
|:-----------|:-----|:------------|
| `conversationId` | `string` | Reference to conversation |
| `otherParticipants` | `array<map>` | Other participants' data |
| `lastMessage` | `map` | Last message preview |
| `unreadCount` | `number` | Number of unread messages |
| `lastViewed` | `timestamp` | Last time user viewed conversation |
| `isPinned` | `boolean` | Whether conversation is pinned |
| `isMuted` | `boolean` | Whether notifications are muted |
| `isArchived` | `boolean` | Whether conversation is archived |
| `updatedAt` | `timestamp` | Last update timestamp |

### 2.4. `messageReactions` Collection

Tracks message reactions for analytics.

**Document ID:** `{messageId}_{userId}_{emoji}`

| Field Name | Type | Description |
|:-----------|:-----|:------------|
| `messageId` | `string` | Message being reacted to |
| `userId` | `string` | User who reacted |
| `emoji` | `string` | Reaction emoji |
| `timestamp` | `timestamp` | Reaction timestamp |

### 2.5. `calls` Collection

Stores call history and metadata.

**Document ID:** Auto-generated `callId`

| Field Name | Type | Description |
|:-----------|:-----|:------------|
| `callId` | `string` | Unique call identifier |
| `conversationId` | `string` | Associated conversation |
| `callerId` | `string` | User who initiated call |
| `callerUsername` | `string` | Caller username |
| `participants` | `array<string>` | Array of participant userIds |
| `type` | `string` | Type: `voice`, `video` |
| `status` | `string` | Status: `ringing`, `ongoing`, `ended`, `missed`, `declined` |
| `startedAt` | `timestamp` | Call start time |
| `endedAt` | `timestamp` | Call end time |
| `duration` | `number` | Call duration in seconds |
| `answeredBy` | `array<string>` | UserIds who answered |
| `missedBy` | `array<string>` | UserIds who missed |
| `declinedBy` | `array<string>` | UserIds who declined |

### 2.6. `typingIndicators` Collection

Real-time typing indicators.

**Document ID:** `{conversationId}_{userId}`

| Field Name | Type | Description |
|:-----------|:-----|:------------|
| `conversationId` | `string` | Conversation ID |
| `userId` | `string` | User who is typing |
| `username` | `string` | Username |
| `isTyping` | `boolean` | Whether currently typing |
| `timestamp` | `timestamp` | Last update timestamp |

## 3. Cloud Functions

### 3.1. Conversation Management Functions

**Function:** `createConversation`
- **Trigger:** HTTPS Callable
- **Purpose:** Create a new conversation
- **Process:**
  1. Verify user authentication
  2. Validate participants
  3. Check if direct conversation already exists
  4. Create conversation document
  5. Create userConversations for all participants
  6. Send notifications
  7. Return conversation data

**Function:** `getConversations`
- **Trigger:** HTTPS Callable
- **Purpose:** Get user's conversations
- **Process:**
  1. Verify user authentication
  2. Query userConversations subcollection
  3. Filter by archived/pinned status
  4. Sort by last message timestamp
  5. Return paginated list

**Function:** `getConversation`
- **Trigger:** HTTPS Callable
- **Purpose:** Get conversation details
- **Process:**
  1. Verify user is participant
  2. Get conversation document
  3. Mark messages as read
  4. Return conversation data

**Function:** `updateConversation`
- **Trigger:** HTTPS Callable
- **Purpose:** Update conversation settings
- **Process:**
  1. Verify user is participant/admin
  2. Update conversation document
  3. Sync with userConversations
  4. Return updated data

**Function:** `deleteConversation`
- **Trigger:** HTTPS Callable
- **Purpose:** Delete conversation
- **Process:**
  1. Verify user is participant
  2. Delete from userConversations
  3. If all participants deleted, remove conversation
  4. Return success status

**Function:** `archiveConversation`
- **Trigger:** HTTPS Callable
- **Purpose:** Archive/unarchive conversation
- **Process:**
  1. Verify user is participant
  2. Update isArchived flag
  3. Return success status

**Function:** `muteConversation`
- **Trigger:** HTTPS Callable
- **Purpose:** Mute/unmute conversation
- **Process:**
  1. Verify user is participant
  2. Update isMuted flag
  3. Return success status

### 3.2. Message Functions

**Function:** `sendMessage`
- **Trigger:** HTTPS Callable
- **Purpose:** Send a message
- **Process:**
  1. Verify user authentication
  2. Verify user is participant
  3. Validate message content
  4. Upload media if present
  5. Create message document
  6. Update conversation lastMessage
  7. Increment unread counts
  8. Send push notifications
  9. Return message data

**Function:** `getMessages`
- **Trigger:** HTTPS Callable
- **Purpose:** Get messages in conversation
- **Process:**
  1. Verify user is participant
  2. Query messages subcollection
  3. Mark messages as read
  4. Update read receipts
  5. Return paginated messages

**Function:** `deleteMessage`
- **Trigger:** HTTPS Callable
- **Purpose:** Delete a message
- **Process:**
  1. Verify user is sender or admin
  2. Option to delete for self or everyone
  3. Update message document
  4. If ephemeral, delete completely
  5. Return success status

**Function:** `editMessage`
- **Trigger:** HTTPS Callable
- **Purpose:** Edit a message
- **Process:**
  1. Verify user is sender
  2. Verify message is editable (text only, within time limit)
  3. Update message text
  4. Set isEdited flag
  5. Return updated message

**Function:** `reactToMessage`
- **Trigger:** HTTPS Callable
- **Purpose:** Add/remove reaction to message
- **Process:**
  1. Verify user is participant
  2. Update reactions map
  3. Create reaction record
  4. Send notification to sender
  5. Return updated reactions

**Function:** `forwardMessage`
- **Trigger:** HTTPS Callable
- **Purpose:** Forward message to other conversations
- **Process:**
  1. Verify user is participant in source conversation
  2. Validate target conversations
  3. Create new messages in target conversations
  4. Return success status

**Function:** `markAsRead`
- **Trigger:** HTTPS Callable
- **Purpose:** Mark messages as read
- **Process:**
  1. Verify user is participant
  2. Update readBy arrays
  3. Update read timestamps
  4. Reset unread count
  5. Send read receipts
  6. Return success status

### 3.3. Media Functions

**Function:** `uploadMessageMedia`
- **Trigger:** HTTPS Callable
- **Purpose:** Upload media for message
- **Process:**
  1. Verify user authentication
  2. Generate signed upload URL
  3. Return upload URL
  4. On upload complete, process media
  5. Generate thumbnail for videos
  6. Return media URLs

**Function:** `getMessageMedia`
- **Trigger:** HTTPS Callable
- **Purpose:** Get media URL with access check
- **Process:**
  1. Verify user is participant
  2. Generate signed download URL
  3. Return media URL

### 3.4. Group Chat Functions

**Function:** `createGroupChat`
- **Trigger:** HTTPS Callable
- **Purpose:** Create a group chat
- **Process:**
  1. Verify user authentication
  2. Validate participants (min 3, max 256)
  3. Create group conversation
  4. Set creator as admin
  5. Send notifications
  6. Return group data

**Function:** `addGroupMembers`
- **Trigger:** HTTPS Callable
- **Purpose:** Add members to group
- **Process:**
  1. Verify user is admin
  2. Validate new members
  3. Add to participants array
  4. Create userConversations for new members
  5. Send system message
  6. Send notifications
  7. Return success status

**Function:** `removeGroupMember`
- **Trigger:** HTTPS Callable
- **Purpose:** Remove member from group
- **Process:**
  1. Verify user is admin
  2. Remove from participants
  3. Delete userConversation
  4. Send system message
  5. Return success status

**Function:** `leaveGroup`
- **Trigger:** HTTPS Callable
- **Purpose:** Leave a group chat
- **Process:**
  1. Verify user is participant
  2. Remove from participants
  3. If user is admin, transfer admin or delete group
  4. Send system message
  5. Return success status

**Function:** `updateGroupInfo`
- **Trigger:** HTTPS Callable
- **Purpose:** Update group name, image, description
- **Process:**
  1. Verify user is admin
  2. Update group fields
  3. Send system message
  4. Return updated group data

### 3.5. Call Functions

**Function:** `initiateCall`
- **Trigger:** HTTPS Callable
- **Purpose:** Start a voice/video call
- **Process:**
  1. Verify user is participant
  2. Create call document
  3. Generate call token (Agora/Twilio)
  4. Send call notifications to participants
  5. Return call data and token

**Function:** `answerCall`
- **Trigger:** HTTPS Callable
- **Purpose:** Answer an incoming call
- **Process:**
  1. Verify user is participant
  2. Update call status
  3. Add to answeredBy array
  4. Return call token

**Function:** `declineCall`
- **Trigger:** HTTPS Callable
- **Purpose:** Decline an incoming call
- **Process:**
  1. Verify user is participant
  2. Update call status
  3. Add to declinedBy array
  4. Send notification to caller
  5. Return success status

**Function:** `endCall`
- **Trigger:** HTTPS Callable
- **Purpose:** End an ongoing call
- **Process:**
  1. Verify user is participant
  2. Calculate duration
  3. Update call status to ended
  4. Create call message in conversation
  5. Return call summary

### 3.6. Ephemeral Message Functions

**Function:** `expireMessages`
- **Trigger:** Scheduled (every 5 minutes)
- **Purpose:** Delete expired ephemeral messages
- **Process:**
  1. Query messages where expiresAt < now
  2. Delete message documents
  3. Delete media from Storage
  4. Update conversation if last message

**Function:** `markMessageViewed`
- **Trigger:** HTTPS Callable
- **Purpose:** Mark ephemeral message as viewed
- **Process:**
  1. Verify user is participant
  2. Add to viewedBy array
  3. If all participants viewed, set expiration
  4. Return success status

### 3.7. Typing Indicator Functions

**Function:** `setTypingIndicator`
- **Trigger:** HTTPS Callable
- **Purpose:** Set typing status
- **Process:**
  1. Verify user is participant
  2. Update typing indicator document
  3. Auto-expire after 5 seconds
  4. Return success status

**Function:** `getTypingIndicators`
- **Trigger:** HTTPS Callable
- **Purpose:** Get who is typing in conversation
- **Process:**
  1. Verify user is participant
  2. Query active typing indicators
  3. Return list of typing users

## 4. Real-time Features

### 4.1. Message Delivery

**Implementation:** Firestore realtime listeners
- Clients subscribe to messages subcollection
- New messages appear instantly
- Delivery and read receipts update in real-time
- Optimistic UI updates for sent messages

### 4.2. Typing Indicators

**Implementation:** Firestore realtime listeners
- Update typing status every 3 seconds while typing
- Auto-expire after 5 seconds
- Display "User is typing..." in conversation

### 4.3. Online Status

**Implementation:** Firestore presence
- Update lastActive timestamp
- Show online/offline status
- Show "Active now" or "Active 5m ago"

## 5. Message Types

### 5.1. Text Messages

- Plain text
- Emoji support
- Link previews
- Mentions (@username)
- Formatting (bold, italic)

### 5.2. Media Messages

- Photos (up to 10 per message)
- Videos (up to 60 seconds)
- Voice messages (up to 5 minutes)
- GIFs
- Stickers

### 5.3. Special Messages

- Location sharing
- Story replies
- Video shares
- Profile shares
- Live stream invites
- Gift notifications
- Call notifications

### 5.4. System Messages

- User joined group
- User left group
- Group name changed
- User added to group
- User removed from group

## 6. Privacy and Security

### 6.1. Message Privacy

- Only participants can view messages
- Blocked users cannot send messages
- Report inappropriate messages
- Delete messages for everyone

### 6.2. Encryption

- End-to-end encryption for sensitive conversations
- Encrypted media storage
- Secure key exchange
- Forward secrecy

### 6.3. Message Controls

- Disable message forwarding
- Disable screenshots (notification)
- Disappearing messages
- Message expiration

## 7. Performance Optimizations

### 7.1. Pagination

- Load messages in batches (20-50)
- Infinite scroll
- Load older messages on demand

### 7.2. Caching

- Cache recent conversations
- Cache message media
- Preload next batch of messages

### 7.3. Compression

- Compress images before upload
- Use WebP format
- Adaptive video quality
- Thumbnail generation

## 8. Integration Points

### 8.1. With Other Systems

- **Profile:** Send messages from profile
- **Videos:** Share videos in chat
- **Stories:** Reply to stories via DM
- **Live Streaming:** Share live streams
- **Gifts:** Send gifts in chat
- **Notifications:** Message notifications

### 8.2. External Services

- **Agora/Twilio:** Voice and video calls
- **Firebase Storage:** Media storage
- **Cloud Functions:** Message processing
- **FCM:** Push notifications

## 9. Future Enhancements

- Message scheduling
- Auto-reply/away messages
- Chat bots and automation
- Message translation
- Voice-to-text transcription
- Video messages (longer format)
- Screen sharing
- File sharing (documents, PDFs)
- Message polls
- Message games
- AR filters in video calls
- Live location sharing
- Shared albums
- Collaborative playlists

This comprehensive messaging system design provides users with a rich, real-time communication platform with privacy, security, and feature parity with leading messaging apps.
