import { api } from '@/utils';
import {
  LiveStream,
  LiveStreamWithStats,
  CreateLiveStreamInput,
  UpdateLiveStreamInput,
  LiveStreamMessage,
  AgoraToken,
  GiftOnLive,
  LiveStreamSettings,
} from '@/types/live';

export const liveService = {
  // Stream Management
  async startLiveStream(data: CreateLiveStreamInput): Promise<LiveStream> {
    const response = await api.post<LiveStream>('/live/start', data);
    return response.data;
  },

  async endLiveStream(streamId: string): Promise<void> {
    await api.post(`/live/${streamId}/end`);
  },

  async getLiveStream(streamId: string): Promise<LiveStream> {
    const response = await api.get<LiveStream>(`/live/${streamId}`);
    return response.data;
  },

  async updateLiveStream(streamId: string, data: UpdateLiveStreamInput): Promise<LiveStream> {
    const response = await api.put<LiveStream>(`/live/${streamId}`, data);
    return response.data;
  },

  async getLiveStreams(category?: string, limit = 20, offset = 0): Promise<LiveStream[]> {
    const response = await api.get<LiveStream[]>('/live/active', {
      params: { category, limit, offset },
    });
    return response.data;
  },

  async getFollowingLiveStreams(limit = 20, offset = 0): Promise<LiveStream[]> {
    const response = await api.get<LiveStream[]>('/live/following', {
      params: { limit, offset },
    });
    return response.data;
  },

  async getRecommendedLiveStreams(limit = 20): Promise<LiveStream[]> {
    const response = await api.get<LiveStream[]>('/live/recommended', {
      params: { limit },
    });
    return response.data;
  },

  // Live Streaming Data
  async getLiveStreamStats(streamId: string): Promise<LiveStreamWithStats> {
    const response = await api.get<LiveStreamWithStats>(`/live/${streamId}/stats`);
    return response.data;
  },

  async getViewerCount(streamId: string): Promise<number> {
    const response = await api.get<{ count: number }>(`/live/${streamId}/viewers/count`);
    return response.data.count;
  },

  async getStreamHistory(userId: string, limit = 20, offset = 0): Promise<LiveStream[]> {
    const response = await api.get<LiveStream[]>(`/live/history/${userId}`, {
      params: { limit, offset },
    });
    return response.data;
  },

  // Agora Token Generation
  async generateAgoraToken(streamId: string, agoraUid: number): Promise<AgoraToken> {
    const response = await api.post<AgoraToken>('/live/agora/token', {
      streamId,
      uid: agoraUid,
    });
    return response.data;
  },

  async renewAgoraToken(streamId: string, agoraUid: number): Promise<AgoraToken> {
    const response = await api.post<AgoraToken>('/live/agora/token/renew', {
      streamId,
      uid: agoraUid,
    });
    return response.data;
  },

  // Live Chat
  async sendChatMessage(streamId: string, message: string): Promise<LiveStreamMessage> {
    const response = await api.post<LiveStreamMessage>(`/live/${streamId}/chat`, { message });
    return response.data;
  },

  async getChatMessages(
    streamId: string,
    limit = 50,
    beforeId?: string
  ): Promise<LiveStreamMessage[]> {
    const response = await api.get<LiveStreamMessage[]>(`/live/${streamId}/chat`, {
      params: { limit, beforeId },
    });
    return response.data;
  },

  async deleteChatMessage(streamId: string, messageId: string): Promise<void> {
    await api.delete(`/live/${streamId}/chat/${messageId}`);
  },

  async muteUser(streamId: string, userId: string, duration: number): Promise<void> {
    await api.post(`/live/${streamId}/mute`, { userId, duration });
  },

  async unmuteUser(streamId: string, userId: string): Promise<void> {
    await api.post(`/live/${streamId}/unmute`, { userId });
  },

  // Gifts on Live
  async sendGiftOnLive(streamId: string, giftId: string, quantity = 1): Promise<GiftOnLive> {
    const response = await api.post<GiftOnLive>(`/live/${streamId}/gift`, {
      giftId,
      quantity,
    });
    return response.data;
  },

  async getLiveGifts(streamId: string, limit = 100): Promise<GiftOnLive[]> {
    const response = await api.get<GiftOnLive[]>(`/live/${streamId}/gifts`, {
      params: { limit },
    });
    return response.data;
  },

  // Stream Settings
  async getStreamSettings(streamId: string): Promise<LiveStreamSettings> {
    const response = await api.get<LiveStreamSettings>(`/live/${streamId}/settings`);
    return response.data;
  },

  async updateStreamSettings(
    streamId: string,
    settings: Partial<LiveStreamSettings>
  ): Promise<LiveStreamSettings> {
    const response = await api.put<LiveStreamSettings>(`/live/${streamId}/settings`, settings);
    return response.data;
  },

  // Moderation
  async blockUser(streamId: string, userId: string): Promise<void> {
    await api.post(`/live/${streamId}/block`, { userId });
  },

  async unblockUser(streamId: string, userId: string): Promise<void> {
    await api.post(`/live/${streamId}/unblock`, { userId });
  },

  async promoteModerator(streamId: string, userId: string): Promise<void> {
    await api.post(`/live/${streamId}/moderator`, { userId });
  },

  async removeModerator(streamId: string, userId: string): Promise<void> {
    await api.delete(`/live/${streamId}/moderator/${userId}`);
  },

  // User Interaction
  async joinLiveStream(streamId: string): Promise<void> {
    await api.post(`/live/${streamId}/join`);
  },

  async leaveLiveStream(streamId: string): Promise<void> {
    await api.post(`/live/${streamId}/leave`);
  },

  async followBroadcaster(broadcasterId: string): Promise<void> {
    await api.post(`/users/${broadcasterId}/follow`);
  },

  async unfollowBroadcaster(broadcasterId: string): Promise<void> {
    await api.post(`/users/${broadcasterId}/unfollow`);
  },

  // Stream Recording
  async startRecording(streamId: string): Promise<void> {
    await api.post(`/live/${streamId}/recording/start`);
  },

  async stopRecording(streamId: string): Promise<string> {
    const response = await api.post<{ recordingUrl: string }>(`/live/${streamId}/recording/stop`);
    return response.data.recordingUrl;
  },

  // Reporting
  async reportLiveStream(
    streamId: string,
    reason: string,
    description?: string
  ): Promise<void> {
    await api.post(`/live/${streamId}/report`, { reason, description });
  },

  // Analytics
  async getLiveAnalytics(streamId: string): Promise<any> {
    const response = await api.get(`/live/${streamId}/analytics`);
    return response.data;
  },

  async getEarnings(limit = 30, offset = 0): Promise<any[]> {
    const response = await api.get('/live/earnings', {
      params: { limit, offset },
    });
    return response.data;
  },

  // Notifications
  async subscribeToStreamNotifications(broadcasterId: string): Promise<void> {
    await api.post(`/users/${broadcasterId}/subscribe-notifications`);
  },

  async unsubscribeFromStreamNotifications(broadcasterId: string): Promise<void> {
    await api.post(`/users/${broadcasterId}/unsubscribe-notifications`);
  },
};
