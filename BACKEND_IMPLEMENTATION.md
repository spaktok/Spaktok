# Spaktok Backend Implementation Guide

## Overview

This guide provides instructions for implementing the Spaktok backend services based on the type definitions and service interfaces already defined in the repository.

## Project Structure

```
spaktok/
├── src/
│   ├── services/
│   │   ├── auth.ts          # Authentication service
│   │   ├── content.ts       # Content management
│   │   ├── social.ts        # Social features
│   │   ├── messaging.ts     # Direct messaging
│   │   ├── payment.ts       # Payment processing
│   │   ├── profile.ts       # User profiles
│   │   ├── moderation.ts    # Content moderation
│   │   ├── sharing.ts       # Content sharing
│   │   └── advertising.ts   # Ad system
│   ├── types/
│   │   ├── auth.ts
│   │   ├── content.ts
│   │   ├── social.ts
│   │   ├── messaging.ts
│   │   ├── payments.ts
│   │   ├── profile.ts
│   │   ├── safety.ts
│   │   ├── sharing.ts
│   │   └── advertising.ts
│   ├── utils/
│   │   └── api.ts           # API client
│   └── middleware/
│       ├── auth.ts          # Auth middleware
│       ├── errorHandler.ts  # Error handling
│       └── validation.ts    # Input validation
├── scripts/
│   ├── db-setup.sql         # Database schema
│   ├── seed.sql             # Test data
│   └── migrations/          # Database migrations
├── API_DOCUMENTATION.md     # API reference
└── ARCHITECTURE.md          # System design
```

## Implementation Steps

### Phase 1: Core Infrastructure (Weeks 1-2)

#### 1.1 Database Setup
Create PostgreSQL schema for all modules:

```bash
# Create user schema
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),
  bio TEXT,
  avatar_url VARCHAR(255),
  cover_image_url VARCHAR(255),
  verified BOOLEAN DEFAULT FALSE,
  is_private BOOLEAN DEFAULT FALSE,
  is_banned BOOLEAN DEFAULT FALSE,
  ban_reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

# Create user profiles table
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  website VARCHAR(255),
  location VARCHAR(255),
  birth_date DATE,
  gender VARCHAR(50),
  followers_count INT DEFAULT 0,
  following_count INT DEFAULT 0,
  videos_count INT DEFAULT 0,
  likes_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

# Similar tables for content, social graph, messaging, payments, etc.
```

#### 1.2 API Framework Setup
```typescript
// Express.js setup with middleware
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { authMiddleware, errorHandler } from './middleware';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(authMiddleware);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/users', userRoutes);
// ... other routes

// Error handling
app.use(errorHandler);

export default app;
```

#### 1.3 Authentication System
```typescript
// services/auth.ts implementation
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const authService = {
  async register(email: string, password: string, username: string) {
    // 1. Validate input
    // 2. Check if user exists
    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 4. Create user in database
    // 5. Generate JWT tokens
    const token = jwt.sign(
      { userId, email },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    
    // 6. Return user and tokens
    return { user, token, refreshToken };
  },

  async login(email: string, password: string) {
    // 1. Find user
    // 2. Verify password
    // 3. Generate tokens
    // 4. Return user and tokens
  },

  async verifyToken(token: string) {
    // Verify JWT signature and expiry
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new AuthError('Invalid token');
    }
  }
};
```

### Phase 2: Core Services (Weeks 3-6)

#### 2.1 Content Management Service
```typescript
// services/content.ts
export const contentService = {
  async uploadVideo(userId: string, file: File, metadata: VideoMetadata) {
    // 1. Validate file
    // 2. Upload to S3/Blob storage
    // 3. Queue video processing (encoding, thumbnails)
    // 4. Create database record
    // 5. Return video object
  },

  async processVideo(videoId: string) {
    // This runs in background job queue
    // 1. Download video from storage
    // 2. Encode to multiple resolutions
    // 3. Generate thumbnail
    // 4. Extract metadata (duration, fps, etc.)
    // 5. Update database
  },

  async likeVideo(videoId: string, userId: string) {
    // 1. Check if already liked
    // 2. Add like record
    // 3. Update video like count
    // 4. Trigger notification
    // 5. Return updated count
  }
};
```

#### 2.2 Social Graph Service
```typescript
// services/social.ts
export const socialService = {
  async followUser(followerId: string, followingId: string) {
    // 1. Validate users exist
    // 2. Check if already following
    // 3. Create follow record
    // 4. Update follower/following counts
    // 5. Create notification
    // 6. Trigger real-time event
  },

  async getFollowers(userId: string, limit: number, offset: number) {
    // 1. Query followers from database
    // 2. Fetch user profiles
    // 3. Check if current user follows back
    // 4. Return paginated list
  }
};
```

