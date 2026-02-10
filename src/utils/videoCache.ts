import * as FileSystem from 'expo-file-system';
import { LocalStorage, STORAGE_KEYS } from './storage';

const CACHE_DIR = `${FileSystem.cacheDirectory}spaktok_videos/`;
const MAX_CACHE_SIZE = 500 * 1024 * 1024; // 500MB

export interface CacheEntry {
  videoId: string;
  url: string;
  localPath: string;
  size: number;
  timestamp: number;
  duration: number;
}

class VideoCacheManager {
  private static instance: VideoCacheManager;
  private cache: Map<string, CacheEntry> = new Map();

  private constructor() {}

  static getInstance(): VideoCacheManager {
    if (!VideoCacheManager.instance) {
      VideoCacheManager.instance = new VideoCacheManager();
    }
    return VideoCacheManager.instance;
  }

  async init(): Promise<void> {
    try {
      // Ensure cache directory exists
      const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
      }

      // Load cache index
      const cached = await LocalStorage.getItem<CacheEntry[]>('video_cache_index');
      if (cached) {
        cached.forEach((entry) => {
          this.cache.set(entry.videoId, entry);
        });
      }

      // Clean up expired or oversized cache
      await this.cleanupCache();
    } catch (error) {
      console.error('Error initializing video cache:', error);
    }
  }

  async cacheVideo(
    videoId: string,
    videoUrl: string,
    localPath: string,
    size: number,
    duration: number
  ): Promise<void> {
    try {
      const entry: CacheEntry = {
        videoId,
        url: videoUrl,
        localPath,
        size,
        timestamp: Date.now(),
        duration,
      };

      this.cache.set(videoId, entry);
      await this.saveCacheIndex();
    } catch (error) {
      console.error('Error caching video:', error);
    }
  }

  async getCachedVideo(videoId: string): Promise<CacheEntry | null> {
    const entry = this.cache.get(videoId);
    
    if (!entry) return null;

    try {
      const fileInfo = await FileSystem.getInfoAsync(entry.localPath);
      if (!fileInfo.exists) {
        this.cache.delete(videoId);
        await this.saveCacheIndex();
        return null;
      }

      return entry;
    } catch (error) {
      console.error('Error checking cached video:', error);
      return null;
    }
  }

  async removeCachedVideo(videoId: string): Promise<void> {
    try {
      const entry = this.cache.get(videoId);
      if (entry) {
        await FileSystem.deleteAsync(entry.localPath, { idempotent: true });
        this.cache.delete(videoId);
        await this.saveCacheIndex();
      }
    } catch (error) {
      console.error('Error removing cached video:', error);
    }
  }

  async clearCache(): Promise<void> {
    try {
      await FileSystem.deleteAsync(CACHE_DIR, { idempotent: true });
      this.cache.clear();
      await LocalStorage.removeItem('video_cache_index');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  private async cleanupCache(): Promise<void> {
    try {
      let totalSize = 0;
      const entries: [string, CacheEntry][] = [];

      // Calculate total size
      for (const [videoId, entry] of this.cache.entries()) {
        const fileInfo = await FileSystem.getInfoAsync(entry.localPath);
        if (!fileInfo.exists) {
          this.cache.delete(videoId);
        } else {
          totalSize += entry.size;
          entries.push([videoId, entry]);
        }
      }

      // If cache exceeds max size, remove oldest entries
      if (totalSize > MAX_CACHE_SIZE) {
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

        let removedSize = 0;
        const targetRemoval = totalSize - MAX_CACHE_SIZE * 0.8; // Keep 80% of max

        for (const [videoId] of entries) {
          if (removedSize >= targetRemoval) break;
          const entry = this.cache.get(videoId);
          if (entry) {
            removedSize += entry.size;
            await this.removeCachedVideo(videoId);
          }
        }
      }

      await this.saveCacheIndex();
    } catch (error) {
      console.error('Error cleaning up cache:', error);
    }
  }

  private async saveCacheIndex(): Promise<void> {
    try {
      const cacheArray = Array.from(this.cache.values());
      await LocalStorage.setItem('video_cache_index', cacheArray);
    } catch (error) {
      console.error('Error saving cache index:', error);
    }
  }

  getCacheStats(): { totalSize: number; entryCount: number } {
    let totalSize = 0;
    for (const entry of this.cache.values()) {
      totalSize += entry.size;
    }
    return {
      totalSize,
      entryCount: this.cache.size,
    };
  }
}

export const videoCacheManager = VideoCacheManager.getInstance();
