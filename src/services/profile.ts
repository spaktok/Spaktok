import { api } from '@/utils';
import {
  UserProfile,
  ProfileUpdate,
  UserFollower,
  UserFollowing,
  UserActivity,
  BlockList,
  PrivacySettings,
  NotificationSettings,
  CreatorDashboard,
  Verification,
  AccountSecurity,
  UserReport,
} from '@/types/profile';

export const profileService = {
  // Profile Management
  async getProfile(userId: string): Promise<UserProfile> {
    const response = await api.get<UserProfile>(`/users/${userId}`);
    return response.data;
  },

  async getCurrentUserProfile(): Promise<UserProfile> {
    const response = await api.get<UserProfile>('/users/me');
    return response.data;
  },

  async updateProfile(updates: ProfileUpdate): Promise<UserProfile> {
    const formData = new FormData();
    
    if (updates.displayName) formData.append('displayName', updates.displayName);
    if (updates.bio) formData.append('bio', updates.bio);
    if (updates.website) formData.append('website', updates.website);
    if (updates.location) formData.append('location', updates.location);
    if (updates.isPrivate !== undefined) formData.append('isPrivate', updates.isPrivate.toString());
    if (updates.avatar) formData.append('avatar', updates.avatar);
    if (updates.coverImage) formData.append('coverImage', updates.coverImage);

    const response = await api.put<UserProfile>('/users/me', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async deleteAccount(password: string): Promise<void> {
    await api.post('/users/me/delete', { password });
  },

  async searchUsers(query: string, limit = 20): Promise<UserProfile[]> {
    const response = await api.get<UserProfile[]>('/users/search', {
      params: { q: query, limit },
    });
    return response.data;
  },

  // Follow System
  async getFollowers(userId: string, limit = 50, offset = 0): Promise<UserFollower[]> {
    const response = await api.get<UserFollower[]>(`/users/${userId}/followers`, {
      params: { limit, offset },
    });
    return response.data;
  },

  async getFollowing(userId: string, limit = 50, offset = 0): Promise<UserFollowing[]> {
    const response = await api.get<UserFollowing[]>(`/users/${userId}/following`, {
      params: { limit, offset },
    });
    return response.data;
  },

  async followUser(userId: string): Promise<void> {
    await api.post(`/users/${userId}/follow`);
  },

  async unfollowUser(userId: string): Promise<void> {
    await api.post(`/users/${userId}/unfollow`);
  },

  async isFollowing(userId: string): Promise<boolean> {
    const response = await api.get<{ following: boolean }>(`/users/${userId}/is-following`);
    return response.data.following;
  },

  async getMutualFollowers(userId: string): Promise<UserProfile[]> {
    const response = await api.get<UserProfile[]>(`/users/${userId}/mutual-followers`);
    return response.data;
  },

  // Blocking System
  async blockUser(userId: string, reason?: string): Promise<void> {
    await api.post(`/users/${userId}/block`, { reason });
  },

  async unblockUser(userId: string): Promise<void> {
    await api.post(`/users/${userId}/unblock`);
  },

  async getBlockedUsers(limit = 50, offset = 0): Promise<BlockList[]> {
    const response = await api.get<BlockList[]>('/users/blocked', {
      params: { limit, offset },
    });
    return response.data;
  },

  async isBlocked(userId: string): Promise<boolean> {
    const response = await api.get<{ blocked: boolean }>(`/users/${userId}/is-blocked`);
    return response.data.blocked;
  },

  // Activity
  async getActivity(limit = 50, offset = 0): Promise<UserActivity[]> {
    const response = await api.get<UserActivity[]>('/users/me/activity', {
      params: { limit, offset },
    });
    return response.data;
  },

  async getUserActivity(userId: string, limit = 50, offset = 0): Promise<UserActivity[]> {
    const response = await api.get<UserActivity[]>(`/users/${userId}/activity`, {
      params: { limit, offset },
    });
    return response.data;
  },

  // Settings
  async getPrivacySettings(): Promise<PrivacySettings> {
    const response = await api.get<PrivacySettings>('/users/me/privacy-settings');
    return response.data;
  },

  async updatePrivacySettings(settings: Partial<PrivacySettings>): Promise<PrivacySettings> {
    const response = await api.put<PrivacySettings>('/users/me/privacy-settings', settings);
    return response.data;
  },

  async getNotificationSettings(): Promise<NotificationSettings> {
    const response = await api.get<NotificationSettings>('/users/me/notification-settings');
    return response.data;
  },

  async updateNotificationSettings(
    settings: Partial<NotificationSettings>
  ): Promise<NotificationSettings> {
    const response = await api.put<NotificationSettings>(
      '/users/me/notification-settings',
      settings
    );
    return response.data;
  },

  // Creator Dashboard
  async getCreatorDashboard(): Promise<CreatorDashboard> {
    const response = await api.get<CreatorDashboard>('/creators/dashboard');
    return response.data;
  },

  async getCreatorAnalytics(period: 'day' | 'week' | 'month' | 'year'): Promise<any> {
    const response = await api.get('/creators/analytics', {
      params: { period },
    });
    return response.data;
  },

  async getAudienceDemographics(): Promise<any> {
    const response = await api.get('/creators/audience-demographics');
    return response.data;
  },

  // Verification
  async requestEmailVerification(): Promise<void> {
    await api.post('/users/me/verify-email/request');
  },

  async verifyEmail(code: string): Promise<void> {
    await api.post('/users/me/verify-email', { code });
  },

  async requestPhoneVerification(phoneNumber: string): Promise<void> {
    await api.post('/users/me/verify-phone/request', { phoneNumber });
  },

  async verifyPhone(code: string): Promise<void> {
    await api.post('/users/me/verify-phone', { code });
  },

  async getVerification(): Promise<Verification> {
    const response = await api.get<Verification>('/users/me/verification');
    return response.data;
  },

  // Account Security
  async getAccountSecurity(): Promise<AccountSecurity> {
    const response = await api.get<AccountSecurity>('/users/me/security');
    return response.data;
  },

  async enable2FA(): Promise<any> {
    const response = await api.post('/users/me/2fa/enable');
    return response.data;
  },

  async disable2FA(password: string): Promise<void> {
    await api.post('/users/me/2fa/disable', { password });
  },

  async getActiveDevices(): Promise<any[]> {
    const response = await api.get('/users/me/devices');
    return response.data;
  },

  async removeDevice(deviceId: string): Promise<void> {
    await api.delete(`/users/me/devices/${deviceId}`);
  },

  async removeAllDevices(password: string): Promise<void> {
    await api.post('/users/me/devices/remove-all', { password });
  },

  // Reporting
  async reportUser(userId: string, reason: string, description?: string, screenshots?: string[]): Promise<UserReport> {
    const response = await api.post<UserReport>(`/users/${userId}/report`, {
      reason,
      description,
      screenshots,
    });
    return response.data;
  },

  // Profile Verification Badge
  async requestVerificationBadge(category: string): Promise<any> {
    const response = await api.post('/users/me/verification-badge/request', { category });
    return response.data;
  },

  async getVerificationBadgeStatus(): Promise<any> {
    const response = await api.get('/users/me/verification-badge/status');
    return response.data;
  },

  // Public Profile Sections
  async getUserLikedVideos(userId: string, limit = 20, offset = 0): Promise<any[]> {
    const response = await api.get(`/users/${userId}/liked-videos`, {
      params: { limit, offset },
    });
    return response.data;
  },

  async getUserCollaborations(userId: string): Promise<any[]> {
    const response = await api.get(`/users/${userId}/collaborations`);
    return response.data;
  },

  async getUserPlaylists(userId: string): Promise<any[]> {
    const response = await api.get(`/users/${userId}/playlists`);
    return response.data;
  },

  // Birthday & Anniversaries
  async updateBirthday(date: string): Promise<void> {
    await api.put('/users/me/birthday', { date });
  },

  // Profile Bio Markdown Support
  async updateProfileBio(bio: string): Promise<UserProfile> {
    const response = await api.put<UserProfile>('/users/me/bio', { bio });
    return response.data;
  },

  // Pronouns
  async updatePronouns(pronouns: string): Promise<void> {
    await api.put('/users/me/pronouns', { pronouns });
  },

  // Account Deletion Confirmation
  async requestAccountDeletion(): Promise<void> {
    await api.post('/users/me/deletion-request');
  },

  async cancelAccountDeletion(): Promise<void> {
    await api.post('/users/me/deletion-request/cancel');
  },
};
