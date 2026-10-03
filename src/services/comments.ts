import { api } from '@/utils';
import { Comment } from '@/types';

export const commentsService = {
  async getComments(videoId: string, page = 1, limit = 20) {
    const { data } = await api.get<{ comments: Comment[]; total: number; hasMore: boolean }>(
      `/videos/${videoId}/comments?page=${page}&limit=${limit}`
    );
    return data;
  },

  async addComment(videoId: string, content: string, parentCommentId?: string) {
    const { data } = await api.post<Comment>(`/videos/${videoId}/comments`, {
      content,
      parentCommentId,
    });
    return data;
  },

  async updateComment(videoId: string, commentId: string, content: string) {
    const { data } = await api.patch<Comment>(
      `/videos/${videoId}/comments/${commentId}`,
      { content }
    );
    return data;
  },

  async deleteComment(videoId: string, commentId: string) {
    await api.delete(`/videos/${videoId}/comments/${commentId}`);
  },

  async likeComment(videoId: string, commentId: string) {
    await api.post(`/videos/${videoId}/comments/${commentId}/like`);
  },

  async unlikeComment(videoId: string, commentId: string) {
    await api.post(`/videos/${videoId}/comments/${commentId}/unlike`);
  },

  async flagComment(videoId: string, commentId: string, reason: string) {
    await api.post(`/videos/${videoId}/comments/${commentId}/flag`, { reason });
  },

  async getReplies(videoId: string, commentId: string, page = 1, limit = 10) {
    const { data } = await api.get<Comment[]>(
      `/videos/${videoId}/comments/${commentId}/replies?page=${page}&limit=${limit}`
    );
    return data;
  },
};
