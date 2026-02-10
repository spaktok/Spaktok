import * as SecureStore from 'expo-secure-store';

export interface SecureStorageKeys {
  AUTH_TOKEN: string;
  REFRESH_TOKEN: string;
  USER_DATA: string;
  DEVICE_ID: string;
  ENCRYPTION_KEY: string;
}

const KEYS: SecureStorageKeys = {
  AUTH_TOKEN: 'spaktok_auth_token',
  REFRESH_TOKEN: 'spaktok_refresh_token',
  USER_DATA: 'spaktok_user_data',
  DEVICE_ID: 'spaktok_device_id',
  ENCRYPTION_KEY: 'spaktok_encryption_key',
};

class SecureStorageManager {
  private static instance: SecureStorageManager;

  private constructor() {}

  static getInstance(): SecureStorageManager {
    if (!SecureStorageManager.instance) {
      SecureStorageManager.instance = new SecureStorageManager();
    }
    return SecureStorageManager.instance;
  }

  async setItem(key: keyof SecureStorageKeys, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(KEYS[key], value);
    } catch (error) {
      console.error(`Error saving to secure storage (${key}):`, error);
      throw error;
    }
  }

  async getItem(key: keyof SecureStorageKeys): Promise<string | null> {
    try {
      const value = await SecureStore.getItemAsync(KEYS[key]);
      return value;
    } catch (error) {
      console.error(`Error reading from secure storage (${key}):`, error);
      return null;
    }
  }

  async removeItem(key: keyof SecureStorageKeys): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(KEYS[key]);
    } catch (error) {
      console.error(`Error deleting from secure storage (${key}):`, error);
    }
  }

  async setAuthCredentials(token: string, refreshToken: string): Promise<void> {
    try {
      await Promise.all([
        this.setItem('AUTH_TOKEN', token),
        this.setItem('REFRESH_TOKEN', refreshToken),
      ]);
    } catch (error) {
      console.error('Error setting auth credentials:', error);
      throw error;
    }
  }

  async getAuthCredentials(): Promise<{ token: string | null; refreshToken: string | null }> {
    try {
      const [token, refreshToken] = await Promise.all([
        this.getItem('AUTH_TOKEN'),
        this.getItem('REFRESH_TOKEN'),
      ]);
      return { token, refreshToken };
    } catch (error) {
      console.error('Error getting auth credentials:', error);
      return { token: null, refreshToken: null };
    }
  }

  async clearAuthCredentials(): Promise<void> {
    try {
      await Promise.all([
        this.removeItem('AUTH_TOKEN'),
        this.removeItem('REFRESH_TOKEN'),
      ]);
    } catch (error) {
      console.error('Error clearing auth credentials:', error);
    }
  }

  async clearAll(): Promise<void> {
    try {
      const allKeys = Object.keys(KEYS) as Array<keyof SecureStorageKeys>;
      await Promise.all(allKeys.map((key) => this.removeItem(key)));
    } catch (error) {
      console.error('Error clearing all secure storage:', error);
    }
  }
}

export const secureStorage = SecureStorageManager.getInstance();
