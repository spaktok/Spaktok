import { api } from '@/utils';
import { Story, StoryView, StoryReply, UserStories } from '@/types/stories';

export const storiesService = {
  // Story Management
  async getUserStories(userId: string) {
    const { data } = await api.get<{ stories: Story[] }>(`/stories/users/${userId}`);
    return data.stories;
  },

  async getFeedStories() {
    const { data } = await api.get<UserStories[]>('/stories/feed');
    return data;
  },

  async getStoryById(storyId: string) {
    const { data } = await api.get<Story>(`/stories/${storyId}`);
    return data;
  },

  async createStory(
    mediaUri: string,
    type: 'image' | 'video',
    options?: {
      caption?: string;
      location?: string;
      stickers?: Array<{
        type: string;
        content: string;
        x: number;
        y: number;
      }>;
    }
  ) {
    const formData = new FormData();
    formData.append('type', type);
    formData.append('media', {
      uri: mediaUri,
      type: type === 'image' ? 'image/jpeg' : 'video/mp4',
      name: `story_${Date.now()}`,
    } as any);

    if (options?.caption) {
      formData.append('caption', options.caption);
    }
    if (options?.location) {
      formData.append('location', options.location);
    }
    if (options?.stickers) {
      formData.append('stickers', JSON.stringify(options.stickers));
    }

    const { data } = await api.uploadFile<Story>('/stories', formData);
    return data;
  },

  async updateStory(storyId: string, updates: Partial<Story>) {
    const { data } = await api.patch<Story>(`/stories/${storyId}`, updates);
    return data;
  },

  async deleteStory(storyId: string) {
    await api.delete(`/stories/${storyId}`);
  },

  // Story Views
  async recordView(storyId: string, viewDuration?: number) {
    const { data } = await api.post<StoryView>(`/stories/${storyId}/views`, {
      duration: viewDuration,
    });
    return data;
  },

  async getStoryViews(storyId: string) {
    const { data } = await api.get<StoryView[]>(`/stories/${storyId}/views`);
    return data;
  },

  async getViewers(storyId: string) {
    const { data } = await api.get<Array<{ userId: string; username: string; viewedAt: Date }>>(
      `/stories/${storyId}/viewers`
    );
    return data;
  },

  async recordScreenshot(storyId: string) {
    await api.post(`/stories/${storyId}/screenshot`);
  },

  // Story Replies
  async sendReply(storyId: string, content: string, type: 'text' | 'media' = 'text') {
    const { data } = await api.post<StoryReply>(`/stories/${storyId}/replies`, {
      content,
      type,
    });
    return data;
  },

  async sendMediaReply(storyId: string, mediaUri: string) {
    const formData = new FormData();
    formData.append('type', 'media');
    formData.append('media', {
      uri: mediaUri,
      type: 'image/jpeg',
      name: `reply_${Date.now()}`,
    } as any);

    const { data } = await api.uploadFile<StoryReply>(
      `/stories/${storyId}/replies/media`,
      formData
    );
    return data;
  },

  async getReplies(storyId: string) {
    const { data } = await api.get<StoryReply[]>(`/stories/${storyId}/replies`);
    return data;
  },

  async deleteReply(storyId: string, replyId: string) {
    await api.delete(`/stories/${storyId}/replies/${replyId}`);
  },

  // Story Reactions
  async addReaction(storyId: string, emoji: string) {
    await api.post(`/stories/${storyId}/reactions`, { emoji });
  },

  async removeReaction(storyId: string, emoji: string) {
    await api.delete(`/stories/${storyId}/reactions/${emoji}`);
  },

  // Story Interactions
  async likeStory(storyId: string) {
    await api.post(`/stories/${storyId}/like`);
  },

  async unlikeStory(storyId: string) {
    await api.post(`/stories/${storyId}/unlike`);
  },

  async shareStory(storyId: string, platform: string) {
    const { data } = await api.post(`/stories/${storyId}/share`, { platform });
    return data;
  },

  async reportStory(storyId: string, reason: string) {
    await api.post(`/stories/${storyId}/report`, { reason });
  },

  // Story Archiving (don't delete, keep in archive)
  async archiveStory(storyId: string) {
    const { data } = await api.patch<Story>(`/stories/${storyId}/archive`, {
      archived: true,
    });
    return data;
  },

  async getArchivedStories() {
    const { data } = await api.get<Story[]>('/stories/archive');
    return data;
  },

  async unarchiveStory(storyId: string) {
    const { data } = await api.patch<Story>(`/stories/${storyId}/archive`, {
      archived: false,
    });
    return data;
  },

  // Story Highlighting (save to highlights)
  async addToHighlight(storyId: string, highlightName: string) {
    const { data } = await api.post(`/stories/${storyId}/highlights`, {
      name: highlightName,
    });
    return data;
  },

  async removeFromHighlight(storyId: string, highlightId: string) {
    await api.delete(`/stories/${storyId}/highlights/${highlightId}`);
  },

  async getHighlights(userId: string) {
    const { data } = await api.get(`/users/${userId}/highlights`);
    return data;
  },

  // Story Analytics
  async getStoryAnalytics(storyId: string) {
    const { data } = await api.get(
      `/stories/${storyId}/analytics`
    );
    return data;
  },

  async getUserStoryAnalytics(userId: string) {
    const { data } = await api.get(`/users/${userId}/story-analytics`);
    return data;
  },

  // Story Search
  async searchStories(query: string) {
    const { data } = await api.get<Story[]>(
      `/stories/search?q=${encodeURIComponent(query)}`
    );
    return data;
  },
};
