# Spaktok Backend - Firebase & Node.js Implementation

**A comprehensive TikTok and Snapchat-like social media platform backend built with Firebase and Node.js**

[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)

## 📋 Overview

This backend implementation provides production-ready infrastructure for the Spaktok social media platform, featuring 40+ Cloud Functions across 12 core systems. The backend is built entirely on Firebase and Node.js, designed to scale to millions of users while maintaining security and performance.

### What's Implemented

**✅ Complete Systems (Design + Cloud Functions):**
- Short Videos (Reels/Feed) System
- Stories System  
- Live Streaming System
- Gift System

**✅ Design Complete (Cloud Functions Pending):**
- Profile System
- Messaging System
- Ads System
- Reports & Penalties System
- Notifications System

**✅ Previously Implemented:**
- Payment & Withdrawal System
- Premium Account System

## 🚀 Quick Start

### Prerequisites

```bash
# Install Node.js 18+
node --version

# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login
```

### Installation

```bash
# Clone repository
git clone https://github.com/spaktok/Spaktok.git
cd Spaktok

# Install dependencies
cd functions && npm install && cd ..

# Deploy to Firebase
firebase deploy
```

### Configuration

Set up environment variables:

```bash
firebase functions:config:set \
  stripe.secret_key="sk_test_..." \
  paypal.client_id="..." \
  agora.app_id="..."
```

## 📚 Core Systems

### 1. Short Videos System

Personalized video feed with engagement features and content discovery.

**Cloud Functions:**
- `uploadVideo`, `deleteVideo`, `likeVideo`, `commentOnVideo`
- `getUserFeed`, `getTrendingVideos`, `searchVideos`
- `getVideosByHashtag`, `getTrendingHashtags`

**Documentation:** [SHORT_VIDEOS_SYSTEM_DESIGN.md](SHORT_VIDEOS_SYSTEM_DESIGN.md)

### 2. Stories System

24-hour ephemeral content with interactive elements and highlights.

**Cloud Functions:**
- `createStory`, `deleteStory`, `recordStoryView`
- `getStoriesFeed`, `getUserStories`, `replyToStory`
- `saveStoryToHighlight`, `getStoryHighlights`

**Documentation:** [STORIES_SYSTEM_DESIGN.md](STORIES_SYSTEM_DESIGN.md)

### 3. Live Streaming System

Real-time video streaming with chat and viewer engagement.

**Cloud Functions:**
- `startLiveStream`, `endLiveStream`, `joinLiveStream`
- `sendStreamComment`, `likeStream`, `banUserFromStream`
- `getLiveStreamsFeed`, `cleanupInactiveViewers`

**Documentation:** [LIVE_STREAMING_SYSTEM_DESIGN.md](LIVE_STREAMING_SYSTEM_DESIGN.md)

### 4. Gift System

Virtual currency and gifting with revenue sharing.

**Cloud Functions:**
- `sendGift`, `purchaseCoins`, `confirmCoinPurchase`
- `getGiftCatalog`, `getCoinPackages`, `getUserGiftStats`
- `getGiftLeaderboard`, `updateGiftLeaderboards`

**Documentation:** [GIFT_SYSTEM_DESIGN.md](GIFT_SYSTEM_DESIGN.md)

### 5. Profile System

User profiles with verification and achievements.

**Documentation:** [PROFILE_SYSTEM_DESIGN.md](PROFILE_SYSTEM_DESIGN.md)

### 6. Messaging System

Real-time chat with ephemeral messages and calls.

**Documentation:** [MESSAGING_SYSTEM_DESIGN.md](MESSAGING_SYSTEM_DESIGN.md)

## 🏗️ Architecture

### Technology Stack

- **Firebase Authentication** - User management
- **Cloud Firestore** - NoSQL database
- **Firebase Storage** - Media storage
- **Cloud Functions** - Serverless backend (TypeScript)
- **Firebase Cloud Messaging** - Push notifications

### Data Model

**Core Collections:**
- `users` - User profiles and account data
- `videos` - Short video content
- `stories` - Ephemeral stories
- `liveStreams` - Live streaming sessions
- `gifts` - Gift catalog
- `conversations` - Messaging conversations
- `notifications` - User notifications

### Security

Security rules enforce authentication, authorization, and data validation at the database level. All Cloud Functions verify user permissions before executing operations.

## 🔌 API Usage

### Example: Upload Video

```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const uploadVideo = httpsCallable(functions, 'uploadVideo');

const result = await uploadVideo({
  title: 'My Video',
  description: 'Check this out!',
  hashtags: ['trending', 'viral'],
  category: 'entertainment'
});

console.log(result.data);
// { success: true, videoId: '...', uploadUrl: '...' }
```

### Example: Send Gift

