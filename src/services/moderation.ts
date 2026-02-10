import { api } from '@/utils';
import {
  ContentReport,
  ModerationLog,
  Ban,
  BanAppeal,
  ContentModerationStats,
  SafetyAlert,
} from '@/types/safety';

export const moderationService = {
  // Reporting
  async reportContent(
    contentType: string,
    contentId: string,
    reason: string,
    description?: string,
    screenshots?: string[]
  ): Promise<ContentReport> {
    const response = await api.post<ContentReport>('/moderation/report', {
      contentType,
      contentId,
      reason,
      description,
      screenshots,
    });
    return response.data;
  },

  async getMyReports(limit = 50, offset = 0): Promise<ContentReport[]> {
    const response = await api.get<ContentReport[]>('/moderation/my-reports', {
      params: { limit, offset },
    });
    return response.data;
  },

  async getReportStatus(reportId: string): Promise<ContentReport> {
    const response = await api.get<ContentReport>(`/moderation/reports/${reportId}`);
    return response.data;
  },

  // Bans
  async getBanStatus(): Promise<Ban | null> {
    try {
      const response = await api.get<Ban>('/moderation/my-ban');
      return response.data;
    } catch {
      return null;
    }
  },

  async appealBan(reason: string, evidence?: string[]): Promise<BanAppeal> {
    const response = await api.post<BanAppeal>('/moderation/appeal-ban', {
      reason,
      evidence,
    });
    return response.data;
  },

  async getAppealStatus(): Promise<BanAppeal | null> {
    try {
      const response = await api.get<BanAppeal>('/moderation/appeal-status');
      return response.data;
    } catch {
      return null;
    }
  },

  // Blocks
  async getBlockedContent(limit = 50, offset = 0): Promise<any[]> {
    const response = await api.get('/moderation/blocked-content', {
      params: { limit, offset },
    });
    return response.data;
  },

  async unblockContent(contentId: string): Promise<void> {
    await api.post(`/moderation/unblock/${contentId}`);
  },

  // Safety Alerts
  async getSafetyAlerts(limit = 50): Promise<SafetyAlert[]> {
    const response = await api.get<SafetyAlert[]>('/moderation/alerts', {
      params: { limit },
    });
    return response.data;
  },

  async acknowledgeSafetyAlert(alertId: string): Promise<void> {
    await api.post(`/moderation/alerts/${alertId}/acknowledge`);
  },

  // Community Guidelines
  async getCommunityGuidelines(): Promise<any> {
    const response = await api.get('/moderation/community-guidelines');
    return response.data;
  },

  // Moderation Statistics
  async getModerationStats(): Promise<ContentModerationStats> {
    const response = await api.get<ContentModerationStats>('/moderation/stats');
    return response.data;
  },

  // Appeal Moderation Decision
  async appealModerationDecision(
    logId: string,
    reason: string,
    evidence?: string[]
  ): Promise<any> {
    const response = await api.post(`/moderation/logs/${logId}/appeal`, {
      reason,
      evidence,
    });
    return response.data;
  },

  // Content Warnings
  async getContentWarnings(contentId: string): Promise<any[]> {
    const response = await api.get(`/moderation/content/${contentId}/warnings`);
    return response.data;
  },

  // Report History for Analytics
  async getReportHistory(period: 'week' | 'month' | 'year'): Promise<any> {
    const response = await api.get('/moderation/report-history', {
      params: { period },
    });
    return response.data;
  },

  // Admin Endpoints (for moderators only)
  async getAllReports(status?: string, limit = 50, offset = 0): Promise<ContentReport[]> {
    const response = await api.get<ContentReport[]>('/admin/moderation/reports', {
      params: { status, limit, offset },
    });
    return response.data;
  },

  async reviewReport(reportId: string, action: string, notes?: string): Promise<void> {
    await api.post(`/admin/moderation/reports/${reportId}/review`, {
      action,
      notes,
    });
  },

  async banUser(userId: string, duration: number, reason: string): Promise<Ban> {
    const response = await api.post<Ban>(`/admin/users/${userId}/ban`, {
      duration,
      reason,
    });
    return response.data;
  },

  async unbanUser(userId: string): Promise<void> {
    await api.post(`/admin/users/${userId}/unban`);
  },

  async removeContent(contentId: string, reason: string): Promise<void> {
    await api.post(`/admin/content/${contentId}/remove`, { reason });
  },

  async muteUser(userId: string, duration: number): Promise<void> {
    await api.post(`/admin/users/${userId}/mute`, { duration });
  },

  async getModerationLogs(limit = 100, offset = 0): Promise<ModerationLog[]> {
    const response = await api.get<ModerationLog[]>('/admin/moderation/logs', {
      params: { limit, offset },
    });
    return response.data;
  },

  async getReportQueue(priority?: string): Promise<any[]> {
    const response = await api.get('/admin/moderation/queue', {
      params: { priority },
    });
    return response.data;
  },

  async assignReportToModerator(reportId: string, moderatorId: string): Promise<void> {
    await api.post(`/admin/moderation/reports/${reportId}/assign`, {
      moderatorId,
    });
  },

  async bulkReviewReports(reportIds: string[], action: string): Promise<void> {
    await api.post('/admin/moderation/bulk-review', {
      reportIds,
      action,
    });
  },

  // Trust Scoring
  async getUserTrustScore(userId: string): Promise<any> {
    const response = await api.get(`/moderation/trust-score/${userId}`);
    return response.data;
  },

  // Block/Allow List
  async addToAllowList(userId: string): Promise<void> {
    await api.post('/moderation/allow-list', { userId });
  },

  async removeFromAllowList(userId: string): Promise<void> {
    await api.delete(`/moderation/allow-list/${userId}`);
  },

  // IP Blocking
  async blockIP(ipAddress: string, reason: string): Promise<void> {
    await api.post('/admin/moderation/block-ip', {
      ipAddress,
      reason,
    });
  },

  async unblockIP(ipAddress: string): Promise<void> {
    await api.delete(`/admin/moderation/block-ip/${ipAddress}`);
  },
};
