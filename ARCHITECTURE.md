# Spaktok Architecture Documentation

## System Overview

Spaktok is a comprehensive social media platform built with a modular, scalable architecture. This document outlines the core systems, data flows, and integration patterns.

## Technology Stack

### Frontend
- **Framework**: Next.js 16 with React 19
- **Styling**: Tailwind CSS
- **State Management**: SWR for data fetching and caching
- **UI Components**: shadcn/ui
- **Real-time**: WebSocket for live features

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js (implied from API structure)
- **Database**: PostgreSQL (recommended)
- **Cache**: Redis
- **Job Queue**: Bull or similar
- **Storage**: S3 or Vercel Blob for media files

### Infrastructure
- **Hosting**: Vercel
- **CDN**: Vercel Edge Network
- **Monitoring**: (To be configured)
- **Analytics**: (To be configured)

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Pages & Components (shadcn/ui)                      │  │
│  │  - Feed, Videos, Stories, Live, Messages, etc.       │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Service Layer (Client-side)                         │  │
│  │  - auth, content, social, messaging, payments, etc.  │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Data Management (SWR + State)                       │  │
│  │  - Caching, Real-time Updates, User State            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          ↕
              HTTP/WebSocket (API Gateway)
                          ↕
┌─────────────────────────────────────────────────────────────┐
│              Backend API Services (Node.js/Express)          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Auth Service              │  Verification            │  │
│  │  - Register/Login          │  - Email verification    │  │
│  │  - Token management        │  - Phone verification    │  │
│  │  - OAuth (Google, Apple)   │  - Identity verification│  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Content Service           │  Media Service           │  │
│  │  - Video management        │  - Encoding/Transcoding  │  │
│  │  - Comments & interactions │  - Thumbnail generation  │  │
│  │  - Stories system          │  - Compression           │  │
│  │  - Live streaming          │  - CDN distribution      │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Social Service            │  Messaging Service       │  │
│  │  - Follow/unfollow         │  - Direct messages       │  │
│  │  - Notifications           │  - Group chats           │  │
│  │  - Search & discovery      │  - Real-time chat        │  │
│  │  - Trending                │  - Media sharing         │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Payment Service           │  Gift System             │  │
│  │  - Stripe integration      │  - Gift marketplace      │  │
│  │  - PayPal integration      │  - Gift transactions     │  │
│  │  - Wallet management       │  - Gift notifications    │  │
│  │  - Subscription handling   │  - Analytics             │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Profile Service           │  Safety & Moderation     │  │
│  │  - User profiles           │  - Content moderation    │  │
│  │  - Settings management     │  - User reporting        │  │
│  │  - Privacy controls        │  - Ban management        │  │
│  │  - Creator dashboard       │  - Appeal system         │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Sharing Service           │  Advertising Service     │  │
│  │  - Duets & Stitches        │  - Ad campaigns          │  │
│  │  - Collaborations          │  - Advertiser dashboard  │  │
│  │  - Referrals               │  - Creator monetization  │  │
│  │  - Cross-platform sharing  │  - Ad serving & tracking│  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          ↕
              Database Drivers (Prisma/Drizzle)
                          ↕
┌─────────────────────────────────────────────────────────────┐
│                  Data Layer (PostgreSQL)                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Users & Auth Database                              │  │
│  │  - Users, Profiles, Sessions, 2FA                   │  │
│  │  - OAuth tokens, Verification                       │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Content Database                                    │  │
│  │  - Videos, Stories, Lives, Comments                 │  │
│  │  - Likes, Interactions, Metadata                    │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Social Database                                     │  │
│  │  - Follows, Blocks, Notifications                   │  │
│  │  - User relationships, Activity logs                │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Messaging Database                                 │  │
│  │  - Conversations, Messages, Attachments             │  │
│  │  - Read receipts, Typing indicators                 │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Payment Database                                    │  │
│  │  - Transactions, Wallets, Subscriptions             │  │
│  │  - Gifts, Payouts, Invoices                         │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Safety Database                                     │  │
│  │  - Reports, Bans, Appeals                           │  │
│  │  - Moderation logs, Safety alerts                   │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Business Databases                                 │  │
│  │  - Ad campaigns, Analytics, Revenue                 │  │
│  │  - Shares, Referrals, Collaborations                │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Core Systems

