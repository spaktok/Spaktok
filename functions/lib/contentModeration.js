"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.moderateMessageContent = void 0;
const admin = __importStar(require("firebase-admin"));
const language_1 = require("@google-cloud/language");
const vision_1 = require("@google-cloud/vision");
const firestore_1 = require("firebase-functions/v2/firestore");
admin.initializeApp();
const languageClient = new language_1.LanguageServiceClient();
const visionClient = new vision_1.ImageAnnotatorClient();
exports.moderateMessageContent = (0, firestore_1.onDocumentCreated)('chats/{chatId}/messages/{messageId}', async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
        return;
    }
    const message = snapshot.data();
    const messageRef = snapshot.ref;
    if (message.isSystemMessage) {
        console.log('Skipping moderation for system message.');
        return null;
    }
    let flagged = false;
    const moderationDetails = [];
    // 1. Text Moderation
    if (message.text) {
        try {
            const document = { content: message.text, type: language_1.protos.google.cloud.language.v1.Document.Type.PLAIN_TEXT };
            const [classification] = await languageClient.classifyText({ document });
            if (classification.categories) {
                for (const category of classification.categories) {
                    // Example: Flag content related to violence, hate speech, etc.
                    if (category.name && (category.name.includes('Violence') || category.name.includes('Hate Speech')) && category.confidence > 0.7) {
                        flagged = true;
                        moderationDetails.push(`Text flagged: ${category.name} (Confidence: ${category.confidence})`);
                    }
                }
            }
            // Basic sentiment analysis for extreme negative sentiment
            const [sentiment] = await languageClient.analyzeSentiment({ document });
            if (sentiment.documentSentiment && sentiment.documentSentiment.score < -0.7) {
                flagged = true;
                moderationDetails.push(`Text flagged: Strong negative sentiment (Score: ${sentiment.documentSentiment.score})`);
            }
        }
        catch (error) {
            console.error('Error classifying text:', error);
        }
    }
    // 2. Image Moderation (if imageUrl exists)
    if (message.imageUrl) {
        try {
            const [result] = await visionClient.safeSearchDetection(message.imageUrl);
            const safeSearchResult = result.safeSearchAnnotation;
            if (safeSearchResult) {
                const categories = [
                    'adult', 'medical', 'racy', 'spoof', 'violence',
                ];
                for (const category of categories) {
                    const likelihood = safeSearchResult[category];
                    if (likelihood && (likelihood === 'LIKELY' || likelihood === 'VERY_LIKELY')) {
                        flagged = true;
                        moderationDetails.push(`Image flagged: ${category} content detected.`);
                    }
                }
            }
        }
        catch (error) {
            console.error('Error with Vision API for image moderation:', error);
        }
    }
    // 3. Video Moderation (if videoUrl exists - placeholder, actual implementation is more complex)
    if (message.videoUrl) {
        // For video moderation, typically you\\'d integrate with a video intelligence API
        // or process frames. This is a placeholder for future expansion.
        // For now, we\\'ll just log a note.
        console.log('Video moderation is a complex task and requires dedicated Video Intelligence API integration.');
    }
    if (flagged) {
        await messageRef.update({
            isModerated: true,
            isFlagged: true,
            moderationDetails: moderationDetails,
            moderatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`Message ${snapshot.id} flagged:`, moderationDetails);
    }
    else {
        await messageRef.update({
            isModerated: true,
            isFlagged: false,
            moderatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`Message ${snapshot.id} processed by moderation, no issues found.`);
    }
    return null;
});
//# sourceMappingURL=contentModeration.js.map