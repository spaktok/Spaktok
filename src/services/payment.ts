import { api } from '@/utils';
import {
  Payment,
  PaymentMethod,
  Wallet,
  WalletTransaction,
  Gift,
  GiftPurchase,
  Subscription,
  SubscriptionPlan,
  Invoice,
  Refund,
  Payout,
  CreditPackage,
  PaymentPromoCode,
  CreatePaymentInput,
  ProcessPaymentInput,
} from '@/types/payments';

export const paymentService = {
  // Wallet Management
  async getWallet(): Promise<Wallet> {
    const response = await api.get<Wallet>('/payments/wallet');
    return response.data;
  },

  async getWalletTransactions(limit = 50, offset = 0): Promise<WalletTransaction[]> {
    const response = await api.get<WalletTransaction[]>('/payments/wallet/transactions', {
      params: { limit, offset },
    });
    return response.data;
  },

  async rechargeWallet(amount: number, paymentMethodId: string): Promise<Payment> {
    const response = await api.post<Payment>('/payments/wallet/recharge', {
      amount,
      paymentMethodId,
    });
    return response.data;
  },

  async getWalletBalance(): Promise<number> {
    const wallet = await this.getWallet();
    return wallet.balance;
  },

  // Payment Methods
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    const response = await api.get<PaymentMethod[]>('/payments/methods');
    return response.data;
  },

  async addPaymentMethod(
    type: string,
    provider: string,
    token: string,
    isDefault = false
  ): Promise<PaymentMethod> {
    const response = await api.post<PaymentMethod>('/payments/methods', {
      type,
      provider,
      token,
      isDefault,
    });
    return response.data;
  },

  async updatePaymentMethod(methodId: string, updates: Partial<PaymentMethod>): Promise<PaymentMethod> {
    const response = await api.put<PaymentMethod>(`/payments/methods/${methodId}`, updates);
    return response.data;
  },

  async removePaymentMethod(methodId: string): Promise<void> {
    await api.delete(`/payments/methods/${methodId}`);
  },

  async setDefaultPaymentMethod(methodId: string): Promise<void> {
    await api.post(`/payments/methods/${methodId}/set-default`);
  },

  // Payments
  async createPayment(input: CreatePaymentInput): Promise<Payment> {
    const response = await api.post<Payment>('/payments', input);
    return response.data;
  },

  async processPayment(input: ProcessPaymentInput): Promise<Payment> {
    const response = await api.post<Payment>('/payments/process', input);
    return response.data;
  },

  async getPayment(paymentId: string): Promise<Payment> {
    const response = await api.get<Payment>(`/payments/${paymentId}`);
    return response.data;
  },

  async getPaymentHistory(limit = 50, offset = 0): Promise<Payment[]> {
    const response = await api.get<Payment[]>('/payments/history', {
      params: { limit, offset },
    });
    return response.data;
  },

  // Gifts
  async getGifts(): Promise<Gift[]> {
    const response = await api.get<Gift[]>('/payments/gifts');
    return response.data;
  },

  async getGift(giftId: string): Promise<Gift> {
    const response = await api.get<Gift>(`/payments/gifts/${giftId}`);
    return response.data;
  },

  async sendGift(
    giftId: string,
    recipientId: string,
    quantity = 1,
    message?: string,
    streamId?: string,
    videoId?: string,
    storyId?: string
  ): Promise<GiftPurchase> {
    const response = await api.post<GiftPurchase>('/payments/gifts/send', {
      giftId,
      recipientId,
      quantity,
      message,
      streamId,
      videoId,
      storyId,
    });
    return response.data;
  },

  async getGiftPurchaseHistory(limit = 50, offset = 0): Promise<GiftPurchase[]> {
    const response = await api.get<GiftPurchase[]>('/payments/gifts/history', {
      params: { limit, offset },
    });
    return response.data;
  },

  async getReceivedGifts(limit = 50, offset = 0): Promise<GiftPurchase[]> {
    const response = await api.get<GiftPurchase[]>('/payments/gifts/received', {
      params: { limit, offset },
    });
    return response.data;
  },

  // Subscriptions
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    const response = await api.get<SubscriptionPlan[]>('/payments/subscriptions/plans');
    return response.data;
  },

  async getSubscriptionPlan(planId: string): Promise<SubscriptionPlan> {
    const response = await api.get<SubscriptionPlan>(`/payments/subscriptions/plans/${planId}`);
    return response.data;
  },

  async subscribeToplan(planId: string, paymentMethodId: string): Promise<Subscription> {
    const response = await api.post<Subscription>('/payments/subscriptions', {
      planId,
      paymentMethodId,
    });
    return response.data;
  },

  async getCurrentSubscription(): Promise<Subscription | null> {
    try {
      const response = await api.get<Subscription>('/payments/subscriptions/current');
      return response.data;
    } catch {
      return null;
    }
  },

  async cancelSubscription(reason?: string): Promise<Subscription> {
    const response = await api.post<Subscription>('/payments/subscriptions/cancel', { reason });
    return response.data;
  },

  async resumeSubscription(): Promise<Subscription> {
    const response = await api.post<Subscription>('/payments/subscriptions/resume');
    return response.data;
  },

  async updateSubscription(planId: string): Promise<Subscription> {
    const response = await api.put<Subscription>('/payments/subscriptions', { planId });
    return response.data;
  },

  // Credit Packages
  async getCreditPackages(): Promise<CreditPackage[]> {
    const response = await api.get<CreditPackage[]>('/payments/credits/packages');
    return response.data;
  },

  async purchaseCreditPackage(packageId: string, paymentMethodId: string): Promise<Payment> {
    const response = await api.post<Payment>('/payments/credits/purchase', {
      packageId,
      paymentMethodId,
    });
    return response.data;
  },

  // Refunds
  async requestRefund(paymentId: string, reason: string): Promise<Refund> {
    const response = await api.post<Refund>('/payments/refunds', {
      paymentId,
      reason,
    });
    return response.data;
  },

  async getRefunds(): Promise<Refund[]> {
    const response = await api.get<Refund[]>('/payments/refunds');
    return response.data;
  },

  // Payouts
  async requestPayout(amount: number, method: string, bankDetails?: any): Promise<Payout> {
    const response = await api.post<Payout>('/payments/payouts/request', {
      amount,
      method,
      bankDetails,
    });
    return response.data;
  },

  async getPayoutHistory(limit = 50, offset = 0): Promise<Payout[]> {
    const response = await api.get<Payout[]>('/payments/payouts', {
      params: { limit, offset },
    });
    return response.data;
  },

  async getPayoutStats(): Promise<any> {
    const response = await api.get('/payments/payouts/stats');
    return response.data;
  },

  // Promo Codes
  async validatePromoCode(code: string, planId?: string): Promise<PaymentPromoCode | null> {
    try {
      const response = await api.post<PaymentPromoCode>('/payments/promo/validate', {
        code,
        planId,
      });
      return response.data;
    } catch {
      return null;
    }
  },

  async applyPromoCode(code: string, paymentId: string): Promise<Payment> {
    const response = await api.post<Payment>('/payments/promo/apply', {
      code,
      paymentId,
    });
    return response.data;
  },

  // Invoices
  async getInvoices(limit = 50, offset = 0): Promise<Invoice[]> {
    const response = await api.get<Invoice[]>('/payments/invoices', {
      params: { limit, offset },
    });
    return response.data;
  },

  async getInvoice(invoiceId: string): Promise<Invoice> {
    const response = await api.get<Invoice>(`/payments/invoices/${invoiceId}`);
    return response.data;
  },

  async downloadInvoice(invoiceId: string): Promise<Blob> {
    const response = await api.get(`/payments/invoices/${invoiceId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Revenue Analytics
  async getEarningsOverview(): Promise<any> {
    const response = await api.get('/payments/analytics/earnings');
    return response.data;
  },

  async getGiftAnalytics(): Promise<any> {
    const response = await api.get('/payments/analytics/gifts');
    return response.data;
  },

  async getSubscriptionAnalytics(): Promise<any> {
    const response = await api.get('/payments/analytics/subscriptions');
    return response.data;
  },

  // Tax Information
  async submitTaxForm(formData: any): Promise<void> {
    await api.post('/payments/tax-info', formData);
  },

  // Payment Security
  async verify3DSecure(paymentId: string, token: string): Promise<Payment> {
    const response = await api.post<Payment>('/payments/verify-3d-secure', {
      paymentId,
      token,
    });
    return response.data;
  },

  // Billing Address
  async updateBillingAddress(address: any): Promise<void> {
    await api.put('/payments/billing-address', address);
  },

  // Payment Disputes
  async reportPaymentDispute(paymentId: string, reason: string): Promise<any> {
    const response = await api.post('/payments/disputes', {
      paymentId,
      reason,
    });
    return response.data;
  },

  // Subscription Features
  async getSubscriptionFeatures(): Promise<any> {
    const response = await api.get('/payments/subscriptions/features');
    return response.data;
  },

  async checkFeatureAccess(featureName: string): Promise<boolean> {
    const response = await api.get<{ hasAccess: boolean }>(`/payments/features/${featureName}`);
    return response.data.hasAccess;
  },
};
