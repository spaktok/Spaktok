# Spaktok Stories System Design

This document outlines the comprehensive design for the Stories system in Spaktok, inspired by Instagram and Snapchat Stories. Stories are ephemeral content that disappears after 24 hours, allowing users to share moments throughout their day with followers.

## 1. Core Concepts

**Stories** are temporary photo or video posts that remain visible for 24 hours before automatically disappearing. They provide a more casual, spontaneous way for users to share content compared to permanent posts.

**Key Features:**
- Photo and video stories (up to 60 seconds)
- 24-hour automatic expiration
- View tracking and analytics
- Interactive elements (polls, questions, quizzes, countdowns)
- Story replies (direct messages)
- Story highlights (permanent story collections)
- Privacy controls (public, friends, custom lists)
- Story sharing and reposting
- Creative tools (filters, stickers, text, drawing)

## 2. Firestore Data Models

### 2.1. `stories` Collection

Stores all story content and metadata.

**Document ID:** Auto-generated `storyId`

| Field Name | Type | Description |
|:-----------|:-----|:------------|
| `storyId` | `string` | Unique identifier for the story |
| `userId` | `string` | ID of the user who posted the story |
| `username` | `string` | Username of poster (denormalized) |
| `userProfileImage` | `string` | Profile image URL of poster (denormalized) |
| `type` | `string` | Story type: `photo`, `video`, `text` |
| `mediaUrl` | `string` | Firebase Storage URL to media file |
| `thumbnailUrl` | `string` | Thumbnail URL (for videos) |
| `duration` | `number` | Display duration in seconds (default: 5 for photos, video length for videos) |
| `width` | `number` | Media width in pixels |
| `height` | `number` | Media height in pixels |
| `caption` | `string` | Optional text caption |
| `textOverlay` | `map` | Text overlay configuration |
| `textOverlay.content` | `string` | Text content |
| `textOverlay.fontFamily` | `string` | Font family name |
| `textOverlay.fontSize` | `number` | Font size |
| `textOverlay.color` | `string` | Text color (hex) |
| `textOverlay.backgroundColor` | `string` | Background color (hex) |
| `textOverlay.alignment` | `string` | Text alignment: `left`, `center`, `right` |
| `textOverlay.position` | `map` | Position coordinates (x, y) |
| `stickers` | `array<map>` | Array of sticker objects |
| `filters` | `array<string>` | Applied filter IDs |
| `music` | `map` | Background music information |
| `music.soundId` | `string` | Reference to sound |
| `music.soundName` | `string` | Sound name |
| `music.startTime` | `number` | Start time in audio track |
| `interactiveElements` | `array<map>` | Interactive elements (polls, questions, etc.) |
| `mentions` | `array<string>` | Array of mentioned userIds |
| `hashtags` | `array<string>` | Array of hashtags |
| `location` | `map` | Optional location data |
| `location.latitude` | `number` | Latitude coordinate |
| `location.longitude` | `number` | Longitude coordinate |
| `location.name` | `string` | Location name |
| `privacy` | `string` | Privacy setting: `public`, `friends`, `close_friends`, `custom` |
| `customAudience` | `array<string>` | Array of userIds if privacy is `custom` |
| `allowReplies` | `boolean` | Whether replies are allowed |
| `allowSharing` | `boolean` | Whether story can be shared |
| `views` | `number` | Total view count |
| `replies` | `number` | Total reply count |
| `shares` | `number` | Total share count |
| `createdAt` | `timestamp` | Story creation timestamp |
| `expiresAt` | `timestamp` | Expiration timestamp (24 hours from creation) |
| `isExpired` | `boolean` | Whether story has expired |
| `isHighlighted` | `boolean` | Whether story is saved to highlights |
| `highlightIds` | `array<string>` | Array of highlight collection IDs |
| `status` | `string` | Status: `active`, `expired`, `deleted` |
| `moderationStatus` | `string` | Moderation status: `pending`, `approved`, `flagged` |

### 2.2. `storyViews` Collection

Tracks who viewed each story and when.

**Document ID:** `{storyId}_{userId}`

| Field Name | Type | Description |
|:-----------|:-----|:------------|
| `storyId` | `string` | ID of the story viewed |
| `userId` | `string` | ID of the viewer |
| `username` | `string` | Username of viewer (denormalized) |
| `userProfileImage` | `string` | Profile image of viewer (denormalized) |
| `viewedAt` | `timestamp` | When the story was viewed |
| `watchTime` | `number` | How long the story was watched (seconds) |
| `completionRate` | `number` | Percentage watched (0-100) |
| `source` | `string` | Source: `feed`, `profile`, `direct_link` |

