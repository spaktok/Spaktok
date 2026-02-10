# Spaktok Messaging System Documentation

## Overview

The Spaktok messaging system provides secure, real-time one-on-one messaging with Snapchat-style ephemeral messages, typing indicators, and auto-deletion features.

## Architecture

### Components

1. **ChatScreen** (`src/screens/messages/ChatScreen.tsx`)
   - Message display and input
   - Media handling (images, videos)
   - Typing indicators
   - Snapchat-style messages

2. **MessageBubble** (`src/components/MessageBubble.tsx`)
   - Message rendering
   - Media display
   - Message status indicators
   - Expiration info

3. **Chat Store** (`src/store/chatStore.ts`)
   - Conversation state management
   - Message caching
   - Typing indicator state
   - Unread count tracking

### Services

1. **Messages Service** (`src/services/messages.ts`)
   - Conversation management
   - Message CRUD operations
   - Media uploads
   - Auto-delete configuration

## Features

### 1. Real-Time Messaging

```typescript
// Send text message
const message = await messagesService.sendMessage(
  conversationId,
  'Hello World',
  'text'
);

// Message automatically added to store
useChatStore.addMessage(conversationId, message);
```

### 2. Snapchat-Style Messages

Messages that auto-delete after being viewed:

```typescript
const snapMessage = await messagesService.sendSnapchatStyleMessage(
  conversationId,
  imageUri,
  10, // 10 seconds
  true, // Delete after first view
  3 // Max 3 views before auto-delete
);
```

Features:
- Auto-expires after specified time
- Deletes after being viewed (optional)
- View count tracking
- Screenshot detection
- Expiration warnings

### 3. Media Messaging

```typescript
// Send image
const imageMessage = await messagesService.sendMediaMessage(
  conversationId,
  imageUri,
  'image'
);

// Send video
const videoMessage = await messagesService.sendMediaMessage(
  conversationId,
  videoUri,
  'video',
  { duration: 30, thumbnail: thumbnailUri }
);

// Send voice message
const voiceMessage = await messagesService.sendMediaMessage(
  conversationId,
  audioUri,
  'voice',
  { duration: 15 }
);
```

### 4. Typing Indicators

```typescript
// Show typing status
await messagesService.sendTypingIndicator(conversationId, true);

// Automatically stop after 2 seconds of inactivity
setTimeout(() => {
  messagesService.sendTypingIndicator(conversationId, false);
}, 2000);

// Monitor typing users
const { typingUsers } = useChatStore();
if (typingUsers.size > 0) {
  // Show "Someone is typing..."
}
```

### 5. Auto-Delete Configuration

```typescript
// Set up auto-delete for all messages in conversation
const config: AutoDeleteConfig = {
  enabled: true,
  deleteAfterSeconds: 30,
  deleteAfterView: true,
};

await messagesService.setAutoDeleteConfig(conversationId, config);
```

### 6. Read Receipts

```typescript
// Mark message as read
await messagesService.markAsRead(conversationId, messageId);

// Mark all as read
await messagesService.markConversationAsRead(conversationId);

// Message shows two checkmarks when read
{isOwn && (
  <Text>{message.viewedAt ? '✓✓' : '✓'}</Text>
)}
```

## Message Types

### Text Messages

- Basic text communication
- Support for emojis
- Automatic link preview (optional)
- Message editing and deletion

### Image Messages

```typescript
{
  type: 'image',
  mediaUrl: 'https://...',
  mediaThumbnail: 'https://...',
  mediaSize: 1024000
}
```

### Video Messages

```typescript
{
  type: 'video',
  mediaUrl: 'https://...',
  mediaThumbnail: 'https://...',
  mediaDuration: 30,
  mediaSize: 5000000
}
```

### Voice Messages

```typescript
{
  type: 'voice',
  mediaUrl: 'https://...',
  mediaDuration: 15,
  mediaSize: 150000
}
```

### System Messages

```typescript
{
  type: 'system',
  content: 'User joined the chat',
  createdAt: Date
}
```

## API Endpoints

### Conversations

- `GET /messages/conversations` - Get all conversations
- `POST /messages/conversations` - Create new conversation
- `GET /messages/conversations/:id` - Get conversation details
- `PATCH /messages/conversations/:id` - Update conversation
- `DELETE /messages/conversations/:id` - Delete conversation

### Messages

- `GET /messages/conversations/:id/messages` - Get messages (paginated)
- `POST /messages/conversations/:id/messages` - Send text message
- `POST /messages/conversations/:id/messages/media` - Send media message
- `POST /messages/conversations/:id/messages/snapchat` - Send Snapchat-style message
- `PATCH /messages/messages/:id` - Edit message
- `DELETE /messages/messages/:id` - Delete message

