# Spaktok Live Streaming System Design

This document outlines the comprehensive design for the Live Streaming system in Spaktok, enabling real-time video broadcasting with interactive features similar to TikTok Live and Instagram Live.

## 1. Core Concepts

**Live Streaming** allows users to broadcast real-time video content to their followers and the broader Spaktok community. Viewers can interact through comments, likes, gifts, and other engagement features during the live broadcast.

**Key Features:**
- Real-time video streaming (RTMP/WebRTC)
- Live chat and comments
- Gift sending during streams
- Viewer count and engagement metrics
- Stream discovery and notifications
- Multi-guest streaming (PK battles)
- Stream recording and replay
- Monetization through gifts
- Moderation tools
- Stream scheduling
- Screen sharing capability
- Beauty filters and effects

## 2. Firestore Data Models

### 2.1. `liveStreams` Collection

Stores all live stream sessions and metadata.

**Document ID:** Auto-generated `streamId`

| Field Name | Type | Description |
|:-----------|:-----|:------------|
| `streamId` | `string` | Unique identifier for the stream |
| `userId` | `string` | ID of the broadcaster |
| `username` | `string` | Username of broadcaster (denormalized) |
| `userProfileImage` | `string` | Profile image of broadcaster (denormalized) |
| `title` | `string` | Stream title/description |
| `thumbnailUrl` | `string` | Stream thumbnail image URL |
| `streamUrl` | `string` | RTMP/HLS stream URL |
| `streamKey` | `string` | Unique stream key for broadcaster |
| `playbackUrl` | `string` | Playback URL for viewers |
| `status` | `string` | Status: `scheduled`, `live`, `ended`, `cancelled` |
| `category` | `string` | Stream category (gaming, music, chat, etc.) |
| `tags` | `array<string>` | Stream tags for discovery |
| `language` | `string` | Primary language of the stream |
| `viewerCount` | `number` | Current number of viewers |
| `peakViewerCount` | `number` | Maximum concurrent viewers |
| `totalViews` | `number` | Total unique viewers |
| `likes` | `number` | Total likes received |
| `comments` | `number` | Total comments count |
| `gifts` | `number` | Total gifts received |
| `giftRevenue` | `number` | Total revenue from gifts (in coins) |
| `duration` | `number` | Stream duration in seconds |
| `startedAt` | `timestamp` | When stream started |
| `endedAt` | `timestamp` | When stream ended |
| `scheduledFor` | `timestamp` | Scheduled start time (optional) |
| `isRecorded` | `boolean` | Whether stream is being recorded |
| `recordingUrl` | `string` | URL to recorded stream (after end) |
| `isPremium` | `boolean` | Whether broadcaster is premium account |
| `isAgeRestricted` | `boolean` | Whether stream is age-restricted |
| `allowComments` | `boolean` | Whether comments are enabled |
| `allowGifts` | `boolean` | Whether gifts are enabled |
| `privacy` | `string` | Privacy: `public`, `followers`, `private` |
| `moderators` | `array<string>` | Array of moderator userIds |
| `bannedUsers` | `array<string>` | Array of banned userIds |
| `guestUsers` | `array<string>` | Array of guest userIds (for multi-guest) |
| `pkOpponentId` | `string` | Opponent stream ID for PK battles |
| `pkScore` | `number` | Current PK battle score |
| `location` | `map` | Optional location data |
| `location.latitude` | `number` | Latitude coordinate |
| `location.longitude` | `number` | Longitude coordinate |
| `location.name` | `string` | Location name |
| `filters` | `array<string>` | Active filter IDs |
| `quality` | `string` | Stream quality: `auto`, `720p`, `1080p` |
| `bitrate` | `number` | Stream bitrate in kbps |
| `moderationStatus` | `string` | Moderation status: `active`, `flagged`, `suspended` |
| `violationFlags` | `array<string>` | Array of violation reasons |
| `createdAt` | `timestamp` | Stream creation timestamp |
| `lastUpdated` | `timestamp` | Last update timestamp |

### 2.2. `streamViewers` Collection

