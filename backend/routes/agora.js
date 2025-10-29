const express = require('express');
const { RtcTokenBuilder, RtcRole } = require('agora-token');
const router = express.Router();

// Configure Agora credentials from environment
const AGORA_APP_ID = process.env.AGORA_APP_ID;
const AGORA_APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;
const TOKEN_EXPIRY = parseInt(process.env.AGORA_TOKEN_EXPIRY || '43200'); // 12 hours default

// In-memory token cache and rate limiter (use Redis in production)
const tokenCache = {};
const tokenCountToday = {};

/**
 * POST /api/agora/token
 * Generate a new Agora token for channel access
 * 
 * Request body:
 * {
 *   channelName: string (required) - The channel to join
 *   uid: number (required) - User ID for the channel
 *   role: 'publisher' | 'subscriber' (optional, default: 'publisher')
 *   userId: string (required) - User ID for rate limiting and audit
 * }
 * 
 * Response:
 * {
 *   token: string - The generated token
 *   channelName: string - The channel name
 *   uid: number - The user ID
 *   expiryTime: number - Token expiry time (Unix timestamp)
 * }
 */
router.post('/token', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { channelName, uid, role = 'publisher', userId } = req.body;

    // Validate required parameters
    if (!channelName || uid === undefined || !userId) {
      return res.status(400).json({
        error: 'Missing required parameters: channelName, uid, userId'
      });
    }

    // Validate UID format
    if (typeof uid !== 'number' || uid < 0 || uid > 232 - 1) {
      return res.status(400).json({
        error: 'Invalid UID: must be a number between 0 and 4294967295'
      });
    }

    // Rate limiting: max 100 tokens per user per day
    const today = new Date().toISOString().split('T')[0];
    const userDayKey = \\-\\;
    tokenCountToday[userDayKey] = (tokenCountToday[userDayKey] || 0) + 1;

    if (tokenCountToday[userDayKey] > (process.env.AGORA_MAX_TOKENS_PER_USER_PER_DAY || 100)) {
      return res.status(429).json({
        error: 'Rate limit exceeded: maximum tokens per day reached'
      });
    }

    // Determine role (publisher = 1, subscriber = 2)
    const agoraRole = role === 'subscriber' ? RtcRole.SUBSCRIBER : RtcRole.PUBLISHER;

    // Generate token
    const expirationTimeInSeconds = Math.floor(TOKEN_EXPIRY);
    const currentTimeInSeconds = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimeInSeconds + expirationTimeInSeconds;

    const token = RtcTokenBuilder.buildTokenWithUid(
      AGORA_APP_ID,
      AGORA_APP_CERTIFICATE,
      channelName,
      uid,
      agoraRole,
      privilegeExpiredTs
    );

    // Log to console (in production, log to PostgreSQL)
    console.log(\? Token Generated for user: \, channel: \, uid: \, role: \\);

    // Return token response
    res.json({
      success: true,
      token: token,
      channelName: channelName,
      uid: uid,
      role: role,
      expiryTime: privilegeExpiredTs,
      expiryTimeMs: privilegeExpiredTs * 1000,
      generatedAt: new Date().toISOString(),
      responseTime: \\ms\
    });

  } catch (error) {
    console.error('? Error generating Agora token:', error);
    res.status(500).json({
      error: 'Failed to generate token',
      message: error.message
    });
  }
});

/**
 * POST /api/agora/renew-token
 * Renew a token before expiry (for long-running sessions)
 * 
 * Request body:
 * {
 *   channelName: string (required)
 *   uid: number (required)
 *   role: 'publisher' | 'subscriber' (optional)
 *   userId: string (required)
 *   currentToken: string (optional) - Previous token for audit trail
 * }
 */
router.post('/renew-token', async (req, res) => {
  try {
    const { channelName, uid, role = 'publisher', userId, currentToken } = req.body;

    // Validate required parameters
    if (!channelName || uid === undefined || !userId) {
      return res.status(400).json({
        error: 'Missing required parameters: channelName, uid, userId'
      });
    }

    // Rate limiting check
    const today = new Date().toISOString().split('T')[0];
    const userDayKey = \\-\\;
    tokenCountToday[userDayKey] = (tokenCountToday[userDayKey] || 0) + 1;

    if (tokenCountToday[userDayKey] > (process.env.AGORA_MAX_TOKENS_PER_USER_PER_DAY || 100)) {
      return res.status(429).json({
        error: 'Rate limit exceeded'
      });
    }

    // Generate new token (same process as /token endpoint)
    const agoraRole = role === 'subscriber' ? RtcRole.SUBSCRIBER : RtcRole.PUBLISHER;
    const expirationTimeInSeconds = Math.floor(TOKEN_EXPIRY);
    const currentTimeInSeconds = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimeInSeconds + expirationTimeInSeconds;

    const token = RtcTokenBuilder.buildTokenWithUid(
      AGORA_APP_ID,
      AGORA_APP_CERTIFICATE,
      channelName,
      uid,
      agoraRole,
      privilegeExpiredTs
    );

    console.log(\? Token Renewed for user: \, channel: \\);

    res.json({
      success: true,
      token: token,
      channelName: channelName,
      uid: uid,
      role: role,
      expiryTime: privilegeExpiredTs,
      expiryTimeMs: privilegeExpiredTs * 1000,
      renewedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('? Error renewing Agora token:', error);
    res.status(500).json({
      error: 'Failed to renew token',
      message: error.message
    });
  }
});

/**
 * GET /api/agora/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    agoraConfigured: !!AGORA_APP_ID,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
