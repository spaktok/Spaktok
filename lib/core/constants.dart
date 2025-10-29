/// Application-wide constants
class AppConstants {
  // ─────────────────────────────── TIMING ───────────────────────────────
  static const Duration apiTimeout = Duration(seconds: 30);
  static const Duration debounceDelay = Duration(milliseconds: 500);
  static const Duration animationDuration = Duration(milliseconds: 300);
  static const Duration shortAnimationDuration = Duration(milliseconds: 150);

  // ─────────────────────────────── PAGINATION ───────────────────────────────
  static const int defaultPageSize = 20;
  static const int defaultLimit = 50;
  static const int maxLimit = 100;

  // ─────────────────────────────── VALIDATION ───────────────────────────────
  static const int minPasswordLength = 8;
  static const int maxPasswordLength = 128;
  static const int minUsernameLength = 3;
  static const int maxUsernameLength = 20;
  static const int minBioLength = 0;
  static const int maxBioLength = 500;
  static const int minMessageLength = 1;
  static const int maxMessageLength = 2000;

  // ─────────────────────────────── COIN SYSTEM ───────────────────────────────
  static const double giftSenderCommissionRate = 0.3; // 30% goes to platform
  static const double giftReceiverCommissionRate = 0.7; // 70% goes to receiver
  static const int minCoinTransfer = 1;
  static const int maxCoinTransfer = 1000000;

  // ─────────────────────────────── MEDIA ───────────────────────────────
  static const int maxImageSizeInMB = 10;
  static const int maxVideoSizeInMB = 100;
  static const int maxAudioSizeInMB = 50;
  static const List<String> allowedImageFormats = [
    'jpg',
    'jpeg',
    'png',
    'gif',
    'webp'
  ];
  static const List<String> allowedVideoFormats = ['mp4', 'avi', 'mov', 'mkv'];
  static const List<String> allowedAudioFormats = ['mp3', 'wav', 'aac', 'm4a'];

  // ─────────────────────────────── CACHE ───────────────────────────────
  static const Duration cacheExpiration = Duration(hours: 24);
  static const Duration shortCacheExpiration = Duration(minutes: 5);
  static const Duration longCacheExpiration = Duration(days: 7);

  // ─────────────────────────────── RETRY ───────────────────────────────
  static const int maxRetryAttempts = 3;
  static const Duration initialRetryDelay = Duration(milliseconds: 100);

  // ─────────────────────────────── AGORA ───────────────────────────────
  static const int agoraTokenExpirationSeconds = 3600; // 1 hour
  static const int agortokenRefreshThresholdSeconds =
      300; // 5 minutes before expiry

  // ─────────────────────────────── STRIPE ───────────────────────────────
  static const int stripeFeePercentage = 2; // 2.9% + $0.30 per transaction

  // ─────────────────────────────── RATE LIMITING ───────────────────────────────
  static const int maxMessagesPerMinute = 60;
  static const int maxPostsPerDay = 100;
  static const int maxFollowRequestsPerDay = 50;

  // ─────────────────────────────── STORAGE PATHS ───────────────────────────────
  static const String profilePhotosPath = 'profile_photos';
  static const String postMediaPath = 'posts';
  static const String storyMediaPath = 'stories';
  static const String chatMediaPath = 'chat_media';
  static const String videoCallRecordingsPath = 'video_calls';
  static const String liveStreamRecordingsPath = 'live_streams';

  // ─────────────────────────────── COLLECTION NAMES ───────────────────────────────
  static const String usersCollection = 'users';
  static const String postsCollection = 'posts';
  static const String commentsCollection = 'comments';
  static const String storiesCollection = 'stories';
  static const String conversationsCollection = 'conversations';
  static const String messagesCollection = 'messages';
  static const String giftsCollection = 'gifts';
  static const String transactionsCollection = 'transactions';
  static const String followsCollection = 'follows';
  static const String likesCollection = 'likes';
  static const String notificationsCollection = 'notifications';
  static const String purchasesCollection = 'purchases';
  static const String payoutRequestsCollection = 'payoutRequests';
  static const String reportsCollection = 'reports';
  static const String bannedUsersCollection = 'bannedUsers';

  // ─────────────────────────────── API ENDPOINTS ───────────────────────────────
  static const String baseApiUrl = 'http://localhost:5000/api';
  static const String agoraTokenEndpoint = '/agora/token';
  static const String agoraRenewTokenEndpoint = '/agora/renew-token';
  static const String agoraHealthEndpoint = '/agora/health';

  // ─────────────────────────────── NOTIFICATION TYPES ───────────────────────────────
  static const String notificationTypeFollow = 'follow';
  static const String notificationTypeLike = 'like';
  static const String notificationTypeComment = 'comment';
  static const String notificationTypeMessage = 'message';
  static const String notificationTypeGift = 'gift';
  static const String notificationTypeStream = 'stream';
  static const String notificationTypePayment = 'payment';

  // ─────────────────────────────── REPORT REASONS ───────────────────────────────
  static const List<String> reportReasons = [
    'Inappropriate content',
    'Harassment or bullying',
    'Spam',
    'Scam or fraud',
    'Copyright infringement',
    'Hate speech',
    'Violence or self-harm',
    'Other',
  ];

  // ─────────────────────────────── ERRORS ───────────────────────────────
  static const String errorUnknown =
      'An unknown error occurred. Please try again.';
  static const String errorNetwork =
      'Network error. Please check your connection.';
  static const String errorTimeout = 'Request timeout. Please try again.';
  static const String errorNotFound = 'Resource not found.';
  static const String errorUnauthorized = 'Unauthorized. Please login again.';
  static const String errorForbidden = 'Access forbidden.';
  static const String errorInvalidInput =
      'Invalid input. Please check your data.';
  static const String errorUserNotFound = 'User not found.';
  static const String errorPostNotFound = 'Post not found.';
}

/// User roles
enum UserRole { user, creator, admin, moderator }

/// Content status
enum ContentStatus { active, archived, deleted, blocked, pending }

/// Message type
enum MessageType { text, image, video, audio, sticker, gift, location }

/// Transaction type
enum TransactionType { credit, debit }

/// Payout method
enum PayoutMethod { stripe, paypal, bankTransfer, cryptocurrency }

/// Gift category
enum GiftCategory { basic, premium, luxury }

/// Live stream status
enum LiveStreamStatus { offline, live, archived, scheduled }

/// Video quality
enum VideoQuality { low, medium, high, ultra }

/// Stream role
enum StreamRole { broadcaster, audience }