#### 2.3 Real-time Messaging Service
```typescript
// services/messaging.ts with WebSocket support
import WebSocket from 'ws';

export const messagingService = {
  async sendMessage(conversationId: string, userId: string, content: string) {
    // 1. Create message record
    // 2. Broadcast to connected WebSocket clients
    // 3. Update conversation lastMessage
    // 4. Create notification for recipient
  }
};

// WebSocket handler
export function handleWebSocketConnection(ws: WebSocket, userId: string) {
  ws.on('message', (data) => {
    const { type, conversationId, text } = JSON.parse(data);
    
    if (type === 'message') {
      messagingService.sendMessage(conversationId, userId, text);
    } else if (type === 'typing') {
      // Broadcast typing indicator
    }
  });
}
```

#### 2.4 Payment Processing Service
```typescript
// services/payment.ts with Stripe integration
import Stripe from 'stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const paymentService = {
  async createPaymentIntent(amount: number, currency: string = 'USD') {
    // 1. Create Stripe payment intent
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      automatic_payment_methods: { enabled: true }
    });

    return intent;
  },

  async handlePaymentWebhook(event: Stripe.Event) {
    // 1. Verify webhook signature
    // 2. Check event type
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.onPaymentSuccess(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await this.onPaymentFailed(event.data.object);
        break;
    }
  },

  async onPaymentSuccess(intent: Stripe.PaymentIntent) {
    // 1. Get userId from metadata
    // 2. Add credits to wallet
    // 3. Create transaction record
    // 4. Notify user
  }
};
```

#### 2.5 Live Streaming Service
```typescript
// services/content.ts - streaming portion
export const streamingService = {
  async startStream(userId: string, title: string) {
    // 1. Generate unique RTMP endpoint and key
    // 2. Create stream record in database
    // 3. Initialize transcoding pipeline
    // 4. Set up HLS distribution
    // 5. Return RTMP credentials to streamer
  },

  async broadcastToViewers(streamId: string, hlsSegment: Buffer) {
    // 1. Process HLS segment
    // 2. Send to CDN
    // 3. Distribute to WebSocket clients
    // 4. Update view count
  }
};
```

### Phase 3: Monetization & Creator Tools (Weeks 7-8)

#### 3.1 Creator Dashboard
```typescript
// services/profile.ts - creator analytics
export const creatorAnalyticsService = {
  async getCreatorDashboard(userId: string) {
    // 1. Query analytics data
    const videoStats = await queryVideoStats(userId);
    const earningStats = await queryEarningStats(userId);
    const followers = await countFollowers(userId);
    
    // 2. Aggregate metrics
    return {
      totalEarnings,
      monthlyEarnings,
      totalFollowers,
      monthlyGrowth,
      totalViews,
      engagementRate,
      topVideos,
      audienceDemographics
    };
  }
};
```

#### 3.2 Monetization System
```typescript
// services/advertising.ts - creator earnings
export const creatorMonetizationService = {
  async enableMonetization(userId: string) {
    // 1. Verify eligibility
    //    - Minimum followers
    //    - Account age
    //    - Community guidelines compliance
    
    // 2. Enable ad serving on content
    // 3. Set up revenue sharing
    // 4. Create payout account
  },

  async calculateEarnings(userId: string, period: string) {
    // 1. Calculate ad revenue
    // 2. Calculate gift earnings
    // 3. Calculate subscription revenue
    // 4. Deduct platform fees
    // 5. Return net earnings
  }
};
```

### Phase 4: Moderation & Safety (Weeks 9-10)

#### 4.1 Content Moderation
```typescript
// services/moderation.ts
export const moderationService = {
  async analyzeContent(contentId: string, contentType: string) {
    // 1. Run automated checks
    //    - Text classification (hate speech, violence, etc.)
    //    - Image analysis (explicit content, violence, etc.)
    //    - Audio transcription and analysis
    
    // 2. If high risk, flag for manual review
    // 3. If clear violation, auto-remove
    // 4. Log action for audit
  },

  async handleReport(report: ContentReport) {
    // 1. Add to moderation queue
    // 2. Assign to moderator
    // 3. Await decision
    // 4. Execute action (remove, ban, etc.)
    // 5. Notify reporter and creator
  }
};
```

#### 4.2 User Safety
```typescript
// Safety monitoring
export const safetyService = {
  async detectSuspiciousActivity(userId: string, activity: string) {
    // 1. Check for unusual patterns
    //    - Rapid mass following
    //    - Fake engagement
    //    - Phishing attempts
    
    // 2. Score risk level
    // 3. Take action if necessary
    // 4. Notify security team
  }
};
```

### Phase 5: Advanced Features (Weeks 11-12)

