const functions = require('firebase-functions');
const admin = require('firebase-admin');
const stripe = require('stripe')('whsec_V4zeDXFiMhGrOx1xjBMoNfxBgav5eTpI'); // Use your secret key

admin.initializeApp();

exports.createPaymentIntent = functions.https.onCall(async (data, context) => {
  // Ensure user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }

  const { amount, currency, userId, packageId } = data;

  try {
    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: currency,
      metadata: {
        userId: userId,
        packageId: packageId,
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
    };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw new functions.https.HttpsError('internal', 'Could not create payment intent.');
  }
});

exports.getAgoraToken = functions.https.onCall(async (data, context) => {
    // This is a placeholder for a secure token generation
    // In a real application, you should use the Agora RTM SDK for token generation
    const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

    const appID = '007eJxTYFDx3C3TVrhPsibRdnrAq6tHq3jSNzCkpz+Ua3qk6r1+TrcCQ6KJoYWBeVJSommyoYlJkmmSRaphWoppaqq5oaE5UKIk/ntGQyAjwxzO/8yMDBAI4rMzBBckZpfkZzMwAABmBiA1';
    const appCertificate = 'YOUR_AGORA_APP_CERTIFICATE'; // You need to get this from your Agora dashboard
    const channelName = data.channelName;
    const uid = 0; // Or a specific user ID
    const role = RtcRole.PUBLISHER;
    const expirationTimeInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    if (!channelName) {
        throw new functions.https.HttpsError('invalid-argument', 'The function must be called with a channelName.');
    }

    try {
        const token = RtcTokenBuilder.buildTokenWithUid(appID, appCertificate, channelName, uid, role, privilegeExpiredTs);
        return { token: token };
    } catch (error) {
        console.error('Error generating Agora token:', error);
        throw new functions.https.HttpsError('internal', 'Could not generate Agora token.');
    }
});
