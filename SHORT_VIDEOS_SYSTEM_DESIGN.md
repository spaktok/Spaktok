# Spaktok Short Videos (Reels/Feed) System Design

This document outlines the comprehensive design for the Short Videos (Reels/Feed) system in Spaktok, similar to TikTok's core functionality. The system enables users to upload, discover, interact with, and share short-form video content.

## 1. Core Concepts

**Short Videos (Reels)** are the primary content format in Spaktok, featuring vertical video content typically ranging from 15 seconds to 3 minutes. The system provides an infinite scroll feed with personalized recommendations based on user preferences, engagement patterns, and trending content.

**Key Features:**
- Video upload with compression and optimization
- Personalized feed algorithm
- Engagement features (likes, comments, shares, saves)
- Hashtag and challenge support
- Sound/audio library integration
- Video effects and filters metadata
- Trending content discovery
- User-generated content moderation

## 2. Firestore Data Models

### 2.1. `videos` Collection

Stores all video content and associated metadata.

**Document ID:** Auto-generated `videoId`

| Field Name | Type | Description |
|:-----------|:-----|:------------|
| `videoId` | `string` | Unique identifier for the video |
| `userId` | `string` | ID of the user who uploaded the video |
| `username` | `string` | Username of the uploader (denormalized for performance) |
| `userProfileImage` | `string` | Profile image URL of uploader (denormalized) |
| `videoUrl` | `string` | Firebase Storage URL to the video file |
| `thumbnailUrl` | `string` | URL to the video thumbnail image |
| `caption` | `string` | Video description/caption |
| `hashtags` | `array<string>` | Array of hashtag strings (without #) |
| `mentions` | `array<string>` | Array of mentioned userIds |
| `soundId` | `string` | Reference to the sound/audio used (optional) |
| `soundName` | `string` | Name of the sound (denormalized) |
| `duration` | `number` | Video duration in seconds |
| `width` | `number` | Video width in pixels |
| `height` | `number` | Video height in pixels |
| `fileSize` | `number` | File size in bytes |
| `views` | `number` | Total view count |
| `likes` | `number` | Total like count |
| `comments` | `number` | Total comment count |
| `shares` | `number` | Total share count |
| `saves` | `number` | Total save count |
| `location` | `map` | Optional location data |
| `location.latitude` | `number` | Latitude coordinate |
| `location.longitude` | `number` | Longitude coordinate |
| `location.name` | `string` | Location name/address |
| `privacy` | `string` | Privacy setting: `public`, `friends`, `private` |
| `allowComments` | `boolean` | Whether comments are allowed |
| `allowDuet` | `boolean` | Whether duets are allowed |
| `allowStitch` | `boolean` | Whether stitches are allowed |
| `isAgeRestricted` | `boolean` | Whether content is age-restricted |
| `status` | `string` | Video status: `processing`, `active`, `hidden`, `removed` |
| `moderationStatus` | `string` | Moderation status: `pending`, `approved`, `flagged`, `removed` |
| `moderationFlags` | `array<string>` | Array of moderation flag reasons |
| `uploadedAt` | `timestamp` | Server timestamp of upload |
| `publishedAt` | `timestamp` | Server timestamp when video became public |
| `lastModified` | `timestamp` | Last modification timestamp |
| `engagementScore` | `number` | Calculated engagement score for ranking |
| `trendingScore` | `number` | Trending algorithm score |
| `challengeId` | `string` | Reference to challenge (optional) |
| `effects` | `array<string>` | Array of effect IDs used in the video |
| `language` | `string` | Primary language of the content |
| `transcription` | `string` | Auto-generated transcription (for accessibility) |

### 2.2. `videoLikes` Collection

Tracks user likes on videos for quick lookup and feed filtering.

**Document ID:** `{userId}_{videoId}`

| Field Name | Type | Description |
|:-----------|:-----|:------------|
| `userId` | `string` | ID of the user who liked |
| `videoId` | `string` | ID of the video liked |
| `timestamp` | `timestamp` | When the like occurred |

### 2.3. `videoComments` Collection

Stores comments on videos with threading support.

**Document ID:** Auto-generated `commentId`

| Field Name | Type | Description |
|:-----------|:-----|:------------|
| `commentId` | `string` | Unique comment identifier |
| `videoId` | `string` | ID of the video being commented on |
| `userId` | `string` | ID of the commenter |
| `username` | `string` | Username of commenter (denormalized) |
| `userProfileImage` | `string` | Profile image of commenter (denormalized) |
| `text` | `string` | Comment text content |
| `parentCommentId` | `string` | ID of parent comment (null for top-level) |
| `likes` | `number` | Number of likes on the comment |
| `replies` | `number` | Number of replies to this comment |
| `timestamp` | `timestamp` | When comment was posted |
| `isEdited` | `boolean` | Whether comment has been edited |
| `isPinned` | `boolean` | Whether comment is pinned by creator |
| `moderationStatus` | `string` | Moderation status: `active`, `hidden`, `removed` |

### 2.4. `videoShares` Collection

Tracks video shares for analytics and trending calculations.

**Document ID:** Auto-generated

| Field Name | Type | Description |
|:-----------|:-----|:------------|
| `userId` | `string` | ID of the user who shared |
| `videoId` | `string` | ID of the video shared |
| `shareMethod` | `string` | Method: `internal`, `whatsapp`, `instagram`, `copy_link`, etc. |
| `timestamp` | `timestamp` | When the share occurred |

### 2.5. `videoSaves` Collection

Tracks saved videos (bookmarks) for users.

**Document ID:** `{userId}_{videoId}`

| Field Name | Type | Description |
|:-----------|:-----|:------------|
| `userId` | `string` | ID of the user who saved |
| `videoId` | `string` | ID of the video saved |
| `collectionId` | `string` | Optional collection/folder ID |
| `timestamp` | `timestamp` | When the save occurred |

### 2.6. `sounds` Collection

Library of audio tracks that can be used in videos.

**Document ID:** Auto-generated `soundId`

| Field Name | Type | Description |
|:-----------|:-----|:------------|
| `soundId` | `string` | Unique sound identifier |
| `name` | `string` | Sound/track name |
| `artist` | `string` | Artist or creator name |
| `audioUrl` | `string` | Firebase Storage URL to audio file |
| `coverImageUrl` | `string` | Cover art URL |
| `duration` | `number` | Audio duration in seconds |
| `category` | `string` | Category: `original`, `trending`, `licensed`, `user_uploaded` |
| `usageCount` | `number` | Number of videos using this sound |
| `isTrending` | `boolean` | Whether sound is currently trending |
| `createdBy` | `string` | UserId if user-uploaded, null for platform sounds |
| `createdAt` | `timestamp` | Creation timestamp |
| `tags` | `array<string>` | Search tags for the sound |

### 2.7. `hashtags` Collection

Tracks hashtag usage and trending hashtags.

**Document ID:** Hashtag text (lowercase, without #)

| Field Name | Type | Description |
|:-----------|:-----|:------------|
| `tag` | `string` | The hashtag text |
| `usageCount` | `number` | Total number of videos using this hashtag |
| `viewCount` | `number` | Total views of videos with this hashtag |
| `trendingScore` | `number` | Calculated trending score |
| `isTrending` | `boolean` | Whether currently trending |
| `category` | `string` | Optional category classification |
| `lastUsed` | `timestamp` | Last time hashtag was used |
| `createdAt` | `timestamp` | First usage timestamp |

### 2.8. `challenges` Collection

Stores video challenges that users can participate in.

**Document ID:** Auto-generated `challengeId`

| Field Name | Type | Description |
|:-----------|:-----|:------------|
| `challengeId` | `string` | Unique challenge identifier |
| `title` | `string` | Challenge title |
| `description` | `string` | Challenge description and rules |
| `hashtag` | `string` | Associated hashtag |
| `coverImageUrl` | `string` | Challenge cover image |
| `createdBy` | `string` | UserId of challenge creator (can be admin) |
| `startDate` | `timestamp` | Challenge start date |
| `endDate` | `timestamp` | Challenge end date (optional) |
| `participantCount` | `number` | Number of participants |
| `videoCount` | `number` | Number of videos submitted |
| `totalViews` | `number` | Total views across all challenge videos |
| `prizes` | `array<map>` | Array of prize information |
| `rules` | `string` | Detailed rules and guidelines |
| `status` | `string` | Status: `upcoming`, `active`, `ended` |
| `isFeatured` | `boolean` | Whether featured on discovery page |

### 2.9. `userFeed` Collection (Subcollection under users)

Personalized feed cache for each user to improve performance.

**Path:** `users/{userId}/feed/{videoId}`

| Field Name | Type | Description |
|:-----------|:-----|:------------|
| `videoId` | `string` | Reference to video in main collection |
| `score` | `number` | Personalization score for this user |
| `reason` | `string` | Why this video was recommended |
| `addedAt` | `timestamp` | When added to feed |
| `viewed` | `boolean` | Whether user has viewed this video |

### 2.10. `videoViews` Collection

Tracks individual video views for analytics and preventing duplicate counting.

**Document ID:** `{userId}_{videoId}`

| Field Name | Type | Description |
|:-----------|:-----|:------------|
| `userId` | `string` | ID of the viewer |
| `videoId` | `string` | ID of the video viewed |
| `watchTime` | `number` | Total watch time in seconds |
| `completionRate` | `number` | Percentage of video watched (0-100) |
| `timestamp` | `timestamp` | First view timestamp |
| `lastViewedAt` | `timestamp` | Most recent view timestamp |
| `viewCount` | `number` | Number of times user viewed this video |
| `source` | `string` | Source: `feed`, `profile`, `hashtag`, `sound`, `share` |

## 3. Cloud Functions

### 3.1. Video Upload and Processing

**Function:** `uploadVideo`
- **Trigger:** HTTPS Callable
- **Purpose:** Handle video upload initiation and return signed upload URL
- **Process:**
  1. Validate user authentication and permissions
  2. Check user upload limits and quotas
  3. Generate unique videoId
  4. Create signed upload URL for Firebase Storage
  5. Create initial video document with `status: 'processing'`
  6. Return upload URL and videoId to client

**Function:** `processVideoUpload`
- **Trigger:** Firebase Storage onCreate
- **Purpose:** Process uploaded video (compression, thumbnail generation)
- **Process:**
  1. Trigger when video uploaded to Storage
  2. Generate thumbnail from first frame
  3. Extract video metadata (duration, dimensions, size)
  4. Optionally transcode/compress video for optimization
  5. Run content moderation check (AI-based)
  6. Update video document with processed data
  7. Set `status: 'active'` if moderation passes
  8. Generate initial feed entries for followers

**Function:** `deleteVideo`
- **Trigger:** HTTPS Callable
- **Purpose:** Delete a video and all associated data
- **Process:**
  1. Verify user is video owner or admin
  2. Delete video file from Storage
  3. Delete thumbnail from Storage
  4. Update video document status to `removed`
  5. Clean up associated likes, comments, shares, saves
  6. Update user statistics

### 3.2. Engagement Functions

**Function:** `likeVideo`
- **Trigger:** HTTPS Callable
- **Parameters:** `videoId`, `action` (like/unlike)
- **Process:**
  1. Verify user authentication
  2. Check if like already exists
  3. Create/delete document in `videoLikes` collection
  4. Increment/decrement like count in video document
  5. Update video engagement score
  6. Send notification to video owner (if liked)
  7. Return updated like status

**Function:** `commentOnVideo`
- **Trigger:** HTTPS Callable
- **Parameters:** `videoId`, `text`, `parentCommentId` (optional)
- **Process:**
  1. Verify user authentication
  2. Validate comment content (length, profanity check)
  3. Create comment document
  4. Increment comment count on video
  5. If reply, increment reply count on parent comment
  6. Send notification to video owner or parent commenter
  7. Return comment data

**Function:** `shareVideo`
- **Trigger:** HTTPS Callable
- **Parameters:** `videoId`, `shareMethod`
- **Process:**
  1. Verify user authentication
  2. Create share record
  3. Increment share count on video
  4. Update video trending score
  5. Generate share link with tracking parameters
  6. Return share URL

**Function:** `saveVideo`
- **Trigger:** HTTPS Callable
- **Parameters:** `videoId`, `collectionId` (optional)
- **Process:**
  1. Verify user authentication
  2. Create/delete save record
  3. Increment/decrement save count on video
  4. Return updated save status

### 3.3. Feed Generation Functions

**Function:** `generateUserFeed`
- **Trigger:** HTTPS Callable / Scheduled (Cloud Scheduler)
- **Purpose:** Generate personalized feed for user
- **Process:**
  1. Fetch user preferences and interaction history
  2. Get videos from followed users
  3. Get videos with hashtags user engages with
  4. Get trending videos
  5. Apply personalization algorithm:
     - User interests and past engagement
     - Video freshness (recent uploads weighted higher)
     - Engagement metrics (likes, comments, shares)
     - Completion rate of similar videos
     - Diversity (mix of content types)
  6. Score and rank videos
  7. Cache top 50-100 videos in user's feed subcollection
  8. Return feed items

**Function:** `recordVideoView`
- **Trigger:** HTTPS Callable
- **Parameters:** `videoId`, `watchTime`, `completionRate`, `source`
- **Process:**
  1. Verify user authentication
  2. Create/update view record
  3. Increment view count on video (once per user)
  4. Update user's viewing history
  5. Update video engagement and trending scores
  6. Feed data to recommendation algorithm
  7. Return success status

**Function:** `getTrendingVideos`
- **Trigger:** HTTPS Callable
- **Purpose:** Get current trending videos
- **Process:**
  1. Query videos with high trending scores
  2. Filter by time window (last 24-48 hours)
  3. Consider engagement velocity (rate of engagement growth)
  4. Return ranked list of trending videos

### 3.4. Discovery Functions

**Function:** `searchVideos`
- **Trigger:** HTTPS Callable
- **Parameters:** `query`, `filters`, `pagination`
- **Process:**
  1. Parse search query
  2. Search in video captions, hashtags, usernames
  3. Apply filters (date range, duration, location)
  4. Rank results by relevance and engagement
  5. Return paginated results

**Function:** `getVideosByHashtag`
- **Trigger:** HTTPS Callable
- **Parameters:** `hashtag`, `sortBy`, `pagination`
- **Process:**
  1. Query videos containing hashtag
  2. Sort by specified criteria (trending, recent, popular)
  3. Return paginated results
  4. Update hashtag view count

**Function:** `getVideosBySound`
- **Trigger:** HTTPS Callable
- **Parameters:** `soundId`, `pagination`
- **Process:**
  1. Query videos using specified sound
  2. Sort by engagement or recency
  3. Return paginated results
  4. Update sound usage statistics

**Function:** `getTrendingHashtags`
- **Trigger:** HTTPS Callable / Scheduled
- **Purpose:** Get current trending hashtags
- **Process:**
  1. Calculate trending scores for hashtags
  2. Consider usage velocity and total engagement
  3. Return top trending hashtags with metadata

### 3.5. Moderation Functions

**Function:** `moderateVideo`
- **Trigger:** HTTPS Callable (admin only)
- **Parameters:** `videoId`, `action`, `reason`
- **Process:**
  1. Verify admin privileges
  2. Update video moderation status
  3. If flagged/removed, hide from feeds
  4. Send notification to video owner
  5. Record moderation action in audit log
  6. Apply penalties if necessary

**Function:** `autoModerateContent`
- **Trigger:** Called by processVideoUpload
- **Purpose:** Automatic content moderation using AI
- **Process:**
  1. Analyze video frames for inappropriate content
  2. Check audio transcription for violations
  3. Scan caption and hashtags for prohibited terms
  4. Calculate risk score
  5. Auto-approve, flag for review, or auto-reject
  6. Return moderation result

### 3.6. Analytics Functions

**Function:** `updateVideoAnalytics`
- **Trigger:** Scheduled (every 5-15 minutes)
- **Purpose:** Batch update video analytics and scores
- **Process:**
  1. Aggregate recent engagement data
  2. Update engagement scores
  3. Calculate trending scores
  4. Update hashtag and sound statistics
  5. Identify trending content
  6. Clean up old feed cache entries

**Function:** `getVideoAnalytics`
- **Trigger:** HTTPS Callable
- **Parameters:** `videoId`
- **Purpose:** Get detailed analytics for video owner
- **Process:**
  1. Verify user is video owner
  2. Aggregate view data (demographics, locations, sources)
  3. Calculate engagement metrics over time
  4. Return comprehensive analytics report

## 4. Feed Algorithm

The feed algorithm combines multiple signals to create a personalized experience:

### 4.1. Scoring Components

**User Interest Score (40%):**
- Hashtags user has engaged with
- Accounts user follows
- Content categories user watches
- Historical engagement patterns

**Content Quality Score (25%):**
- Engagement rate (likes, comments, shares per view)
- Completion rate
- Share rate
- Save rate

**Freshness Score (15%):**
- Time since upload (exponential decay)
- Recent engagement velocity

**Diversity Score (10%):**
- Content type variety
- Creator diversity
- Topic diversity

**Social Proof Score (10%):**
- Engagement from user's friends
- Trending status
- Challenge participation

### 4.2. Ranking Formula

```
FinalScore = (UserInterest × 0.4) + (ContentQuality × 0.25) + 
             (Freshness × 0.15) + (Diversity × 0.1) + (SocialProof × 0.1)
```

### 4.3. Feed Refresh Strategy

- Generate initial feed cache on user login
- Refresh top 20 items every 5 minutes
- Add new items as user scrolls
- Remove viewed items after 24 hours
- Inject trending content every 5-10 videos

## 5. Storage Structure

### 5.1. Firebase Storage Paths

```
/videos/{userId}/{videoId}/
  - original.mp4 (original upload)
  - processed.mp4 (optimized version)
  - thumbnail.jpg (video thumbnail)
  
/sounds/{soundId}/
  - audio.mp3
  - cover.jpg
```

### 5.2. Video Processing Pipeline

1. **Upload:** User uploads video to temporary location
2. **Validation:** Check file format, size, duration
3. **Transcoding:** Convert to standard format (H.264/AAC)
4. **Compression:** Optimize for mobile streaming
5. **Thumbnail:** Generate from first frame or user selection
6. **Moderation:** AI-based content analysis
7. **Publishing:** Move to permanent location and activate

## 6. Performance Optimizations

### 6.1. Caching Strategy

- Cache user feeds in Firestore subcollections
- Cache trending videos in memory (Cloud Functions)
- Use CDN for video delivery
- Denormalize frequently accessed data (username, profile image)

### 6.2. Query Optimization

- Create composite indexes for common queries
- Use pagination for all list endpoints
- Limit feed generation to top 100 items
- Batch write operations where possible

### 6.3. Scalability Considerations

- Shard counters for high-traffic videos
- Use Cloud Tasks for background processing
- Implement rate limiting on upload and engagement
- Use Firebase Extensions for video transcoding

## 7. Security Considerations

### 7.1. Access Control

- Users can only upload videos to their own account
- Users can only delete their own videos
- Video privacy settings enforced at query level
- Age-restricted content filtered based on user age

### 7.2. Content Safety

- Automatic moderation on upload
- User reporting system
- Admin moderation dashboard
- DMCA takedown process
- Age verification for sensitive content

### 7.3. Rate Limiting

- Upload limits: 10 videos per day for standard users
- Like/comment limits to prevent spam
- API rate limiting per user
- Throttling for suspicious activity

## 8. Integration Points

### 8.1. With Other Systems

- **Profile System:** User data, followers, statistics
- **Notifications:** Engagement notifications
- **Messaging:** Share videos in chats
- **Stories:** Cross-post to stories
- **Live Streaming:** Promote live streams in feed
- **Gifts:** Send gifts on videos
- **Ads System:** Inject promoted content
- **Reports:** Report inappropriate videos

### 8.2. External Services

- **Firebase Storage:** Video and thumbnail hosting
- **Cloud Vision API:** Content moderation
- **Cloud Speech-to-Text:** Transcription for accessibility
- **Cloud Translation:** Caption translation
- **CDN:** Video delivery optimization

## 9. Monitoring and Analytics

### 9.1. Key Metrics

- Daily active users (DAU)
- Videos uploaded per day
- Average watch time
- Engagement rate
- Feed refresh rate
- Video processing time
- Storage usage
- CDN bandwidth

### 9.2. Alerting

- Failed video uploads
- Moderation queue backlog
- High error rates in Cloud Functions
- Storage quota warnings
- Unusual engagement patterns (potential abuse)

## 10. Future Enhancements

- AI-powered video editing suggestions
- Collaborative videos (duets, stitches)
- Live video reactions
- Advanced analytics dashboard
- Creator monetization tools
- Video series/playlists
- Scheduled video publishing
- Multi-language caption support
- Accessibility features (auto-captions, audio descriptions)

This design provides a comprehensive foundation for the Short Videos system, enabling TikTok-like functionality with scalability, performance, and user engagement at its core.
