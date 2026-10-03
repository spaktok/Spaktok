# Spaktok Video System Documentation

## Overview

The Spaktok video system provides a complete solution for video management, streaming, and discovery with advanced features like compression, caching, and intelligent feed ranking.

## Architecture

### Components

1. **Video Upload Service** (`src/services/videoUpload.ts`)
   - Handles video uploads with progress tracking
   - Automatic retry with exponential backoff
   - Compression support

2. **Video Player** (`src/components/VideoPlayer.tsx`)
   - Native video playback with controls
   - Progress bar and duration display
   - Mute/unmute functionality
   - Custom controls UI

3. **Video Compression** (`src/utils/videoCompression.ts`)
   - Adaptive compression based on network
   - Quality and size optimization
   - Thumbnail generation

4. **Video Cache** (`src/utils/videoCache.ts`)
   - Intelligent caching system
   - LRU cache eviction
   - Automatic cleanup

5. **Feed Algorithm** (`src/utils/feedAlgorithm.ts`)
   - Personalized video ranking
   - Trending detection
   - Recommendation engine

6. **Video Service** (`src/services/video.ts`)
   - API integration for video operations
   - Feed management
   - Analytics tracking

## Usage

### Uploading Videos

```typescript
import { videoUploadService } from '@/services/videoUpload';

const handleUpload = async () => {
  try {
    const result = await videoUploadService.uploadVideo(
      videoUri,
      {
        title: 'My Awesome Video',
        description: 'Check this out!',
        category: 'reel',
        isPublic: true,
        tags: ['awesome', 'funny'],
        compress: true,
        compressionQuality: 0.8,
        onProgress: (progress) => {
          console.log(`Upload progress: ${progress.percentage}%`);
        },
      }
    );
    
    console.log('Video uploaded:', result.videoId);
  } catch (error) {
    console.error('Upload failed:', error);
  }
};
```

### Playing Videos

```typescript
import { VideoPlayer } from '@/components';

function VideoScreen() {
  return (
    <VideoPlayer
      uri="https://example.com/video.mp4"
      autoPlay={true}
      loop={true}
      onPlay={() => console.log('Playing')}
      onPause={() => console.log('Paused')}
      onEnd={() => console.log('Finished')}
      onError={(error) => console.error('Error:', error)}
    />
  );
}
```

### Using Feed Hook

```typescript
import { useFeed } from '@/hooks';

function FeedScreen() {
  const {
    videos,
    isLoading,
    hasMore,
    likedVideoIds,
    loadMore,
    refresh,
    toggleLike,
  } = useFeed({
    type: 'feed',
    limit: 20,
    autoLoad: true,
  });

  const handleLike = (videoId: string) => {
    toggleLike(videoId);
  };

  const handleLoadMore = () => {
    loadMore();
  };

  return (
    <FlatList
      data={videos}
      renderItem={({ item }) => (
        <VideoCard
          video={item}
          isLiked={likedVideoIds.has(item.id)}
          onLikePress={() => handleLike(item.id)}
        />
      )}
      onEndReached={handleLoadMore}
      refreshing={isLoading}
      onRefresh={refresh}
    />
  );
}
```

### Feed Personalization

```typescript
import { feedAlgorithm, UserPreferences } from '@/utils';

const preferences: UserPreferences = {
  preferredCategories: ['entertainment', 'gaming'],
  followedCreators: ['creator1', 'creator2'],
  watchHistory: ['video1', 'video2'],
  likedVideos: ['video3', 'video4'],
  engagementPattern: 'high',
};

const personalizedFeed = feedAlgorithm.generateFeed(
  allVideos,
  preferences,
  20 // limit
);

// Get trending videos
const trending = feedAlgorithm.getTrendingVideos(videos, 24); // last 24 hours

// Get recommendations
const recommendations = feedAlgorithm.getRecommendations(
  watchedVideos,
  allVideos,
  10
);
```

### Video Caching

```typescript
import { videoCacheManager } from '@/utils';

// Initialize cache
await videoCacheManager.init();

// Cache a video
await videoCacheManager.cacheVideo(
  'video123',
  'https://example.com/video.mp4',
  '/cache/path',
  1000000, // size in bytes
  60 // duration in seconds
);

// Get cached video
const cached = await videoCacheManager.getCachedVideo('video123');
if (cached) {
  // Use local path
  playVideo(cached.localPath);
}

// Get cache stats
const stats = videoCacheManager.getCacheStats();
console.log(`Cache size: ${stats.totalSize} bytes`);
console.log(`Cached videos: ${stats.entryCount}`);

// Clear cache
await videoCacheManager.clearCache();
```