### 2.3. `storyReplies` Collection

Stores direct message replies to stories.

**Document ID:** Auto-generated `replyId`

| Field Name | Type | Description |
|:-----------|:-----|:------------|
| `replyId` | `string` | Unique reply identifier |
| `storyId` | `string` | ID of the story being replied to |
| `senderId` | `string` | ID of the user sending the reply |
| `recipientId` | `string` | ID of the story owner |
| `messageText` | `string` | Reply message text |
| `messageType` | `string` | Type: `text`, `reaction`, `media` |
| `reactionType` | `string` | If reaction: `heart`, `fire`, `laugh`, etc. |
| `mediaUrl` | `string` | If media reply, URL to media |
| `timestamp` | `timestamp` | When reply was sent |
| `isRead` | `boolean` | Whether reply has been read |
| `conversationId` | `string` | Reference to DM conversation |

### 2.4. `storyHighlights` Collection

Stores permanent collections of stories (highlights).

**Document ID:** Auto-generated `highlightId`

| Field Name | Type | Description |
|:-----------|:-----|:------------|
| `highlightId` | `string` | Unique highlight identifier |
| `userId` | `string` | ID of the user who owns the highlight |
| `title` | `string` | Highlight collection title |
| `coverImageUrl` | `string` | Cover image for the highlight |
| `storyIds` | `array<string>` | Array of story IDs in this highlight |
| `storyCount` | `number` | Number of stories in highlight |
| `createdAt` | `timestamp` | When highlight was created |
| `updatedAt` | `timestamp` | Last update timestamp |
| `order` | `number` | Display order on profile |
| `privacy` | `string` | Privacy setting: `public`, `friends`, `private` |

### 2.5. `storyInteractions` Collection

Tracks interactions with interactive story elements.

**Document ID:** Auto-generated

| Field Name | Type | Description |
|:-----------|:-----|:------------|
| `storyId` | `string` | ID of the story |
| `elementId` | `string` | ID of the interactive element |
| `elementType` | `string` | Type: `poll`, `question`, `quiz`, `slider`, `countdown` |
| `userId` | `string` | ID of the user interacting |
| `response` | `map` | User's response data |
| `timestamp` | `timestamp` | When interaction occurred |

### 2.6. `storyArchive` Collection (Subcollection under users)

Stores user's expired stories for personal viewing.

**Path:** `users/{userId}/storyArchive/{storyId}`

| Field Name | Type | Description |
|:-----------|:-----|:------------|
| `storyId` | `string` | Reference to original story |
| `archivedAt` | `timestamp` | When story was archived |
| `originalCreatedAt` | `timestamp` | Original creation date |
| `mediaUrl` | `string` | URL to archived media |
| `thumbnailUrl` | `string` | Thumbnail URL |
| `metadata` | `map` | Original story metadata |

### 2.7. `closeFriendsList` Collection (Subcollection under users)

Stores user's close friends list for story privacy.

**Path:** `users/{userId}/closeFriends/{friendId}`

| Field Name | Type | Description |
|:-----------|:-----|:------------|
| `friendId` | `string` | ID of the close friend |
| `username` | `string` | Username (denormalized) |
| `profileImage` | `string` | Profile image (denormalized) |
| `addedAt` | `timestamp` | When added to close friends |

## 3. Cloud Functions

### 3.1. Story Creation and Management

**Function:** `createStory`
- **Trigger:** HTTPS Callable
- **Purpose:** Create a new story
- **Process:**
  1. Verify user authentication
  2. Validate media file and metadata
  3. Generate unique storyId
  4. Upload media to Firebase Storage
  5. Generate thumbnail for videos
  6. Process filters and effects metadata
  7. Set expiration time (24 hours from now)
  8. Create story document
  9. Notify followers of new story
  10. Return story data

**Function:** `deleteStory`
- **Trigger:** HTTPS Callable
- **Purpose:** Delete a story before expiration
- **Process:**
  1. Verify user is story owner
  2. Update story status to `deleted`
  3. Optionally delete media from Storage
  4. Remove from active story feeds
  5. Return success status

