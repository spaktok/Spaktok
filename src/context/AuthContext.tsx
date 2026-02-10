import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuthStore } from '@/store';
import { authService } from '@/services';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, hydrateAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      await hydrateAuth();
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const updateUserProfile = async (updates: Partial<User>) => {
    // Implementation will be added with user service
  };

  const refreshUserData = async () => {
    // Implementation will be added with user service
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    updateUserProfile,
    refreshUserData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
}
