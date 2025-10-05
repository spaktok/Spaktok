# Spaktok Backend API Documentation

This document provides comprehensive API documentation for the Spaktok social media platform backend, built using Firebase Cloud Functions and Firestore. It details the available endpoints, their functionalities, request parameters, and expected responses.

## Table of Contents
1.  [Introduction](#1-introduction)
2.  [Authentication](#2-authentication)
3.  [Error Handling](#3-error-handling)
4.  [Core Systems API Endpoints](#4-core-systems-api-endpoints)
    *   [4.1. User Management](#41-user-management)
    *   [4.2. Profile System](#42-profile-system)
    *   [4.3. Short Videos (Reels/Feed)](#43-short-videos-reelsfeed)
    *   [4.4. Stories System](#44-stories-system)
    *   [4.5. Live Streaming System](#45-live-streaming-system)
    *   [4.6. Gift System](#46-gift-system)
    *   [4.7. Messaging & Snaps System](#47-messaging--snaps-system)
    *   [4.8. Ads System](#48-ads-system)
    *   [4.9. Age & Safety Verification System](#49-age--safety-verification-system)
    *   [4.10. Reports & Penalties System](#410-reports--penalties-system)
    *   [4.11. Notifications System](#411-notifications-system)
    *   [4.12. Admin Dashboard & Internal Economy](#412-admin-dashboard--internal-economy)

## 1. Introduction

The Spaktok backend API provides a robust set of functionalities for managing users, content, interactions, and platform operations. All API interactions are handled via Firebase Cloud Functions, which are callable directly from client applications (Flutter, Web, etc.).

## 2. Authentication

All API calls require user authentication via Firebase Authentication. The client-side Firebase SDK automatically handles passing the authentication token with callable Cloud Function requests. The `request.auth.uid` is used on the backend to identify the authenticated user.

## 3. Error Handling

API calls will return an error object in case of failure. Common error types include:
-   `UNAUTHENTICATED`: User is not authenticated.
-   `PERMISSION_DENIED`: User does not have the necessary permissions.
-   `INVALID_ARGUMENT`: Missing or invalid request parameters.
-   `NOT_FOUND`: Requested resource does not exist.
-   `ALREADY_EXISTS`: Resource already exists (e.g., duplicate username).
-   `INTERNAL`: Generic server-side error.

## 4. Core Systems API Endpoints

### 4.1. User Management

#### `updateUserProfile`
-   **Description**: Updates a user's profile information.
-   **Request**: `(data: { displayName?: string, bio?: string, profileImage?: string, ... })`
-   **Response**: `{ success: boolean, message: string }`

#### `blockUser`
-   **Description**: Blocks another user.
-   **Request**: `(data: { targetUserId: string })`
-   **Response**: `{ success: boolean, message: string }`

#### `unblockUser`
-   **Description**: Unblocks a user.
-   **Request**: `(data: { targetUserId: string })`
-   **Response**: `{ success: boolean, message: string }`

#### `sendFriendRequest`
-   **Description**: Sends a friend request to another user.
-   **Request**: `(data: { receiverId: string })`
-   **Response**: `{ success: boolean, message: string }`

#### `acceptFriendRequest`
-   **Description**: Accepts a pending friend request.
-   **Request**: `(data: { requestId: string })`
-   **Response**: `{ success: boolean, message: string }`

#### `declineFriendRequest`
-   **Description**: Declines a pending friend request.
-   **Request**: `(data: { requestId: string })`
-   **Response**: `{ success: boolean, message: string }`

#### `removeFriend`
-   **Description**: Removes an existing friend.
-   **Request**: `(data: { friendId: string })`
-   **Response**: `{ success: boolean, message: string }`

#### `getFriends`
-   **Description**: Retrieves a list of the user's friends.
-   **Request**: `()`
-   **Response**: `{ success: boolean, friends: UserProfile[] }`

#### `getFriendRequests`
-   **Description**: Retrieves pending friend requests (sent and received).
-   **Request**: `()`
-   **Response**: `{ success: boolean, sent: FriendRequest[], received: FriendRequest[] }`

#### `updateLocationPrivacy`
-   **Description**: Updates user's location privacy settings.
-   **Request**: `(data: { privacy: 'public' | 'friends' | 'private', sharedWithFriends?: string[], excludedFriends?: string[] })`
-   **Response**: `{ success: boolean, message: string }`

#### `updateLiveLocationSharing`
-   **Description**: Enables or disables live location sharing.
-   **Request**: `(data: { enable: boolean, durationMinutes?: number })`
-   **Response**: `{ success: boolean, message: string }`

#### `getNearbyUsers`
-   **Description**: Retrieves users near the current user based on location privacy settings.
-   **Request**: `(data: { radiusKm: number })`
-   **Response**: `{ success: boolean, users: UserProfile[] }`

### 4.2. Profile System

#### `getUserProfile`
-   **Description**: Retrieves a user's profile, including statistics and media tabs.
-   **Request**: `(data: { userId: string })`
-   **Response**: `{ success: boolean, profile: UserProfile }`

#### `editProfile`
-   **Description**: Allows users to edit their profile details.
-   **Request**: `(data: { displayName?: string, bio?: string, profileImage?: string, publicMode?: boolean, ... })`
-   **Response**: `{ success: boolean, message: string }`

#### `requestVerification`
-   **Description**: Submits a request for profile verification.
-   **Request**: `(data: { documents: string[] })`
-   **Response**: `{ success: boolean, message: string }`

### 4.3. Short Videos (Reels/Feed)

#### `uploadVideo`
-   **Description**: Uploads a new short video.
-   **Request**: `(data: { videoUrl: string, thumbnailUrl: string, title: string, description?: string, tags?: string[], visibility: 'public' | 'private' | 'friends' })`
-   **Response**: `{ success: boolean, videoId: string }`

#### `getVideoFeed`
-   **Description**: Retrieves a personalized feed of short videos.
-   **Request**: `(data: { lastVideoId?: string, limit?: number })`
-   **Response**: `{ success: boolean, videos: Video[], hasMore: boolean }`

#### `likeVideo`
-   **Description**: Likes a video.
-   **Request**: `(data: { videoId: string })`
-   **Response**: `{ success: boolean, message: string }`

#### `addComment`
-   **Description**: Adds a comment to a video.
-   **Request**: `(data: { videoId: string, text: string })`
-   **Response**: `{ success: boolean, commentId: string }`

### 4.4. Stories System

#### `uploadStory`
-   **Description**: Uploads a new story (image or short video).
-   **Request**: `(data: { mediaUrl: string, type: 'image' | 'video', caption?: string, durationSeconds?: number, visibility: 'public' | 'friends' })`
-   **Response**: `{ success: boolean, storyId: string }`

#### `getStoriesFeed`
-   **Description**: Retrieves a feed of stories from friends and public users.
-   **Request**: `(data: { lastStoryId?: string, limit?: number })`
-   **Response**: `{ success: boolean, stories: Story[], hasMore: boolean }`

#### `viewStory`
-   **Description**: Marks a story as viewed by the current user.
-   **Request**: `(data: { storyId: string })`
-   **Response**: `{ success: boolean }`

### 4.5. Live Streaming System

#### `startLiveStream`
-   **Description**: Initiates a new live stream.
-   **Request**: `(data: { title: string, description?: string, thumbnailUrl?: string, tags?: string[], visibility: 'public' | 'private' | 'friends' })`
-   **Response**: `{ success: boolean, streamId: string, rtmpUrl: string, streamKey: string }`

#### `endLiveStream`
-   **Description**: Terminates an active live stream.
-   **Request**: `(data: { streamId: string })`
-   **Response**: `{ success: boolean, message: string }`

#### `getLiveStreams`
-   **Description**: Retrieves a list of active live streams.
-   **Request**: `(data: { lastStreamId?: string, limit?: number })`
-   **Response**: `{ success: boolean, streams: LiveStream[], hasMore: boolean }`

#### `joinLiveStream`
-   **Description**: Allows a user to join a live stream.
-   **Request**: `(data: { streamId: string })`
-   **Response**: `{ success: boolean, message: string }`

### 4.6. Gift System

#### `sendGift`
-   **Description**: Sends a virtual gift to a live streamer or content creator.
-   **Request**: `(data: { receiverId: string, giftId: string, quantity: number, contextId?: string, contextType?: 'livestream' | 'video' })`
-   **Response**: `{ success: boolean, transactionId: string }`

#### `getGiftCatalog`
-   **Description**: Retrieves the list of available virtual gifts.
-   **Request**: `()`
-   **Response**: `{ success: boolean, gifts: Gift[] }`

#### `getUserGifts`
-   **Description**: Retrieves gifts received by a user.
-   **Request**: `(data: { userId: string })`
-   **Response**: `{ success: boolean, receivedGifts: ReceivedGift[] }`

### 4.7. Messaging & Snaps System

#### `createConversation`
-   **Description**: Creates a new one-to-one or group conversation.
-   **Request**: `(data: { participantIds: string[], type: 'one-to-one' | 'group', name?: string })`
-   **Response**: `{ success: boolean, conversationId: string }`

#### `sendMessage`
-   **Description**: Sends a message within a conversation.
-   **Request**: `(data: { conversationId: string, text?: string, imageUrl?: string, videoUrl?: string, isEphemeral?: boolean })`
-   **Response**: `{ success: boolean, messageId: string }`

#### `getMessages`
-   **Description**: Retrieves messages from a conversation.
-   **Request**: `(data: { conversationId: string, lastMessageId?: string, limit?: number })`
-   **Response**: `{ success: boolean, messages: Message[], hasMore: boolean }`

#### `markMessageAsRead`
-   **Description**: Marks a message as read.
-   **Request**: `(data: { conversationId: string, messageId: string })`
-   **Response**: `{ success: boolean }`

#### `startTyping`
-   **Description**: Notifies participants that the user is typing.
-   **Request**: `(data: { conversationId: string })`
-   **Response**: `{ success: boolean }`

#### `stopTyping`
-   **Description**: Notifies participants that the user has stopped typing.
-   **Request**: `(data: { conversationId: string })`
-   **Response**: `{ success: boolean }`

#### `initiateCall`
-   **Description**: Initiates a voice or video call (basic signaling).
-   **Request**: `(data: { conversationId: string, callType: 'audio' | 'video' })`
-   **Response**: `{ success: boolean, callId: string, offer: RTCSessionDescriptionInit }`

#### `answerCall`
-   **Description**: Answers an incoming call.
-   **Request**: `(data: { callId: string, answer: RTCSessionDescriptionInit })`
-   **Response**: `{ success: boolean }`

#### `endCall`
-   **Description**: Ends an active call.
-   **Request**: `(data: { callId: string })`
-   **Response**: `{ success: boolean }`

### 4.8. Ads System

#### `createAd` (Admin Only)
-   **Description**: Creates a new advertisement.
-   **Request**: `(data: { type: 'feed' | 'rewarded', title: string, description: string, imageUrl: string, targetUrl: string, budget: number, startDate: string, endDate: string, targetAudience?: any })`
-   **Response**: `{ success: boolean, adId: string }`

#### `updateAd` (Admin Only)
-   **Description**: Updates an existing advertisement.
-   **Request**: `(data: { adId: string, updates: any })`
-   **Response**: `{ success: boolean, message: string }`

#### `getAds`
-   **Description**: Retrieves active advertisements for display.
-   **Request**: `(data: { type: 'feed' | 'rewarded', limit?: number })`
-   **Response**: `{ success: boolean, ads: Ad[] }`

#### `recordAdImpression`
-   **Description**: Records an ad impression.
-   **Request**: `(data: { adId: string })`
-   **Response**: `{ success: boolean }`

#### `recordAdClick`
-   **Description**: Records an ad click.
-   **Request**: `(data: { adId: string })`
-   **Response**: `{ success: boolean }`

#### `getAdAnalytics` (Admin Only)
-   **Description**: Retrieves analytics for advertisements.
-   **Request**: `(data: { adId?: string, startDate?: string, endDate?: string })`
-   **Response**: `{ success: boolean, analytics: AdAnalytics }`

### 4.9. Age & Safety Verification System

#### `setBirthDate`
-   **Description**: Sets a user's birth date and calculates age. Can only be set once.
-   **Request**: `(data: { birthDate: string })`
-   **Response**: `{ success: boolean, age: number, message: string }`

#### `requestIdVerification`
-   **Description**: Submits a request for ID verification.
-   **Request**: `(data: { idType: string, idNumber: string, idImageUrls: string[] })`
-   **Response**: `{ success: boolean, message: string }`

#### `approveIdVerification` (Admin Only)
-   **Description**: Approves a pending ID verification request.
-   **Request**: `(data: { userId: string, requestId: string, verifiedAge?: number })`
-   **Response**: `{ success: boolean, message: string }`

#### `rejectIdVerification` (Admin Only)
-   **Description**: Rejects a pending ID verification request.
-   **Request**: `(data: { userId: string, requestId: string, reason?: string })`
-   **Response**: `{ success: boolean, message: string }`

#### `updateContentFilterLevel`
-   **Description**: Updates a user's content filter level (`strict`, `moderate`, `off`).
-   **Request**: `(data: { level: 'strict' | 'moderate' | 'off' })`
-   **Response**: `{ success: boolean, message: string }`

#### `checkContentAgeRestriction`
-   **Description**: Checks if a user can view specific content based on age restrictions.
-   **Request**: `(data: { contentId: string, contentType: 'video' | 'story' | 'livestream' })`
-   **Response**: `{ success: boolean, canView: boolean, userAge: number, ageRestriction: number, message: string }`

#### `setContentAgeRestriction`
-   **Description**: Sets an age restriction for a user's content.
-   **Request**: `(data: { contentId: string, contentType: 'video' | 'story' | 'livestream', ageRestriction: number })`
-   **Response**: `{ success: boolean, message: string }`

#### `enableParentalControls` (Admin Only)
-   **Description**: Enables parental controls for a user.
-   **Request**: `(data: { userId: string, settings: { restrictedMode?: boolean, allowDirectMessages?: boolean, allowComments?: boolean, allowLiveStreaming?: boolean, screenTimeLimit?: number } })`
-   **Response**: `{ success: boolean, message: string }`

### 4.10. Reports & Penalties System

#### `reportContent`
-   **Description**: Submits a report against content or a user.
-   **Request**: `(data: { reportType: string, targetId: string, targetType: 'user' | 'video' | 'story' | 'comment' | 'livestream' | 'message', reason: string, description?: string, evidence?: string[] })`
-   **Response**: `{ success: boolean, reportId: string, message: string }`

#### `reviewReport` (Admin Only)
-   **Description**: Reviews a submitted report and takes action.
-   **Request**: `(data: { reportId: string, action: 'dismiss' | 'remove_content' | 'hide_content' | 'warn_user' | 'ban_user', actionReason?: string, banDuration?: number })`
-   **Response**: `{ success: boolean, message: string }`

#### `banUserManual` (Admin Only)
-   **Description**: Manually bans a user for a specified duration.
-   **Request**: `(data: { userId: string, durationDays: number, reason: string })`
-   **Response**: `{ success: boolean, message: string }`

#### `unbanUser` (Admin Only)
-   **Description**: Unbans a previously banned user.
-   **Request**: `(data: { userId: string })`
-   **Response**: `{ success: boolean, message: string }`

#### `getPendingReports` (Admin Only)
-   **Description**: Retrieves a list of pending reports.
-   **Request**: `(data: { limit?: number, priority?: 'low' | 'medium' | 'high' })`
-   **Response**: `{ success: boolean, reports: Report[] }`

#### `getModerationStats` (Admin Only)
-   **Description**: Retrieves statistics related to moderation activities.
-   **Request**: `(data: { startDate?: string, endDate?: string })`
-   **Response**: `{ success: boolean, stats: ModerationStats }`

### 4.11. Notifications System

#### `registerFcmToken`
-   **Description**: Registers a Firebase Cloud Messaging (FCM) token for push notifications.
-   **Request**: `(data: { token: string, platform?: 'ios' | 'android' | 'web' })`
-   **Response**: `{ success: boolean, message: string }`

#### `unregisterFcmToken`
-   **Description**: Unregisters an FCM token.
-   **Request**: `(data: { token: string })`
-   **Response**: `{ success: boolean, message: string }`

#### `getNotifications`
-   **Description**: Retrieves a user's notifications.
-   **Request**: `(data: { limit?: number, lastNotificationId?: string })`
-   **Response**: `{ success: boolean, notifications: Notification[], unreadCount: number, hasMore: boolean }`

#### `markNotificationAsRead`
-   **Description**: Marks a specific notification as read.
-   **Request**: `(data: { notificationId: string })`
-   **Response**: `{ success: boolean, message: string }`

#### `markAllNotificationsAsRead`
-   **Description**: Marks all unread notifications for the user as read.
-   **Request**: `()`
-   **Response**: `{ success: boolean, count: number, message: string }`

#### `deleteNotification`
-   **Description**: Deletes a specific notification.
-   **Request**: `(data: { notificationId: string })`
-   **Response**: `{ success: boolean, message: string }`

#### `updateNotificationSettings`
-   **Description**: Updates a user's notification preferences.
-   **Request**: `(data: { settings: { likes?: boolean, comments?: boolean, liveStreams?: boolean, messages?: boolean } })`
-   **Response**: `{ success: boolean, message: string }`

### 4.12. Admin Dashboard & Internal Economy

#### `getPlatformStatistics` (Admin Only)
-   **Description**: Retrieves overall platform statistics (users, content, revenue).
-   **Request**: `()`
-   **Response**: `{ success: boolean, statistics: PlatformStatistics }`

#### `getUserAnalytics` (Admin Only)
-   **Description**: Retrieves user-related analytics (new users, engagement).
-   **Request**: `(data: { startDate?: string, endDate?: string })`
-   **Response**: `{ success: boolean, analytics: UserAnalytics }`

#### `getRevenueAnalytics` (Admin Only)
-   **Description**: Retrieves detailed revenue analytics (gifts, premium, ads, coins, payouts).
-   **Request**: `(data: { startDate?: string, endDate?: string })`
-   **Response**: `{ success: boolean, analytics: RevenueAnalytics }`

#### `getContentAnalytics` (Admin Only)
-   **Description**: Retrieves content-related analytics (videos uploaded, views, likes, live streams).
-   **Request**: `(data: { startDate?: string, endDate?: string })`
-   **Response**: `{ success: boolean, analytics: ContentAnalytics }`

#### `manageUser` (Admin Only)
-   **Description**: Performs various administrative actions on a user account (verify, grant premium, adjust balance/coins, delete).
-   **Request**: `(data: { userId: string, action: 'verify' | 'unverify' | 'grant_premium' | 'revoke_premium' | 'adjust_balance' | 'adjust_coins' | 'delete_account', data?: any })`
-   **Response**: `{ success: boolean, message: string }`

#### `getAllUsers` (Admin Only)
-   **Description**: Retrieves a paginated list of all users with optional filters.
-   **Request**: `(data: { limit?: number, lastUserId?: string, filters?: { isPremium?: boolean, isVerified?: boolean, isBanned?: boolean } })`
-   **Response**: `{ success: boolean, users: UserProfile[], hasMore: boolean }`

#### `getEconomyInsights` (Admin Only)
-   **Description**: Provides insights into the platform's internal economy (total balances, pending payouts, revenue breakdown).
-   **Request**: `()`
-   **Response**: `{ success: boolean, insights: EconomyInsights }`

---

This documentation will be continuously updated as the Spaktok platform evolves.
