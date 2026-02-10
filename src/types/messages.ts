export type MessageType = 'text' | 'image' | 'video' | 'voice' | 'system';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  type: MessageType;
  content: string;
  mediaUrl?: string;
  mediaThumbnail?: string;
  mediaSize?: number;
  mediaDuration?: number;
  expiresAt?: Date; // For Snapchat-style messages
  viewedAt?: Date;
  deletedAt?: Date;
  reactions?: MessageReaction[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageReaction {
  userId: string;
  emoji: string;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  participants: string[]; // User IDs
  lastMessage?: Message;
  lastMessageAt: Date;
  unreadCount: number;
  isMuted: boolean;
  isBlocked: boolean;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TypingIndicator {
  conversationId: string;
  userId: string;
  isTyping: boolean;
}

export interface MessageReadReceipt {
  messageId: string;
  conversationId: string;
  userId: string;
  readAt: Date;
}

export interface VoiceMessage {
  id: string;
  conversationId: string;
  senderId: string;
  duration: number;
  audioUrl: string;
  waveform?: number[]; // For visualizing audio levels
  createdAt: Date;
}

export interface AutoDeleteConfig {
  enabled: boolean;
  deleteAfterSeconds: number; // e.g., 10, 30, 60
  deleteAfterView: boolean; // Delete after first view
}

export interface SnapchatStyleMessage extends Message {
  expiresAt: Date;
  viewCount: number;
  screenshotTaken: boolean;
  maxViews?: number;
}