Tracks current and historical viewers of streams.

**Document ID:** `{streamId}_{userId}`

| Field Name | Type | Description |
|:-----------|:-----|:------------|
| `streamId` | `string` | ID of the stream |
| `userId` | `string` | ID of the viewer |
| `username` | `string` | Username of viewer (denormalized) |
| `userProfileImage` | `string` | Profile image of viewer (denormalized) |
| `joinedAt` | `timestamp` | When viewer joined |
| `leftAt` | `timestamp` | When viewer left (null if still watching) |
| `watchTime` | `number` | Total watch time in seconds |
| `isActive` | `boolean` | Whether currently watching |
| `lastHeartbeat` | `timestamp` | Last activity timestamp |
| `giftsSent` | `number` | Number of gifts sent |
| `commentsPosted` | `number` | Number of comments posted |

### 2.3. `streamComments` Collection

Stores live chat messages during streams.

**Document ID:** Auto-generated `commentId`

| Field Name | Type | Description |
|:-----------|:-----|:------------|
| `commentId` | `string` | Unique comment identifier |
| `streamId` | `string` | ID of the stream |
| `userId` | `string` | ID of the commenter |
| `username` | `string` | Username of commenter (denormalized) |
| `userProfileImage` | `string` | Profile image of commenter (denormalized) |
| `text` | `string` | Comment text |
| `type` | `string` | Type: `text`, `gift`, `join`, `like`, `system` |
| `giftId` | `string` | Gift ID if type is `gift` |
| `timestamp` | `timestamp` | When comment was posted |
| `isPinned` | `boolean` | Whether pinned by broadcaster |
| `isDeleted` | `boolean` | Whether deleted by moderator |
| `deletedBy` | `string` | UserId of moderator who deleted |

### 2.4. `streamLikes` Collection

Tracks likes given during streams.

**Document ID:** `{streamId}_{userId}`

| Field Name | Type | Description |
|:-----------|:-----|:------------|
| `streamId` | `string` | ID of the stream |
| `userId` | `string` | ID of the user who liked |
| `timestamp` | `timestamp` | When like was given |
| `likeCount` | `number` | Number of likes from this user |

### 2.5. `streamGifts` Collection

Records gifts sent during streams.

**Document ID:** Auto-generated

| Field Name | Type | Description |
|:-----------|:-----|:------------|
| `streamId` | `string` | ID of the stream |
| `giftId` | `string` | ID of the gift sent |
| `senderId` | `string` | ID of the gift sender |
| `senderUsername` | `string` | Username of sender (denormalized) |
| `receiverId` | `string` | ID of the broadcaster |
| `receiverUsername` | `string` | Username of broadcaster (denormalized) |
| `giftName` | `string` | Name of the gift |
| `giftImageUrl` | `string` | Image URL of the gift |
| `giftAnimationUrl` | `string` | Animation URL of the gift |
| `coinCost` | `number` | Cost in coins |
| `realValueUSD` | `number` | Real USD value |
| `broadcasterShare` | `number` | Amount broadcaster receives |
| `platformShare` | `number` | Amount platform retains |
| `isPremiumBroadcaster` | `boolean` | Whether broadcaster is premium |
| `timestamp` | `timestamp` | When gift was sent |
| `isCombo` | `boolean` | Whether part of combo |
| `comboCount` | `number` | Combo count if applicable |

### 2.6. `streamAnalytics` Collection (Subcollection under liveStreams)

Detailed analytics for each stream.

**Path:** `liveStreams/{streamId}/analytics/{analyticsId}`

| Field Name | Type | Description |
|:-----------|:-----|:------------|
| `timestamp` | `timestamp` | Analytics snapshot timestamp |
| `viewerCount` | `number` | Viewers at this moment |
| `likes` | `number` | Total likes at this moment |
| `gifts` | `number` | Total gifts at this moment |
| `comments` | `number` | Total comments at this moment |
| `revenue` | `number` | Total revenue at this moment |
| `topViewers` | `array<map>` | Top viewers by gifts sent |
| `topGifters` | `array<map>` | Top gift senders |
| `viewerDemographics` | `map` | Viewer demographics data |

