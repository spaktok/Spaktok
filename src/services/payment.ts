import { api } from '@/utils';
import { Transaction, Gift } from '@/types';

export const paymentService = {
  // Gift system
  async getGifts() {
    const { data } = await api.get<Gift[]>('/gifts');
    return data;
  },

  async sendGift(userId: string, giftId: string, amount: number) {
    const { data } = await api.post<Transaction>('/gifts/send', {
      userId,
      giftId,
      amount,
    });
    return data;
  },

  async getGiftStats() {
    const { data } = await api.get('/gifts/stats');
    return data;
  },

  // Stripe payment
  async createStripePaymentIntent(amount: number, currency = 'USD') {
    const { data } = await api.post('/payments/stripe/intent', { amount, currency });
    return data;
  },

  async confirmStripePayment(paymentIntentId: string) {
    const { data } = await api.post('/payments/stripe/confirm', { paymentIntentId });
    return data;
  },

  // PayPal payment
  async createPayPalOrder(amount: number, currency = 'USD') {
    const { data } = await api.post('/payments/paypal/order', { amount, currency });
    return data;
  },

  async capturePayPalPayment(orderId: string) {
    const { data } = await api.post('/payments/paypal/capture', { orderId });
    return data;
  },

  // Wallet
  async getWalletBalance() {
    const { data } = await api.get<{ balance: number }>('/wallet/balance');
    return data;
  },

  async addFundsToWallet(amount: number, method: 'stripe' | 'paypal') {
    const { data } = await api.post('/wallet/add-funds', { amount, method });
    return data;
  },

  async getTransactionHistory(page = 1) {
    const { data } = await api.get<Transaction[]>(`/transactions?page=${page}`);
    return data;
  },

  async getEarnings() {
    const { data } = await api.get('/earnings');
    return data;
  },

  async withdrawEarnings(amount: number, method: 'bank' | 'paypal') {
    const { data } = await api.post('/earnings/withdraw', { amount, method });
    return data;
  },

  // Subscriptions
  async getSubscriptionPlans() {
    const { data } = await api.get('/subscriptions/plans');
    return data;
  },

  async subscribeToCreator(creatorId: string, planId: string) {
    const { data } = await api.post(`/subscriptions/${creatorId}`, { planId });
    return data;
  },

  async cancelSubscription(creatorId: string) {
    await api.post(`/subscriptions/${creatorId}/cancel`);
  },

  async getSubscriptions() {
    const { data } = await api.get('/subscriptions');
    return data;
  },
};
