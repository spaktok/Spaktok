export type ReportReason = 'harassment' | 'spam' | 'inappropriate_content' | 'hate_speech' | 'violence' | 'copyright' | 'misinformation' | 'self_harm' | 'sexual_content' | 'other';
export type ModerationAction = 'warning' | 'content_removal' | 'account_restriction' | 'temporary_ban' | 'permanent_ban';
export type ContentStatus = 'approved' | 'under_review' | 'rejected' | 'removed';

export interface ContentReport {
  id: string;
  reporterId: string;
  contentType: 'video' | 'comment' | 'message' | 'profile' | 'live_stream';
  contentId: string;
  creatorId: string;
  reason: ReportReason;
  description?: string;
  screenshots?: string[];
  status: ContentStatus;
  moderatorNotes?: string;
  actionTaken?: ModerationAction;
  actionReason?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface ModerationLog {
  id: string;
  userId: string;
  action: ModerationAction;
  reason: string;
  contentId?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  duration?: number; // Duration in hours for temporary bans
  notes?: string;
  appealable: boolean;
  createdAt: string;
}

export interface ContentFilter {
  id: string;
  type: 'keyword' | 'pattern' | 'image' | 'audio';
  pattern: string;
  action: 'warn' | 'remove' | 'hide' | 'flag_for_review';
  severity: 'low' | 'medium' | 'high';
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Ban {
  id: string;
  userId: string;
  reason: string;
  type: 'temporary' | 'permanent';
  duration?: number; // in hours for temporary
  startDate: string;
  endDate?: string;
  appealable: boolean;
  appealedAt?: string;
  appealStatus?: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface BanAppeal {
  id: string;
  banId: string;
  userId: string;
  reason: string;
  evidence?: string[];
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewNotes?: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface PrivacyViolation {
  id: string;
  userId: string;
  type: 'unauthorized_sharing' | 'screenshot' | 'recording' | 'data_breach';
  description: string;
  reportedAt: string;
  actionTaken?: string;
}

export interface SuspiciousActivity {
  id: string;
  userId: string;
  type: 'unusual_login' | 'brute_force' | 'credential_stuffing' | 'abnormal_behavior';
  ipAddress?: string;
  deviceInfo?: string;
  description: string;
  flaggedAt: string;
  status: 'pending' | 'investigated' | 'cleared' | 'action_taken';
}

export interface ContentModerationStats {
  totalReports: number;
  pendingReports: number;
  resolvedReports: number;
  averageResolutionTime: number; // in hours
  contentRemoved: number;
  usersWarned: number;
  accountsSuspended: number;
  accountsBanned: number;
}

export interface CommunityGuidelines {
  id: string;
  version: string;
  sections: GuidelineSection[];
  lastUpdated: string;
  language: string;
}

export interface GuidelineSection {
  id: string;
  title: string;
  description: string;
  examples: string[];
  consequences: string[];
}

export interface AgeGate {
  id: string;
  contentId: string;
  minimumAge: number;
  reason: string;
  createdAt: string;
}

export interface ContentWarning {
  id: string;
  contentId: string;
  warningType: 'violence' | 'gore' | 'self_harm' | 'epilepsy' | 'sexual_content' | 'profanity' | 'spoiler';
  description?: string;
  createdAt: string;
}

export interface ModerationQueue {
  id: string;
  contentId: string;
  contentType: string;
  reason: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  addedAt: string;
  assignedTo?: string;
  status: 'pending' | 'in_progress' | 'resolved';
}

export interface BlockedWord {
  id: string;
  word: string;
  severity: 'low' | 'medium' | 'high';
  action: 'auto_remove' | 'flag' | 'require_approval';
  category: string;
  active: boolean;
}

export interface TrustScore {
  id: string;
  userId: string;
  score: number; // 0-100
  factors: {
    accountAge: number;
    reportHistory: number;
    violationHistory: number;
    communityEngagement: number;
    verificationStatus: number;
  };
  lastUpdated: string;
}

export interface SafetyAlert {
  id: string;
  userId: string;
  type: 'suspicious_login' | 'unauthorized_access' | 'content_policy_violation' | 'account_compromised';
  message: string;
  severity: 'info' | 'warning' | 'critical';
  actionRequired: boolean;
  actionUrl?: string;
  createdAt: string;
  acknowledgedAt?: string;
}

export interface ContentPolicy {
  id: string;
  policyName: string;
  description: string;
  affectedContentTypes: string[];
  violations: string[];
  consequences: ModerationAction[];
  active: boolean;
  version: string;
  createdAt: string;
  updatedAt: string;
}
