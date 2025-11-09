const functions = require('firebase-functions');
const logger = require('firebase-functions/logger');
const config = require('./config');

/**
 * Callable function to generate an Agora RTC token for a channel.
 * Expected data: { channelName: string, uid?: number }
 * Note: This function lazily requires the `agora-access-token` package. If
 * you prefer another token builder, replace the implementation or install the
 * appropriate package: `npm install agora-access-token` in the functions folder.
 */
exports.getAgoraToken = functions.https.onCall((data, context) => {
  const channelName = data.channelName;
  if (!channelName) {
    throw new functions.https.HttpsError('invalid-argument', 'channelName is required');
  }

  const appId = config.agora.appId || process.env.AGORA_APP_ID;
  const appCertificate = config.agora.appCertificate || process.env.AGORA_APP_CERTIFICATE;

  if (!appId || !appCertificate) {
    logger.error('Agora credentials missing');
    throw new functions.https.HttpsError('failed-precondition', 'Agora credentials are not configured');
  }

  // Lazy require so that deploy/install can continue even if dependency is absent.
  let RtcTokenBuilder;
  let RtcRole;
  try {
    ({ RtcTokenBuilder, RtcRole } = require('agora-access-token'));
  } catch (e) {
    logger.error('agora-access-token module not installed', { error: e.message });
    throw new functions.https.HttpsError(
      'failed-precondition',
      'Server dependency `agora-access-token` is not installed. Run `npm install agora-access-token` in functions folder or install an alternative token builder.'
    );
  }

  // UID can be a number or 0 for app-wide tokens
  const uid = Number(data.uid || 0);
  const role = RtcRole.PUBLISHER;
  // Token expiry: 1 hour
  const expireTime = 3600;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expireTime;

  try {
    const token = RtcTokenBuilder.buildTokenWithUid(appId, appCertificate, channelName, uid, role, privilegeExpiredTs);
    return { token, appId, expiresAt: privilegeExpiredTs };
  } catch (err) {
    logger.error('Failed to build Agora token', { error: err.message });
    throw new functions.https.HttpsError('internal', 'Failed to build token');
  }
});
