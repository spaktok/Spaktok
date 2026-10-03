import { api } from '@/utils';
import { User } from '@/types';

export const userService = {
  async getUserById(id: string) {
    const { data } = await api.get<User>(`/users/${id}`);
    return data;
  },

  async getCurrentUser() {
    const { data } = await api.get<User>('/users/me');
    return data;
  },

  async updateProfile(updates: Partial<User>) {
    const { data } = await api.patch<User>('/users/me', updates);
    return data;
  },

  async uploadAvatar(formData: FormData) {
    const { data } = await api.uploadFile<{ avatar: string }>('/users/avatar', formData);
    return data;
  },

  async uploadCover(formData: FormData) {
    const { data } = await api.uploadFile<{ cover: string }>('/users/cover', formData);
    return data;
  },

  async followUser(userId: string) {
    await api.post(`/users/${userId}/follow`);
  },

  async unfollowUser(userId: string) {
    await api.post(`/users/${userId}/unfollow`);
  },

  async getFollowers(userId: string, page = 1) {
    const { data } = await api.get(`/users/${userId}/followers?page=${page}`);
    return data;
  },

  async getFollowing(userId: string, page = 1) {
    const { data } = await api.get(`/users/${userId}/following?page=${page}`);
    return data;
  },

  async blockUser(userId: string) {
    await api.post(`/users/${userId}/block`);
  },

  async unblockUser(userId: string) {
    await api.post(`/users/${userId}/unblock`);
  },

  async getBlockedUsers() {
    const { data } = await api.get('/users/blocked');
    return data;
  },

  async searchUsers(query: string, page = 1) {
    const { data } = await api.get(`/users/search?q=${query}&page=${page}`);
    return data;
  },

  async getUserVideos(userId: string, page = 1) {
    const { data } = await api.get(`/users/${userId}/videos?page=${page}`);
    return data;
  },

  async getUserStats(userId: string) {
    const { data } = await api.get(`/users/${userId}/stats`);
    return data;
  },

  async verifyUser(userId: string) {
    const { data } = await api.post(`/users/${userId}/verify`);
    return data;
  },

  async reportUser(userId: string, reason: string) {
    await api.post(`/users/${userId}/report`, { reason });
  },

  async deactivateAccount() {
    await api.post('/users/me/deactivate');
  },

  async deleteAccount() {
    await api.delete('/users/me');
  },
};
