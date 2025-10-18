# Spaktok Profile System Design

This document outlines the comprehensive design for the user Profile System in Spaktok, providing users with customizable profiles, social connections, and content management capabilities.

## 1. Core Concepts

**User Profiles** serve as the central hub for user identity, content, and social connections within Spaktok. Profiles display user information, content history, statistics, and provide access to various platform features.

**Key Features:**
- Customizable profile information
- Profile and cover photos
- Bio and links
- Content tabs (videos, stories, highlights, live)
- Follower/following system
- Verification badges
- Privacy settings
- Blocking and muting
- Profile analytics
- Account types (standard, premium, business, creator)
- Profile themes and customization
- Achievements and badges

## 2. Firestore Data Models

### 2.1. `users` Collection (Extended)

Core user profile data.

**Document ID:** `userId`

| Field Name | Type | Description |
|:-----------|:-----|:------------|
| `userId` | `string` | Unique user identifier |
| `username` | `string` | Unique username (handle) |
| `displayName` | `string` | Display name |
| `email` | `string` | Email address |
| `phoneNumber` | `string` | Phone number (optional) |
| `bio` | `string` | Profile biography (max 150 characters) |
| `profileImage` | `string` | Profile photo URL |
| `coverImage` | `string` | Cover photo URL |
| `website` | `string` | Personal website URL |
| `socialLinks` | `map` | Social media links |
| `socialLinks.instagram` | `string` | Instagram handle |
| `socialLinks.twitter` | `string` | Twitter handle |
| `socialLinks.youtube` | `string` | YouTube channel |
| `socialLinks.tiktok` | `string` | TikTok handle |
| `dateOfBirth` | `timestamp` | Date of birth |
| `age` | `number` | Calculated age |
| `gender` | `string` | Gender: `male`, `female`, `other`, `prefer_not_to_say` |
| `location` | `map` | Location information |
| `location.country` | `string` | Country |
| `location.city` | `string` | City |
| `location.coordinates` | `geopoint` | Coordinates |
| `language` | `string` | Preferred language |
| `accountType` | `string` | Type: `standard`, `premium`, `business`, `creator` |
| `isVerified` | `boolean` | Verification badge status |
| `verifiedAt` | `timestamp` | Verification date |
| `isPremiumAccount` | `boolean` | Premium account status |
| `premiumSlotId` | `string` | Premium slot ID |
| `isPrivate` | `boolean` | Private account status |
| `isAdmin` | `boolean` | Admin privileges |
| `isBanned` | `boolean` | Ban status |
| `banExpiresAt` | `timestamp` | Ban expiration |
| `banReason` | `string` | Ban reason |
| `warningCount` | `number` | Number of warnings |
| `followerCount` | `number` | Total followers |
| `followingCount` | `number` | Total following |
| `videoCount` | `number` | Total videos posted |
| `likeCount` | `number` | Total likes received |
| `viewCount` | `number` | Total views received |
| `balance` | `number` | Withdrawable balance (USD) |
| `coins` | `number` | Virtual coins balance |
| `level` | `number` | User level (based on activity) |
| `experience` | `number` | Experience points |
| `achievements` | `array<string>` | Earned achievement IDs |
| `badges` | `array<string>` | Display badge IDs |
| `theme` | `string` | Profile theme |
| `privacySettings` | `map` | Privacy configuration |
| `notificationSettings` | `map` | Notification preferences |
| `createdAt` | `timestamp` | Account creation date |
| `lastActive` | `timestamp` | Last activity timestamp |
| `updatedAt` | `timestamp` | Last profile update |

### 2.2. `followers` Collection

Tracks follower relationships.

**Document ID:** `{followerId}_{followingId}`

| Field Name | Type | Description |
|:-----------|:-----|:------------|
| `followerId` | `string` | ID of the follower |
| `followingId` | `string` | ID of the user being followed |
| `followerUsername` | `string` | Follower username (denormalized) |
| `followingUsername` | `string` | Following username (denormalized) |
| `timestamp` | `timestamp` | When follow occurred |
| `notificationsEnabled` | `boolean` | Whether to receive notifications |

### 2.3. `followRequests` Collection

Pending follow requests for private accounts.

**Document ID:** `{requesterId}_{targetId}`

| Field Name | Type | Description |
|:-----------|:-----|:------------|
| `requesterId` | `string` | ID of the requester |
| `targetId` | `string` | ID of the target user |
| `requesterUsername` | `string` | Requester username (denormalized) |
| `requesterProfileImage` | `string` | Requester profile image (denormalized) |
| `status` | `string` | Status: `pending`, `accepted`, `rejected` |
| `timestamp` | `timestamp` | When request was sent |
| `respondedAt` | `timestamp` | When request was responded to |

