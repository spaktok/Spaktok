import { create } from 'zustand';
import { Video } from '@/types';

interface FeedStore {
  videos: Video[];
  setVideos: (videos: Video[]) => void;
  addVideos: (videos: Video[]) => void;
  addVideo: (video: Video) => void;
  removeVideo: (id: string) => void;
  updateVideo: (id: string, updates: Partial<Video>) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  hasMore: boolean;
  setHasMore: (hasMore: boolean) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  likedVideoIds: Set<string>;
  toggleVideoLike: (id: string) => void;
}

export const useFeedStore = create<FeedStore>((set) => ({
  videos: [],
  setVideos: (videos) => set({ videos }),
  addVideos: (newVideos) => set((state) => ({ videos: [...state.videos, ...newVideos] })),
  addVideo: (video) => set((state) => ({ videos: [video, ...state.videos] })),
  removeVideo: (id) => set((state) => ({ videos: state.videos.filter((v) => v.id !== id) })),
  updateVideo: (id, updates) =>
    set((state) => ({
      videos: state.videos.map((v) => (v.id === id ? { ...v, ...updates } : v)),
    })),
  
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  
  hasMore: true,
  setHasMore: (hasMore) => set({ hasMore }),
  
  currentPage: 1,
  setCurrentPage: (page) => set({ currentPage: page }),
  
  likedVideoIds: new Set(),
  toggleVideoLike: (id) =>
    set((state) => {
      const newLiked = new Set(state.likedVideoIds);
      if (newLiked.has(id)) {
        newLiked.delete(id);
      } else {
        newLiked.add(id);
      }
      return { likedVideoIds: newLiked };
    }),
}));
