/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const functions = require('firebase-functions');
const logger = require('firebase-functions/logger');

// Export all Cloud Functions from module files
// Stripe payment functions
const stripeModule = require('./src/stripe');
exports.createPaymentIntent = stripeModule.createPaymentIntent;
exports.handleStripeWebhook = stripeModule.handleStripeWebhook;

// Agora token generation
const agoraModule = require('./src/agora');
exports.getAgoraToken = agoraModule.getAgoraToken;

// Gift system functions
const giftsModule = require('./src/gifts');
exports.getGiftCatalog = giftsModule.getGiftCatalog;
exports.sendGift = giftsModule.sendGift;

logger.info('All Cloud Functions modules loaded successfully');

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
functions.setGlobalOptions({ maxInstances: 10 });

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
