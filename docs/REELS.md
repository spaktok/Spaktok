# Spaktok Reels System - TikTok-Like Features

## Overview

The Spaktok Reels system provides a TikTok-like vertical video experience with full-screen playback, double-tap likes, comments, and infinite scroll.

## Architecture

### Components

1. **VerticalReelPlayer** (`src/components/VerticalReelPlayer.tsx`)
   - Full-screen vertical video player
   - Double-tap like animation
   - Floating action buttons for interactions
   - Creator info overlay

2. **CommentsScreen** (`src/screens/feed/CommentsScreen.tsx`)
   - Modal comment interface
   - Real-time comment loading
   - Comment posting and interaction
   - Nested replies support

3. **Gesture Handlers** (`src/utils/gestureHandlers.ts`)
   - Double-tap detection
   - Long-press handling
   - Configurable gesture thresholds

### Services

1. **Comments Service** (`src/services/comments.ts`)
   - Get, post, update, delete comments
   - Like/unlike comments
   - Comment flagging/reporting
   - Nested reply management

2. **Feed Hook** (`src/hooks/useFeed.ts`)
   - Infinite scroll management
   - Like/unlike functionality
   - Video deletion
   - View tracking

## Features

### 1. Full-Screen Vertical Playback

- Optimized for mobile 9:16 aspect ratio
- Smooth scrolling between videos
- Automatic playback when visible
- Pause on scroll

### 2. Double-Tap Like Animation

```typescript
const { onTap } = useDoubleTap(() => {
  // Like animation triggered
  toggleLike(videoId);
}, { delay: 300 });
```

- Animated heart appears on double-tap
- Automatic like if not already liked
- Configurable delay between taps
- Smooth scale animation

### 3. Floating Action Buttons

Located on the right side of the video:

- **Like Button**: Toggle like with count
- **Comment Button**: Opens comment modal
- **Share Button**: Share to other apps
- **More Options**: Additional actions

### 4. Comments System

```typescript
// Load comments
const { comments, hasMore } = await commentsService.getComments(videoId);

// Post comment
const comment = await commentsService.addComment(videoId, content);

// Like comment
await commentsService.likeComment(videoId, commentId);

// Get nested replies
const replies = await commentsService.getReplies(videoId, commentId);
```

### 5. Creator Info Section

- Profile picture
- Username and handle
- Follow button
- Verified badge (optional)

### 6. Infinite Scroll

- Paging enabled for smooth scrolling
- Snap to center alignment
- Auto-load next batch at threshold
- Efficient memory management

## Usage

### Basic Setup

```typescript
import { useFeed } from '@/hooks';
import { VerticalReelPlayer } from '@/components';

function ReelsScreen() {
  const { videos, toggleLike, likedVideoIds, loadMore } = useFeed({
    type: 'reels',
    limit: 5,
  });

  return (
    <FlatList
      data={videos}
      renderItem={({ item }) => (
        <VerticalReelPlayer
          video={item}
          isLiked={likedVideoIds.has(item.id)}
          onLikePress={() => toggleLike(item.id)}
          visible={true}
        />
      )}
      onEndReached={loadMore}
    />
  );
}
```

### Custom Gesture Handling

```typescript
import { useDoubleTap, useLongPress } from '@/utils';

const { onTap } = useDoubleTap(
  () => console.log('Double tap detected'),
  { delay: 300 }
);

const longPressHandlers = useLongPress(
  () => console.log('Long press detected'),
  { delayMs: 500, maxDistance: 10 }
);
```

### Comments Integration

```typescript
import { CommentsScreen } from '@/screens/feed/CommentsScreen';

function VideoScreen() {
  const [showComments, setShowComments] = useState(false);

  return (
    <>
      <VerticalReelPlayer
        onCommentPress={() => setShowComments(true)}
      />
      <Modal visible={showComments}>
        <CommentsScreen
          videoId={videoId}
          onClose={() => setShowComments(false)}
        />
      </Modal>
    </>
  );
}
```

