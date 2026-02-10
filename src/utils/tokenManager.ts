import { SecureStorage, STORAGE_KEYS } from './storage';
import jwtDecode from 'jwt-decode';

export interface TokenPayload {
  sub: string;
  email: string;
  username: string;
  iat: number;
  exp: number;
}

export class TokenManager {
  private static instance: TokenManager;

  private constructor() {}

  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  async setToken(token: string): Promise<void> {
    await SecureStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  }

  async getToken(): Promise<string | null> {
    return await SecureStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  async setRefreshToken(token: string): Promise<void> {
    await SecureStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
  }

  async getRefreshToken(): Promise<string | null> {
    return await SecureStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  async clearTokens(): Promise<void> {
    await SecureStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    await SecureStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  isTokenExpired(token: string): boolean {
    try {
      const decoded = jwtDecode<TokenPayload>(token);
      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  getTokenExpiration(token: string): Date | null {
    try {
      const decoded = jwtDecode<TokenPayload>(token);
      return new Date(decoded.exp * 1000);
    } catch (error) {
      return null;
    }
  }

  getTokenData(token: string): TokenPayload | null {
    try {
      return jwtDecode<TokenPayload>(token);
    } catch (error) {
      return null;
    }
  }

  getTimeUntilExpiration(token: string): number {
    try {
      const decoded = jwtDecode<TokenPayload>(token);
      const currentTime = Math.floor(Date.now() / 1000);
      return Math.max(0, decoded.exp - currentTime);
    } catch (error) {
      return 0;
    }
  }

  async isValidToken(): Promise<boolean> {
    const token = await this.getToken();
    if (!token) return false;
    return !this.isTokenExpired(token);
  }
}

export const tokenManager = TokenManager.getInstance();
