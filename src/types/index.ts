// User Types
export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  bio: string;
  avatar: string;
  cover: string;
  followers: number;
  following: number;
  createdAt: Date;
  verified: boolean;
  blockedUsers: string[];
}

// Video Types
export interface Video {
  id: string;
  userId: string;
  title: string;
  description: string;
  thumbnail: string;
  videoUrl: string;
  duration: number;
  width: number;
  height: number;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  createdAt: Date;
  isPublic: boolean;
  tags: string[];
  category: 'reel' | 'story' | 'live' | 'post';
}

// Story Types
export interface Story {
  id: string;
  userId: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  caption?: string;
  expiresAt: Date;
  views: number;
  createdAt: Date;
  viewers: string[];
}

// Chat Types
export interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  mediaUrl?: string;
  mediaExpiry?: number;
  expiresAt?: Date;
  read: boolean;
  createdAt: Date;
}

export interface Chat {
  id: string;
  userId: string;
  otherUserId: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
}

// Live Stream Types
export interface LiveStream {
  id: string;
  userId: string;
  title: string;
  description: string;
  thumbnail: string;
  viewers: number;
  likes: number;
  gifts: Gift[];
  channelId: string;
  isLive: boolean;
  startedAt: Date;
  endedAt?: Date;
}

// Gift Types
export interface Gift {
  id: string;
  name: string;
  icon: string;
  price: number;
  currency: string;
  animation: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

// Filter Types
export interface Filter {
  id: string;
  name: string;
  creator: string;
  thumbnail: string;
  glb?: string;
  type: 'face' | 'body' | 'environment' | 'text' | 'effect';
  rating: number;
  downloads: number;
  createdAt: Date;
}

// Avatar Types
export interface Avatar {
  id: string;
  userId: string;
  model: string;
  customizations: Record<string, any>;
  createdAt: Date;
}

// Payment Types
export interface PaymentMethod {
  id: string;
  userId: string;
  provider: 'stripe' | 'paypal' | 'wallet';
  last4?: string;
  type: string;
  isDefault: boolean;
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  type: 'gift' | 'subscription' | 'topup';
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
  metadata: Record<string, any>;
}

// Comment Types
export interface Comment {
  id: string;
  userId: string;
  videoId: string;
  content: string;
  likes: number;
  replies: Comment[];
  createdAt: Date;
}

// Auth Types
export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}
