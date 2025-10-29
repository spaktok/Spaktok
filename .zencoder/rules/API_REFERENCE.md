---
description: Spaktok Complete API Reference Documentation
alwaysApply: true
---

# 🔌 SPAKTOK API REFERENCE

**Status**: ✅ Complete | **Version**: 2.0 | **Base URL**: `https://api.spaktok.com`

---

## TABLE OF CONTENTS

1. [Authentication APIs](#authentication-apis)
2. [RTC/Agora APIs](#rtcagora-apis)
3. [Content APIs](#content-apis)
4. [Streaming APIs](#streaming-apis)
5. [Payment APIs](#payment-apis)
6. [User APIs](#user-apis)
7. [Chat APIs](#chat-apis)
8. [Error Codes](#error-codes)
9. [Rate Limiting](#rate-limiting)
10. [Best Practices](#best-practices)

---

## AUTHENTICATION APIS

### Register User

```
POST /api/auth/register
Content-Type: application/json

Request:
{
  "email": "user@example.com",
  "password": "secure_password",
  "username": "username",
  "phone": "+1234567890"
}

Response (200):
{
  "success": true,
  "user_id": "uuid-here",
  "token": "jwt-token-here",
  "expires_in": 86400
}

Response (400):
{
  "success": false,
  "error": "Email already exists"
}
```

### Login

```
POST /api/auth/login
Content-Type: application/json

Request:
{
  "email": "user@example.com",
  "password": "secure_password"
}

Response (200):
{
  "success": true,
  "token": "jwt-token-here",
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "username": "username"
  },
  "expires_in": 86400
}
```

### Refresh Token

```
POST /api/auth/refresh-token
Authorization: Bearer {refresh_token}

Response (200):
{
  "success": true,
  "token": "new-jwt-token",
  "expires_in": 86400
}
```

### Logout

```
POST /api/auth/logout
Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## RTC/AGORA APIs

### Get RTC Token

```
POST /api/agora/token
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "userId": "user-id",
  "channel": "channel-name",
  "role": "publisher" | "subscriber",
  "uid": 0
}

Response (200):
{
  "success": true,
  "token": "agora-token-string",
  "expiresIn": 43200,
  "channelName": "channel-name",
  "uid": 0
}

Response (429):
{
  "success": false,
  "error": "Rate limit exceeded: 100 tokens per day"
}
```

**Parameters**:
- `channel`: Channel name (unique identifier)
- `role`: "publisher" for streamers, "subscriber" for viewers
- `uid`: User numeric ID (0 for auto-assignment)

**Rate Limiting**: 100 tokens per user per day

### Renew Token

```
POST /api/agora/renew-token
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "channel": "channel-name",
  "uid": 0
}

Response (200):
{
  "success": true,
  "token": "new-agora-token",
  "expiresIn": 43200
}
```

### Health Check

```
GET /api/agora/health

Response (200):
{
  "status": "ok",
  "timestamp": "2025-10-28T12:00:00Z",
  "version": "2.0.0",
  "agora_status": "healthy"
}
```

---

## CONTENT APIS

### Upload Video

```
POST /api/content/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data

Request:
- video_file: File (video/mp4, max 1GB)
- thumbnail: File (image/jpeg)
- title: "Video title"
- description: "Video description"
- tags: ["tag1", "tag2"]
- visibility: "public" | "private" | "friends"

Response (201):
{
  "success": true,
  "video_id": "uuid",
  "title": "Video title",
  "duration": 60,
  "status": "processing",
  "created_at": "2025-10-28T12:00:00Z"
}
```

### Get Feed

```
GET /api/content/feed
Authorization: Bearer {token}
?page=1&limit=20&sort=latest

Response (200):
{
  "success": true,
  "videos": [
    {
      "id": "uuid",
      "title": "Title",
      "creator_id": "uuid",
      "creator_name": "username",
      "thumbnail_url": "https://...",
      "duration": 60,
      "views": 1000,
      "likes": 100,
      "comments": 50,
      "shares": 10,
      "created_at": "2025-10-28T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1000,
    "has_more": true
  }
}
```

### Like/Unlike Video

```
POST /api/content/videos/{video_id}/like
Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "liked": true,
  "like_count": 101
}
```

### Comment on Video

```
POST /api/content/videos/{video_id}/comment
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "text": "Great video!",
  "timestamp": 30
}

Response (201):
{
  "success": true,
  "comment": {
    "id": "uuid",
    "user_id": "uuid",
    "text": "Great video!",
    "timestamp": 30,
    "likes": 0,
    "created_at": "2025-10-28T12:00:00Z"
  }
}
```

### Get Comments

```
GET /api/content/videos/{video_id}/comments
?page=1&limit=20

Response (200):
{
  "success": true,
  "comments": [
    {
      "id": "uuid",
      "user": {
        "id": "uuid",
        "username": "username",
        "avatar": "https://..."
      },
      "text": "Great video!",
      "timestamp": 30,
      "likes": 5,
      "replies": 2,
      "created_at": "2025-10-28T12:00:00Z"
    }
  ]
}
```

### Delete Video

```
DELETE /api/content/videos/{video_id}
Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "message": "Video deleted successfully"
}
```

---

## STREAMING APIS

### Start Live Stream

```
POST /api/streaming/start
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "title": "Live Stream Title",
  "description": "Stream description",
  "thumbnail_url": "https://...",
  "visibility": "public" | "private"
}

Response (201):
{
  "success": true,
  "stream_id": "uuid",
  "rtmp_url": "rtmp://stream.spaktok.com/live",
  "stream_key": "stream-key-here",
  "channel": "channel-uuid",
  "agora_token": "token-here",
  "starts_at": "2025-10-28T12:00:00Z"
}
```

### Get Active Streams

```
GET /api/streaming/active
?page=1&limit=20

Response (200):
{
  "success": true,
  "streams": [
    {
      "id": "uuid",
      "title": "Live Stream",
      "streamer": {
        "id": "uuid",
        "username": "streamer_name",
        "avatar": "https://..."
      },
      "viewers": 5000,
      "duration": 3600,
      "thumbnail": "https://...",
      "started_at": "2025-10-28T12:00:00Z"
    }
  ]
}
```

### End Live Stream

```
POST /api/streaming/end
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "stream_id": "uuid"
}

Response (200):
{
  "success": true,
  "stats": {
    "viewers_peak": 10000,
    "viewers_avg": 5000,
    "duration": 3600,
    "gifts_received": 50,
    "revenue": 500.00
  }
}
```

### Get Stream Stats

```
GET /api/streaming/{stream_id}/stats
Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "stats": {
    "viewers_current": 5000,
    "viewers_peak": 10000,
    "viewers_total_unique": 20000,
    "duration": 3600,
    "viewer_list": [
      {
        "user_id": "uuid",
        "joined_at": "2025-10-28T12:00:00Z"
      }
    ]
  }
}
```

---

## PAYMENT APIS

### Process Payment

```
POST /api/payments/process
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "amount": 100.00,
  "currency": "USD",
  "payment_method": "card",
  "card_token": "stripe-token",
  "description": "Coins purchase"
}

Response (200):
{
  "success": true,
  "transaction_id": "uuid",
  "amount": 100.00,
  "status": "success",
  "timestamp": "2025-10-28T12:00:00Z"
}
```

### Get Payment History

```
GET /api/payments/history
Authorization: Bearer {token}
?page=1&limit=20

Response (200):
{
  "success": true,
  "transactions": [
    {
      "id": "uuid",
      "amount": 100.00,
      "currency": "USD",
      "status": "success",
      "type": "purchase",
      "description": "Coins purchase",
      "timestamp": "2025-10-28T12:00:00Z"
    }
  ]
}
```

### Get Earnings

```
GET /api/payments/earnings
Authorization: Bearer {token}
?period=month | year

Response (200):
{
  "success": true,
  "earnings": {
    "total": 5000.00,
    "this_period": 500.00,
    "pending": 100.00,
    "available": 400.00,
    "breakdown": {
      "live_gifts": 300.00,
      "video_ads": 150.00,
      "brand_partnerships": 50.00
    }
  }
}
```

---

## USER APIS

### Get User Profile

```
GET /api/users/{user_id}
Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "user": {
    "id": "uuid",
    "username": "username",
    "email": "email@example.com",
    "bio": "User bio",
    "avatar": "https://...",
    "followers": 1000,
    "following": 500,
    "total_views": 100000,
    "verified": true,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### Update Profile

```
PUT /api/users/profile
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "username": "new_username",
  "bio": "New bio",
  "avatar": "base64_image_data"
}

Response (200):
{
  "success": true,
  "user": { ... }
}
```

### Follow/Unfollow User

```
POST /api/users/{user_id}/follow
Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "following": true,
  "follower_count": 1001
}
```

### Get Followers

```
GET /api/users/{user_id}/followers
?page=1&limit=20

Response (200):
{
  "success": true,
  "followers": [
    {
      "id": "uuid",
      "username": "follower_name",
      "avatar": "https://...",
      "bio": "Bio",
      "followed_at": "2025-10-28T12:00:00Z"
    }
  ]
}
```

---

## CHAT APIS

### Send Message

```
POST /api/chat/send
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "recipient_id": "uuid",
  "text": "Hello!",
  "type": "text" | "image" | "video"
}

Response (201):
{
  "success": true,
  "message": {
    "id": "uuid",
    "from": "uuid",
    "to": "uuid",
    "text": "Hello!",
    "sent_at": "2025-10-28T12:00:00Z",
    "read": false
  }
}
```

### Get Conversation

```
GET /api/chat/conversations/{user_id}
Authorization: Bearer {token}
?page=1&limit=50

Response (200):
{
  "success": true,
  "messages": [
    {
      "id": "uuid",
      "from": "uuid",
      "to": "uuid",
      "text": "Hello!",
      "sent_at": "2025-10-28T12:00:00Z",
      "read": true
    }
  ]
}
```

### Mark as Read

```
PUT /api/chat/messages/{message_id}/read
Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "read": true
}
```

---

## ERROR CODES

### Standard HTTP Status Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 200 | OK | Success |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Check request parameters |
| 401 | Unauthorized | Include valid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 429 | Rate Limited | Wait before retrying |
| 500 | Server Error | Try again later |
| 503 | Service Unavailable | Maintenance in progress |

### Custom Error Responses

```json
{
  "success": false,
  "error": "Error message",
  "error_code": "INVALID_TOKEN",
  "details": {
    "field": "email",
    "message": "Invalid email format"
  }
}
```

### Common Error Codes

| Code | Message | Fix |
|------|---------|-----|
| INVALID_TOKEN | Token is invalid or expired | Login again |
| RATE_LIMIT_EXCEEDED | Too many requests | Wait before retrying |
| INVALID_CREDENTIALS | Invalid email or password | Check credentials |
| EMAIL_ALREADY_EXISTS | Email already registered | Use different email |
| INVALID_FILE_TYPE | File type not supported | Use correct format |
| FILE_TOO_LARGE | File exceeds max size | Use smaller file |

---

## RATE LIMITING

### Rate Limit Headers

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1635336000
```

### Rate Limits by Endpoint

| Endpoint | Limit | Window |
|----------|-------|--------|
| /api/agora/token | 100 | per day |
| /api/auth/login | 10 | per hour |
| /api/content/upload | 5 | per hour |
| /api/chat/send | 100 | per hour |
| /api/streaming/start | 1 | per day |

### Handling Rate Limits

```javascript
if (response.status === 429) {
  const resetTime = response.headers['X-RateLimit-Reset'];
  const waitSeconds = resetTime - Math.floor(Date.now() / 1000);
  console.log(`Wait ${waitSeconds} seconds before retrying`);
}
```

---

## BEST PRACTICES

### Authentication

```javascript
// ✅ DO: Always include token
headers: {
  'Authorization': 'Bearer {token}',
  'Content-Type': 'application/json'
}

// ❌ DON'T: Never expose token
// Don't log tokens
// Don't send in URL params
// Don't store in localStorage (use secure cookie)
```

### Error Handling

```javascript
// ✅ DO: Handle all error codes
try {
  const response = await fetch('/api/content/videos', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  
  if (!response.ok) {
    const error = await response.json();
    handleError(error.error_code);
  }
  
  const data = await response.json();
} catch (err) {
  handleNetworkError(err);
}

// ❌ DON'T: Ignore errors
```

### Pagination

```javascript
// ✅ DO: Use pagination
const response = await fetch(
  '/api/content/feed?page=1&limit=20'
);

// ❌ DON'T: Fetch all data at once
// This causes performance issues
```

### Caching

```javascript
// ✅ DO: Cache GET responses
const cacheKey = `user_${userId}`;
let user = cache.get(cacheKey);

if (!user) {
  user = await fetch(`/api/users/${userId}`);
  cache.set(cacheKey, user, 3600); // 1 hour TTL
}

// ❌ DON'T: Always fetch fresh data
```

### Timeout

```javascript
// ✅ DO: Set appropriate timeouts
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 5000);

const response = await fetch(url, {
  signal: controller.signal
});

clearTimeout(timeout);

// ❌ DON'T: Have no timeout (connection hangs)
```

---

## API VERSIONING

### Current Version
- **Version**: 2.0
- **Base URL**: https://api.spaktok.com/v2
- **Deprecation**: v1 deprecated on 2025-12-31

### Version Migration

```
Old: /api/content/upload
New: /api/v2/content/upload
```

---

## WEBHOOKS

### Webhook Configuration

```
POST /api/webhooks/register
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "url": "https://yourserver.com/webhook",
  "events": ["video.uploaded", "live.started", "payment.completed"]
}

Response (201):
{
  "success": true,
  "webhook_id": "uuid",
  "events": [...],
  "active": true
}
```

### Webhook Events

```json
{
  "event": "video.uploaded",
  "timestamp": "2025-10-28T12:00:00Z",
  "data": {
    "video_id": "uuid",
    "creator_id": "uuid",
    "title": "Video title"
  }
}
```

---

## TESTING

### Using cURL

```bash
# Get token
curl -X POST https://api.spaktok.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Use token in requests
curl https://api.spaktok.com/api/users/profile \
  -H "Authorization: Bearer {token}"
```

### Using Postman

1. Import API collection
2. Set base URL: `{{base_url}}`
3. Set variables: `token`, `base_url`, `user_id`
4. Test each endpoint

---

**Last Updated**: 2025-10-28  
**Status**: ✅ Complete  
**Questions**: See CONSOLIDATED_MASTER_GUIDE.md