### 2.4. `blockedUsers` Collection (Subcollection under users)

Users blocked by a user.

**Path:** `users/{userId}/blockedUsers/{blockedUserId}`

| Field Name | Type | Description |
|:-----------|:-----|:------------|
| `blockedUserId` | `string` | ID of the blocked user |
| `blockedUsername` | `string` | Username of blocked user |
| `timestamp` | `timestamp` | When block occurred |
| `reason` | `string` | Optional reason for blocking |

### 2.5. `mutedUsers` Collection (Subcollection under users)

Users muted by a user.

**Path:** `users/{userId}/mutedUsers/{mutedUserId}`

| Field Name | Type | Description |
|:-----------|:-----|:------------|
| `mutedUserId` | `string` | ID of the muted user |
| `mutedUsername` | `string` | Username of muted user |
| `timestamp` | `timestamp` | When mute occurred |
| `expiresAt` | `timestamp` | When mute expires (optional) |

### 2.6. `profileViews` Collection

Tracks profile views for analytics.

**Document ID:** `{profileId}_{viewerId}_{date}`

| Field Name | Type | Description |
|:-----------|:-----|:------------|
| `profileId` | `string` | ID of the profile viewed |
| `viewerId` | `string` | ID of the viewer (null if anonymous) |
| `timestamp` | `timestamp` | When view occurred |
| `source` | `string` | Source: `search`, `feed`, `video`, `direct` |

### 2.7. `achievements` Collection

Available achievements users can earn.

**Document ID:** `achievementId`

| Field Name | Type | Description |
|:-----------|:-----|:------------|
| `achievementId` | `string` | Unique achievement identifier |
| `name` | `string` | Achievement name |
| `description` | `string` | Achievement description |
| `category` | `string` | Category: `content`, `social`, `engagement`, `monetization` |
| `iconUrl` | `string` | Achievement icon URL |
| `requirement` | `map` | Requirement criteria |
| `points` | `number` | Experience points awarded |
| `isSecret` | `boolean` | Whether achievement is hidden |
| `rarity` | `string` | Rarity: `common`, `rare`, `epic`, `legendary` |

### 2.8. `userAchievements` Collection (Subcollection under users)

Achievements earned by a user.

**Path:** `users/{userId}/achievements/{achievementId}`

| Field Name | Type | Description |
|:-----------|:-----|:------------|
| `achievementId` | `string` | ID of the achievement |
| `earnedAt` | `timestamp` | When achievement was earned |
| `progress` | `number` | Progress towards achievement (0-100) |
| `isDisplayed` | `boolean` | Whether displayed on profile |

## 3. Cloud Functions

### 3.1. Profile Management Functions

**Function:** `updateProfile`
- **Trigger:** HTTPS Callable
- **Purpose:** Update user profile information
- **Process:**
  1. Verify user authentication
  2. Validate profile data
  3. Check username availability (if changing)
  4. Update user document
  5. Update denormalized data across collections
  6. Return updated profile

**Function:** `uploadProfileImage`
- **Trigger:** HTTPS Callable
- **Purpose:** Upload profile or cover image
- **Process:**
  1. Verify user authentication
  2. Generate signed upload URL
  3. Return upload URL
  4. On upload complete, update user document
  5. Delete old image from Storage

**Function:** `getProfile`
- **Trigger:** HTTPS Callable
- **Purpose:** Get user profile data
- **Process:**
  1. Get user document
  2. Check privacy settings
  3. Check if viewer is blocked
  4. Record profile view
  5. Return profile data with appropriate visibility

**Function:** `searchUsers`
- **Trigger:** HTTPS Callable
- **Purpose:** Search for users
- **Process:**
  1. Parse search query
  2. Search by username, display name
  3. Apply filters
  4. Return paginated results

### 3.2. Follow System Functions

**Function:** `followUser`
- **Trigger:** HTTPS Callable
- **Purpose:** Follow a user
- **Process:**
  1. Verify user authentication
  2. Check if target user is private
  3. If private, create follow request
  4. If public, create follower relationship
  5. Increment follower/following counts
  6. Send notification
  7. Return follow status

**Function:** `unfollowUser`
- **Trigger:** HTTPS Callable
- **Purpose:** Unfollow a user
- **Process:**
  1. Verify user authentication
  2. Delete follower relationship
  3. Decrement follower/following counts
  4. Return success status

**Function:** `acceptFollowRequest`
- **Trigger:** HTTPS Callable
- **Purpose:** Accept a follow request
- **Process:**
  1. Verify user authentication
  2. Get follow request
  3. Create follower relationship
  4. Update request status
  5. Increment counts
  6. Send notification
  7. Return success status

**Function:** `rejectFollowRequest`
- **Trigger:** HTTPS Callable
- **Purpose:** Reject a follow request
- **Process:**
  1. Verify user authentication
  2. Update request status to rejected
  3. Send notification
  4. Return success status

