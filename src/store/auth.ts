import { create } from 'zustand';
import { User, AuthState } from '@/types';
import { SecureStorage, LocalStorage, STORAGE_KEYS } from '@/utils';

interface AuthStore extends AuthState {
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setRefreshToken: (token: string | null) => void;
  logout: () => Promise<void>;
  login: (user: User, token: string, refreshToken: string) => Promise<void>;
  hydrateAuth: () => Promise<void>;
  isLoading: boolean;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => {
    set({ user });
    if (user) {
      LocalStorage.setItem(STORAGE_KEYS.USER, user);
    } else {
      LocalStorage.removeItem(STORAGE_KEYS.USER);
    }
  },

  setToken: async (token) => {
    set({ token });
    if (token) {
      await SecureStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    } else {
      await SecureStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    }
  },

  setRefreshToken: async (token) => {
    set({ refreshToken: token });
    if (token) {
      await SecureStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
    } else {
      await SecureStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    }
  },

  login: async (user, token, refreshToken) => {
    set({ user, token, refreshToken, isAuthenticated: true });
    await LocalStorage.setItem(STORAGE_KEYS.USER, user);
    await SecureStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    await SecureStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  },

  logout: async () => {
    set({ user: null, token: null, refreshToken: null, isAuthenticated: false });
    await LocalStorage.removeItem(STORAGE_KEYS.USER);
    await SecureStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    await SecureStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  },

  hydrateAuth: async () => {
    try {
      const [user, token] = await Promise.all([
        LocalStorage.getItem<User>(STORAGE_KEYS.USER),
        SecureStorage.getItem(STORAGE_KEYS.AUTH_TOKEN),
      ]);

      if (user && token) {
        set({ user, token, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Error hydrating auth:', error);
      set({ isLoading: false });
    }
  },
}));