### 2.7. `streamSchedule` Collection

Scheduled upcoming streams.

**Document ID:** Auto-generated `scheduleId`

| Field Name | Type | Description |
|:-----------|:-----|:------------|
| `scheduleId` | `string` | Unique schedule identifier |
| `userId` | `string` | ID of the broadcaster |
| `title` | `string` | Scheduled stream title |
| `description` | `string` | Stream description |
| `thumbnailUrl` | `string` | Thumbnail image URL |
| `scheduledFor` | `timestamp` | Scheduled start time |
| `category` | `string` | Stream category |
| `tags` | `array<string>` | Stream tags |
| `notifyFollowers` | `boolean` | Whether to notify followers |
| `status` | `string` | Status: `scheduled`, `started`, `cancelled` |
| `createdAt` | `timestamp` | When schedule was created |
| `reminders` | `array<string>` | UserIds who set reminders |

### 2.8. `streamModerationLog` Collection

Logs moderation actions during streams.

**Document ID:** Auto-generated

| Field Name | Type | Description |
|:-----------|:-----|:------------|
| `streamId` | `string` | ID of the stream |
| `moderatorId` | `string` | ID of the moderator |
| `action` | `string` | Action: `ban`, `timeout`, `delete_comment`, `end_stream` |
| `targetUserId` | `string` | ID of affected user |
| `targetCommentId` | `string` | ID of affected comment (if applicable) |
| `reason` | `string` | Reason for action |
| `duration` | `number` | Duration in seconds (for timeouts) |
| `timestamp` | `timestamp` | When action was taken |

### 2.9. `pkBattles` Collection

Tracks PK (Player Kill) battles between streamers.

**Document ID:** Auto-generated `battleId`

| Field Name | Type | Description |
|:-----------|:-----|:------------|
| `battleId` | `string` | Unique battle identifier |
| `stream1Id` | `string` | First stream ID |
| `stream2Id` | `string` | Second stream ID |
| `broadcaster1Id` | `string` | First broadcaster ID |
| `broadcaster2Id` | `string` | Second broadcaster ID |
| `score1` | `number` | Score for broadcaster 1 |
| `score2` | `number` | Score for broadcaster 2 |
| `duration` | `number` | Battle duration in seconds |
| `startedAt` | `timestamp` | Battle start time |
| `endedAt` | `timestamp` | Battle end time |
| `winnerId` | `string` | ID of the winner |
| `status` | `string` | Status: `active`, `ended` |
| `gifts1` | `array<map>` | Gifts for broadcaster 1 |
| `gifts2` | `array<map>` | Gifts for broadcaster 2 |

## 3. Cloud Functions

### 3.1. Stream Management Functions

**Function:** `startLiveStream`
- **Trigger:** HTTPS Callable
- **Purpose:** Initialize a new live stream
- **Process:**
  1. Verify user authentication and streaming permissions
  2. Check if user already has active stream
  3. Generate unique streamId and streamKey
  4. Create RTMP ingest URL and playback URL
  5. Initialize stream document in Firestore
  6. Set up recording if enabled
  7. Notify followers of new stream
  8. Return stream credentials and URLs

**Function:** `endLiveStream`
- **Trigger:** HTTPS Callable
- **Purpose:** End an active live stream
- **Process:**
  1. Verify user is broadcaster
  2. Calculate final statistics (duration, peak viewers, revenue)
  3. Update stream document with final data
  4. Process recording if enabled
  5. Distribute earnings to broadcaster
  6. Clean up active viewers
  7. Send notifications to viewers
  8. Archive stream analytics

**Function:** `updateStreamStatus`
- **Trigger:** HTTPS Callable / Background
- **Purpose:** Update stream status and metrics
- **Process:**
  1. Update viewer count
  2. Update engagement metrics
  3. Check stream health
  4. Handle reconnections
  5. Update analytics snapshots

