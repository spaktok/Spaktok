import { api } from '@/utils';
import {
  Message,
  Conversation,
  TypingIndicator,
  AutoDeleteConfig,
} from '@/types/messages';

export const messagesService = {
  // Conversation Management
  async getConversations(page = 1, limit = 20) {
    const { data } = await api.get<{
      conversations: Conversation[];
      total: number;
      hasMore: boolean;
    }>(`/messages/conversations?page=${page}&limit=${limit}`);
    return data;
  },

  async createConversation(participantIds: string[]) {
    const { data } = await api.post<Conversation>('/messages/conversations', {
      participantIds,
    });
    return data;
  },

  async getConversation(conversationId: string) {
    const { data } = await api.get<Conversation>(
      `/messages/conversations/${conversationId}`
    );
    return data;
  },

  async updateConversation(conversationId: string, updates: Partial<Conversation>) {
    const { data } = await api.patch<Conversation>(
      `/messages/conversations/${conversationId}`,
      updates
    );
    return data;
  },

  async deleteConversation(conversationId: string) {
    await api.delete(`/messages/conversations/${conversationId}`);
  },

  async blockUser(userId: string) {
    await api.post(`/messages/blocks`, { userId });
  },

  async unblockUser(userId: string) {
    await api.delete(`/messages/blocks/${userId}`);
  },

  async muteConversation(conversationId: string, muted: boolean) {
    await api.patch(`/messages/conversations/${conversationId}`, { isMuted: muted });
  },

  // Message Management
  async getMessages(conversationId: string, page = 1, limit = 50) {
    const { data } = await api.get<{
      messages: Message[];
      total: number;
      hasMore: boolean;
    }>(`/messages/conversations/${conversationId}/messages?page=${page}&limit=${limit}`);
    return data;
  },

  async sendMessage(conversationId: string, content: string, type: string = 'text') {
    const { data } = await api.post<Message>(
      `/messages/conversations/${conversationId}/messages`,
      {
        content,
        type,
      }
    );
    return data;
  },

  async sendMediaMessage(
    conversationId: string,
    mediaUri: string,
    type: 'image' | 'video' | 'voice',
    options?: { duration?: number; thumbnail?: string }
  ) {
    const formData = new FormData();
    formData.append('type', type);
    formData.append('media', {
      uri: mediaUri,
      type: type === 'image' ? 'image/jpeg' : type === 'video' ? 'video/mp4' : 'audio/mp3',
      name: `${type}_${Date.now()}`,
    } as any);

    if (options?.duration) {
      formData.append('duration', options.duration.toString());
    }
    if (options?.thumbnail) {
      formData.append('thumbnail', options.thumbnail);
    }

    const { data } = await api.uploadFile<Message>(
      `/messages/conversations/${conversationId}/messages/media`,
      formData
    );
    return data;
  },

  async sendSnapchatStyleMessage(
    conversationId: string,
    mediaUri: string,
    autoDeleteSeconds: number,
    deleteAfterView: boolean = true,
    maxViews?: number
  ) {
    const formData = new FormData();
    formData.append('type', 'image');
    formData.append('media', {
      uri: mediaUri,
      type: 'image/jpeg',
      name: `snap_${Date.now()}`,
    } as any);
    formData.append('expiresAfterSeconds', autoDeleteSeconds.toString());
    formData.append('deleteAfterView', deleteAfterView.toString());

    if (maxViews) {
      formData.append('maxViews', maxViews.toString());
    }

    const { data } = await api.uploadFile<Message>(
      `/messages/conversations/${conversationId}/messages/snapchat`,
      formData
    );
    return data;
  },

  async editMessage(messageId: string, content: string) {
    const { data } = await api.patch<Message>(`/messages/messages/${messageId}`, {
      content,
    });
    return data;
  },

  async deleteMessage(messageId: string, permanent: boolean = false) {
    await api.delete(`/messages/messages/${messageId}?permanent=${permanent}`);
  },

  async reactToMessage(messageId: string, emoji: string) {
    await api.post(`/messages/messages/${messageId}/reactions`, { emoji });
  },

  async removeReaction(messageId: string, emoji: string) {
    await api.delete(`/messages/messages/${messageId}/reactions/${emoji}`);
  },

  // Message Status
  async markAsRead(conversationId: string, messageId: string) {
    await api.post(`/messages/messages/${messageId}/read`, {
      conversationId,
    });
  },

  async markConversationAsRead(conversationId: string) {
    await api.post(`/messages/conversations/${conversationId}/read`);
  },

  async recordScreenshot(messageId: string) {
    await api.post(`/messages/messages/${messageId}/screenshot`);
  },

  // Typing Indicators
  async sendTypingIndicator(conversationId: string, isTyping: boolean) {
    await api.post(`/messages/conversations/${conversationId}/typing`, {
      isTyping,
    });
  },

  // Search
  async searchMessages(conversationId: string, query: string) {
    const { data } = await api.get<Message[]>(
      `/messages/conversations/${conversationId}/search?q=${encodeURIComponent(query)}`
    );
    return data;
  },

  async searchConversations(query: string) {
    const { data } = await api.get<Conversation[]>(
      `/messages/conversations/search?q=${encodeURIComponent(query)}`
    );
    return data;
  },

  // Auto-Delete Configuration
  async setAutoDeleteConfig(conversationId: string, config: AutoDeleteConfig) {
    const { data } = await api.patch<Conversation>(
      `/messages/conversations/${conversationId}`,
      {
        autoDeleteConfig: config,
      }
    );
    return data;
  },

  async getAutoDeleteConfig(conversationId: string) {
    const { data } = await api.get<AutoDeleteConfig>(
      `/messages/conversations/${conversationId}/auto-delete`
    );
    return data;
  },

  // Pinned Messages
  async pinMessage(conversationId: string, messageId: string) {
    await api.post(
      `/messages/conversations/${conversationId}/pinned`,
      { messageId }
    );
  },

  async unpinMessage(conversationId: string, messageId: string) {
    await api.delete(
      `/messages/conversations/${conversationId}/pinned/${messageId}`
    );
  },

  async getPinnedMessages(conversationId: string) {
    const { data } = await api.get<Message[]>(
      `/messages/conversations/${conversationId}/pinned`
    );
    return data;
  },
};
