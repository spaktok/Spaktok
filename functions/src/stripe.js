const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Stripe = require('stripe');
const config = require('./config');
const logger = require('firebase-functions/logger');

// Initialize admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const stripeSecret = config.stripe.secretKey || process.env.STRIPE_SECRET_KEY || '';

// Optional mock: when explicitly requested, use a lightweight mock to avoid
// making network calls to Stripe during tests/CI. Enable by setting
// USE_STRIPE_MOCK=true. Otherwise, use the real Stripe client (even in tests)
// if a valid STRIPE_SECRET_KEY is present.
let stripe;
if (process.env.USE_STRIPE_MOCK === 'true') {
  // Minimal mock implementation used only for tests.
  stripe = {
    paymentIntents: {
      create: async ({ amount, currency, metadata }) => {
        // Return a fake payment intent
        return {
          id: `pi_mock_${Date.now()}`,
          amount: amount || 0,
          currency: currency || 'usd',
          metadata: metadata || {},
          client_secret: `cs_mock_${Math.random().toString(36).slice(2)}`,
        };
      },
    },
    webhooks: {
      constructEvent: (rawBody, signature, secret) => {
        // In mock mode, assume the body is already the event
        try {
          return typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
        } catch (e) {
          return rawBody;
        }
      },
    },
  };
} else {
  // Real Stripe client for production/dev
  stripe = new Stripe(stripeSecret, { apiVersion: '2022-11-15' });
}

/**
 * Create a PaymentIntent for coin purchases. Callable function.
 * Expected data: { amount: integer (in cents), currency: string, uid: string }
 */
exports.createPaymentIntent = functions.https.onCall(async (data, context) => {
  try {
    const uid = data.uid || (context.auth && context.auth.uid);
    if (!uid) throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');

    const amount = Number(data.amount || 0);
    const currency = data.currency || 'usd';
    if (!amount || amount <= 0) throw new functions.https.HttpsError('invalid-argument', 'Invalid amount');

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata: { uid },
    });

    return { clientSecret: paymentIntent.client_secret };
  } catch (err) {
    logger.error('createPaymentIntent error', { error: err.message });
    throw new functions.https.HttpsError('internal', err.message);
  }
});

/**
 * Webhook endpoint for Stripe events. Use functions.https.onRequest.
 * Make sure to set STRIPE_WEBHOOK_SECRET in your environment and configure the webhook in Stripe.
 */
exports.handleStripeWebhook = functions.https.onRequest(async (req, res) => {
  const webhookSecret = config.stripe.webhookSecret || process.env.STRIPE_WEBHOOK_SECRET || '';
  let event;

  try {
    if (webhookSecret) {
      const signature = req.headers['stripe-signature'];
      event = stripe.webhooks.constructEvent(req.rawBody, signature, webhookSecret);
    } else {
      // In testing/dev environments the secret might not be set; parse body directly
      event = req.body;
    }
  } catch (err) {
    logger.error('Stripe webhook signature verification failed', { error: err.message });
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event types you care about
  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object;
        const uid = pi.metadata && pi.metadata.uid;
        // Example: credit user's coins according to amount
        if (uid) {
          const coins = Math.floor(pi.amount / 100); // simple conversion, customize as needed
          const userRef = admin.firestore().collection('users').doc(uid);
          await admin.firestore().runTransaction(async (tx) => {
            const snap = await tx.get(userRef);
            const prev = snap.exists ? (snap.data().coins || 0) : 0;
            tx.set(userRef, { coins: prev + coins }, { merge: true });
          });
        }
        break;
      }
      // Add more event handlers as needed
      default:
        logger.info(`Unhandled Stripe event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    logger.error('Error handling stripe webhook', { error: err.message });
    res.status(500).send();
  }
});
