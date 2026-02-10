import { api } from '@/utils';
import { Message, Chat } from '@/types';

export const messagingService = {
  async getChats(page = 1) {
    const { data } = await api.get<Chat[]>(`/messages/chats?page=${page}`);
    return data;
  },

  async getChatMessages(userId: string, page = 1) {
    const { data } = await api.get<Message[]>(`/messages/chats/${userId}?page=${page}`);
    return data;
  },

  async sendMessage(recipientId: string, content: string, mediaUrl?: string, mediaExpiry?: number) {
    const { data } = await api.post<Message>('/messages/send', {
      recipientId,
      content,
      mediaUrl,
      mediaExpiry,
    });
    return data;
  },

  async sendPhotoMessage(recipientId: string, formData: FormData, expirySeconds?: number) {
    const { data } = await api.uploadFile<Message>('/messages/send-photo', formData, {
      params: { recipientId, expirySeconds },
    });
    return data;
  },

  async markAsRead(messageId: string) {
    await api.post(`/messages/${messageId}/read`);
  },

  async deleteMessage(messageId: string) {
    await api.delete(`/messages/${messageId}`);
  },

  async deleteChat(userId: string) {
    await api.delete(`/messages/chats/${userId}`);
  },

  async searchMessages(query: string, page = 1) {
    const { data } = await api.get(`/messages/search?q=${query}&page=${page}`);
    return data;
  },

  async blockUser(userId: string) {
    await api.post(`/messages/block/${userId}`);
  },

  async unblockUser(userId: string) {
    await api.post(`/messages/unblock/${userId}`);
  },

  async muteChat(userId: string) {
    await api.post(`/messages/mute/${userId}`);
  },

  async unmuteChat(userId: string) {
    await api.post(`/messages/unmute/${userId}`);
  },

  async reportMessage(messageId: string, reason: string) {
    await api.post(`/messages/${messageId}/report`, { reason });
  },
};
