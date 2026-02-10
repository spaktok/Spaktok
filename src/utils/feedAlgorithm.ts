import { Video } from '@/types';

export interface FeedScore {
  videoId: string;
  score: number;
  factors: {
    engagement: number;
    recency: number;
    personalization: number;
    diversity: number;
  };
}

export interface UserPreferences {
  preferredCategories: string[];
  followedCreators: string[];
  watchHistory: string[];
  likedVideos: string[];
  engagementPattern: 'high' | 'medium' | 'low';
}

class FeedAlgorithm {
  private static instance: FeedAlgorithm;

  private constructor() {}

  static getInstance(): FeedAlgorithm {
    if (!FeedAlgorithm.instance) {
      FeedAlgorithm.instance = new FeedAlgorithm();
    }
    return FeedAlgorithm.instance;
  }

  /**
   * Rank videos based on multiple factors
   */
  rankVideos(
    videos: Video[],
    userPreferences: UserPreferences
  ): FeedScore[] {
    return videos
      .map((video) => ({
        videoId: video.id,
        score: this.calculateScore(video, userPreferences),
        factors: {
          engagement: this.calculateEngagement(video),
          recency: this.calculateRecency(video),
          personalization: this.calculatePersonalization(video, userPreferences),
          diversity: this.calculateDiversity(video),
        },
      }))
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Calculate engagement score (likes, comments, shares)
   */
  private calculateEngagement(video: Video): number {
    const totalInteractions = video.likes + video.comments + video.shares;
    const engagementRate = totalInteractions / (video.views || 1);
    return Math.min(100, engagementRate * 100);
  }

  /**
   * Calculate recency score (newer videos ranked higher)
   */
  private calculateRecency(video: Video): number {
    const hoursOld = (Date.now() - new Date(video.createdAt).getTime()) / (1000 * 60 * 60);
    // Half-life decay: score decreases by half every 24 hours
    const recencyScore = Math.exp(-Math.log(2) * (hoursOld / 24)) * 100;
    return Math.max(0, recencyScore);
  }

  /**
   * Calculate personalization score based on user preferences
   */
  private calculatePersonalization(
    video: Video,
    preferences: UserPreferences
  ): number {
    let score = 0;

    // Followed creator bonus
    if (preferences.followedCreators.includes(video.userId)) {
      score += 30;
    }

    // Category preference
    if (preferences.preferredCategories.some((cat) => video.tags.includes(cat))) {
      score += 20;
    }

    // Similar to watch history
    const similarTags = video.tags.filter((tag) =>
      preferences.watchHistory.some((watched) => watched.includes(tag))
    );
    score += Math.min(20, similarTags.length * 5);

    return Math.min(100, score);
  }

  /**
   * Calculate diversity score (avoid showing too many similar videos)
   */
  private calculateDiversity(video: Video): number {
    // This would typically check against recent feed
    // For now, return a base score
    return 50;
  }

  /**
   * Calculate overall score combining all factors with weights
   */
  private calculateScore(
    video: Video,
    preferences: UserPreferences
  ): number {
    const engagement = this.calculateEngagement(video);
    const recency = this.calculateRecency(video);
    const personalization = this.calculatePersonalization(video, preferences);
    const diversity = this.calculateDiversity(video);

    // Weights based on engagement pattern
    const weights = {
      high: { engagement: 0.4, recency: 0.2, personalization: 0.3, diversity: 0.1 },
      medium: { engagement: 0.3, recency: 0.25, personalization: 0.35, diversity: 0.1 },
      low: { engagement: 0.2, recency: 0.2, personalization: 0.5, diversity: 0.1 },
    };

    const w = weights[preferences.engagementPattern];
    const score =
      engagement * w.engagement +
      recency * w.recency +
      personalization * w.personalization +
      diversity * w.diversity;

    return score;
  }

  /**
   * Generate personalized feed
   */
  generateFeed(
    allVideos: Video[],
    preferences: UserPreferences,
    limit: number = 20
  ): Video[] {
    const scored = this.rankVideos(allVideos, preferences);
    const selectedIds = scored.slice(0, limit).map((s) => s.videoId);
    return allVideos.filter((v) => selectedIds.includes(v.id));
  }

  /**
   * Detect trending videos
   */
  getTrendingVideos(videos: Video[], timeWindowHours: number = 24): Video[] {
    const cutoffTime = Date.now() - timeWindowHours * 60 * 60 * 1000;

    return videos
      .filter((v) => new Date(v.createdAt).getTime() > cutoffTime)
      .sort((a, b) => {
        const engagementA = (a.likes + a.comments + a.shares) / (a.views || 1);
        const engagementB = (b.likes + b.comments + b.shares) / (b.views || 1);
        return engagementB - engagementA;
      });
  }

  /**
   * Recommend videos for specific user
   */
  getRecommendations(
    watchedVideos: Video[],
    allVideos: Video[],
    limit: number = 10
  ): Video[] {
    const watchedIds = new Set(watchedVideos.map((v) => v.id));
    const watchedTags = new Set(watchedVideos.flatMap((v) => v.tags));

    return allVideos
      .filter((v) => !watchedIds.has(v.id))
      .sort((a, b) => {
        const matchA = a.tags.filter((t) => watchedTags.has(t)).length;
        const matchB = b.tags.filter((t) => watchedTags.has(t)).length;
        return matchB - matchA;
      })
      .slice(0, limit);
  }
}

export const feedAlgorithm = FeedAlgorithm.getInstance();
