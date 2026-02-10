import { create } from 'zustand';

interface UIStore {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  showBottomSheet: boolean;
  setShowBottomSheet: (show: boolean) => void;
  selectedTab: 'feed' | 'reels' | 'messages' | 'stories' | 'profile';
  setSelectedTab: (tab: 'feed' | 'reels' | 'messages' | 'stories' | 'profile') => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  isDarkMode: true,
  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
  
  showBottomSheet: false,
  setShowBottomSheet: (show) => set({ showBottomSheet: show }),
  
  selectedTab: 'feed',
  setSelectedTab: (tab) => set({ selectedTab: tab }),
  
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
}));
