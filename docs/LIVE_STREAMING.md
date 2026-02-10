# Live Streaming System Documentation

## Overview

Spaktok's Live Streaming system leverages Agora.io for real-time video/audio transmission with integrated chat, gifting, and monetization features.

## Architecture

### Agora Integration
- Real-time video/audio transmission via Agora SDK
- Token-based authentication for secure channel access
- Automatic token refresh and reconnection handling
- Support for 1000+ concurrent viewers per stream

### Broadcasting Flow
1. User initiates live stream through mobile app
2. Backend generates unique channel ID and Agora token
3. Client connects to Agora channel with broadcaster credentials
4. Viewers join as audience members (read-only streams)
5. Real-time chat and interactions via WebSocket

## Core Features

### Stream Management
- Stream creation with metadata (title, description, tags)
- Category-based organization
- Viewer count tracking
- Stream scheduling (future functionality)
- Automatic recording and VOD generation

### Real-time Interactions
- Live chat with moderation
- Gift sending and receiving
- Follow/unfollow during stream
- Viewer milestone celebrations
- Host blocking and user muting

### Monetization
- Gift catalog with multiple price points
- Creator earnings calculation
- Gift history and analytics
- Payout management

### Moderation & Safety
- User blocking system
- Message filtering for spam/profanity
- Broadcaster moderation tools
- Inappropriate content reporting
- Automatic stream termination for violations

## API Endpoints

### Stream Lifecycle
```
POST /api/live/start - Start a new live stream
POST /api/live/:id/end - End an active stream
GET /api/live/:id - Get stream details
GET /api/live/active - Get all active streams
```

### Agora Integration
```
POST /api/live/agora/token - Generate viewer token
POST /api/live/agora/token/renew - Renew expired token
```

### Chat & Interactions
```
POST /api/live/:id/chat - Send chat message
GET /api/live/:id/chat - Get chat history
POST /api/live/:id/gift - Send gift to broadcaster
```

### Management
```
POST /api/live/:id/mute - Mute user
POST /api/live/:id/block - Block user
POST /api/live/:id/settings - Update stream settings
```

## Client Implementation

### Starting a Live Stream

```typescript
import { liveService } from '@/services/live';
import { AgoraRTC } from 'agora-react-native-rtc';

// 1. Create stream entry
const stream = await liveService.startLiveStream({
  title: 'My Awesome Live Stream',
  description: 'Join me for a live session',
  category: 'Entertainment',
  tags: ['live', 'entertainment'],
  monetized: true,
});

// 2. Get Agora token
const agoraToken = await liveService.generateAgoraToken(
  stream.id,
  Math.floor(Math.random() * 100000)
);

// 3. Initialize Agora client
const engine = await AgoraRTC.createRtcEngine();
await engine.initialize(agoraAppId);
await engine.enableVideo();
await engine.enableAudio();

// 4. Join channel
await engine.joinChannel(
  agoraToken.token,
  agoraToken.channelId,
  agoraToken.uid,
  { clientRoleType: 1 } // 1 = Broadcaster
);
```

### Viewing a Live Stream

```typescript
// 1. Get stream info
const stream = await liveService.getLiveStream(streamId);

// 2. Get viewer token
const viewerToken = await liveService.generateAgoraToken(
  streamId,
  Math.floor(Math.random() * 100000)
);

// 3. Join as viewer
await engine.joinChannel(
  viewerToken.token,
  viewerToken.channelId,
  viewerToken.uid,
  { clientRoleType: 2 } // 2 = Audience
);

// 4. Load chat history
const messages = await liveService.getChatMessages(streamId);
```

### Sending Gifts

```typescript
await liveService.sendGiftOnLive(streamId, 'rose', 5);
// Deducts 5 * rose_price from user wallet
// Credits broadcaster earnings
```

## Storage & Data

### Cloudflare Storage Structure
```
/live/streams/{streamId}/
  - metadata.json (stream info)
  - thumbnail.jpg
  - recording.mp4 (if recorded)
  
/live/chat/{streamId}/
  - messages.db (persisted chat)
  
/live/gifts/{streamId}/
  - gift_log.json (gift transactions)
```

### Automatic Cleanup
- Chat history retained for 30 days
- Stream recordings archived after 90 days
- Temporary files cleaned up immediately

## Performance Optimization

### Bandwidth Management
- Adaptive bitrate based on network conditions
- Multiple video quality options (720p, 480p, 360p, 240p)
- Audio-only fallback mode
- Automatic codec selection

### Latency Reduction
- Ultra-low latency mode (< 150ms)
- CDN edge distribution
- WebRTC optimization
- Local message caching

### Scalability
- Horizontal scaling across multiple Agora channels
- Load balancing for chat server
- Cached viewer counts
- Async transaction processing

## Error Handling

### Connection Issues
- Automatic reconnection with exponential backoff
- User notification on connection loss
- Graceful degradation (audio-only mode)
- Stream resumption capability

### Rate Limiting
- Chat message rate limiting: 5 msgs/second per user
- Gift sending rate limiting: 1 gift/second per user
- API rate limiting: 100 requests/minute

## Best Practices

1. **Stream Quality**
   - Use good lighting and clear audio
   - Test microphone and camera before going live
   - Maintain stable internet connection
   - Use landscape orientation for better viewer experience

2. **Chat Management**
   - Moderate inappropriate content promptly
   - Welcome new viewers
   - Engage with audience questions
   - Block spammers immediately

3. **Monetization**
   - Set clear gift expectations
   - Thank gift senders publicly
   - Use gifts as engagement tools
   - Track earnings regularly

4. **Safety**
   - Report policy violations
   - Block abusive users quickly
   - Enable stream settings appropriately
   - Review viewer list regularly

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Black video | Check camera permissions, restart app |
| Audio not working | Verify microphone permissions, test audio in settings |
| Can't join channel | Check Agora token validity, verify internet |
| Chat not loading | Refresh chat, check WebSocket connection |
| Viewer count incorrect | Wait 5-10 seconds for count sync |
| Can't send gifts | Verify wallet has sufficient balance |
