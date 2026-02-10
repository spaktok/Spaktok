export type StoryType = 'image' | 'video' | 'text';

export interface Story {
  id: string;
  userId: string;
  type: StoryType;
  mediaUrl: string;
  thumbnail?: string;
  caption?: string;
  location?: string;
  stickers?: StorySticker[];
  text?: StoryText[];
  filters?: StoryFilter[];
  likes?: number;
  comments?: number;
  shares?: number;
  views?: number;
  createdAt: Date;
  expiresAt: Date; // 24 hours from creation
  deletedAt?: Date;
}

export interface StorySticker {
  id: string;
  type: 'emoji' | 'filter' | 'text' | 'mention' | 'hashtag' | 'location';
  content: string;
  x: number;
  y: number;
  rotation?: number;
  scale?: number;
}

export interface StoryText {
  id: string;
  content: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  backgroundColor?: string;
  fontFamily: string;
  rotation?: number;
  opacity?: number;
}

export interface StoryFilter {
  id: string;
  name: string;
  intensity?: number; // 0-100
}

export interface StoryView {
  id: string;
  storyId: string;
  userId: string;
  viewedAt: Date;
  duration?: number; // seconds
  screenshotTaken?: boolean;
}

export interface StoryReply {
  id: string;
  storyId: string;
  senderId: string;
  recipientId: string;
  type: 'text' | 'media';
  content: string;
  mediaUrl?: string;
  createdAt: Date;
  viewedAt?: Date;
}

export interface StoryReaction {
  userId: string;
  emoji: string;
  createdAt: Date;
}

export interface UserStories {
  userId: string;
  username: string;
  avatar?: string;
  stories: Story[];
  totalViews: number;
  hasUnviewedStories: boolean;
  lastStoryTime?: Date;
}

export interface StorySegment {
  id: string;
  storyId: string;
  duration: number; // seconds to display
  transitionType?: 'fade' | 'slide' | 'none';
}

export interface StoryCameraOptions {
  aspectRatio?: 9 | 16; // 9:16 for vertical
  quality?: 'low' | 'medium' | 'high';
  recordingOptions?: {
    bitrate?: number;
    fps?: number;
  };
}
