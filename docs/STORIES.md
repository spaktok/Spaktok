# Stories System Documentation

## Overview

The Stories system in Spaktok is designed to mirror Snapchat's functionality while providing enhanced features for content creators and users. Stories auto-delete after 24 hours, support viewing analytics, and include interactive reply features.

## Features

### Story Creation & Upload
- Image and video story support
- Text overlay and drawing tools
- Sticker and filter integration
- Auto-expiry after 24 hours
- Story archive functionality

### Story Viewing & Analytics
- Automatic view tracking
- View-specific messaging
- Analytics dashboard for creators
- Sequential story viewing

### Story Replies
- Direct messaging replies to stories
- Story reply notifications
- Reply expiry matching story expiry

### Story Management
- Story deletion
- Story archive
- Story sharing to other platforms
- Story editing (time-limited)

## API Endpoints

### Upload Story
```
POST /api/stories
- Content: multipart/form-data (image or video)
- Metadata: { caption, location, tags, visibility }
```

### Get Stories Feed
```
GET /api/stories/feed?limit=10&offset=0
- Returns: Array of Story objects
```

### View Story
```
POST /api/stories/:id/view
- Timestamps view for analytics
```

### Reply to Story
```
POST /api/stories/:id/reply
- Body: { message, mediaUrl? }
```

### Delete Story
```
DELETE /api/stories/:id
```

## Storage

Stories are stored on Cloudflare with the following structure:
- Original media: High quality preservation
- Thumbnails: Optimized for feed display
- Metadata: JSON records with timestamps and view counts

## Auto-Deletion

Stories are automatically deleted 24 hours after creation using:
- Scheduled deletion jobs
- Cascade deletion of associated views and replies
- Cache invalidation

## Example Usage

```typescript
import { storiesService } from '@/services';

// Upload a story
const story = await storiesService.uploadStory({
  media: videoFile,
  caption: 'Check out my day!',
  mediaType: 'video',
});

// Get stories feed
const stories = await storiesService.getStoriesFeed();

// View a story
await storiesService.markStoryAsViewed(storyId);

// Reply to story
await storiesService.replyToStory(storyId, {
  message: 'Great content!',
});

// Delete a story
await storiesService.deleteStory(storyId);
```

## Privacy & Permissions

- Story visibility can be set to: Friends, Close Friends, or Everyone
- Story replies can be restricted to followers
- Story view list shows all viewers with timestamps
- Option to hide view list from specific users

## Best Practices

1. Compress media before uploading for faster processing
2. Use relevant hashtags and location tags for discoverability
3. Manage story view lists regularly
4. Archive important stories before they expire
5. Use story replies to engage with viewers
