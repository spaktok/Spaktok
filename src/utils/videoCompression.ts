import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

export interface CompressionOptions {
  targetSize?: number; // in KB
  quality?: number; // 0-1
  width?: number;
  height?: number;
}

const DEFAULT_OPTIONS: CompressionOptions = {
  targetSize: 5000, // 5MB default
  quality: 0.8,
  width: 1080,
  height: 1920,
};

class VideoCompressionManager {
  private static instance: VideoCompressionManager;

  private constructor() {}

  static getInstance(): VideoCompressionManager {
    if (!VideoCompressionManager.instance) {
      VideoCompressionManager.instance = new VideoCompressionManager();
    }
    return VideoCompressionManager.instance;
  }

  async getVideoInfo(uri: string): Promise<{
    size: number;
    duration: number;
    width: number;
    height: number;
  }> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      
      // Note: For actual video duration, you'd use react-native-video or similar
      // This is a placeholder - actual implementation would need native module
      return {
        size: fileInfo.size || 0,
        duration: 0, // Would be calculated from video
        width: 1080,
        height: 1920,
      };
    } catch (error) {
      console.error('Error getting video info:', error);
      throw error;
    }
  }

  async compressVideo(
    inputUri: string,
    options: Partial<CompressionOptions> = {}
  ): Promise<string> {
    const config = { ...DEFAULT_OPTIONS, ...options };

    try {
      const inputInfo = await this.getVideoInfo(inputUri);
      
      // Calculate compression ratio needed
      const targetSize = config.targetSize! * 1024; // Convert to bytes
      if (inputInfo.size <= targetSize) {
        return inputUri; // Already small enough
      }

      const compressionRatio = targetSize / inputInfo.size;
      const newQuality = Math.max(0.3, Math.min(1, config.quality! * compressionRatio));

      console.log(`[v0] Compressing video: ${compressionRatio.toFixed(2)}x, quality: ${newQuality.toFixed(2)}`);

      // For videos, actual compression requires native module like react-native-video-compress
      // This is a simplified implementation that would work with the native module
      return inputUri;
    } catch (error) {
      console.error('Video compression error:', error);
      throw error;
    }
  }

  async generateThumbnail(
    videoUri: string,
    options: { width?: number; height?: number; quality?: number } = {}
  ): Promise<string> {
    try {
      const { width = 400, height = 300, quality = 0.7 } = options;

      // Use expo-video-thumbnails or similar
      // This is a placeholder for the actual implementation
      return videoUri;
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      throw error;
    }
  }

  async calculateBitrate(
    fileSize: number,
    durationSeconds: number
  ): Promise<number> {
    return (fileSize * 8) / durationSeconds; // bits per second
  }

  async optimizeForNetwork(
    videoUri: string,
    networkType: 'wifi' | '4g' | '3g'
  ): Promise<CompressionOptions> {
    const presets: Record<string, CompressionOptions> = {
      wifi: { targetSize: 10000, quality: 0.9 },
      '4g': { targetSize: 5000, quality: 0.7 },
      '3g': { targetSize: 2000, quality: 0.5 },
    };

    return presets[networkType] || presets['4g'];
  }
}

export const videoCompressionManager = VideoCompressionManager.getInstance();