## API Endpoints

### Reels

- `GET /videos/reels?page=1&limit=20` - Get reels feed
- `GET /videos/:id` - Get reel details

### Comments

- `GET /videos/:id/comments?page=1&limit=20` - Get comments
- `POST /videos/:id/comments` - Add comment
- `PATCH /videos/:id/comments/:commentId` - Update comment
- `DELETE /videos/:id/comments/:commentId` - Delete comment
- `POST /videos/:id/comments/:commentId/like` - Like comment
- `POST /videos/:id/comments/:commentId/unlike` - Unlike comment
- `GET /videos/:id/comments/:commentId/replies` - Get replies

### Interactions

- `POST /videos/:id/like` - Like video
- `POST /videos/:id/unlike` - Unlike video
- `POST /videos/:id/view` - Record view
- `POST /videos/:id/share` - Record share

## Performance Optimization

### Rendering

- Only render visible items with FlatList
- Paging enabled for smooth scrolling
- Remove offscreen components
- Lazy load thumbnails

### Memory Management

- Cache limited to 5 reels
- Pre-fetch next batch at 50% scroll
- Clear cache when navigating away
- Efficient state management with Zustand

### Network

- Adaptive bitrate streaming
- Progressive JPEG thumbnails
- Request batching for comments
- Optimistic UI updates

## User Experience

### Interactions

1. **Swipe Down**: Next video
2. **Swipe Up**: Previous video
3. **Double Tap**: Like video
4. **Tap Right Buttons**: Actions
5. **Tap Creator**: View profile
6. **Long Press**: More options

### States

- Loading: Show spinner
- Empty: Show "No videos"
- Error: Show error message
- Buffering: Pause video

## Accessibility

- Video controls for keyboard navigation
- Caption support
- Audio descriptions
- High contrast colors
- Screen reader support

## Moderation

### Comment Filtering

- Swear word filter
- Spam detection
- User blocking
- Comment flagging

### Content Policies

- Sexual content removal
- Violence detection
- Hate speech filtering
- Copyright detection

## Analytics Tracking

```typescript
// Track reel view
await videoService.recordView(videoId, durationSeconds);

// Track engagement
analytics.track('reel_liked', { videoId, userId });
analytics.track('comment_posted', { videoId, commentId });
analytics.track('reel_shared', { videoId, platform });
```

## Configuration

### Gesture Config

```typescript
const doubleTapConfig = {
  delay: 300, // ms between taps
};

const longPressConfig = {
  delayMs: 500,
  maxDistance: 10,
};
```

### Performance Config

```typescript
const feedConfig = {
  limit: 5, // Videos to load per page
  preloadDistance: 50, // Percentage to preload
  cacheSize: 500 * 1024 * 1024, // 500MB
};
```

## Troubleshooting

### Videos Not Playing

1. Check internet connection
2. Verify video URL validity
3. Clear cache
4. Restart app

### Comments Not Loading

1. Check API connectivity
2. Verify video ID
3. Check authentication
4. Review server logs

### Lag or Stuttering

1. Reduce video quality
2. Clear app cache
3. Close background apps
4. Check available storage

## Best Practices

1. **Always cache** frequently viewed reels
2. **Implement** proper error handling
3. **Use** pagination for comments
4. **Track** user engagement metrics
5. **Test** on slow networks
6. **Optimize** video compression
7. **Implement** content moderation

## Future Enhancements

- [ ] AR filters for reels
- [ ] Green screen effect
- [ ] Stitching feature
- [ ] Duet functionality
- [ ] Comment filters
- [ ] Live reels
- [ ] NFT reels
- [ ] Monetization

## References

- [TikTok Design](https://www.tiktok.com)
- [Gesture Handler Docs](https://docs.swmansion.com/react-native-gesture-handler/)
- [React Native Performance](https://reactnative.dev/docs/performance)
- [FlatList Optimization](https://reactnative.dev/docs/optimizing-flatlist-configuration)