**Function:** `expireStories`
- **Trigger:** Scheduled (Cloud Scheduler - runs every hour)
- **Purpose:** Automatically expire stories after 24 hours
- **Process:**
  1. Query stories where `expiresAt` < current time
  2. For each expired story:
     - Update `isExpired` to true
     - Update `status` to `expired`
     - Archive story to user's archive (if enabled)
     - Remove from active feeds
     - Optionally delete media from Storage (if not highlighted)
  3. Clean up expired view records
  4. Log expiration statistics

**Function:** `saveStoryToHighlight`
- **Trigger:** HTTPS Callable
- **Parameters:** `storyId`, `highlightId` (optional)
- **Purpose:** Save story to highlights before it expires
- **Process:**
  1. Verify user is story owner
  2. If no highlightId, create new highlight
  3. Add storyId to highlight's storyIds array
  4. Update story's `isHighlighted` flag
  5. Add highlightId to story's `highlightIds` array
  6. Prevent automatic media deletion on expiration
  7. Return highlight data

**Function:** `createHighlight`
- **Trigger:** HTTPS Callable
- **Parameters:** `title`, `coverImageUrl`, `storyIds`
- **Purpose:** Create a new story highlight collection
- **Process:**
  1. Verify user authentication
  2. Create highlight document
  3. Update referenced stories
  4. Return highlight data

**Function:** `updateHighlight`
- **Trigger:** HTTPS Callable
- **Parameters:** `highlightId`, `updates`
- **Purpose:** Update highlight metadata or story list
- **Process:**
  1. Verify user is highlight owner
  2. Update highlight document
  3. Update story references if needed
  4. Return updated highlight data

**Function:** `deleteHighlight`
- **Trigger:** HTTPS Callable
- **Parameters:** `highlightId`
- **Purpose:** Delete a highlight collection
- **Process:**
  1. Verify user is highlight owner
  2. Remove highlight reference from stories
  3. Delete highlight document
  4. Return success status

### 3.2. Story Viewing and Analytics

**Function:** `recordStoryView`
- **Trigger:** HTTPS Callable
- **Parameters:** `storyId`, `watchTime`, `completionRate`, `source`
- **Purpose:** Record a story view
- **Process:**
  1. Verify user authentication
  2. Check if user already viewed this story
  3. Create/update view record
  4. Increment view count on story (once per user)
  5. Send notification to story owner (optional)
  6. Update user's story viewing history
  7. Return success status

**Function:** `getStoryViewers`
- **Trigger:** HTTPS Callable
- **Parameters:** `storyId`
- **Purpose:** Get list of users who viewed a story
- **Process:**
  1. Verify user is story owner
  2. Query storyViews collection for this story
  3. Sort by view timestamp (most recent first)
  4. Return list of viewers with metadata

**Function:** `getStoryAnalytics`
- **Trigger:** HTTPS Callable
- **Parameters:** `storyId`
- **Purpose:** Get detailed analytics for a story
- **Process:**
  1. Verify user is story owner
  2. Aggregate view data:
     - Total views
     - Unique viewers
     - Average watch time
     - Completion rate
     - View sources
     - Viewer demographics
  3. Aggregate interaction data (polls, questions, etc.)
  4. Calculate engagement metrics
  5. Return analytics report

### 3.3. Story Feed and Discovery

**Function:** `getStoriesFeed`
- **Trigger:** HTTPS Callable
- **Purpose:** Get stories from followed users
- **Process:**
  1. Verify user authentication
  2. Get list of users the current user follows
  3. Query active stories from followed users
  4. Filter by privacy settings
  5. Group stories by user
  6. Sort users by:
     - Users with unseen stories first
     - Most recent story timestamp
  7. Return grouped stories feed

**Function:** `getUserStories`
- **Trigger:** HTTPS Callable
- **Parameters:** `userId`
- **Purpose:** Get all active stories from a specific user
- **Process:**
  1. Verify user has permission to view
  2. Query active stories for the user
  3. Filter by privacy settings
  4. Sort by creation timestamp
  5. Mark which stories current user has viewed
  6. Return stories list

**Function:** `getStoryHighlights`
- **Trigger:** HTTPS Callable
- **Parameters:** `userId`
- **Purpose:** Get user's story highlights
- **Process:**
  1. Query highlights for the user
  2. Filter by privacy settings
  3. Sort by order field
  4. Return highlights with cover images