### 1. Authentication System
**Purpose**: Secure user identification and session management

**Key Components**:
- Multi-auth support (Email/Password, Google, Apple)
- JWT token management
- Refresh token rotation
- 2FA/MFA support

**Service Files**:
- `src/services/auth.ts` - Authentication logic
- `src/types/auth.ts` - Type definitions

### 2. Content Management System
**Purpose**: Handle all user-generated content (videos, stories, livestreams)

**Key Features**:
- Video upload with metadata
- Story creation and expiration
- Live streaming with real-time chat
- Comment system with threading
- Like and interaction tracking

**Service Files**:
- `src/services/content.ts`
- `src/types/content.ts`

**Database Tables**:
- `videos`, `stories`, `livestreams`, `comments`
- `likes`, `video_interactions`, `story_viewers`

### 3. Social Graph System
**Purpose**: Manage user relationships and social features

**Key Features**:
- Follow/unfollow with notifications
- Block system with privacy
- Activity tracking
- Search and discovery
- Trending content algorithms

**Service Files**:
- `src/services/social.ts`
- `src/types/social.ts`

**Database Tables**:
- `follows`, `blocks`, `notifications`
- `activity_logs`, `trending_videos`

### 4. Messaging System
**Purpose**: Real-time communication between users

**Key Features**:
- Direct messaging
- Group conversations
- Media sharing
- Typing indicators
- Read receipts
- WebSocket-based real-time updates

**Service Files**:
- `src/services/messaging.ts`
- `src/types/messaging.ts`

**Infrastructure**:
- WebSocket server for real-time events
- Message queue for delivery reliability

### 5. Payment System
**Purpose**: Monetization, subscriptions, and virtual currency

**Key Features**:
- Stripe and PayPal integration
- Wallet system with virtual currency
- Gift economy
- Creator payouts
- Subscription management
- Invoice generation

**Service Files**:
- `src/services/payment.ts`
- `src/types/payments.ts`

**External Services**:
- Stripe API for payments
- PayPal API for alternative payments
- Banking APIs for payouts

### 6. Profile & User Management
**Purpose**: User identity, settings, and analytics

**Key Features**:
- Profile customization
- Privacy settings
- Creator dashboard with analytics
- Verification badges
- Account security
- Data export/deletion

**Service Files**:
- `src/services/profile.ts`
- `src/types/profile.ts`

### 7. Moderation & Safety
**Purpose**: Content safety and community standards enforcement

**Key Features**:
- Automated content detection
- User reporting system
- Manual moderation queue
- Ban/appeal system
- Community guidelines enforcement
- Privacy violation protection

**Service Files**:
- `src/services/moderation.ts`
- `src/types/safety.ts`

**Infrastructure**:
- AI content detection (optional)
- Moderation dashboard
- Ban management system

### 8. Sharing & Collaborations
**Purpose**: Enable content sharing and creator collaborations

**Key Features**:
- Duets (side-by-side video responses)
- Stitches (video remixing)
- Referral system
- Cross-platform sharing
- Collaboration invites
- Playlist sharing

**Service Files**:
- `src/services/sharing.ts`
- `src/types/sharing.ts`

### 9. Advertising System
**Purpose**: Revenue generation through ads and sponsorships

**Key Features**:
- Ad campaign management
- Creator monetization
- Ad serving and tracking
- Audience targeting
- Analytics and ROI tracking
- Sponsored content management

**Service Files**:
- `src/services/advertising.ts`
- `src/types/advertising.ts`

## Data Flow Examples

### User Registration Flow
```
1. User submits registration form
2. Frontend calls authService.register()
3. Backend validates email/password
4. Creates user record in database
5. Sends verification email
6. Returns JWT token and refresh token
7. Frontend stores tokens and redirects to onboarding
```

### Content Upload Flow
```
1. User selects video file
2. Frontend initiates upload with metadata
3. Backend receives file
4. Queues video for processing:
   - Transcode to multiple resolutions
   - Generate thumbnail
   - Extract metadata
5. Stores in S3/blob storage
6. Updates database with video record
7. Notifies followers via social service
8. Frontend receives video object
```

