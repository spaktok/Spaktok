import { tokenManager } from './tokenManager';
import { secureStorage } from './secureStorage';
import { api } from './api';

interface SessionConfig {
  refreshThreshold: number; // milliseconds before expiration to refresh
  maxRetries: number;
  retryDelay: number; // milliseconds
}

const DEFAULT_CONFIG: SessionConfig = {
  refreshThreshold: 5 * 60 * 1000, // 5 minutes before expiration
  maxRetries: 3,
  retryDelay: 1000,
};

class SessionManager {
  private static instance: SessionManager;
  private config: SessionConfig;
  private refreshTimer: NodeJS.Timer | null = null;

  private constructor(config: Partial<SessionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  static getInstance(config?: Partial<SessionConfig>): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager(config);
    }
    return SessionManager.instance;
  }

  async initializeSession(): Promise<void> {
    const credentials = await secureStorage.getAuthCredentials();
    if (credentials.token) {
      this.scheduleTokenRefresh();
    }
  }

  private scheduleTokenRefresh(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    const token = tokenManager.getToken?.();
    if (!token) return;

    const timeUntilExpiration = tokenManager.getTimeUntilExpiration(token);
    const refreshTime = Math.max(0, timeUntilExpiration - this.config.refreshThreshold);

    this.refreshTimer = setTimeout(() => {
      this.refreshToken();
    }, refreshTime);
  }

  async refreshToken(): Promise<boolean> {
    let retryCount = 0;

    while (retryCount < this.config.maxRetries) {
      try {
        const refreshToken = await secureStorage.getItem('REFRESH_TOKEN');
        if (!refreshToken) {
          return false;
        }

        // Call refresh endpoint
        const response = await api.post('/auth/refresh', { refreshToken });
        
        if (response.data?.token) {
          await secureStorage.setItem('AUTH_TOKEN', response.data.token);
          api.setAuthToken(response.data.token);
          this.scheduleTokenRefresh();
          return true;
        }

        return false;
      } catch (error) {
        retryCount++;
        if (retryCount < this.config.maxRetries) {
          await new Promise((resolve) =>
            setTimeout(resolve, this.config.retryDelay * retryCount)
          );
        }
      }
    }

    // Refresh failed after retries
    await this.logout();
    return false;
  }

  async logout(): Promise<void> {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }
    await secureStorage.clearAuthCredentials();
    api.clearAuthToken();
  }

  async isSessionValid(): Promise<boolean> {
    const { token } = await secureStorage.getAuthCredentials();
    if (!token) return false;
    return !tokenManager.isTokenExpired(token);
  }

  getSessionDuration(): number {
    const token = tokenManager.getToken?.();
    if (!token) return 0;
    return tokenManager.getTimeUntilExpiration(token);
  }
}

export const sessionManager = SessionManager.getInstance();
