import { api } from '@/utils';
import { Video } from '@/types';
import { feedAlgorithm, UserPreferences } from '@/utils/feedAlgorithm';

export const videoService = {
  async uploadVideo(formData: FormData) {
    const { data } = await api.uploadFile<{ videoId: string }>('/videos/upload', formData);
    return data;
  },

  async getVideoById(id: string) {
    const { data } = await api.get<Video>(`/videos/${id}`);
    return data;
  },

  async getFeed(page = 1, limit = 20) {
    const { data } = await api.get<{ videos: Video[]; total: number; hasMore: boolean }>(
      `/videos/feed?page=${page}&limit=${limit}`
    );
    return data;
  },

  async getReels(page = 1, limit = 20) {
    const { data } = await api.get<{ videos: Video[]; total: number; hasMore: boolean }>(
      `/videos/reels?page=${page}&limit=${limit}`
    );
    return data;
  },

  async likeVideo(id: string) {
    await api.post(`/videos/${id}/like`);
  },

  async unlikeVideo(id: string) {
    await api.post(`/videos/${id}/unlike`);
  },

  async getComments(videoId: string, page = 1) {
    const { data } = await api.get(`/videos/${videoId}/comments?page=${page}`);
    return data;
  },

  async addComment(videoId: string, content: string) {
    const { data } = await api.post(`/videos/${videoId}/comments`, { content });
    return data;
  },

  async deleteComment(videoId: string, commentId: string) {
    await api.delete(`/videos/${videoId}/comments/${commentId}`);
  },

  async shareVideo(videoId: string, platform: string) {
    const { data } = await api.post(`/videos/${videoId}/share`, { platform });
    return data;
  },

  async deleteVideo(id: string) {
    await api.delete(`/videos/${id}`);
  },

  async updateVideo(id: string, updates: Partial<VideoUploadInput>) {
    const { data } = await api.patch(`/videos/${id}`, updates);
    return data;
  },

  async getVideoAnalytics(id: string) {
    const { data } = await api.get(`/videos/${id}/analytics`);
    return data;
  },

  async searchVideos(query: string, page = 1) {
    const { data } = await api.get(`/videos/search?q=${query}&page=${page}`);
    return data;
  },

  async getTrendingVideos() {
    const { data } = await api.get('/videos/trending');
    return data;
  },

  async reportVideo(videoId: string, reason: string) {
    await api.post(`/videos/${videoId}/report`, { reason });
  },

  async getPersonalizedFeed(page = 1, limit = 20, preferences: UserPreferences) {
    const { data } = await api.get<{ videos: Video[]; total: number; hasMore: boolean }>(
      `/videos/personalized?page=${page}&limit=${limit}`
    );
    
    // Apply client-side ranking
    const ranked = feedAlgorithm.rankVideos(data.videos, preferences);
    const sortedVideos = data.videos.sort((a, b) => {
      const rankA = ranked.find(r => r.videoId === a.id)?.score || 0;
      const rankB = ranked.find(r => r.videoId === b.id)?.score || 0;
      return rankB - rankA;
    });

    return { videos: sortedVideos, total: data.total, hasMore: data.hasMore };
  },

  async getTrendingFeed(timeWindowHours = 24) {
    const { data } = await api.get<Video[]>('/videos/trending');
    return feedAlgorithm.getTrendingVideos(data, timeWindowHours);
  },

  async getRecommendations(limit = 10) {
    const { data } = await api.get<Video[]>('/videos/recommendations');
    return data.slice(0, limit);
  },

  async recordView(videoId: string, viewDurationSeconds: number) {
    await api.post(`/videos/${videoId}/view`, { duration: viewDurationSeconds });
  },

  async getViewHistory() {
    const { data } = await api.get<Video[]>('/videos/history');
    return data;
  },
};
