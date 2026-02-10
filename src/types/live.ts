import { User } from './index';

export interface LiveStream {
  id: string;
  broadcasterId: string;
  broadcaster: User;
  title: string;
  description?: string;
  thumbnail?: string;
  category: string;
  isLive: boolean;
  viewerCount: number;
  startedAt: string;
  endedAt?: string;
  duration?: number;
  tags: string[];
  language: string;
  mature: boolean;
  monetized: boolean;
  giftTarget?: number;
  currentGifts: number;
  chatId: string;
  agoraChannelId?: string;
  thumbnail_url?: string;
  created_at: string;
  updated_at: string;
}

export interface LiveStreamWithStats extends LiveStream {
  peakViewers: number;
  averageViewTime: number;
  totalGiftValue: number;
  topGivers: Array<{ userId: string; username: string; giftCount: number }>;
}

export interface LiveStreamParticipant {
  id: string;
  liveStreamId: string;
  userId: string;
  user: User;
  joinedAt: string;
  leftAt?: string;
  duration: number;
  role: 'broadcaster' | 'moderator' | 'viewer';
}

export interface LiveStreamMessage {
  id: string;
  liveStreamId: string;
  userId: string;
  user: User;
  message: string;
  type: 'text' | 'gift' | 'join' | 'leave' | 'milestone';
  giftData?: {
    giftId: string;
    giftName: string;
    giftValue: number;
    quantity: number;
  };
  createdAt: string;
}

export interface LiveStreamSettings {
  id: string;
  liveStreamId: string;
  allowGuests: boolean;
  chatEnabled: boolean;
  giftEnabled: boolean;
  moderationEnabled: boolean;
  requireApprovalForComments: boolean;
  blockedUsers: string[];
  allowedUsers?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AgoraToken {
  token: string;
  channelId: string;
  uid: number;
  expiresAt: number;
}

export interface CreateLiveStreamInput {
  title: string;
  description?: string;
  category: string;
  tags?: string[];
  language?: string;
  mature?: boolean;
  monetized?: boolean;
  giftTarget?: number;
  thumbnail?: string;
}

export interface UpdateLiveStreamInput {
  title?: string;
  description?: string;
  category?: string;
  tags?: string[];
  language?: string;
  mature?: boolean;
  giftTarget?: number;
}

export interface GiftOnLive {
  id: string;
  liveStreamId: string;
  senderId: string;
  sender: User;
  giftId: string;
  giftName: string;
  giftPrice: number;
  quantity: number;
  totalValue: number;
  message?: string;
  createdAt: string;
}

export interface LiveStreamReport {
  id: string;
  liveStreamId: string;
  reporterId: string;
  reason: string;
  description?: string;
  status: 'pending' | 'under_review' | 'resolved' | 'dismissed';
  actionTaken?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LiveStreamNotification {
  id: string;
  userId: string;
  streamId: string;
  broadcasterName: string;
  type: 'stream_started' | 'follow_live';
  read: boolean;
  createdAt: string;
}