**Function:** `getFollowers`
- **Trigger:** HTTPS Callable
- **Purpose:** Get list of followers
- **Process:**
  1. Verify permissions
  2. Query followers collection
  3. Return paginated list

**Function:** `getFollowing`
- **Trigger:** HTTPS Callable
- **Purpose:** Get list of following
- **Process:**
  1. Verify permissions
  2. Query followers collection
  3. Return paginated list

### 3.3. Blocking and Muting Functions

**Function:** `blockUser`
- **Trigger:** HTTPS Callable
- **Purpose:** Block a user
- **Process:**
  1. Verify user authentication
  2. Add to blocked users subcollection
  3. Remove follower relationships (both ways)
  4. Hide content from blocked user
  5. Return success status

**Function:** `unblockUser`
- **Trigger:** HTTPS Callable
- **Purpose:** Unblock a user
- **Process:**
  1. Verify user authentication
  2. Remove from blocked users
  3. Return success status

**Function:** `muteUser`
- **Trigger:** HTTPS Callable
- **Purpose:** Mute a user's content
- **Process:**
  1. Verify user authentication
  2. Add to muted users subcollection
  3. Set expiration if temporary
  4. Return success status

**Function:** `unmuteUser`
- **Trigger:** HTTPS Callable
- **Purpose:** Unmute a user
- **Process:**
  1. Verify user authentication
  2. Remove from muted users
  3. Return success status

### 3.4. Privacy and Settings Functions

**Function:** `updatePrivacySettings`
- **Trigger:** HTTPS Callable
- **Purpose:** Update privacy settings
- **Process:**
  1. Verify user authentication
  2. Validate settings
  3. Update user document
  4. Return updated settings

**Function:** `updateNotificationSettings`
- **Trigger:** HTTPS Callable
- **Purpose:** Update notification preferences
- **Process:**
  1. Verify user authentication
  2. Update notification settings
  3. Return updated settings

**Function:** `setAccountPrivate`
- **Trigger:** HTTPS Callable
- **Purpose:** Make account private/public
- **Process:**
  1. Verify user authentication
  2. Update isPrivate field
  3. If making private, convert followers to pending requests
  4. Return success status

### 3.5. Verification Functions

**Function:** `requestVerification`
- **Trigger:** HTTPS Callable
- **Purpose:** Request verification badge
- **Process:**
  1. Verify user authentication
  2. Check eligibility (follower count, content quality)
  3. Create verification request
  4. Notify admin team
  5. Return request status

**Function:** `approveVerification`
- **Trigger:** HTTPS Callable (admin only)
- **Purpose:** Approve verification request
- **Process:**
  1. Verify admin privileges
  2. Update user isVerified status
  3. Set verifiedAt timestamp
  4. Send notification to user
  5. Return success status

### 3.6. Analytics Functions

**Function:** `recordProfileView`
- **Trigger:** HTTPS Callable
- **Purpose:** Record a profile view
- **Process:**
  1. Get viewer ID (if authenticated)
  2. Create profile view record
  3. Increment daily view count
  4. Return success status

**Function:** `getProfileAnalytics`
- **Trigger:** HTTPS Callable
- **Purpose:** Get profile analytics
- **Process:**
  1. Verify user is profile owner
  2. Aggregate profile views
  3. Calculate engagement metrics
  4. Get follower growth
  5. Return analytics report

### 3.7. Achievement Functions

**Function:** `checkAchievements`
- **Trigger:** Background (on user activity)
- **Purpose:** Check and award achievements
- **Process:**
  1. Get user statistics
  2. Check achievement requirements
  3. Award new achievements
  4. Add experience points
  5. Calculate level
  6. Send notifications

**Function:** `getUserAchievements`
- **Trigger:** HTTPS Callable
- **Purpose:** Get user's achievements
- **Process:**
  1. Query user achievements
  2. Return list with progress

## 4. Profile Features

### 4.1. Profile Tabs

**Videos Tab:**
- Grid view of user's videos
- Sort by recent, popular, oldest
- Filter by hashtag

**Stories Tab:**
- Active stories (24-hour)
- Story highlights
- Archived stories (private)

**Live Tab:**
- Current live stream
- Scheduled streams
- Past stream replays

**Likes Tab:**
- Videos liked by user
- Privacy setting (public/private)

### 4.2. Profile Statistics

**Public Stats:**
- Follower count
- Following count
- Total likes received
- Total views received
- Videos posted

**Private Stats (owner only):**
- Profile views
- Revenue earned
- Engagement rate
- Follower demographics
- Growth trends

### 4.3. Account Types

**Standard Account:**
- Basic features
- 50% gift revenue share
- Standard support

