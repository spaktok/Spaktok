# Spaktok API Documentation

Complete API reference for the Spaktok social media platform backend.

## Table of Contents

1. [Authentication API](#authentication-api)
2. [Content API](#content-api)
3. [Social API](#social-api)
4. [Messaging API](#messaging-api)
5. [Payment API](#payment-api)
6. [Profile API](#profile-api)
7. [Moderation API](#moderation-api)
8. [Sharing API](#sharing-api)
9. [Advertising API](#advertising-api)

---

## Authentication API

### Base URL
`/api/auth`

### Endpoints

#### Register User
```
POST /register
Body: {
  email: string,
  password: string,
  username: string,
  dateOfBirth: string
}
Response: { user: UserProfile, token: string, refreshToken: string }
```

#### Login
```
POST /login
Body: { email: string, password: string }
Response: { user: UserProfile, token: string, refreshToken: string }
```

#### Refresh Token
```
POST /refresh
Body: { refreshToken: string }
Response: { token: string }
```

#### Logout
```
POST /logout
Response: { success: boolean }
```

#### Google Auth
```
POST /google
Body: { idToken: string }
Response: { user: UserProfile, token: string, refreshToken: string }
```

#### Apple Auth
```
POST /apple
Body: { identityToken: string }
Response: { user: UserProfile, token: string, refreshToken: string }
```

#### Reset Password
```
POST /reset-password
Body: { email: string }
Response: { success: boolean }
```

#### Verify Email
```
POST /verify-email
Body: { token: string }
Response: { verified: boolean }
```

---

## Content API

### Base URL
`/api/content`

### Video Management

#### Upload Video
```
POST /videos
Content-Type: multipart/form-data
Body: {
  file: File,
  title: string,
  description?: string,
  thumbnail?: File,
  visibility: 'public' | 'private' | 'friends',
  allowComments?: boolean,
  allowDuets?: boolean,
  allowStitches?: boolean,
  categoryId?: string,
  tags?: string[]
}
Response: { video: Video }
```

#### Get Videos
```
GET /videos?limit=20&offset=0&sort=newest
Response: { videos: Video[], hasMore: boolean }
```

#### Get Video
```
GET /videos/{id}
Response: { video: Video }
```

#### Update Video
```
PUT /videos/{id}
Body: Partial<Video>
Response: { video: Video }
```

#### Delete Video
```
DELETE /videos/{id}
Response: { success: boolean }
```

#### Like Video
```
POST /videos/{id}/like
Response: { liked: boolean, likesCount: number }
```

#### Unlike Video
```
POST /videos/{id}/unlike
Response: { liked: boolean, likesCount: number }
```

#### Add Comment
```
POST /videos/{id}/comments
Body: { text: string }
Response: { comment: Comment }
```

#### Get Comments
```
GET /videos/{id}/comments?limit=20&offset=0
Response: { comments: Comment[], hasMore: boolean }
```

#### Delete Comment
```
DELETE /videos/{id}/comments/{commentId}
Response: { success: boolean }
```

### Stories

#### Post Story
```
POST /stories
Content-Type: multipart/form-data
Body: {
  file: File,
  duration?: number,
  stickers?: string[],
  text?: string,
  music?: string
}
Response: { story: Story }
```

#### Get Stories
```
GET /stories?limit=20
Response: { stories: Story[] }
```

#### View Story
```
POST /stories/{id}/view
Response: { success: boolean }
```

#### Delete Story
```
DELETE /stories/{id}
Response: { success: boolean }
```

### Live Streaming

#### Start Live Stream
```
POST /live/start
Body: {
  title: string,
  description?: string,
  thumbnail?: File,
  tags?: string[]
}
Response: { 
  stream: Stream,
  rtmpUrl: string,
  streamKey: string
}
```

#### End Live Stream
```
POST /live/{id}/end
Response: { success: boolean }
```

#### Get Active Streams
```
GET /live/active?limit=20&offset=0
Response: { streams: Stream[], hasMore: boolean }
```

#### Join Live Stream
```
POST /live/{id}/join
Response: { success: boolean }
```

#### Send Chat Message
```
POST /live/{id}/chat
Body: { message: string }
Response: { message: ChatMessage }
```

---

## Social API

### Base URL
`/api/users`

### Follow System

#### Follow User
```
POST /{userId}/follow
Response: { following: boolean }
```

#### Unfollow User
```
POST /{userId}/unfollow
Response: { following: boolean }
```

#### Get Followers
```
GET /{userId}/followers?limit=50&offset=0
Response: { followers: UserFollower[], hasMore: boolean }
```

#### Get Following
```
GET /{userId}/following?limit=50&offset=0
Response: { following: UserFollowing[], hasMore: boolean }
```

### Notifications

#### Get Notifications
```
GET /me/notifications?limit=50&offset=0
Response: { notifications: Notification[], unread: number }
```

#### Mark as Read
```
POST /notifications/{id}/read
Response: { success: boolean }
```

#### Clear Notifications
```
POST /notifications/clear
Response: { success: boolean }
```

### Search

#### Search Users
```
GET /search?q=query&limit=20
Response: { users: UserProfile[] }
```

#### Search Videos
```
GET /content/search?q=query&limit=20&offset=0
Response: { videos: Video[], hasMore: boolean }
```

#### Trending Videos
```
GET /content/trending?limit=20&period=day
Response: { videos: Video[] }
```

#### Explore Feed
```
GET /content/explore?limit=20&offset=0&category=all
Response: { videos: Video[], hasMore: boolean }
```

---

## Messaging API

### Base URL
`/api/messages`

### Direct Messages

#### Send Message
```
POST /conversations/{conversationId}/messages
Body: { 
  text?: string,
  media?: File[],
  type: 'text' | 'image' | 'video' | 'audio'
}
Response: { message: Message }
```

#### Get Conversation
```
GET /conversations/{conversationId}?limit=50&offset=0
Response: { 
  conversation: Conversation,
  messages: Message[]
}
```

#### Get Conversations
```
GET /conversations?limit=20&offset=0
Response: { conversations: Conversation[], hasMore: boolean }
```

#### Delete Message
```
DELETE /conversations/{conversationId}/messages/{messageId}
Response: { success: boolean }
```

#### Mark as Read
```
POST /conversations/{conversationId}/read
Response: { success: boolean }
```

#### Typing Indicator
```
POST /conversations/{conversationId}/typing
Response: { success: boolean }
```

---

## Payment API

### Base URL
`/api/payments`

### Wallet

#### Get Wallet
```
GET /wallet
Response: { wallet: Wallet }
```

#### Recharge Wallet
```
POST /wallet/recharge
Body: { 
  amount: number,
  paymentMethodId: string
}
Response: { payment: Payment }
```

#### Get Transactions
```
GET /wallet/transactions?limit=50&offset=0
Response: { transactions: WalletTransaction[] }
```

### Payment Methods

#### Add Payment Method
```
POST /methods
Body: {
  type: string,
  provider: 'stripe' | 'paypal',
  token: string,
  isDefault: boolean
}
Response: { method: PaymentMethod }
```

#### Get Payment Methods
```
GET /methods
Response: { methods: PaymentMethod[] }
```

#### Delete Payment Method
```
DELETE /methods/{methodId}
Response: { success: boolean }
```

### Gifts

#### Get Gifts
```
GET /gifts
Response: { gifts: Gift[] }
```

#### Send Gift
```
POST /gifts/send
Body: {
  giftId: string,
  recipientId: string,
  quantity: number,
  message?: string,
  streamId?: string,
  videoId?: string,
  storyId?: string
}
Response: { purchase: GiftPurchase }
```

### Subscriptions

#### Get Plans
```
GET /subscriptions/plans
Response: { plans: SubscriptionPlan[] }
```

#### Subscribe
```
POST /subscriptions
Body: {
  planId: string,
  paymentMethodId: string
}
Response: { subscription: Subscription }
```

#### Cancel Subscription
```
POST /subscriptions/cancel
Body: { reason?: string }
Response: { subscription: Subscription }
```

### Payouts

#### Request Payout
```
POST /payouts/request
Body: {
  amount: number,
  method: string,
  bankDetails?: object
}
Response: { payout: Payout }
```

#### Get Payouts
```
GET /payouts?limit=50&offset=0
Response: { payouts: Payout[] }
```

---

## Profile API

### Base URL
`/api/users`

### Profile Management

#### Get Profile
```
GET /{userId}
Response: { profile: UserProfile }
```

#### Get My Profile
```
GET /me
Response: { profile: UserProfile }
```

#### Update Profile
```
PUT /me
Content-Type: multipart/form-data
Body: {
  displayName?: string,
  bio?: string,
  avatar?: File,
  coverImage?: File,
  website?: string,
  location?: string,
  isPrivate?: boolean
}
Response: { profile: UserProfile }
```

### Settings

#### Get Privacy Settings
```
GET /me/privacy-settings
Response: { settings: PrivacySettings }
```

#### Update Privacy Settings
```
PUT /me/privacy-settings
Body: Partial<PrivacySettings>
Response: { settings: PrivacySettings }
```

#### Get Notification Settings
```
GET /me/notification-settings
Response: { settings: NotificationSettings }
```

#### Update Notification Settings
```
PUT /me/notification-settings
Body: Partial<NotificationSettings>
Response: { settings: NotificationSettings }
```

### Blocking

#### Block User
```
POST /{userId}/block
Body: { reason?: string }
Response: { success: boolean }
```

#### Unblock User
```
POST /{userId}/unblock
Response: { success: boolean }
```

#### Get Blocked Users
```
GET /blocked?limit=50&offset=0
Response: { blocked: BlockList[] }
```

### Security

#### Enable 2FA
```
POST /me/2fa/enable
Response: { 
  secret: string,
  qrCode: string
}
```

#### Verify 2FA
```
POST /me/2fa/verify
Body: { code: string }
Response: { success: boolean }
```

#### Get Active Devices
```
GET /me/devices
Response: { devices: Device[] }
```

---

## Moderation API

### Base URL
`/api/moderation`

### Reporting

#### Report Content
```
POST /report
Body: {
  contentType: string,
  contentId: string,
  reason: string,
  description?: string,
  screenshots?: string[]
}
Response: { report: ContentReport }
```

#### Get My Reports
```
GET /my-reports?limit=50&offset=0
Response: { reports: ContentReport[] }
```

### Appeals

#### Appeal Ban
```
POST /appeal-ban
Body: {
  reason: string,
  evidence?: string[]
}
Response: { appeal: BanAppeal }
```

#### Check Ban Status
```
GET /my-ban
Response: { ban: Ban | null }
```

---

## Sharing API

### Base URL
`/api/sharing`

### Basic Sharing

#### Share Content
```
POST /share
Body: {
  contentId: string,
  contentType: string,
  targets: string[],
  customMessage?: string
}
Response: { share: Share }
```

### Duets

#### Create Duet
```
POST /duets
Content-Type: multipart/form-data
Body: {
  originalVideoId: string,
  videoFile: File,
  duetType: 'side_by_side' | 'reaction'
}
Response: { duet: Duet }
```

#### Get Duets
```
GET /duets/{videoId}?limit=50&offset=0
Response: { duets: Duet[], hasMore: boolean }
```

### Stitches

#### Create Stitch
```
POST /stitches
Content-Type: multipart/form-data
Body: {
  originalVideoId: string,
  videoFile: File,
  clipStartTime: number,
  clipEndTime: number
}
Response: { stitch: Stitch }
```

### Referrals

#### Get Referral Link
```
GET /referral/link
Response: { link: ReferralLink }
```

#### Get Referral Stats
```
GET /referral/stats
Response: { stats: ReferralStats }
```

#### Claim Rewards
```
POST /referral/claim-rewards
Response: { success: boolean, rewardValue: number }
```

---

## Advertising API

### Base URL
`/api/advertising`

### Campaigns (Advertisers)

#### Create Campaign
```
POST /campaigns
Body: {
  name: string,
  description?: string,
  format: string,
  budget: number,
  startDate: string,
  endDate: string,
  targetingRules: TargetingRule[]
}
Response: { campaign: AdCampaign }
```

#### Get Campaigns
```
GET /campaigns?status=running&limit=50&offset=0
Response: { campaigns: AdCampaign[] }
```

#### Update Campaign
```
PUT /campaigns/{id}
Body: Partial<AdCampaign>
Response: { campaign: AdCampaign }
```

#### Get Analytics
```
GET /campaigns/{id}/analytics
Response: { analytics: CampaignAnalytics }
```

### Creator Settings

#### Get Ad Settings
```
GET /creator/settings
Response: { settings: CreatorAds }
```

#### Update Ad Settings
```
PUT /creator/settings
Body: Partial<CreatorAds>
Response: { settings: CreatorAds }
```

#### Get Revenue
```
GET /creator/revenue?month=2024-01
Response: { revenue: AdRevenue[] }
```

### Ad Preferences (Users)

#### Get Preferences
```
GET /preferences
Response: { preferences: AdPreference }
```

#### Update Preferences
```
PUT /preferences
Body: Partial<AdPreference>
Response: { preferences: AdPreference }
```

#### Block Advertiser
```
POST /block/{advertiserId}
Response: { success: boolean }
```

---

## Error Handling

All endpoints return standardized error responses:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {}
  }
}
```

### Common Error Codes

- `UNAUTHORIZED` - Missing or invalid authentication
- `FORBIDDEN` - User doesn't have permission
- `NOT_FOUND` - Resource not found
- `BAD_REQUEST` - Invalid request data
- `CONFLICT` - Resource conflict (e.g., duplicate)
- `RATE_LIMITED` - Too many requests
- `INTERNAL_ERROR` - Server error

---

## Rate Limiting

All endpoints are rate limited:

- **Public endpoints**: 100 requests/minute per IP
- **Authenticated endpoints**: 300 requests/minute per user
- **Upload endpoints**: 10 requests/minute per user

---

## Pagination

List endpoints support pagination:

```
?limit=20&offset=0
```

Response includes:
```json
{
  "items": [],
  "hasMore": boolean,
  "total": number,
  "limit": number,
  "offset": number
}
```

---

## WebSocket Events

### Live Chat
```
WS /live/{streamId}/chat

Events:
- message - { sender: User, message: string, timestamp: string }
- user:joined - { user: User }
- user:left - { user: User }
- gift:received - { gift: Gift, sender: User }
```

### Notifications
```
WS /notifications

Events:
- new:notification - { notification: Notification }
- new:message - { message: Message }
- user:online - { userId: string }
- user:offline - { userId: string }
```

---

## Version

**Current API Version**: 1.0.0  
**Last Updated**: 2024

For support, visit: https://support.spaktok.com
