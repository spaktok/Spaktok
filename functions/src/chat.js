const functions = require('firebase-functions');
const logger = require('firebase-functions/logger');
const config = require('./config');
const admin = require('firebase-admin');
const axios = require('axios');

if (!admin.apps.length) {
  admin.initializeApp();
}

// Simple in-memory cache for app tokens (avoids redundant API calls).
// In production, consider Redis/Memorystore for multi-instance consistency.
let appTokenCache = {
  token: null,
  expiresAt: 0,
};

// Agora Chat App Token generator.
// Callable function: getAgoraChatAppToken
// Returns { token, expiresAt }.
// Uses client credentials (OAuth) against Agora Chat REST API.
// Mock mode: if USE_CHAT_MOCK=true or secrets missing, returns a fake token.
// Environment needed:
//   CHAT_APP_KEY (format org#app) e.g. 711404457#1607467
//   CHAT_CLIENT_ID
//   CHAT_CLIENT_SECRET
// Docs: https://docs.agora.io/en/chat/restful/authentication

exports.getAgoraChatAppToken = functions.https.onCall(async (data, context) => {
  try {
    const { appKey, clientId, clientSecret } = config.chat;
    const useMock = process.env.USE_CHAT_MOCK === 'true' || !appKey || !clientId || !clientSecret;

    if (useMock) {
      // Provide deterministic mock for local tests / CI when secrets absent.
      const expiresInSeconds = 3600;
      return {
        token: `mock_chat_token_${Date.now()}`,
        expiresAt: Date.now() + expiresInSeconds * 1000,
        mock: true,
      };
    }

    // Check cache first (5-minute buffer before expiry for safety)
    const now = Date.now();
    if (appTokenCache.token && appTokenCache.expiresAt > now + 300000) {
      logger.info('Returning cached app token');
      return {
        token: appTokenCache.token,
        expiresAt: appTokenCache.expiresAt,
        mock: false,
        cached: true,
      };
    }

    // Fetch new token from Agora Chat REST API
    const url = `https://a1.agora.io/${appKey}/token`;
    const payload = {
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      ttl: 3600, // seconds
    };

    const response = await axios.post(url, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000,
    });

    if (!response.data || !response.data.access_token) {
      throw new Error('Invalid response from Agora Chat');
    }

    // Update cache
    const expiresAt = Date.now() + (response.data.expires_in || 3600) * 1000;
    appTokenCache = {
      token: response.data.access_token,
      expiresAt,
    };

    return {
      token: response.data.access_token,
      expiresAt,
      mock: false,
      cached: false,
    };
  } catch (err) {
    logger.error('getAgoraChatAppToken error', { error: err.message });
    throw new functions.https.HttpsError('internal', err.message);
  }
});

// Per-user Chat token generator.
// Callable function: getAgoraChatUserToken
// Requires authenticated context (context.auth.uid).
// Returns { token, expiresAt, chatUserId }.
// Uses app token to register/authenticate individual chat users.
exports.getAgoraChatUserToken = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth || !context.auth.uid) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const uid = context.auth.uid;
    const { appKey, clientId, clientSecret } = config.chat;
    const useMock = process.env.USE_CHAT_MOCK === 'true' || !appKey || !clientId || !clientSecret;

    if (useMock) {
      return {
        token: `mock_user_token_${uid}_${Date.now()}`,
        expiresAt: Date.now() + 3600000,
        chatUserId: uid,
        mock: true,
      };
    }

    // Get app token first (cached)
    const appTokenResult = await exports.getAgoraChatAppToken.run({}, context);
    const appToken = appTokenResult.token;

    // Register or get user token via Agora Chat REST API
    // POST /{org_name}/{app_name}/users/{username}/token
    const url = `https://a1.agora.io/${appKey}/users/${uid}/token`;
    
    const response = await axios.post(
      url,
      { ttl: 3600 },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${appToken}`,
        },
        timeout: 5000,
      }
    );

    if (!response.data || !response.data.access_token) {
      throw new Error('Invalid user token response from Agora Chat');
    }

    return {
      token: response.data.access_token,
      expiresAt: Date.now() + (response.data.expires_in || 3600) * 1000,
      chatUserId: uid,
      mock: false,
    };
  } catch (err) {
    const uid = context.auth && context.auth.uid ? context.auth.uid : null;
    logger.error('getAgoraChatUserToken error', { error: err.message, uid: uid });
    throw new functions.https.HttpsError('internal', err.message);
  }
});
