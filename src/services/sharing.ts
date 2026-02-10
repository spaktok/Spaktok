import { api } from '@/utils';
import {
  Share,
  ShareableLink,
  ReferralLink,
  ReferralStats,
  Duet,
  Stitch,
  Collaboration,
  CollaborationInvite,
  ShareLink,
} from '@/types/sharing';

export const sharingService = {
  // Basic Sharing
  async shareContent(
    contentId: string,
    contentType: string,
    targets: string[],
    customMessage?: string
  ): Promise<Share> {
    const response = await api.post<Share>('/sharing/share', {
      contentId,
      contentType,
      targets,
      customMessage,
    });
    return response.data;
  },

  async getShareHistory(limit = 50, offset = 0): Promise<Share[]> {
    const response = await api.get<Share[]>('/sharing/history', {
      params: { limit, offset },
    });
    return response.data;
  },

  async getShareAnalytics(shareId: string): Promise<ShareAnalytics> {
    const response = await api.get(`/sharing/${shareId}/analytics`);
    return response.data;
  },

  // Share Links
  async createShareableLink(
    contentId: string,
    contentType: string,
    customText?: string,
    expiresAt?: string
  ): Promise<ShareableLink> {
    const response = await api.post<ShareableLink>('/sharing/links/create', {
      contentId,
      contentType,
      customText,
      expiresAt,
    });
    return response.data;
  },

  async getShareableLinks(limit = 50, offset = 0): Promise<ShareableLink[]> {
    const response = await api.get<ShareableLink[]>('/sharing/links', {
      params: { limit, offset },
    });
    return response.data;
  },

  async updateShareableLink(linkId: string, updates: Partial<ShareableLink>): Promise<ShareableLink> {
    const response = await api.put<ShareableLink>(`/sharing/links/${linkId}`, updates);
    return response.data;
  },

  async deleteShareableLink(linkId: string): Promise<void> {
    await api.delete(`/sharing/links/${linkId}`);
  },

  async getShareLinkAnalytics(linkId: string): Promise<any> {
    const response = await api.get(`/sharing/links/${linkId}/analytics`);
    return response.data;
  },

  // Referrals
  async getReferralLink(): Promise<ReferralLink> {
    const response = await api.get<ReferralLink>('/sharing/referral/link');
    return response.data;
  },

  async getReferralStats(): Promise<ReferralStats> {
    const response = await api.get<ReferralStats>('/sharing/referral/stats');
    return response.data;
  },

  async claimReferralRewards(): Promise<any> {
    const response = await api.post('/sharing/referral/claim-rewards');
    return response.data;
  },

  async getReferralHistory(limit = 50, offset = 0): Promise<any[]> {
    const response = await api.get('/sharing/referral/history', {
      params: { limit, offset },
    });
    return response.data;
  },

  // Duets
  async createDuet(
    originalVideoId: string,
    duetVideoFile: File,
    duetType: 'side_by_side' | 'reaction'
  ): Promise<Duet> {
    const formData = new FormData();
    formData.append('originalVideoId', originalVideoId);
    formData.append('videoFile', duetVideoFile);
    formData.append('duetType', duetType);

    const response = await api.post<Duet>('/sharing/duets', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async getDuets(videoId: string, limit = 50, offset = 0): Promise<Duet[]> {
    const response = await api.get<Duet[]>(`/sharing/duets/${videoId}`, {
      params: { limit, offset },
    });
    return response.data;
  },

  async getMyDuets(limit = 50, offset = 0): Promise<Duet[]> {
    const response = await api.get<Duet[]>('/sharing/duets/my', {
      params: { limit, offset },
    });
    return response.data;
  },

  async allowDuets(videoId: string, allow: boolean): Promise<void> {
    await api.put(`/sharing/videos/${videoId}/duets-allowed`, { allow });
  },

  // Stitches
  async createStitch(
    originalVideoId: string,
    stitchVideoFile: File,
    clipStartTime: number,
    clipEndTime: number
  ): Promise<Stitch> {
    const formData = new FormData();
    formData.append('originalVideoId', originalVideoId);
    formData.append('videoFile', stitchVideoFile);
    formData.append('clipStartTime', clipStartTime.toString());
    formData.append('clipEndTime', clipEndTime.toString());

    const response = await api.post<Stitch>('/sharing/stitches', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async getStitches(videoId: string, limit = 50, offset = 0): Promise<Stitch[]> {
    const response = await api.get<Stitch[]>(`/sharing/stitches/${videoId}`, {
      params: { limit, offset },
    });
    return response.data;
  },

  async getMyStitches(limit = 50, offset = 0): Promise<Stitch[]> {
    const response = await api.get<Stitch[]>('/sharing/stitches/my', {
      params: { limit, offset },
    });
    return response.data;
  },

  async allowStitches(videoId: string, allow: boolean): Promise<void> {
    await api.put(`/sharing/videos/${videoId}/stitches-allowed`, { allow });
  },

  // Collaborations
  async sendCollaborationInvite(userId: string, message?: string): Promise<CollaborationInvite> {
    const response = await api.post<CollaborationInvite>('/sharing/collaboration/invite', {
      userId,
      message,
    });
    return response.data;
  },

  async getCollaborationInvites(): Promise<CollaborationInvite[]> {
    const response = await api.get<CollaborationInvite[]>('/sharing/collaboration/invites');
    return response.data;
  },

  async acceptCollaborationInvite(inviteId: string): Promise<Collaboration> {
    const response = await api.post<Collaboration>(
      `/sharing/collaboration/invites/${inviteId}/accept`
    );
    return response.data;
  },

  async rejectCollaborationInvite(inviteId: string): Promise<void> {
    await api.post(`/sharing/collaboration/invites/${inviteId}/reject`);
  },

  async getCollaborations(limit = 50, offset = 0): Promise<Collaboration[]> {
    const response = await api.get<Collaboration[]>('/sharing/collaboration', {
      params: { limit, offset },
    });
    return response.data;
  },

  // Embed Code
  async getEmbedCode(contentId: string, contentType: string): Promise<string> {
    const response = await api.get(`/sharing/embed/${contentId}`, {
      params: { type: contentType },
    });
    return response.data.embedCode;
  },

  async updateEmbedRestrictions(
    contentId: string,
    restrictedDomains?: string[]
  ): Promise<void> {
    await api.put(`/sharing/embed/${contentId}`, { restrictedDomains });
  },

  // Share Tracking
  async trackShare(shareId: string): Promise<void> {
    await api.post(`/sharing/${shareId}/track`);
  },

  async trackShareClick(code: string): Promise<void> {
    await api.post('/sharing/track-click', { code });
  },

  // Download Video
  async downloadVideo(videoId: string): Promise<Blob> {
    const response = await api.get(`/sharing/download/${videoId}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Social Media Cross-posting
  async setupSocialMediaIntegration(platform: string, token: string): Promise<void> {
    await api.post('/sharing/social/connect', { platform, token });
  },

  async disconnectSocialMedia(platform: string): Promise<void> {
    await api.post(`/sharing/social/disconnect/${platform}`);
  },

  async getCrossPostSettings(): Promise<any> {
    const response = await api.get('/sharing/social/settings');
    return response.data;
  },

  async updateCrossPostSettings(settings: any): Promise<void> {
    await api.put('/sharing/social/settings', settings);
  },

  async crossPostVideo(videoId: string, platforms: string[]): Promise<any> {
    const response = await api.post('/sharing/cross-post', {
      videoId,
      platforms,
    });
    return response.data;
  },

  // Share Notifications
  async getShareNotifications(limit = 50): Promise<any[]> {
    const response = await api.get('/sharing/notifications', {
      params: { limit },
    });
    return response.data;
  },

  // Playlist Sharing
  async createPlaylist(name: string, description?: string): Promise<any> {
    const response = await api.post('/sharing/playlists', {
      name,
      description,
    });
    return response.data;
  },

  async addVideoToPlaylist(playlistId: string, videoId: string): Promise<void> {
    await api.post(`/sharing/playlists/${playlistId}/videos`, { videoId });
  },

  async sharePlaylist(playlistId: string, userId: string): Promise<void> {
    await api.post(`/sharing/playlists/${playlistId}/share`, { userId });
  },
};
