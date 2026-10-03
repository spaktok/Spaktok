export type AdFormat = 'banner' | 'interstitial' | 'rewarded' | 'native' | 'video' | 'sponsored_content';
export type AdPlacement = 'feed' | 'reels' | 'stories' | 'live' | 'search' | 'profile';
export type AdStatus = 'pending' | 'approved' | 'running' | 'paused' | 'ended' | 'rejected';
export type TargetingType = 'age' | 'gender' | 'location' | 'interests' | 'behavior' | 'device';

export interface Ad {
  id: string;
  advertiserId: string;
  campaignId: string;
  title: string;
  description?: string;
  format: AdFormat;
  creativeUrl: string;
  landingUrl: string;
  placement: AdPlacement[];
  status: AdStatus;
  budget: number;
  spentAmount: number;
  startDate: string;
  endDate: string;
  dailyBudget?: number;
  bidAmount: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number; // Click-through rate
  cpc: number; // Cost per click
  cpm: number; // Cost per mille (thousand impressions)
  targetingRules: TargetingRule[];
  createdAt: string;
  updatedAt: string;
}

export interface AdCampaign {
  id: string;
  advertiserId: string;
  name: string;
  description?: string;
  status: AdStatus;
  totalBudget: number;
  spentAmount: number;
  startDate: string;
  endDate: string;
  ads: Ad[];
  targetAudience: TargetAudience;
  analytics: CampaignAnalytics;
  createdAt: string;
  updatedAt: string;
}

export interface TargetingRule {
  type: TargetingType;
  value: string | number | string[];
  operator?: 'equals' | 'contains' | 'between' | 'greater_than' | 'less_than';
}

export interface TargetAudience {
  ageRange: [number, number];
  genders: string[];
  locations: string[];
  interests: string[];
  devices: string[];
  languages: string[];
  customAudience?: string[];
}

export interface CampaignAnalytics {
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  conversionRate: number;
  cpc: number;
  cpm: number;
  roas: number; // Return on ad spend
  dailyStats: DailyAdStats[];
}

export interface DailyAdStats {
  date: string;
  impressions: number;
  clicks: number;
  conversions: number;
  cost: number;
  revenue?: number;
}

export interface AdInventory {
  id: string;
  placement: AdPlacement;
  capacity: number;
  available: number;
  pricePerMille: number;
  durationSeconds: number;
  format: AdFormat[];
  createdAt: string;
}

export interface SponsoredContent {
  id: string;
  creatorId: string;
  advertiserId: string;
  contentId: string;
  contentType: string;
  compensation: number;
  compensationType: 'fixed' | 'revenue_share' | 'product';
  approvalStatus: 'pending' | 'approved' | 'rejected';
  performanceBonus?: number;
  minViews?: number;
  createdAt: string;
}

export interface AdNetwork {
  id: string;
  name: string;
  type: 'adsense' | 'mediavine' | 'adthrive' | 'native' | 'custom';
  status: 'connected' | 'pending' | 'disconnected';
  earnings: number;
  revenue: number;
  connectedAt?: string;
  disconnectedAt?: string;
}

export interface AdPreference {
  userId: string;
  blockedAdvertisers: string[];
  blockedCategories: string[];
  interestBased: boolean;
  personalized: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatorAds {
  id: string;
  creatorId: string;
  placement: AdPlacement;
  monetizationEnabled: boolean;
  sharePercentage: number;
  minimumViews: number;
  preferredAdFormats: AdFormat[];
  blockedAdvertisers: string[];
  blockedCategories: string[];
  earningsThisMonth: number;
  totalEarnings: number;
  nextPayoutDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdRevenue {
  id: string;
  creatorId: string;
  month: string;
  impressions: number;
  clicks: number;
  rpm: number; // Revenue per mille
  totalRevenue: number;
  platformShare: number;
  creatorShare: number;
  pendingPayment: number;
  status: 'pending' | 'paid';
  paidAt?: string;
}

export interface VideoAd {
  id: string;
  advertiserId: string;
  title: string;
  duration: number; // seconds
  videoUrl: string;
  thumbnailUrl: string;
  landingUrl: string;
  callToAction: string;
  budget: number;
  bidAmount: number;
  targetingRules: TargetingRule[];
  status: AdStatus;
  createdAt: string;
}

export interface NativeAd {
  id: string;
  advertiserId: string;
  headline: string;
  description: string;
  imageUrl: string;
  iconUrl: string;
  callToAction: string;
  landingUrl: string;
  rating?: number;
  downloads?: string;
  price?: string;
  createdAt: string;
}

export interface AdReview {
  id: string;
  adId: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy: string;
  reason?: string;
  reviewedAt?: string;
  escalatedAt?: string;
}

export interface AdPolicies {
  id: string;
  version: string;
  categories: Record<string, string[]>;
  prohibitedContent: string[];

  prohibitedClaims: string[];
  guidanceLinks: Record<string, string>;
  lastUpdated: string;
}