### Message Actions

- `POST /messages/messages/:id/read` - Mark as read
- `POST /messages/messages/:id/reactions` - Add reaction
- `DELETE /messages/messages/:id/reactions/:emoji` - Remove reaction
- `POST /messages/messages/:id/screenshot` - Record screenshot
- `POST /messages/conversations/:id/typing` - Send typing indicator

### Blocking

- `POST /messages/blocks` - Block user
- `DELETE /messages/blocks/:userId` - Unblock user

### Search

- `GET /messages/conversations/search?q=query` - Search conversations
- `GET /messages/conversations/:id/search?q=query` - Search messages in conversation

## State Management

### Zustand Chat Store

```typescript
import { useChatStore } from '@/store/chatStore';

const {
  conversations,
  activeConversation,
  messages,
  typingUsers,
  unreadCount,
  // ... and all the setters
} = useChatStore();
```

### Local vs Global State

- **Global**: Conversations, active conversation, unread count
- **Per-Conversation**: Messages in that conversation
- **Real-Time**: Typing indicators, online status

## Real-Time Updates (WebSocket)

Implementation pattern:

```typescript
useEffect(() => {
  const socket = io(WS_URL);

  socket.on('message:new', (message: Message) => {
    addMessage(message.conversationId, message);
  });

  socket.on('typing:indicator', (data) => {
    if (data.isTyping) {
      addTypingUser(data.userId);
    } else {
      removeTypingUser(data.userId);
    }
  });

  socket.on('message:read', (messageId: string) => {
    // Update message read status
  });

  return () => socket.disconnect();
}, []);
```

## Performance Optimization

### Message Loading

- Pagination: Load 50 messages at a time
- Lazy loading: Load older messages on scroll
- Virtual scrolling: Render only visible messages
- Caching: Store in Zustand for instant access

### Media Optimization

- Image compression before upload
- Video thumbnail generation
- Lazy load image previews
- Progressive JPEG format

### Network

- Message queue for offline mode
- Automatic retry with exponential backoff
- Request batching for read receipts
- Delta sync for efficiency

## Security & Privacy

### End-to-End Encryption

- TLS for transport
- Planned: E2E encryption (future)

### Data Protection

- Messages encrypted at rest
- Auto-delete removes permanently
- User can delete their messages
- No message archiving without consent

### User Privacy

- Block functionality prevents contact
- Typing indicators can be disabled
- Read receipts can be turned off
- Screenshot detection

## Accessibility

- High contrast messaging
- Large font support
- Screen reader support
- Voice message playback
- Keyboard navigation

## Troubleshooting

### Messages Not Sending

1. Check internet connection
2. Verify conversation exists
3. Check character limits
4. Review error message

### Real-Time Updates Not Working

1. Check WebSocket connection
2. Verify authentication token
3. Check server logs
4. Review network tab

### Media Upload Issues

1. Check file size limits
2. Verify file format
3. Check storage space
4. Try different image/video

## Configuration

```typescript
// Message limits
const MESSAGE_MAX_LENGTH = 1000;
const MEDIA_MAX_SIZE = 10 * 1024 * 1024; // 10MB
const VIDEO_MAX_DURATION = 600; // 10 minutes

// Timeouts
const TYPING_INDICATOR_TIMEOUT = 2000; // 2 seconds
const MESSAGE_RETRY_TIMEOUT = 3000; // 3 seconds

// Pagination
const MESSAGES_PER_PAGE = 50;
const PRELOAD_THRESHOLD = 0.3; // Load more at 30% scroll
```

## Best Practices

1. **Optimistic Updates**: Show message immediately
2. **Error Handling**: Graceful fallbacks for failures
3. **User Feedback**: Show typing indicators
4. **Performance**: Paginate and cache messages
5. **Privacy**: Use auto-delete for sensitive content
6. **Moderation**: Filter spam and abuse
7. **Analytics**: Track engagement metrics

## Future Enhancements

- [ ] End-to-end encryption
- [ ] Voice calls
- [ ] Video calls
- [ ] Group messaging
- [ ] Message reactions
- [ ] Stickers and GIFs
- [ ] Message search
- [ ] Message pinning
- [ ] Voice notes editor
- [ ] Location sharing

## References

- [Firebase Realtime Database](https://firebase.google.com/docs/database)
- [Socket.IO Documentation](https://socket.io/docs/)
- [WebSocket Best Practices](https://www.ably.io/websockets)
- [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)
