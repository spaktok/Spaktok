import { api } from '@/utils';
import {
  Filter,
  UserFilter,
  BeautyFilter,
  CustomFilter,
  FilterAnalytics,
  FaceDetectionResult,
} from '@/types/filters';

export const filtersService = {
  // Get Filters
  async getFilters(category?: string, limit = 50, offset = 0): Promise<Filter[]> {
    const response = await api.get<Filter[]>('/filters', {
      params: { category, limit, offset },
    });
    return response.data;
  },

  async getFilter(filterId: string): Promise<Filter> {
    const response = await api.get<Filter>(`/filters/${filterId}`);
    return response.data;
  },

  async getTrendingFilters(limit = 20): Promise<Filter[]> {
    const response = await api.get<Filter[]>('/filters/trending', {
      params: { limit },
    });
    return response.data;
  },

  async searchFilters(query: string, limit = 20): Promise<Filter[]> {
    const response = await api.get<Filter[]>('/filters/search', {
      params: { q: query, limit },
    });
    return response.data;
  },

  // User Filter Library
  async getSavedFilters(): Promise<UserFilter[]> {
    const response = await api.get<UserFilter[]>('/filters/saved');
    return response.data;
  },

  async saveFilter(filterId: string): Promise<UserFilter> {
    const response = await api.post<UserFilter>('/filters/save', { filterId });
    return response.data;
  },

  async unsaveFilter(filterId: string): Promise<void> {
    await api.delete(`/filters/save/${filterId}`);
  },

  async isSaved(filterId: string): Promise<boolean> {
    const response = await api.get<{ saved: boolean }>(`/filters/save/check/${filterId}`);
    return response.data.saved;
  },

  // Beauty Filters
  async getBeautyFilters(): Promise<BeautyFilter[]> {
    const response = await api.get<BeautyFilter[]>('/filters/beauty');
    return response.data;
  },

  async applyBeautyFilter(
    filterId: string,
    intensity: number
  ): Promise<any> {
    const response = await api.post('/filters/beauty/apply', {
      filterId,
      intensity,
    });
    return response.data;
  },

  // Face Detection
  async detectFaces(frameData: any): Promise<FaceDetectionResult> {
    const formData = new FormData();
    formData.append('frame', frameData);

    const response = await api.post<FaceDetectionResult>('/filters/face-detect', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async processFrameWithFilter(frameData: any, filterId: string, intensity = 100): Promise<any> {
    const formData = new FormData();
    formData.append('frame', frameData);
    formData.append('filterId', filterId);
    formData.append('intensity', intensity.toString());

    const response = await api.post('/filters/process', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Custom Filters
  async createCustomFilter(
    name: string,
    properties: any,
    thumbnail?: any
  ): Promise<CustomFilter> {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('properties', JSON.stringify(properties));
    if (thumbnail) formData.append('thumbnail', thumbnail);

    const response = await api.post<CustomFilter>('/filters/custom', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async getCustomFilters(): Promise<CustomFilter[]> {
    const response = await api.get<CustomFilter[]>('/filters/custom');
    return response.data;
  },

  async updateCustomFilter(filterId: string, updates: Partial<CustomFilter>): Promise<CustomFilter> {
    const response = await api.put<CustomFilter>(`/filters/custom/${filterId}`, updates);
    return response.data;
  },

  async deleteCustomFilter(filterId: string): Promise<void> {
    await api.delete(`/filters/custom/${filterId}`);
  },

  async publishCustomFilter(filterId: string): Promise<void> {
    await api.post(`/filters/custom/${filterId}/publish`);
  },

  async unpublishCustomFilter(filterId: string): Promise<void> {
    await api.post(`/filters/custom/${filterId}/unpublish`);
  },

  // Community Filters
  async getPublicFilters(limit = 50, offset = 0): Promise<CustomFilter[]> {
    const response = await api.get<CustomFilter[]>('/filters/community', {
      params: { limit, offset },
    });
    return response.data;
  },

  async downloadCustomFilter(filterId: string): Promise<void> {
    await api.post(`/filters/community/${filterId}/download`);
  },

  // Filter Analytics
  async getFilterAnalytics(filterId: string): Promise<FilterAnalytics> {
    const response = await api.get<FilterAnalytics>(`/filters/${filterId}/analytics`);
    return response.data;
  },

  async getAllFilterAnalytics(limit = 20): Promise<FilterAnalytics[]> {
    const response = await api.get<FilterAnalytics[]>('/filters/analytics', {
      params: { limit },
    });
    return response.data;
  },

  // Filter Ratings
  async rateFilter(filterId: string, rating: number): Promise<void> {
    await api.post(`/filters/${filterId}/rate`, { rating });
  },

  async getFilterRating(filterId: string): Promise<number> {
    const response = await api.get<{ rating: number }>(`/filters/${filterId}/rating`);
    return response.data.rating;
  },

  // Filter Usage Tracking
  async recordFilterUsage(filterId: string, duration: number): Promise<void> {
    await api.post(`/filters/${filterId}/usage`, { duration });
  },

  // Real-time Filter Preview
  async previewFilter(filterId: string, frameData: any): Promise<any> {
    const formData = new FormData();
    formData.append('frame', frameData);

    const response = await api.post(`/filters/${filterId}/preview`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Batch Filter Application
  async applyMultipleFilters(frameData: any, filterIds: string[]): Promise<any> {
    const formData = new FormData();
    formData.append('frame', frameData);
    filterIds.forEach((id) => formData.append('filters', id));

    const response = await api.post('/filters/batch-apply', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Filter Collections/Presets
  async getFilterPresets(): Promise<any[]> {
    const response = await api.get('/filters/presets');
    return response.data;
  },

  async createFilterPreset(name: string, filterIds: string[]): Promise<any> {
    const response = await api.post('/filters/presets', { name, filterIds });
    return response.data;
  },

  async applyFilterPreset(presetId: string, frameData: any): Promise<any> {
    const formData = new FormData();
    formData.append('frame', frameData);

    const response = await api.post(`/filters/presets/${presetId}/apply`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // AI-powered effects
  async enhanceWithAI(frameData: any, enhancement: 'portrait' | 'landscape' | 'night' | 'auto'): Promise<any> {
    const formData = new FormData();
    formData.append('frame', frameData);
    formData.append('enhancement', enhancement);

    const response = await api.post('/filters/enhance', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Filter Suggestions based on face
  async getRecommendedFilters(): Promise<Filter[]> {
    const response = await api.get<Filter[]>('/filters/recommended');
    return response.data;
  },

  // Advanced Face Editing
  async editFaceFeatures(
    frameData: any,
    adjustments: {
      jawline?: number;
      cheekbones?: number;
      forehead?: number;
      chin?: number;
      eyeSize?: number;
      eyeDistance?: number;
      noseWidth?: number;
      lipSize?: number;
    }
  ): Promise<any> {
    const formData = new FormData();
    formData.append('frame', frameData);
    formData.append('adjustments', JSON.stringify(adjustments));

    const response = await api.post('/filters/face-edit', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
