import AsyncStorage from '@react-native-async-storage/async-storage';

// Secure storage deprecated - use secureStorage from ./secureStorage instead
export const SecureStorage = {
  async setItem(key: string, value: string): Promise<void> {
    console.warn('Use secureStorage from ./secureStorage instead');
  },

  async getItem(key: string): Promise<string | null> {
    console.warn('Use secureStorage from ./secureStorage instead');
    return null;
  },

  async removeItem(key: string): Promise<void> {
    console.warn('Use secureStorage from ./secureStorage instead');
  },

  async clear(): Promise<void> {
    console.warn('Use secureStorage from ./secureStorage instead');
  },
};

// Regular async storage
export const LocalStorage = {
  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('AsyncStorage setItem error:', error);
    }
  },

  async getItem<T>(key: string): Promise<T | null> {
    try {
      const item = await AsyncStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('AsyncStorage getItem error:', error);
      return null;
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('AsyncStorage removeItem error:', error);
    }
  },

  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('AsyncStorage clear error:', error);
    }
  },

  async getAllKeys(): Promise<string[]> {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error('AsyncStorage getAllKeys error:', error);
      return [];
    }
  },
};

// Storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user_data',
  USER_PREFERENCES: 'user_preferences',
  CACHE_FEED: 'cache_feed',
  CACHE_VIDEOS: 'cache_videos',
  CACHE_USERS: 'cache_users',
  DRAFT_VIDEOS: 'draft_videos',
  DRAFT_STORIES: 'draft_stories',
  DEVICE_ID: 'device_id',
  LAST_SYNC: 'last_sync',
};
