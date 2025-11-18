/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

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

// Agora Chat functions
const chatModule = require('./src/chat');
exports.getAgoraChatAppToken = chatModule.getAgoraChatAppToken;
exports.getAgoraChatUserToken = chatModule.getAgoraChatUserToken;

// AI Moderation functions
const moderationModule = require('./src/moderation');
exports.moderateVideo = moderationModule.moderateVideo;
exports.moderateStory = moderationModule.moderateStory;
exports.moderateComment = moderationModule.moderateComment;
exports.manualModerateContent = moderationModule.manualModerateContent;
exports.getFlaggedContent = moderationModule.getFlaggedContent;

// Auto-Captions functions
const captionsModule = require('./src/captions');
exports.generateCaptions = captionsModule.generateCaptions;
exports.generateCaptionsManual = captionsModule.generateCaptionsManual;
exports.translateCaptions = captionsModule.translateCaptions;
exports.getCaptionStats = captionsModule.getCaptionStats;

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