**Function:** `getHighlightStories`
- **Trigger:** HTTPS Callable
- **Parameters:** `highlightId`
- **Purpose:** Get stories in a specific highlight
- **Process:**
  1. Verify user has permission to view
  2. Get highlight document
  3. Fetch stories by IDs in highlight
  4. Return stories in order

### 3.4. Story Interactions

**Function:** `replyToStory`
- **Trigger:** HTTPS Callable
- **Parameters:** `storyId`, `messageText`, `messageType`, `reactionType`
- **Purpose:** Send a reply to a story
- **Process:**
  1. Verify user authentication
  2. Check if story allows replies
  3. Create reply document
  4. Increment reply count on story
  5. Create/update DM conversation
  6. Send notification to story owner
  7. Return reply data

**Function:** `interactWithStoryElement`
- **Trigger:** HTTPS Callable
- **Parameters:** `storyId`, `elementId`, `response`
- **Purpose:** Interact with story elements (polls, questions, etc.)
- **Process:**
  1. Verify user authentication
  2. Validate element exists and is interactive
  3. Check if user already interacted
  4. Create/update interaction record
  5. Update element response aggregates
  6. Send notification to story owner (for questions)
  7. Return updated element data

**Function:** `getStoryElementResponses`
- **Trigger:** HTTPS Callable
- **Parameters:** `storyId`, `elementId`
- **Purpose:** Get responses to interactive story element
- **Process:**
  1. Verify user is story owner
  2. Query interactions for this element
  3. Aggregate response data
  4. Return response statistics and details

**Function:** `shareStory`
- **Trigger:** HTTPS Callable
- **Parameters:** `storyId`, `shareMethod`, `recipientIds`
- **Purpose:** Share a story with others
- **Process:**
  1. Verify user authentication
  2. Check if story allows sharing
  3. If sharing to DM, create messages
  4. If reposting, create new story with attribution
  5. Increment share count
  6. Send notifications
  7. Return success status

### 3.5. Privacy and Close Friends

**Function:** `addToCloseFriends`
- **Trigger:** HTTPS Callable
- **Parameters:** `friendId`
- **Purpose:** Add user to close friends list
- **Process:**
  1. Verify user authentication
  2. Create close friend document
  3. Send notification to friend (optional)
  4. Return success status

**Function:** `removeFromCloseFriends`
- **Trigger:** HTTPS Callable
- **Parameters:** `friendId`
- **Purpose:** Remove user from close friends list
- **Process:**
  1. Verify user authentication
  2. Delete close friend document
  3. Return success status

**Function:** `getCloseFriendsList`
- **Trigger:** HTTPS Callable
- **Purpose:** Get user's close friends list
- **Process:**
  1. Verify user authentication
  2. Query close friends subcollection
  3. Return list of close friends

**Function:** `updateStoryPrivacy`
- **Trigger:** HTTPS Callable
- **Parameters:** `storyId`, `privacy`, `customAudience`
- **Purpose:** Update story privacy settings
- **Process:**
  1. Verify user is story owner
  2. Update story privacy fields
  3. Refresh story visibility in feeds
  4. Return success status

### 3.6. Story Moderation

**Function:** `reportStory`
- **Trigger:** HTTPS Callable
- **Parameters:** `storyId`, `reason`, `details`
- **Purpose:** Report inappropriate story
- **Process:**
  1. Verify user authentication
  2. Create report document
  3. Update story moderation status to `flagged`
  4. Notify moderation team
  5. Optionally auto-hide if multiple reports
  6. Return success status

**Function:** `moderateStory`
- **Trigger:** HTTPS Callable (admin only)
- **Parameters:** `storyId`, `action`, `reason`
- **Purpose:** Take moderation action on story
- **Process:**
  1. Verify admin privileges
  2. Update story moderation status
  3. If removed, hide from all feeds
  4. Send notification to story owner
  5. Apply penalties if necessary
  6. Record moderation action
  7. Return success status

## 4. Interactive Story Elements

### 4.1. Poll Element

**Structure:**
```json
{
  "elementId": "poll_123",
  "type": "poll",
  "question": "Which do you prefer?",
  "options": [
    {"id": "opt1", "text": "Option A", "votes": 0},
    {"id": "opt2", "text": "Option B", "votes": 0}
  ],
  "totalVotes": 0,
  "position": {"x": 0.5, "y": 0.7}
}
```

### 4.2. Question Element

**Structure:**
```json
{
  "elementId": "question_456",
  "type": "question",
  "prompt": "Ask me anything!",
  "responses": [],
  "position": {"x": 0.5, "y": 0.8}
}
```