#### 5.1 Duets & Stitches
```typescript
// services/sharing.ts
export const duetService = {
  async createDuet(originalVideoId: string, userId: string, videoFile: File) {
    // 1. Verify original video exists and allows duets
    // 2. Upload duet video
    // 3. Process video (encoding, etc.)
    // 4. Create duet record linking both videos
    // 5. Notify original creator
    // 6. Add to feed of followers
  }
};
```

#### 5.2 Recommendations & Discovery
```typescript
// Advanced recommendation engine
export const recommendationService = {
  async getRecommendedVideos(userId: string) {
    // 1. Get user's watch history
    // 2. Get user's interaction patterns
    // 3. Query similar content from others
    // 4. Calculate relevance scores
    // 5. Rank and return top N videos
  },

  // Use ML/AI for personalization
  // Consider collaborative filtering
  // Consider content-based filtering
};
```

## Database Schema Templates

### Core Tables

```sql
-- Authentication
CREATE TABLE sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  token VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Content
CREATE TABLE videos (
  id UUID PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  video_url VARCHAR(255) NOT NULL,
  thumbnail_url VARCHAR(255),
  duration INT,
  views INT DEFAULT 0,
  likes INT DEFAULT 0,
  comments INT DEFAULT 0,
  visibility VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Social
CREATE TABLE follows (
  id UUID PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES users(id),
  following_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- Messaging
CREATE TABLE conversations (
  id UUID PRIMARY KEY,
  participant_ids UUID[] NOT NULL,
  last_message_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id),
  sender_id UUID NOT NULL REFERENCES users(id),
  text TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Payments
CREATE TABLE wallets (
  id UUID PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL REFERENCES users(id),
  balance DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE transactions (
  id UUID PRIMARY KEY,
  wallet_id UUID NOT NULL REFERENCES wallets(id),
  type VARCHAR(50),
  amount DECIMAL(10, 2),
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Safety
CREATE TABLE reports (
  id UUID PRIMARY KEY,
  reporter_id UUID NOT NULL REFERENCES users(id),
  content_type VARCHAR(50),
  content_id UUID,
  reason VARCHAR(255),
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);
```

## Environment Variables Required

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/spaktok

# Authentication
JWT_SECRET=your_jwt_secret_key
REFRESH_TOKEN_SECRET=your_refresh_token_secret

# External Services
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...

# Storage
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=spaktok-videos
# OR for Vercel Blob
BLOB_READ_WRITE_TOKEN=...

# Streaming
RTMP_SERVER_URL=rtmp://streaming.example.com:1935/live
HLS_ENDPOINT=https://cdn.example.com/hls

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=...

# Redis (for caching/sessions)
REDIS_URL=redis://localhost:6379

# Monitoring
SENTRY_DSN=...

# Node
NODE_ENV=development
```

## Testing Strategy

```typescript
// Example test structure
import { describe, it, expect, beforeEach } from '@jest/globals';
import { authService } from '../services/auth';

describe('Auth Service', () => {
  describe('register', () => {
    it('should create a new user', async () => {
      const result = await authService.register(
        'test@example.com',
        'password123',
        'testuser'
      );
      
      expect(result.user).toBeDefined();
      expect(result.token).toBeDefined();
      expect(result.user.email).toBe('test@example.com');
    });

    it('should reject duplicate email', async () => {
      await authService.register('test@example.com', 'pass1', 'user1');
      
      expect(
        authService.register('test@example.com', 'pass2', 'user2')
      ).rejects.toThrow('Email already registered');
    });
  });
});
```

## Deployment Checklist

- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] CORS settings configured
- [ ] Rate limiting enabled
- [ ] Error logging configured
- [ ] Health check endpoints ready
- [ ] Database backups configured
- [ ] SSL/TLS certificates valid
- [ ] CDN configured for media
- [ ] Webhook endpoints verified
- [ ] Monitoring and alerts set up
- [ ] Load balancing configured

## Performance Optimization Tips

1. **Database Queries**
   - Use indexes on frequently queried columns
   - Implement query caching with Redis
   - Use connection pooling

2. **API Performance**
   - Implement pagination for list endpoints
   - Use compression (gzip)
   - Cache responses with appropriate TTLs
   - Implement field selection

3. **Media Processing**
   - Use background job queues for encoding
   - Implement adaptive bitrate streaming
   - Cache generated thumbnails
   - Use CDN for distribution

4. **Scalability**
   - Implement database replication
   - Use Redis for caching layer
   - Separate read and write databases
   - Implement service-to-service caching

## Maintenance Tasks

- Daily: Monitor error logs, check system health
- Weekly: Review performance metrics, update dependencies
- Monthly: Analyze usage patterns, plan optimizations
- Quarterly: Security audits, database optimization

---

**Next Steps**: Follow the implementation phases sequentially, testing each phase before moving to the next.
