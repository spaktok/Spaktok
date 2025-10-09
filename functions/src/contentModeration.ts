
import * as admin from 'firebase-admin';
import {LanguageServiceClient, protos} from '@google-cloud/language';
import {ImageAnnotatorClient} from '@google-cloud/vision';
import {onDocumentCreated} from 'firebase-functions/v2/firestore';

admin.initializeApp();

const languageClient = new LanguageServiceClient();
const visionClient = new ImageAnnotatorClient();

export const moderateMessageContent = onDocumentCreated('chats/{chatId}/messages/{messageId}', async (event) => {
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
  const moderationDetails: string[] = [];

  // 1. Text Moderation
  if (message.text) {
    try {
      const document: protos.google.cloud.language.v1.IDocument = {content: message.text, type: protos.google.cloud.language.v1.Document.Type.PLAIN_TEXT};
      const [classification] = await languageClient.classifyText({document});

      if (classification.categories) {
        for (const category of classification.categories) {
          // Example: Flag content related to violence, hate speech, etc.
          if (category.name && (category.name.includes('Violence') || category.name.includes('Hate Speech')) && category.confidence! > 0.7) {
            flagged = true;
            moderationDetails.push(`Text flagged: ${category.name} (Confidence: ${category.confidence})`);
          }
        }
      }

      // Basic sentiment analysis for extreme negative sentiment
      const [sentiment] = await languageClient.analyzeSentiment({document});
      if (sentiment.documentSentiment && sentiment.documentSentiment.score! < -0.7) {
        flagged = true;
        moderationDetails.push(`Text flagged: Strong negative sentiment (Score: ${sentiment.documentSentiment.score})`);
      }
    } catch (error) {
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
          const likelihood = safeSearchResult[category as keyof typeof safeSearchResult];
          if (likelihood && (likelihood === 'LIKELY' || likelihood === 'VERY_LIKELY')) {
            flagged = true;
            moderationDetails.push(`Image flagged: ${category} content detected.`);
          }
        }
      }
    } catch (error) {
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
  } else {
    await messageRef.update({
      isModerated: true,
      isFlagged: false,
      moderatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`Message ${snapshot.id} processed by moderation, no issues found.`);
  }

  return null;
});