### 4.3. Quiz Element

**Structure:**
```json
{
  "elementId": "quiz_789",
  "type": "quiz",
  "question": "What's the capital of France?",
  "options": [
    {"id": "opt1", "text": "London", "isCorrect": false},
    {"id": "opt2", "text": "Paris", "isCorrect": true},
    {"id": "opt3", "text": "Berlin", "isCorrect": false}
  ],
  "correctAnswers": 0,
  "totalAnswers": 0,
  "position": {"x": 0.5, "y": 0.7}
}
```

### 4.4. Slider Element

**Structure:**
```json
{
  "elementId": "slider_101",
  "type": "slider",
  "question": "How much do you agree?",
  "minLabel": "Disagree",
  "maxLabel": "Agree",
  "averageValue": 0,
  "totalResponses": 0,
  "position": {"x": 0.5, "y": 0.75}
}
```

### 4.5. Countdown Element

**Structure:**
```json
{
  "elementId": "countdown_202",
  "type": "countdown",
  "title": "My Birthday!",
  "endTime": "2025-12-31T23:59:59Z",
  "position": {"x": 0.5, "y": 0.6}
}
```

## 5. Storage Structure

### 5.1. Firebase Storage Paths

```
/stories/{userId}/{storyId}/
  - media.jpg or media.mp4 (story media)
  - thumbnail.jpg (for videos)
  
/story-highlights/{userId}/{highlightId}/
  - cover.jpg (highlight cover image)
```

### 5.2. Story Processing Pipeline

1. **Upload:** User uploads photo/video
2. **Validation:** Check format, size, duration (max 60s)
3. **Compression:** Optimize for mobile viewing
4. **Thumbnail:** Generate for videos
5. **Filters:** Apply selected filters/effects
6. **Text/Stickers:** Overlay text and stickers
7. **Publishing:** Create story document and notify followers
8. **Expiration:** Auto-expire after 24 hours
9. **Archiving:** Move to user's archive (if enabled)

## 6. Performance Optimizations

### 6.1. Caching Strategy

- Cache active stories feed for each user
- Cache story view status to prevent duplicate counting
- Use CDN for media delivery
- Denormalize user data in story documents

### 6.2. Query Optimization

- Index on userId and expiresAt for feed queries
- Composite index for privacy filtering
- Limit feed queries to followed users only
- Batch fetch stories by user

### 6.3. Scalability Considerations

- Shard view counters for viral stories
- Use Cloud Tasks for background expiration
- Implement pagination for story viewers list
- Compress archived stories aggressively

## 7. Security Considerations

### 7.1. Access Control

- Users can only create stories on their own account
- Privacy settings enforced at query level
- Close friends list is private
- Story viewers list only visible to owner

### 7.2. Content Safety

- Same moderation as regular videos
- User reporting system
- Age-restricted content filtering
- Automatic expiration reduces long-term risk

### 7.3. Rate Limiting

- Story upload limit: 100 per day
- Reply rate limiting to prevent spam
- View recording throttling

## 8. Integration Points

### 8.1. With Other Systems

- **Profile System:** Display active stories on profile
- **Notifications:** Story view and reply notifications
- **Messaging:** Story replies create DM conversations
- **Short Videos:** Cross-post stories to feed
- **Live Streaming:** Promote live streams via stories
- **Followers:** Story visibility based on follow relationships

### 8.2. External Services

- **Firebase Storage:** Media hosting
- **Cloud Vision API:** Content moderation
- **CDN:** Fast media delivery
- **Cloud Scheduler:** Automatic expiration

## 9. Analytics and Metrics

### 9.1. Key Metrics

- Daily active story posters
- Stories posted per day
- Average story views
- Story completion rate
- Reply rate
- Highlight creation rate
- Close friends list size

### 9.2. User Analytics

- Story views over time
- Best performing stories
- Viewer demographics
- Engagement by time of day
- Interactive element response rates

## 10. Future Enhancements

- Story templates
- Collaborative stories
- Story ads
- Shoppable stories (product tags)
- Story insights for business accounts
- Advanced filters and AR effects
- Story scheduling
- Multi-photo stories (carousel)
- Story reactions (emoji quick replies)
- Story mentions with preview
- Location-based story discovery

This design provides a comprehensive foundation for the Stories system, enabling ephemeral content sharing with rich interactivity and engagement features similar to Instagram and Snapchat Stories.
