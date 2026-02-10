export type ShareTarget = 'instagram' | 'facebook' | 'twitter' | 'whatsapp' | 'telegram' | 'email' | 'link' | 'native';
export type ShareableContent = 'video' | 'story' | 'stream' | 'profile' | 'comment';

export interface Share {
  id: string;
  contentId: string;
  contentType: ShareableContent;
  userId: string;
  targets: ShareTarget[];
  shareUrl: string;
  customMessage?: string;
  analytics: ShareAnalytics;
  createdAt: string;
}

export interface ShareAnalytics {
  clicks: number;
  impressions: number;
  conversions: number;
  lastClickedAt?: string;
  referralValue?: number;
}

export interface ShareableLink {
  id: string;
  code: string;
  contentId: string;
  contentType: ShareableContent;
  creatorId: string;
  expiresAt?: string;
  maxUses?: number;
  currentUses: number;
  customText?: string;
  enableAnalytics: boolean;
  createdAt: string;
}

export interface ReferralLink {
  id: string;
  userId: string;
  code: string;
  reward: number;
  rewardType: 'credits' | 'points' | 'premium_days';
  totalRewards: number;
  clickCount: number;
  conversionCount: number;
  expiresAt?: string;
  active: boolean;
  createdAt: string;
}

export interface ReferralStats {
  userId: string;
  totalReferrals: number;
  successfulReferrals: number;
  totalEarnings: number;
  pendingEarnings: number;
  lastReferralDate?: string;
  topReferralSource: string;
}

export interface Duet {
  id: string;
  originalVideoId: string;
  duetVideoId: string;
  originalCreatorId: string;
  duetCreatorId: string;
  duetType: 'side_by_side' | 'reaction';
  views: number;
  likes: number;
  createdAt: string;
}

export interface Stitch {
  id: string;
  originalVideoId: string;
  stitchVideoId: string;
  originalCreatorId: string;
  stitchCreatorId: string;
  clipStartTime: number;
  clipEndTime: number;
  views: number;
  likes: number;
  createdAt: string;
}

export interface Collaboration {
  id: string;
  videoId: string;
  collaborators: string[];
  owner: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  earnings: Record<string, number>;
  createdAt: string;
  completedAt?: string;
}

export interface CollaborationInvite {
  id: string;
  fromUserId: string;
  toUserId: string;
  videoId: string;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected';
  expiresAt: string;
  createdAt: string;
}

export interface ShareLink {
  id: string;
  userId: string;
  content: {
    type: ShareableContent;
    id: string;
    title?: string;
    thumbnail?: string;
  };
  shortCode: string;
  views: number;
  clicks: number;
  uniqueVisitors: number;
  expiresAt?: string;
  createdAt: string;
}

export interface EmbedCode {
  id: string;
  contentId: string;
  contentType: ShareableContent;
  embedCode: string;
  restrictedDomains?: string[];
  active: boolean;
  createdAt: string;
}