**Function:** `scheduleLiveStream`
- **Trigger:** HTTPS Callable
- **Purpose:** Schedule a future live stream
- **Process:**
  1. Verify user authentication
  2. Validate schedule time (must be future)
  3. Create schedule document
  4. Optionally notify followers
  5. Set up reminder notifications
  6. Return schedule details

**Function:** `cancelScheduledStream`
- **Trigger:** HTTPS Callable
- **Purpose:** Cancel a scheduled stream
- **Process:**
  1. Verify user is broadcaster
  2. Update schedule status to cancelled
  3. Notify users who set reminders
  4. Return success status

### 3.2. Viewer Management Functions

**Function:** `joinLiveStream`
- **Trigger:** HTTPS Callable
- **Purpose:** Join a live stream as viewer
- **Process:**
  1. Verify user authentication
  2. Check stream privacy settings
  3. Check if user is banned
  4. Create viewer document
  5. Increment viewer count
  6. Send join notification to chat
  7. Return stream playback URL and chat token

**Function:** `leaveLiveStream`
- **Trigger:** HTTPS Callable
- **Purpose:** Leave a live stream
- **Process:**
  1. Update viewer document with leave time
  2. Calculate watch time
  3. Decrement viewer count
  4. Update viewer analytics
  5. Return success status

**Function:** `updateViewerHeartbeat`
- **Trigger:** HTTPS Callable
- **Purpose:** Update viewer active status
- **Process:**
  1. Update lastHeartbeat timestamp
  2. Maintain active viewer count
  3. Detect disconnected viewers
  4. Return current stream stats

**Function:** `cleanupInactiveViewers`
- **Trigger:** Scheduled (every 1 minute)
- **Purpose:** Remove viewers who haven't sent heartbeat
- **Process:**
  1. Query viewers with old lastHeartbeat (>2 minutes)
  2. Mark as inactive
  3. Decrement viewer count
  4. Update analytics

### 3.3. Chat and Engagement Functions

**Function:** `sendStreamComment`
- **Trigger:** HTTPS Callable
- **Purpose:** Send a chat message during stream
- **Process:**
  1. Verify user authentication
  2. Check if user is banned or timed out
  3. Validate message content
  4. Check rate limiting
  5. Create comment document
  6. Increment comment count
  7. Broadcast to all viewers (via Firestore realtime)
  8. Return comment data

**Function:** `deleteStreamComment`
- **Trigger:** HTTPS Callable
- **Purpose:** Delete a chat message (moderator action)
- **Process:**
  1. Verify user is broadcaster or moderator
  2. Mark comment as deleted
  3. Log moderation action
  4. Return success status

**Function:** `pinStreamComment`
- **Trigger:** HTTPS Callable
- **Purpose:** Pin a comment in chat
- **Process:**
  1. Verify user is broadcaster
  2. Unpin previous pinned comment
  3. Pin new comment
  4. Return success status

**Function:** `likeStream`
- **Trigger:** HTTPS Callable
- **Purpose:** Send likes to stream
- **Process:**
  1. Verify user authentication
  2. Create/update like document
  3. Increment like count
  4. Create chat notification
  5. Return success status

**Function:** `sendStreamGift`
- **Trigger:** HTTPS Callable
- **Purpose:** Send a gift during stream
- **Process:**
  1. Verify user authentication
  2. Get gift details
  3. Check user has sufficient coins
  4. Deduct coins from sender
  5. Calculate broadcaster and platform shares
  6. Create gift transaction
  7. Update stream revenue
  8. Create chat notification with animation
  9. Update PK battle score if applicable
  10. Send notification to broadcaster
  11. Return gift animation data

### 3.4. Moderation Functions

**Function:** `banUserFromStream`
- **Trigger:** HTTPS Callable
- **Purpose:** Ban a user from stream
- **Process:**
  1. Verify user is broadcaster or moderator
  2. Add user to banned list
  3. Remove user from active viewers
  4. Delete user's recent comments
  5. Log moderation action
  6. Send notification to banned user
  7. Return success status

**Function:** `timeoutUserInStream`
- **Trigger:** HTTPS Callable
- **Purpose:** Temporarily mute a user
- **Process:**
  1. Verify user is broadcaster or moderator
  2. Create timeout record with duration
  3. Prevent user from commenting
  4. Log moderation action
  5. Auto-remove timeout after duration
  6. Return success status

