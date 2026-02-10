export type PaymentProvider = 'stripe' | 'paypal' | 'wallet';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';
export type PaymentMethod = 'card' | 'paypal' | 'apple_pay' | 'google_pay' | 'wallet';
export type TransactionType = 'gift' | 'subscription' | 'recharge' | 'withdrawal' | 'refund' | 'bonus';

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  provider: PaymentProvider;
  method?: PaymentMethod;
  description?: string;
  transactionType: TransactionType;
  stripePaymentIntentId?: string;
  paypalOrderId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface PaymentMethod {
  id: string;
  userId: string;
  type: PaymentMethod;
  provider: PaymentProvider;
  isDefault: boolean;
  cardLast4?: string;
  cardExpiry?: string;
  cardBrand?: string;
  paypalEmail?: string;
  stripePaymentMethodId?: string;
  createdAt: string;
  expiresAt?: string;
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  lastRechargeDate?: string;
  totalSpent: number;
  totalEarned: number;
  createdAt: string;
  updatedAt: string;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  userId: string;
  type: 'debit' | 'credit';
  amount: number;
  balance: number;
  reason: string;
  relatedId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface Gift {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  price: number;
  currency: string;
  category: string;
  animationUrl?: string;
  requiresAudio?: boolean;
  displayRarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  createdAt: string;
  updatedAt: string;
}

export interface GiftPurchase {
  id: string;
  purchaserId: string;
  giftId: string;
  gift: Gift;
  recipientId: string;
  quantity: number;
  totalAmount: number;
  message?: string;
  streamId?: string;
  videoId?: string;
  storyId?: string;
  paymentId?: string;
  createdAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  type: 'premium' | 'pro' | 'elite';
  status: 'active' | 'cancelled' | 'expired' | 'suspended';
  planId: string;
  priceId: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelledAt?: string;
  reason?: string;
  autoRenew: boolean;
  stripeSubscriptionId?: string;
  paypalSubscriptionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly';
  features: string[];
  limits: {
    videoQuality: string;
    storageGB: number;
    monthlyUploads: number;
    liveStreamHours: number;
    customFilters: number;
  };
  stripePriceId?: string;
  paypalPlanId?: string;
  active: boolean;
  createdAt: string;
}

export interface Invoice {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'cancelled' | 'refunded';
  dueDate: string;
  issuedDate: string;
  paidDate?: string;
  description: string;
  items: InvoiceItem[];
  stripeInvoiceId?: string;
  paypalInvoiceId?: string;
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Refund {
  id: string;
  paymentId: string;
  amount: number;
  reason: string;
  status: 'pending' | 'completed' | 'failed';
  stripeRefundId?: string;
  paypalRefundId?: string;
  processedAt?: string;
  createdAt: string;
}

export interface Payout {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'in_transit' | 'completed' | 'failed';
  method: 'bank_transfer' | 'paypal' | 'stripe_payout';
  bankAccount?: {
    accountNumber: string;
    routingNumber: string;
    accountHolder: string;
  };
  stripPayoutId?: string;
  paypalPayoutId?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  bonus: number; // Bonus credits
  price: number;
  currency: string;
  discountPercentage?: number;
  bestValue?: boolean;
  stripePriceId?: string;
  active: boolean;
  createdAt: string;
}

export interface PaymentPromoCode {
  id: string;
  code: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxUsagePerUser: number;
  totalUsageLimit?: number;
  currentUsage: number;
  applicablePlans: string[];
  expiresAt: string;
  active: boolean;
  createdAt: string;
}

export interface PurchaseHistory {
  id: string;
  userId: string;
  type: 'gift' | 'subscription' | 'recharge' | 'filter';
  items: any[];
  totalAmount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  createdAt: string;
}

export interface CreatePaymentInput {
  amount: number;
  currency?: string;
  paymentMethod: PaymentMethod;
  description?: string;
  transactionType: TransactionType;
  metadata?: Record<string, any>;
}

export interface ProcessPaymentInput {
  paymentMethodId: string;
  amount: number;
  currency: string;
  description: string;
  paymentProvider: PaymentProvider;
  metadata?: Record<string, any>;
}

export interface PaymentWebhookEvent {
  id: string;
  type: string;
  provider: PaymentProvider;
  data: any;
  processed: boolean;
  processedAt?: string;
  createdAt: string;
}
