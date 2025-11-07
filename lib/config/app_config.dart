class AppConfig {
  // Backend configuration
  static const String backendBaseUrl = 'http://localhost:5000';
  static const String agoraTokenEndpoint = '$backendBaseUrl/api/agora/token';
  // Agora App ID (do NOT hardcode secrets). Prefer passing via --dart-define=AGORA_APP_ID=...
  static const String agoraAppId = String.fromEnvironment(
    'AGORA_APP_ID',
    defaultValue: '',
  );

  // Agora token configuration
  static const int agoraTokenExpiryBufferSeconds = 600; // 10 minutes
  static const Duration tokenRequestTimeout = Duration(seconds: 30);
  static const int maxTokensPerUserPerDay = 100;

  // Debug configuration
  static const bool enableDebugLogging = true;
  static const bool debugAgoraTokenRequests = true;
}

// Backward compatibility alias
typedef Config = AppConfig;