**Function:** `addStreamModerator`
- **Trigger:** HTTPS Callable
- **Purpose:** Add a moderator to stream
- **Process:**
  1. Verify user is broadcaster
  2. Add user to moderators list
  3. Grant moderation permissions
  4. Send notification to new moderator
  5. Return success status

**Function:** `reportStream`
- **Trigger:** HTTPS Callable
- **Purpose:** Report stream for violations
- **Process:**
  1. Verify user authentication
  2. Create report document
  3. Update stream moderation status if multiple reports
  4. Notify moderation team
  5. Optionally auto-suspend stream
  6. Return success status

### 3.5. PK Battle Functions

**Function:** `startPKBattle`
- **Trigger:** HTTPS Callable
- **Purpose:** Start a PK battle between two streams
- **Process:**
  1. Verify both broadcasters agree
  2. Create PK battle document
  3. Link streams together
  4. Initialize scores
  5. Set battle duration
  6. Notify both audiences
  7. Return battle data

**Function:** `updatePKScore`
- **Trigger:** Background (triggered by gifts)
- **Purpose:** Update PK battle scores
- **Process:**
  1. Get active PK battle
  2. Add gift value to appropriate score
  3. Update battle document
  4. Broadcast score update to both streams
  5. Check for battle end
  6. Return updated scores

**Function:** `endPKBattle`
- **Trigger:** HTTPS Callable / Scheduled
- **Purpose:** End a PK battle and declare winner
- **Process:**
  1. Calculate final scores
  2. Determine winner
  3. Update battle status
  4. Award bonus to winner
  5. Unlink streams
  6. Send notifications
  7. Return battle results

### 3.6. Analytics Functions

**Function:** `getStreamAnalytics`
- **Trigger:** HTTPS Callable
- **Purpose:** Get detailed analytics for a stream
- **Process:**
  1. Verify user is broadcaster
  2. Aggregate viewer data
  3. Calculate engagement metrics
  4. Get revenue breakdown
  5. Get top gifters and viewers
  6. Get viewer demographics
  7. Return comprehensive analytics

**Function:** `recordStreamAnalytics`
- **Trigger:** Scheduled (every 5 minutes during stream)
- **Purpose:** Record analytics snapshots
- **Process:**
  1. Query active streams
  2. For each stream, capture:
     - Current viewer count
     - Engagement metrics
     - Revenue data
     - Top participants
  3. Store in analytics subcollection
  4. Update stream document

**Function:** `getStreamReplay`
- **Trigger:** HTTPS Callable
- **Purpose:** Get recorded stream for replay
- **Process:**
  1. Verify stream is recorded
  2. Check user permissions
  3. Generate signed playback URL
  4. Return replay data

## 4. Streaming Infrastructure

### 4.1. RTMP Ingestion

**Technology:** Use a streaming service like:
- **Agora** (recommended for ease of use)
- **Mux** (professional video streaming)
- **AWS IVS** (Amazon Interactive Video Service)
- **Custom RTMP server** (nginx-rtmp module)

**Flow:**
1. Broadcaster gets RTMP URL and stream key
2. Broadcaster uses OBS or mobile app to stream to RTMP endpoint
3. Service transcodes and distributes stream
4. Viewers receive HLS/DASH playback URLs

### 4.2. WebRTC for Low Latency

For ultra-low latency (< 1 second), use WebRTC:
- **Agora SDK** for mobile apps
- **Daily.co** or **Twilio Live** for web
- Direct peer-to-peer when possible
- Fallback to HLS for scalability

### 4.3. Recording

**Storage:** Firebase Storage or Cloud Storage
**Process:**
1. Enable recording when stream starts
2. Stream service records to cloud storage
3. Generate thumbnail from recording
4. Make available for replay
5. Optionally delete after 7-30 days

### 4.4. CDN Distribution

Use CDN for global distribution:
- Firebase Hosting CDN
- Cloudflare Stream
- AWS CloudFront
- Fastly

