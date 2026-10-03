import { useCallback, useState, useEffect } from 'react';
import { useFeedStore } from '@/store';
import { videoService } from '@/services';
import { videoCacheManager, feedAlgorithm } from '@/utils';
import { Video } from '@/types';

export interface UseFeedOptions {
  limit?: number;
  type?: 'feed' | 'reels' | 'trending';
  autoLoad?: boolean;
}

export function useFeed(options: UseFeedOptions = {}) {
  const {
    limit = 20,
    type = 'feed',
    autoLoad = true,
  } = options;

  const {
    videos,
    setVideos,
    addVideos,
    removeVideo,
    updateVideo,
    isLoading,
    setIsLoading,
    hasMore,
    setHasMore,
    currentPage,
    setCurrentPage,
    likedVideoIds,
    toggleVideoLike,
  } = useFeedStore();

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (autoLoad && videos.length === 0) {
      loadMore();
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log(`[v0] Loading ${type} feed, page ${currentPage}`);

      let response;
      if (type === 'reels') {
        response = await videoService.getReels(currentPage, limit);
      } else if (type === 'trending') {
        response = await videoService.getTrendingFeed();
      } else {
        response = await videoService.getFeed(currentPage, limit);
      }

      if (currentPage === 1) {
        setVideos(response.videos);
      } else {
        addVideos(response.videos);
      }

      setHasMore(response.hasMore);
      setCurrentPage(currentPage + 1);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load feed';
      setError(errorMessage);
      console.error('[v0] Feed load error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, isLoading, hasMore, type, limit]);

  const refresh = useCallback(async () => {
    setCurrentPage(1);
    setVideos([]);
    await loadMore();
  }, []);

  const toggleLike = useCallback(
    async (videoId: string) => {
      try {
        const isLiked = likedVideoIds.has(videoId);
        
        if (isLiked) {
          await videoService.unlikeVideo(videoId);
        } else {
          await videoService.likeVideo(videoId);
        }

        toggleVideoLike(videoId);

        // Update video like count
        const video = videos.find((v) => v.id === videoId);
        if (video) {
          updateVideo(videoId, {
            likes: isLiked ? video.likes - 1 : video.likes + 1,
          });
        }
      } catch (err) {
        console.error('[v0] Like error:', err);
      }
    },
    [likedVideoIds, videos]
  );

  const deleteVideo = useCallback(
    async (videoId: string) => {
      try {
        await videoService.deleteVideo(videoId);
        removeVideo(videoId);
      } catch (err) {
        console.error('[v0] Delete error:', err);
      }
    },
    []
  );

  const recordView = useCallback(
    async (videoId: string, durationSeconds: number) => {
      try {
        await videoService.recordView(videoId, durationSeconds);
      } catch (err) {
        console.error('[v0] View recording error:', err);
      }
    },
    []
  );

  const getCachedVideo = useCallback(
    async (videoId: string) => {
      return await videoCacheManager.getCachedVideo(videoId);
    },
    []
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    videos,
    isLoading,
    error,
    hasMore,
    likedVideoIds,
    loadMore,
    refresh,
    toggleLike,
    deleteVideo,
    recordView,
    getCachedVideo,
    clearError,
  };
}