### Video Compression

```typescript
import { videoCompressionManager } from '@/utils';

// Compress for specific network
const networkType = 'wifi'; // 'wifi' | '4g' | '3g'
const compressionOptions = await videoCompressionManager.optimizeForNetwork(
  videoUri,
  networkType
);

// Compress with options
const compressedUri = await videoCompressionManager.compressVideo(
  videoUri,
  {
    targetSize: 5000, // 5MB
    quality: 0.8,
    width: 1080,
    height: 1920,
  }
);

// Get video info
const info = await videoCompressionManager.getVideoInfo(videoUri);
console.log(`Duration: ${info.duration}s, Size: ${info.size} bytes`);
```

## Feed Algorithm

### Ranking Factors

1. **Engagement Score (40% weight for high engagement users)**
   - Likes, comments, shares
   - Engagement rate = interactions / views

2. **Recency Score (20-25% weight)**
   - Newer videos ranked higher
   - Exponential decay over time
   - Half-life of 24 hours

3. **Personalization Score (30-50% weight)**
   - User's followed creators (+30 points)
   - Preferred categories (+20 points)
   - Similar to watch history (+5 per match)

4. **Diversity Score (10% weight)**
   - Prevents repetitive content
   - Varies based on recent feed

### User Engagement Patterns

- **High**: Prioritizes engagement and trending
- **Medium**: Balanced approach
- **Low**: Prioritizes personalization

## API Endpoints

### Video Operations

- `POST /videos/upload` - Upload new video
- `GET /videos/:id` - Get video details
- `GET /videos/feed` - Get personalized feed
- `GET /videos/reels` - Get reels
- `GET /videos/trending` - Get trending videos
- `GET /videos/recommendations` - Get recommendations

### Video Interactions

- `POST /videos/:id/like` - Like video
- `POST /videos/:id/unlike` - Unlike video
- `POST /videos/:id/view` - Record view
- `POST /videos/:id/share` - Share video
- `DELETE /videos/:id` - Delete video

### Comments

- `GET /videos/:id/comments` - Get comments
- `POST /videos/:id/comments` - Add comment
- `DELETE /videos/:id/comments/:commentId` - Delete comment

## Performance Optimization

### Caching Strategy

1. **HTTP Caching**: Leverage browser/CDN caching
2. **Local Caching**: Cache frequently accessed videos
3. **LRU Eviction**: Remove oldest/least used videos
4. **Max Size**: 500MB default, configurable

### Compression Strategy

1. **Adaptive**: Compress based on network speed
2. **Quality**: Maintain visual quality while reducing size
3. **Bandwidth**: Target 2-10MB for most videos
4. **Preview**: Generate thumbnails for faster loading

## Security

- Videos require authentication for upload
- RLS policies for private videos
- Malware scanning on upload
- Automated content moderation
- DMCA/Copyright protection

## Troubleshooting

### Video Won't Play

1. Check network connectivity
2. Verify video URL is accessible
3. Check video format compatibility
4. Clear cache and retry

### Upload Fails

1. Check file size (max 500MB)
2. Verify video format (MP4 recommended)
3. Check network connection
4. Try retry with exponential backoff

### High Memory Usage

1. Clear video cache
2. Reduce video quality
3. Close other apps
4. Restart application

## Best Practices

1. **Always compress** before uploading
2. **Use adaptive** playback based on network
3. **Cache** frequently watched videos
4. **Monitor** cache size regularly
5. **Test** on slow networks
6. **Handle** playback errors gracefully
7. **Track** analytics for engagement

## Future Enhancements

- [ ] Live streaming support
- [ ] Video transcoding
- [ ] Advanced filters
- [ ] Video editing tools
- [ ] AI-powered recommendations
- [ ] Social sharing integration
- [ ] Offline playback
- [ ] 360° video support
- [ ] HDR video support

## References

- [Expo Video Documentation](https://docs.expo.dev/versions/latest/sdk/video/)
- [Video Performance Optimization](https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Using_HTML5_audio_and_video/)
- [Mobile Video Streaming Best Practices](https://developer.apple.com/streaming/)
