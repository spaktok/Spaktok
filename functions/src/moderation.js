const functions = require('firebase-functions');
const admin = require('firebase-admin');
const vision = require('@google-cloud/vision');
const language = require('@google-cloud/language');

// Initialize Vision and Language clients
const visionClient = new vision.ImageAnnotatorClient();
const languageClient = new language.LanguageServiceClient();

/**
 * Moderate video content when uploaded
 * Triggers on new video document creation
 */
exports.moderateVideo = functions.firestore
  .document('videos/{videoId}')
  .onCreate(async (snap, context) => {
    const videoData = snap.data();
    const videoId = context.params.videoId;
    
    try {
      console.log(`Starting moderation for video: ${videoId}`);
      
      let violationScore = 0;
      const flags = [];

      // 1. Analyze thumbnail with Cloud Vision
      if (videoData.thumbnailUrl) {
        const [safeSearchResult] = await visionClient.safeSearchDetection(
          videoData.thumbnailUrl
        );
        const safeSearch = safeSearchResult.safeSearchAnnotation;

        // Score violations
        if (safeSearch.adult === 'LIKELY' || safeSearch.adult === 'VERY_LIKELY') {
          violationScore += 3;
          flags.push('adult_content');
        }
        if (safeSearch.violence === 'LIKELY' || safeSearch.violence === 'VERY_LIKELY') {
          violationScore += 2;
          flags.push('violence');
        }
        if (safeSearch.racy === 'VERY_LIKELY') {
          violationScore += 1;
          flags.push('racy_content');
        }
        if (safeSearch.medical === 'VERY_LIKELY') {
          violationScore += 1;
          flags.push('medical');
        }
      }

      // 2. Analyze caption/description text
      const textToAnalyze = `${videoData.caption || ''} ${videoData.description || ''}`.trim();
      
      if (textToAnalyze) {
        const textFlags = await analyzeText(textToAnalyze);
        violationScore += textFlags.score;
        flags.push(...textFlags.flags);
      }

      // 3. Check blocked hashtags
      if (videoData.hashtags && videoData.hashtags.length > 0) {
        const hashtagFlags = checkBlockedHashtags(videoData.hashtags);
        violationScore += hashtagFlags.score;
        flags.push(...hashtagFlags.flags);
      }

      // 4. Determine moderation action
      let moderationStatus = 'approved';
      let action = 'none';

      if (violationScore >= 3) {
        moderationStatus = 'removed';
        action = 'auto_removed';
      } else if (violationScore >= 1) {
        moderationStatus = 'flagged';
        action = 'manual_review';
      }

      // 5. Update video document
      await snap.ref.update({
        moderationStatus,
        moderationAction: action,
        moderationScore: violationScore,
        moderationFlags: flags,
        moderationTimestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 6. Notify user if content removed
      if (action === 'auto_removed') {
        await notifyUserContentRemoved(videoData.userId, videoId, flags);
      }

      // 7. Create audit log
      await admin.firestore().collection('moderationLogs').add({
        contentType: 'video',
        contentId: videoId,
        userId: videoData.userId,
        moderationStatus,
        action,
        score: violationScore,
        flags,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`Video ${videoId} moderated: ${moderationStatus} (score: ${violationScore})`);

      return { status: moderationStatus, score: violationScore, flags };
    } catch (error) {
      console.error('Error moderating video:', error);
      
      // Mark as pending review on error
      await snap.ref.update({
        moderationStatus: 'pending',
        moderationError: error.message,
      });
      
      throw error;
    }
  });

/**
 * Moderate story content when uploaded
 */
exports.moderateStory = functions.firestore
  .document('stories/{storyId}')
  .onCreate(async (snap, context) => {
    const storyData = snap.data();
    const storyId = context.params.storyId;
    
    try {
      console.log(`Starting moderation for story: ${storyId}`);
      
      let violationScore = 0;
      const flags = [];

      // Analyze media URL (thumbnail for videos, actual image for photos)
      const mediaUrl = storyData.type === 'video' ? storyData.thumbnailUrl : storyData.mediaUrl;
      
      if (mediaUrl) {
        const [safeSearchResult] = await visionClient.safeSearchDetection(mediaUrl);
        const safeSearch = safeSearchResult.safeSearchAnnotation;

        if (safeSearch.adult === 'LIKELY' || safeSearch.adult === 'VERY_LIKELY') {
          violationScore += 3;
          flags.push('adult_content');
        }
        if (safeSearch.violence === 'LIKELY' || safeSearch.violence === 'VERY_LIKELY') {
          violationScore += 2;
          flags.push('violence');
        }
        if (safeSearch.racy === 'VERY_LIKELY') {
          violationScore += 1;
          flags.push('racy_content');
        }
      }

      // Determine action
      let moderationStatus = 'approved';
      let action = 'none';

      if (violationScore >= 3) {
        moderationStatus = 'removed';
        action = 'auto_removed';
      } else if (violationScore >= 1) {
        moderationStatus = 'flagged';
        action = 'manual_review';
      }

      // Update story
      await snap.ref.update({
        moderationStatus,
        moderationAction: action,
        moderationScore: violationScore,
        moderationFlags: flags,
        moderationTimestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      if (action === 'auto_removed') {
        await notifyUserContentRemoved(storyData.userId, storyId, flags);
      }

      console.log(`Story ${storyId} moderated: ${moderationStatus}`);

      return { status: moderationStatus, score: violationScore };
    } catch (error) {
      console.error('Error moderating story:', error);
      throw error;
    }
  });

/**
 * Moderate comment when posted
 */
exports.moderateComment = functions.firestore
  .document('videoComments/{commentId}')
  .onCreate(async (snap, context) => {
    const commentData = snap.data();
    const commentId = context.params.commentId;
    
    try {
      const textFlags = await analyzeText(commentData.text);
      
      let moderationStatus = 'approved';
      let action = 'none';

      if (textFlags.score >= 2) {
        moderationStatus = 'removed';
        action = 'auto_removed';
        
        // Remove comment
        await snap.ref.update({ isDeleted: true, moderationStatus, moderationFlags: textFlags.flags });
      } else if (textFlags.score >= 1) {
        moderationStatus = 'flagged';
        action = 'manual_review';
        await snap.ref.update({ moderationStatus, moderationFlags: textFlags.flags });
      }

      console.log(`Comment ${commentId} moderated: ${moderationStatus}`);

      return { status: moderationStatus, score: textFlags.score };
    } catch (error) {
      console.error('Error moderating comment:', error);
      throw error;
    }
  });

/**
 * Analyze text for violations
 */
async function analyzeText(text) {
  let score = 0;
  const flags = [];

  // 1. Check blocked words
  const blockedWords = [
    'spam', 'scam', 'fake', 'buy followers', 'click here',
    // Add more blocked words
  ];

  const lowerText = text.toLowerCase();
  for (const word of blockedWords) {
    if (lowerText.includes(word)) {
      score += 1;
      flags.push(`blocked_word_${word.replace(/\s+/g, '_')}`);
    }
  }

  // 2. Use Natural Language API for sentiment and toxicity
  try {
    const document = {
      content: text,
      type: 'PLAIN_TEXT',
    };

    // Analyze sentiment
    const [sentimentResult] = await languageClient.analyzeSentiment({ document });
    const sentiment = sentimentResult.documentSentiment;

    // Very negative sentiment
    if (sentiment.score < -0.7) {
      score += 1;
      flags.push('negative_sentiment');
    }

    // Analyze entities to detect spam patterns
    const [entitiesResult] = await languageClient.analyzeEntities({ document });
    const entities = entitiesResult.entities;

    // Multiple URLs or mentions might indicate spam
    const urlCount = entities.filter(e => e.type === 'URL').length;
    if (urlCount > 2) {
      score += 1;
      flags.push('multiple_urls');
    }
  } catch (error) {
    console.error('Error analyzing text with NL API:', error);
  }

  // 3. Check for repeated characters (spam indicator)
  if (/(.)\1{5,}/.test(text)) {
    score += 1;
    flags.push('repeated_characters');
  }

  // 4. Check for all caps (spam indicator)
  if (text.length > 20 && text === text.toUpperCase()) {
    score += 1;
    flags.push('all_caps');
  }

  return { score, flags };
}

/**
 * Check blocked hashtags
 */
function checkBlockedHashtags(hashtags) {
  let score = 0;
  const flags = [];

  const blockedHashtags = [
    'spam', 'scam', 'nsfw',
    // Add more blocked hashtags
  ];

  for (const tag of hashtags) {
    if (blockedHashtags.includes(tag.toLowerCase())) {
      score += 1;
      flags.push(`blocked_hashtag_${tag}`);
    }
  }

  return { score, flags };
}

/**
 * Notify user about content removal
 */
async function notifyUserContentRemoved(userId, contentId, flags) {
  try {
    await admin.firestore().collection('notifications').add({
      userId,
      type: 'content_removed',
      contentId,
      title: 'Content Removed',
      message: 'Your content was removed for violating community guidelines.',
      violationReasons: flags,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      isRead: false,
    });
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

/**
 * Manual moderation action (callable function for admins)
 */
exports.manualModerateContent = functions.https.onCall(async (data, context) => {
  // Verify admin
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admins can moderate content'
    );
  }

  const { contentType, contentId, action, reason } = data;

  try {
    let collection;
    switch (contentType) {
      case 'video':
        collection = 'videos';
        break;
      case 'story':
        collection = 'stories';
        break;
      case 'comment':
        collection = 'videoComments';
        break;
      default:
        throw new Error('Invalid content type');
    }

    const docRef = admin.firestore().collection(collection).doc(contentId);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new Error('Content not found');
    }

    const contentData = doc.data();

    // Update content
    await docRef.update({
      moderationStatus: action === 'approve' ? 'approved' : 'removed',
      moderationAction: `manual_${action}`,
      moderationReason: reason,
      moderatedBy: context.auth.uid,
      moderationTimestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Create audit log
    await admin.firestore().collection('moderationLogs').add({
      contentType,
      contentId,
      userId: contentData.userId,
      action: `manual_${action}`,
      reason,
      moderatedBy: context.auth.uid,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Notify user if removed
    if (action === 'remove') {
      await notifyUserContentRemoved(contentData.userId, contentId, [reason]);
    }

    return { success: true, action };
  } catch (error) {
    console.error('Error in manual moderation:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Get flagged content for review (callable function for admins)
 */
exports.getFlaggedContent = functions.https.onCall(async (data, context) => {
  // Verify admin
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admins can view flagged content'
    );
  }

  const { contentType = 'video', limit = 20 } = data;

  try {
    let collection;
    switch (contentType) {
      case 'video':
        collection = 'videos';
        break;
      case 'story':
        collection = 'stories';
        break;
      case 'comment':
        collection = 'videoComments';
        break;
      default:
        throw new Error('Invalid content type');
    }

    const snapshot = await admin.firestore()
      .collection(collection)
      .where('moderationStatus', '==', 'flagged')
      .orderBy('moderationTimestamp', 'desc')
      .limit(limit)
      .get();

    const flaggedContent = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return { success: true, content: flaggedContent };
  } catch (error) {
    console.error('Error getting flagged content:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});