**Premium Account:**
- All standard features
- 90% gift revenue share
- Priority support
- Verification badge
- Advanced analytics
- Custom profile themes

**Business Account:**
- All premium features
- Business analytics
- Ad management
- Team collaboration
- API access

**Creator Account:**
- All business features
- Creator tools
- Monetization features
- Brand partnerships
- Early access to features

## 5. Privacy Settings

### 5.1. Account Privacy

- **Public:** Anyone can view profile and content
- **Private:** Only approved followers can view
- **Friends:** Only mutual followers can view

### 5.2. Content Privacy

- **Who can view videos:** Everyone, Followers, Friends
- **Who can view stories:** Everyone, Followers, Close Friends
- **Who can view likes:** Everyone, Followers, Only Me

### 5.3. Interaction Privacy

- **Who can comment:** Everyone, Followers, Friends, No One
- **Who can duet/stitch:** Everyone, Followers, No One
- **Who can send gifts:** Everyone, Followers, No One
- **Who can message:** Everyone, Followers, Friends, No One

### 5.4. Discovery Privacy

- **Suggest account to others:** On/Off
- **Allow others to find by email:** On/Off
- **Allow others to find by phone:** On/Off
- **Show in search results:** On/Off

## 6. Profile Customization

### 6.1. Themes

- **Classic:** Default theme
- **Dark:** Dark mode theme
- **Colorful:** Vibrant colors
- **Minimal:** Clean and simple
- **Custom:** User-defined colors

### 6.2. Profile Sections

- **Pinned Video:** Highlight one video
- **Featured Playlist:** Curated video collection
- **About Section:** Extended bio
- **Links Section:** Multiple external links
- **Shop Section:** Product links (for business accounts)

## 7. Verification System

### 7.1. Verification Criteria

**Minimum Requirements:**
- 10,000+ followers
- 100,000+ total views
- Active account (posted in last 30 days)
- No community guideline violations
- Complete profile information
- Authentic identity

**Verification Process:**
1. User submits verification request
2. Admin reviews account
3. Verification decision (approve/reject)
4. Badge awarded if approved
5. Badge displayed on profile and content

### 7.2. Verification Benefits

- Blue checkmark badge
- Increased discoverability
- Priority in search results
- Enhanced credibility
- Access to exclusive features

## 8. User Levels and Experience

### 8.1. Experience Points

**Earning XP:**
- Post video: +10 XP
- Receive like: +1 XP
- Receive comment: +2 XP
- Receive share: +5 XP
- Go live: +20 XP
- Complete daily tasks: +50 XP

**Level Thresholds:**
- Level 1: 0 XP
- Level 5: 500 XP
- Level 10: 2,000 XP
- Level 20: 10,000 XP
- Level 50: 100,000 XP
- Level 100: 1,000,000 XP

### 8.2. Level Benefits

- Unlock new features
- Increased upload limits
- Exclusive badges
- Priority support
- Special effects and filters

## 9. Performance Optimizations

### 9.1. Caching

- Cache profile data
- Cache follower counts
- Cache recent videos
- Use CDN for profile images

### 9.2. Denormalization

- Store username and profile image in related documents
- Update denormalized data on profile changes
- Use Cloud Functions to maintain consistency

### 9.3. Pagination

- Paginate follower/following lists
- Paginate video grids
- Lazy load profile sections

## 10. Security Considerations

### 10.1. Privacy Protection

- Enforce privacy settings at query level
- Hide blocked users' content
- Prevent blocked users from viewing profile
- Secure personal information (email, phone)

### 10.2. Data Validation

- Validate username format and uniqueness
- Validate bio length and content
- Validate URLs
- Prevent injection attacks

### 10.3. Rate Limiting

- Limit profile updates (once per hour)
- Limit follow/unfollow actions
- Limit search queries
- Prevent spam

## 11. Integration Points

### 11.1. With Other Systems

- **Videos:** Display user's videos on profile
- **Stories:** Show active stories and highlights
- **Live Streaming:** Show live indicator
- **Messaging:** Profile-to-DM navigation
- **Gifts:** Display gift statistics
- **Notifications:** Profile activity notifications

### 11.2. External Services

- **Firebase Auth:** User authentication
- **Firebase Storage:** Profile and cover images
- **Cloud Functions:** Profile operations
- **Firestore:** Profile data storage

## 12. Future Enhancements

- Profile QR codes
- Profile analytics dashboard
- Profile badges and stickers
- Profile music (background music)
- Profile widgets
- Profile collaboration (shared profiles)
- Profile templates
- Profile export (data portability)
- Profile import from other platforms
- Profile verification tiers (gold, platinum)

This comprehensive profile system design provides users with a robust, customizable, and feature-rich profile experience while maintaining privacy, security, and performance.