## 5. Real-time Features

### 5.1. Live Chat

**Implementation:** Firestore realtime listeners
- Viewers subscribe to `streamComments` collection
- New comments appear instantly
- Use pagination (last 100 messages)
- Implement rate limiting (1 message per 2 seconds)

### 5.2. Viewer Count

**Implementation:** Firestore aggregation
- Update viewer count on join/leave
- Use sharded counters for high-traffic streams
- Broadcast count updates every 5 seconds

### 5.3. Gift Animations

**Implementation:** Real-time notifications
- Send gift event through Firestore
- Trigger animation on all viewers' screens
- Show combo counter for multiple gifts
- Display top gifters leaderboard

## 6. Monetization

### 6.1. Gift Revenue

**Standard Broadcasters:**
- Receive 50% of gift value
- Platform retains 50%

**Premium Broadcasters:**
- Receive 90% of gift value
- Platform retains 10%

### 6.2. Revenue Distribution

**Process:**
1. Gift sent during stream
2. Coins deducted from sender
3. Revenue calculated based on broadcaster type
4. Broadcaster share added to balance
5. Platform share added to revenue
6. Transaction recorded
7. Broadcaster can withdraw after stream

### 6.3. Minimum Payout

- Minimum balance for withdrawal: $10 USD
- Withdrawals processed within 3-5 business days
- Support PayPal and bank transfer

## 7. Performance Optimizations

### 7.1. Scalability

- Use sharded counters for high-traffic metrics
- Implement pagination for chat and viewers
- Cache stream metadata
- Use Cloud Tasks for background processing
- Implement rate limiting on all endpoints

### 7.2. Latency Reduction

- Use WebRTC for sub-second latency
- Deploy streaming servers in multiple regions
- Use CDN for playback distribution
- Optimize chat with batched updates

### 7.3. Cost Optimization

- Auto-scale streaming resources
- Use adaptive bitrate streaming
- Compress recordings
- Delete old recordings
- Implement viewer limits for free accounts

## 8. Security Considerations

### 8.1. Access Control

- Verify broadcaster identity
- Protect stream keys
- Implement privacy settings
- Ban abusive users
- Verify gift transactions

### 8.2. Content Moderation

- Real-time content analysis
- Automated profanity filtering
- Moderator tools
- User reporting system
- Stream suspension for violations

### 8.3. DDoS Protection

- Rate limiting on all endpoints
- CAPTCHA for suspicious activity
- IP blocking for abuse
- CDN-level protection

## 9. Integration Points

### 9.1. With Other Systems

- **Profile System:** Display live indicator on profile
- **Notifications:** Notify followers when live
- **Gifts:** Send gifts during streams
- **Messaging:** Share stream links in DMs
- **Short Videos:** Promote streams in feed
- **Stories:** Cross-promote streams in stories
- **Wallet:** Process gift payments

### 9.2. External Services

- **Agora/Mux:** Video streaming infrastructure
- **Firebase Storage:** Recording storage
- **Cloud Functions:** Backend processing
- **Firestore:** Real-time data sync
- **FCM:** Push notifications

## 10. Monitoring and Analytics

### 10.1. Key Metrics

- Concurrent streams
- Total viewers
- Average watch time
- Gift revenue per stream
- Stream quality metrics
- Latency measurements
- Error rates

### 10.2. Broadcaster Analytics

- Total views
- Peak viewers
- Average watch time
- Revenue earned
- Top gifters
- Viewer demographics
- Engagement rate
- Follower growth

## 11. Future Enhancements

- Multi-camera streaming
- Green screen effects
- Advanced beauty filters
- Stream overlays and alerts
- Subscriber-only streams
- Paid ticket events
- Stream raids (sending viewers to another stream)
- Co-hosting with multiple broadcasters
- Stream highlights and clips
- Automated stream moderation AI
- Virtual gifts with AR effects
- Stream tournaments and competitions

This comprehensive design provides a production-ready foundation for live streaming functionality in Spaktok, with scalability, monetization, and user engagement at its core.
