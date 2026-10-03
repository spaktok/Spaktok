import * as FileSystem from 'expo-file-system';
import { api } from '@/utils';
import { videoCacheManager } from '@/utils/videoCache';
import { videoCompressionManager } from '@/utils/videoCompression';

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadOptions {
  title: string;
  description?: string;
  category: 'reel' | 'story' | 'live' | 'post';
  isPublic: boolean;
  tags: string[];
  compress?: boolean;
  compressionQuality?: number;
  onProgress?: (progress: UploadProgress) => void;
}

class VideoUploadService {
  private static instance: VideoUploadService;
  private uploadQueue: Map<string, boolean> = new Map();

  private constructor() {}

  static getInstance(): VideoUploadService {
    if (!VideoUploadService.instance) {
      VideoUploadService.instance = new VideoUploadService();
    }
    return VideoUploadService.instance;
  }

  async uploadVideo(
    videoUri: string,
    options: UploadOptions
  ): Promise<{ videoId: string; url: string }> {
    const uploadId = Math.random().toString(36).substring(7);
    this.uploadQueue.set(uploadId, true);

    try {
      console.log(`[v0] Starting video upload: ${uploadId}`);

      let finalUri = videoUri;

      // Compress if requested
      if (options.compress !== false) {
        console.log('[v0] Compressing video...');
        finalUri = await videoCompressionManager.compressVideo(videoUri, {
          quality: options.compressionQuality || 0.8,
        });
      }

      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(finalUri);
      if (!fileInfo.exists) {
        throw new Error('Video file not found');
      }

      console.log(`[v0] Video file size: ${fileInfo.size} bytes`);

      // Create FormData
      const formData = new FormData();
      formData.append('file', {
        uri: finalUri,
        type: 'video/mp4',
        name: `video_${uploadId}.mp4`,
      } as any);
      formData.append('title', options.title);
      formData.append('description', options.description || '');
      formData.append('category', options.category);
      formData.append('isPublic', options.isPublic.toString());
      formData.append('tags', JSON.stringify(options.tags));

      // Upload with progress tracking
      const response = await this.uploadWithProgress(
        '/videos/upload',
        formData,
        fileInfo.size || 0,
        options.onProgress
      );

      console.log('[v0] Video uploaded successfully:', response.videoId);

      // Cache the video
      await videoCacheManager.cacheVideo(
        response.videoId,
        finalUri,
        finalUri,
        fileInfo.size || 0,
        0 // Duration would be calculated
      );

      return response;
    } catch (error) {
      console.error(`[v0] Upload error (${uploadId}):`, error);
      throw error;
    } finally {
      this.uploadQueue.delete(uploadId);
    }
  }

  private async uploadWithProgress(
    endpoint: string,
    formData: FormData,
    totalSize: number,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<{ videoId: string; url: string }> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress: UploadProgress = {
              loaded: event.loaded,
              total: event.total,
              percentage: Math.round((event.loaded / event.total) * 100),
            };
            onProgress(progress);
            console.log(`[v0] Upload progress: ${progress.percentage}%`);
          }
        });
      }

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            reject(new Error('Invalid response format'));
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload network error'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload cancelled'));
      });

      xhr.open('POST', `${process.env.EXPO_PUBLIC_API_URL}${endpoint}`);
      
      // Add auth token if available
      const token = localStorage.getItem('auth_token');
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      xhr.send(formData);
    });
  }

  async retryUpload(videoUri: string, options: UploadOptions, maxRetries = 3): Promise<any> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[v0] Upload attempt ${attempt}/${maxRetries}`);
        return await this.uploadVideo(videoUri, options);
      } catch (error) {
        lastError = error as Error;
        const backoffMs = Math.pow(2, attempt - 1) * 1000; // Exponential backoff
        console.log(`[v0] Retry in ${backoffMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }

    throw lastError || new Error('Upload failed after all retries');
  }

  async cancelUpload(uploadId: string): Promise<void> {
    this.uploadQueue.delete(uploadId);
    console.log(`[v0] Upload cancelled: ${uploadId}`);
  }

  getActiveUploads(): string[] {
    return Array.from(this.uploadQueue.keys());
  }

  isUploading(): boolean {
    return this.uploadQueue.size > 0;
  }
}

export const videoUploadService = VideoUploadService.getInstance();
