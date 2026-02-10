import { api } from '@/utils';
import { LoginInput, RegisterInput } from '@/utils/validation';

export const authService = {
  async login(credentials: LoginInput) {
    const { data } = await api.post('/auth/login', credentials);
    return data;
  },

  async register(formData: RegisterInput) {
    const { data } = await api.post('/auth/register', formData);
    return data;
  },

  async logout() {
    await api.post('/auth/logout');
  },

  async refreshToken(refreshToken: string) {
    const { data } = await api.post('/auth/refresh', { refreshToken });
    return data;
  },

  async resendVerification(email: string) {
    await api.post('/auth/resend-verification', { email });
  },

  async verifyEmail(token: string) {
    const { data } = await api.post('/auth/verify-email', { token });
    return data;
  },

  async requestPasswordReset(email: string) {
    await api.post('/auth/forgot-password', { email });
  },

  async resetPassword(token: string, newPassword: string) {
    const { data } = await api.post('/auth/reset-password', { token, newPassword });
    return data;
  },

  async changePassword(oldPassword: string, newPassword: string) {
    await api.post('/auth/change-password', { oldPassword, newPassword });
  },

  async loginWithGoogle(idToken: string) {
    const { data } = await api.post('/auth/google', { idToken });
    return data;
  },

  async loginWithFacebook(accessToken: string) {
    const { data } = await api.post('/auth/facebook', { accessToken });
    return data;
  },

  async getTwoFactorStatus() {
    const { data } = await api.get('/auth/2fa/status');
    return data;
  },

  async setupTwoFactor() {
    const { data } = await api.post('/auth/2fa/setup');
    return data;
  },

  async verifyTwoFactor(code: string) {
    const { data } = await api.post('/auth/2fa/verify', { code });
    return data;
  },
};
