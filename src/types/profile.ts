export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  bio?: string;
  avatar?: string;
  coverImage?: string;
  website?: string;
  location?: string;
  birthDate?: string;
  gender?: 'male' | 'female' | 'other';
  verifiedStatus: boolean;
  followersCount: number;
  followingCount: number;
  videosCount: number;
  likesCount: number;
  joinDate: string;
  lastSeen: string;
  isPrivate: boolean;
  isBlocked: boolean;
  isFollowing: boolean;
  isFollowedBy: boolean;
  isBanned: boolean;
  banReason?: string;
  badges: Badge[];
  socialLinks?: SocialLink[];
  stats: UserStats;
  settings: ProfileSettings;
  createdAt: string;
  updatedAt: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  awardedDate: string;
  type: 'verified' | 'achievement' | 'milestone' | 'special';
}

export interface SocialLink {
  platform: 'instagram' | 'twitter' | 'youtube' | 'tiktok' | 'twitch';
  url: string;
}

export interface UserStats {
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  averageEngagementRate: number;
  monthlyViews: number;
  monthlyGrowth: number;
}

export interface ProfileSettings {
  allowMessages: boolean;
  allowComments: boolean;
  allowDuets: boolean;
  allowStitches: boolean;
  showActivity: boolean;
  showFollowers: boolean;
  allowSearchIndexing: boolean;
  dataCollectionOptIn: boolean;
  pushNotificationsEnabled: boolean;
  emailNotificationsEnabled: boolean;
}

export interface ProfileUpdate {
  displayName?: string;
  bio?: string;
  avatar?: File;
  coverImage?: File;
  website?: string;
  location?: string;
  isPrivate?: boolean;
}

export interface UserFollower {
  id: string;
  followerId: string;
  follower: UserProfile;
  followedAt: string;
}

export interface UserFollowing {
  id: string;
  followingId: string;
  following: UserProfile;
  followedAt: string;
}

export interface UserActivity {
  id: string;
  userId: string;
  type: 'like' | 'comment' | 'share' | 'follow' | 'upload' | 'live';
  targetId: string;
  targetType: 'video' | 'user' | 'comment' | 'stream';
  description: string;
  timestamp: string;
}

export interface BlockList {
  id: string;
  userId: string;
  blockedUserId: string;
  blockedUser: UserProfile;
  reason?: string;
  blockedAt: string;
}

export interface PrivacySettings {
  id: string;
  userId: string;
  allowPrivateMessages: boolean;
  allowFollowRequests: boolean;
  showLastSeen: boolean;
  showActivity: boolean;
  allowTagging: boolean;
  allowScreenshots: boolean; // For stories
  dataRetention: 'minimal' | 'standard' | 'extended';
  createdAt: string;
  updatedAt: string;
}

export interface NotificationSettings {
  id: string;
  userId: string;
  newFollower: boolean;
  newComment: boolean;
  newLike: boolean;
  newShare: boolean;
  newMessage: boolean;
  liveStreamNotification: boolean;
  giftNotification: boolean;
  digestEmailFrequency: 'never' | 'daily' | 'weekly' | 'monthly';
  createdAt: string;
  updatedAt: string;
}

export interface CreatorDashboard {
  totalEarnings: number;
  monthlyEarnings: number;
  totalFollowers: number;
  monthlyGrowth: number;
  totalViews: number;
  monthlyViews: number;
  engagementRate: number;
  topVideos: any[];
  audienceDemographics: {
    age: Record<string, number>;
    gender: Record<string, number>;
    location: string[];
  };
  trends: {
    bestHour: string;
    bestDay: string;
    topTags: string[];
    topCategories: string[];
  };
}

export interface Verification {
  id: string;
  userId: string;
  type: 'email' | 'phone' | 'identity';
  status: 'pending' | 'verified' | 'rejected';
  verificationCode?: string;
  expiresAt: string;
  verifiedAt?: string;
  rejectionReason?: string;
  documents?: string[];
  createdAt: string;
}

export interface AccountSecurity {
  id: string;
  userId: string;
  twoFactorEnabled: boolean;
  loginAlerts: boolean;
  activeDevices: Device[];
  lastPasswordChange: string;
  lastLoginTime: string;
  loginAttempts: number;
  suspiciousActivities: SuspiciousActivity[];
  createdAt: string;
  updatedAt: string;
}

export interface Device {
  id: string;
  userAgent: string;
  ipAddress: string;
  lastActive: string;
  isCurrent: boolean;
  name?: string;
}

export interface SuspiciousActivity {
  id: string;
  type: string;
  description: string;
  ipAddress: string;
  timestamp: string;
  resolved: boolean;
}

export interface UserReport {
  id: string;
  reporterId: string;
  reportedUserId: string;
  reason: string;
  description?: string;
  screenshots?: string[];
  status: 'pending' | 'under_review' | 'resolved' | 'dismissed';
  actionTaken?: string;
  createdAt: string;
  updatedAt: string;
}
