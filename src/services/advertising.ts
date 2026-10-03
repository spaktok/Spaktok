import { api } from '@/utils';
import {
  Ad,
  AdCampaign,
  CampaignAnalytics,
  SponsoredContent,
  AdNetwork,
  AdPreference,
  CreatorAds,
  AdRevenue,
} from '@/types/advertising';

export const advertisingService = {
  // Ad Campaigns (for advertisers)
  async createCampaign(campaignData: any): Promise<AdCampaign> {
    const response = await api.post<AdCampaign>('/advertising/campaigns', campaignData);
    return response.data;
  },

  async getCampaigns(status?: string, limit = 50, offset = 0): Promise<AdCampaign[]> {
    const response = await api.get<AdCampaign[]>('/advertising/campaigns', {
      params: { status, limit, offset },
    });
    return response.data;
  },

  async getCampaign(campaignId: string): Promise<AdCampaign> {
    const response = await api.get<AdCampaign>(`/advertising/campaigns/${campaignId}`);
    return response.data;
  },

  async updateCampaign(campaignId: string, updates: any): Promise<AdCampaign> {
    const response = await api.put<AdCampaign>(`/advertising/campaigns/${campaignId}`, updates);
    return response.data;
  },

  async pauseCampaign(campaignId: string): Promise<void> {
    await api.post(`/advertising/campaigns/${campaignId}/pause`);
  },

  async resumeCampaign(campaignId: string): Promise<void> {
    await api.post(`/advertising/campaigns/${campaignId}/resume`);
  },

  async endCampaign(campaignId: string): Promise<void> {
    await api.post(`/advertising/campaigns/${campaignId}/end`);
  },

  async deleteCampaign(campaignId: string): Promise<void> {
    await api.delete(`/advertising/campaigns/${campaignId}`);
  },

  // Ads
  async createAd(adData: any): Promise<Ad> {
    const response = await api.post<Ad>('/advertising/ads', adData);
    return response.data;
  },

  async getAds(campaignId: string, limit = 50): Promise<Ad[]> {
    const response = await api.get<Ad[]>(`/advertising/campaigns/${campaignId}/ads`, {
      params: { limit },
    });
    return response.data;
  },

  async updateAd(adId: string, updates: any): Promise<Ad> {
    const response = await api.put<Ad>(`/advertising/ads/${adId}`, updates);
    return response.data;
  },

  async deleteAd(adId: string): Promise<void> {
    await api.delete(`/advertising/ads/${adId}`);
  },

  // Campaign Analytics
  async getCampaignAnalytics(campaignId: string): Promise<CampaignAnalytics> {
    const response = await api.get<CampaignAnalytics>(`/advertising/campaigns/${campaignId}/analytics`);
    return response.data;
  },

  async getAdAnalytics(adId: string): Promise<any> {
    const response = await api.get(`/advertising/ads/${adId}/analytics`);
    return response.data;
  },

  async getCampaignReports(campaignId: string, period: string): Promise<any> {
    const response = await api.get(`/advertising/campaigns/${campaignId}/reports`, {
      params: { period },
    });
    return response.data;
  },

  // Ad Management
  async publishCampaign(campaignId: string): Promise<void> {
    await api.post(`/advertising/campaigns/${campaignId}/publish`);
  },

  async duplicateCampaign(campaignId: string, name: string): Promise<AdCampaign> {
    const response = await api.post<AdCampaign>(
      `/advertising/campaigns/${campaignId}/duplicate`,
      { name }
    );
    return response.data;
  },

  // Sponsored Content (for creators)
  async getSponsorshipOpportunities(): Promise<SponsoredContent[]> {
    const response = await api.get<SponsoredContent[]>('/advertising/opportunities');
    return response.data;
  },

  async acceptSponsorshipOffer(offerId: string): Promise<void> {
    await api.post(`/advertising/opportunities/${offerId}/accept`);
  },

  async rejectSponsorshipOffer(offerId: string, reason?: string): Promise<void> {
    await api.post(`/advertising/opportunities/${offerId}/reject`, { reason });
  },

  async submitSponsoredContent(contentId: string, sponsorshipId: string): Promise<void> {
    await api.post(`/advertising/sponsored/${sponsorshipId}/submit`, { contentId });
  },

  // Creator Ad Settings
  async getCreatorAdSettings(): Promise<CreatorAds> {
    const response = await api.get<CreatorAds>('/advertising/creator/settings');
    return response.data;
  },

  async updateCreatorAdSettings(settings: Partial<CreatorAds>): Promise<CreatorAds> {
    const response = await api.put<CreatorAds>('/advertising/creator/settings', settings);
    return response.data;
  },

  async enableAdMonetization(): Promise<void> {
    await api.post('/advertising/creator/enable-monetization');
  },

  async disableAdMonetization(): Promise<void> {
    await api.post('/advertising/creator/disable-monetization');
  },

  // Creator Revenue
  async getCreatorRevenue(month?: string): Promise<AdRevenue[]> {
    const response = await api.get<AdRevenue[]>('/advertising/creator/revenue', {
      params: { month },
    });
    return response.data;
  },

  async getCreatorEarnings(): Promise<any> {
    const response = await api.get('/advertising/creator/earnings');
    return response.data;
  },

  async requestCreatorPayout(amount: number, method: string): Promise<any> {
    const response = await api.post('/advertising/creator/payout', { amount, method });
    return response.data;
  },

  // Ad Networks
  async connectAdNetwork(network: string, credentials: any): Promise<AdNetwork> {
    const response = await api.post<AdNetwork>('/advertising/networks/connect', {
      network,
      credentials,
    });
    return response.data;
  },

  async getAdNetworks(): Promise<AdNetwork[]> {
    const response = await api.get<AdNetwork[]>('/advertising/networks');
    return response.data;
  },

  async disconnectAdNetwork(networkId: string): Promise<void> {
    await api.delete(`/advertising/networks/${networkId}`);
  },

  // User Ad Preferences
  async getAdPreferences(): Promise<AdPreference> {
    const response = await api.get<AdPreference>('/advertising/preferences');
    return response.data;
  },

  async updateAdPreferences(preferences: Partial<AdPreference>): Promise<AdPreference> {
    const response = await api.put<AdPreference>('/advertising/preferences', preferences);
    return response.data;
  },

  async blockAdvertiser(advertiserId: string): Promise<void> {
    await api.post(`/advertising/block/${advertiserId}`);
  },

  async unblockAdvertiser(advertiserId: string): Promise<void> {
    await api.post(`/advertising/unblock/${advertiserId}`);
  },

  // Ad Serving
  async getAdsForPlacement(
    placement: string,
    limit = 5,
    contextData?: any
  ): Promise<Ad[]> {
    const response = await api.get<Ad[]>('/advertising/serve', {
      params: { placement, limit, context: contextData },
    });
    return response.data;
  },

  async trackAdImpression(adId: string, placementId: string): Promise<void> {
    await api.post('/advertising/track/impression', { adId, placementId });
  },

  async trackAdClick(adId: string): Promise<void> {
    await api.post('/advertising/track/click', { adId });
  },

  async trackAdConversion(adId: string, value?: number): Promise<void> {
    await api.post('/advertising/track/conversion', { adId, value });
  },

  // Bidding & Pricing
  async getAvailableInventory(placement: string, startDate: string, endDate: string): Promise<any> {
    const response = await api.get('/advertising/inventory', {
      params: { placement, startDate, endDate },
    });
    return response.data;
  },

  async getRecommendedBid(targetingRules: any): Promise<number> {
    const response = await api.post<{ recommendedBid: number }>(
      '/advertising/bid-recommendation',
      { targetingRules }
    );
    return response.data.recommendedBid;
  },

  // Ad Review & Compliance
  async getAdPolicies(): Promise<any> {
    const response = await api.get('/advertising/policies');
    return response.data;
  },

  async checkAdCompliance(adData: any): Promise<any> {
    const response = await api.post('/advertising/check-compliance', adData);
    return response.data;
  },

  // Global Ad Stats
  async getAdStats(period: 'day' | 'week' | 'month'): Promise<any> {
    const response = await api.get('/advertising/stats', {
      params: { period },
    });
    return response.data;
  },

  // Fraud Detection
  async reportAdFraud(adId: string, reason: string): Promise<void> {
    await api.post(`/advertising/fraud/report/${adId}`, { reason });
  },
};