### Live Stream Flow
```
1. Creator starts live stream
2. Backend generates RTMP URL and stream key
3. Creator streams via OBS/mobile app
4. Backend receives stream data
5. Distributes to viewers via HLS
6. Handles real-time chat via WebSocket
7. Records stream for VOD
8. Generates analytics
```

### Payment Flow
```
1. User purchases credits
2. Frontend shows payment form
3. User selects payment method
4. Payment provider tokenizes details
5. Backend creates payment intent
6. User confirms payment
7. Provider charges card
8. Backend receives webhook notification
9. Credits added to wallet
10. Transaction recorded
```

## Integration Patterns

### Service-to-Service Communication
- RESTful APIs for synchronous calls
- Message queues for async operations
- Database transactions for consistency

### External Service Integrations
```typescript
// Example: Payment integration
const paymentResult = await paymentService.createPayment({
  userId: currentUser.id,
  amount: 100,
  paymentMethodId: selectedMethod.id,
  type: 'gift_purchase'
});

// Triggers webhook handler
// Webhook validates signature
// Updates database
// Returns result to frontend
```

### Real-time Updates
```typescript
// WebSocket event broadcasting
// Example: User likes video
likeService.addLike(videoId, userId);
broadcastEvent('video:liked', {
  videoId,
  userId,
  totalLikes: updatedCount
});

// All watching users receive update
```

## Security Considerations

### Authentication & Authorization
- JWT tokens with short expiry (15 min)
- Refresh tokens stored securely (httpOnly cookies)
- Role-based access control (RBAC)
- Rate limiting on auth endpoints

### Data Protection
- Password hashing with bcrypt
- Encrypted sensitive data in database
- HTTPS/TLS for all communications
- Input validation and sanitization

### Content Safety
- Automated moderation filters
- User reporting with investigation
- Ban escalation for repeat offenders
- GDPR/CCPA compliance features

### Payment Security
- PCI compliance through Stripe/PayPal
- No direct card storage
- Payment verification via webhooks
- Fraud detection

## Scalability Patterns

### Database Optimization
- Connection pooling
- Query caching with Redis
- Database sharding for large tables
- Read replicas for analytics

### Caching Strategy
- Redis cache for user data
- CDN for media assets
- Client-side caching with SWR
- Cache invalidation patterns

### Load Distribution
- Horizontal scaling of API servers
- Load balancing via reverse proxy
- Microservice separation of concerns
- Queue-based background jobs

## Monitoring & Analytics

### Metrics to Track
- User growth and retention
- Content metrics (uploads, views, engagement)
- Payment metrics (revenue, ARPU)
- Performance metrics (API latency, error rates)
- Safety metrics (reports, bans, appeals)

### Tools
- Application Performance Monitoring (APM)
- Error tracking
- Log aggregation
- User analytics

## Future Enhancements

1. **AI/ML Features**
   - Personalized feed algorithm
   - Automated content moderation
   - Recommendation engine
   - Trend prediction

2. **Advanced Monetization**
   - Subscription tiers
   - Merchandise integration
   - Sponsored duets/stitches
   - Premium features

3. **Creator Tools**
   - Analytics dashboard enhancements
   - Batch content scheduling
   - Collaboration tools
   - Streaming studio features

4. **Social Features**
   - Group channels
   - Community posts
   - Events and broadcasts
   - Creator councils

## Deployment Architecture

### Development
```
Local → Git push → GitHub Actions
```

### Staging
```
GitHub main → Vercel preview → QA testing
```

### Production
```
GitHub main → Vercel production
↓
Edge Network (Global CDN)
↓
Origin servers
↓
PostgreSQL replicas
↓
Redis cluster
```

## Performance Targets

- **API Response Time**: <200ms (p95)
- **Video Upload Completion**: <5 minutes
- **Live Stream Latency**: <3 seconds
- **Message Delivery**: <1 second
- **Search Results**: <500ms
- **Page Load**: <2 seconds

---

**Last Updated**: 2024
**Version**: 1.0.0

For detailed API information, see: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
