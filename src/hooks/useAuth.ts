import { useCallback, useState } from 'react';
import { useAuthStore } from '@/store';
import { authService } from '@/services';
import { LoginInput, RegisterInput } from '@/utils/validation';
import { handleApiError } from '@/utils';

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated, login, logout, setToken } = useAuthStore();

  const loginUser = useCallback(
    async (credentials: LoginInput) => {
      setLoading(true);
      setError(null);
      try {
        const response = await authService.login(credentials);
        await login(response.user, response.token, response.refreshToken);
        return { success: true };
      } catch (err) {
        const errorMessage = handleApiError(err);
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [login]
  );

  const registerUser = useCallback(
    async (formData: RegisterInput) => {
      setLoading(true);
      setError(null);
      try {
        const response = await authService.register(formData);
        await login(response.user, response.token, response.refreshToken);
        return { success: true };
      } catch (err) {
        const errorMessage = handleApiError(err);
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [login]
  );

  const logoutUser = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await authService.logout();
      await logout();
      return { success: true };
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [logout]);

  const resetPassword = useCallback(
    async (email: string) => {
      setLoading(true);
      setError(null);
      try {
        await authService.requestPasswordReset(email);
        return { success: true };
      } catch (err) {
        const errorMessage = handleApiError(err);
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const changePassword = useCallback(
    async (oldPassword: string, newPassword: string) => {
      setLoading(true);
      setError(null);
      try {
        await authService.changePassword(oldPassword, newPassword);
        return { success: true };
      } catch (err) {
        const errorMessage = handleApiError(err);
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    user,
    isAuthenticated,
    loading,
    error,
    clearError,
    loginUser,
    registerUser,
    logoutUser,
    resetPassword,
    changePassword,
  };
}