```javascript
const sendGift = httpsCallable(functions, 'sendGift');

const result = await sendGift({
  giftId: 'rose',
  receiverId: 'user123',
  context: 'live_stream',
  contextId: 'stream456',
  quantity: 1
});

console.log(result.data);
// { success: true, animationUrl: '...', message: 'Gift sent successfully' }
```

## 📊 Database Schema

### users Collection

```typescript
{
  userId: string;
  username: string;
  displayName: string;
  email: string;
  profileImage: string;
  followerCount: number;
  followingCount: number;
  videoCount: number;
  balance: number;
  coins: number;
  level: number;
  isVerified: boolean;
  isPremiumAccount: boolean;
  // ... more fields
}
```

### videos Collection

```typescript
{
  videoId: string;
  userId: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  hashtags: string[];
  soundId: string;
  category: string;
  // ... more fields
}
```

For complete schema documentation, see individual system design documents.

## 🔒 Security

### Firebase Security Rules

Security rules in `firestore.rules` enforce:
- User authentication for all operations
- Authorization checks for data access
- Privacy settings enforcement
- Content ownership verification
- Admin privilege verification

### Rate Limiting

All endpoints implement rate limiting:
- Video uploads: 10 per hour
- Comments: 30 per minute
- Likes: 60 per minute
- Gift sending: 100 per minute

## 📈 Performance

### Optimizations

- Denormalized data for frequently accessed fields
- Composite indexes for complex queries
- Pagination for all list endpoints
- CDN for media delivery
- Batch operations for bulk updates
- Sharded counters for high-traffic metrics

### Scalability

- Serverless Cloud Functions auto-scale
- Firestore handles millions of concurrent connections
- Storage and CDN scale automatically

## 💰 Cost Estimation

### For 10,000 Active Users

- Firestore: $50-100/month
- Storage: $100-200/month
- Cloud Functions: $50-100/month
- Bandwidth: $200-500/month
- **Total: $400-900/month**

### For 100,000 Active Users

- **Total: $2,000-5,000/month**

Additional costs:
- Streaming: $500-2000/month
- Payment processing: 2.9% + $0.30 per transaction
- Content moderation: $0.001-0.01 per item

## 📝 Documentation

### System Design Documents

1. [Short Videos System](SHORT_VIDEOS_SYSTEM_DESIGN.md)
2. [Stories System](STORIES_SYSTEM_DESIGN.md)
3. [Live Streaming System](LIVE_STREAMING_SYSTEM_DESIGN.md)
4. [Gift System](GIFT_SYSTEM_DESIGN.md)
5. [Profile System](PROFILE_SYSTEM_DESIGN.md)
6. [Messaging System](MESSAGING_SYSTEM_DESIGN.md)
7. [Payment & Withdrawal System](PAYMENT_WITHDRAWAL_SYSTEM_DESIGN.md)
8. [Premium Account System](PREMIUM_ACCOUNT_DESIGN.md)
9. [Ads System](ADS_SYSTEM_DESIGN.md)
10. [Reports & Penalties System](REPORTING_PENALTY_SYSTEM_DESIGN.md)
11. [Notifications System](NOTIFICATIONS_SYSTEM_DESIGN.md)

### Implementation Summary

- [Backend Implementation Summary](BACKEND_IMPLEMENTATION_SUMMARY.md) - Complete overview

## 🧪 Testing

### Run Tests

```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# With coverage
npm run test:coverage
```

## 🤝 Contributing

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make changes and test locally
4. Submit pull request

### Code Standards

- Use TypeScript for all Cloud Functions
- Follow ESLint configuration
- Write unit tests for new functions
- Document all public functions

## 📞 Support

- GitHub Issues: [Report bugs](https://github.com/spaktok/Spaktok/issues)
- Email: support@spaktok.app
- Documentation: https://docs.spaktok.app

## 🗺️ Roadmap

### Q4 2025
- ✅ Core backend systems (75% complete)
- 🔄 Complete remaining Cloud Functions
- 🔄 Set up streaming infrastructure
- 🔄 Integrate payment gateways

### Q1 2026
- Mobile app development (Flutter)
- Web app development (React)
- Beta testing
- Public launch

## 📊 Project Status

**Version:** 1.0.0  
**Status:** Active Development  
**Last Updated:** October 5, 2025

**Completion:**
- ✅ Short Videos (100%)
- ✅ Stories (100%)
- ✅ Live Streaming (100%)
- ✅ Gift System (100%)
- ✅ Profile (80%)
- ✅ Messaging (80%)
- 📋 Others (50%)

**Overall Progress:** 75% Complete

---

**Built with ❤️ by the Spaktok Team**

For more information, see [BACKEND_IMPLEMENTATION_SUMMARY.md](BACKEND_IMPLEMENTATION_SUMMARY.md)
