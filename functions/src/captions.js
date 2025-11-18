const functions = require('firebase-functions');
const admin = require('firebase-admin');
const speech = require('@google-cloud/speech');
const { Storage } = require('@google-cloud/storage');
const { v4: uuidv4 } = require('uuid');

// Initialize clients
const speechClient = new speech.SpeechClient();
const storage = new Storage();

/**
 * Generate captions for video when uploaded
 * Triggers on new video document creation with generateCaptions flag
 */
exports.generateCaptions = functions
  .runWith({ memory: '2GB', timeoutSeconds: 540 })
  .firestore
  .document('videos/{videoId}')
  .onCreate(async (snap, context) => {
    const videoData = snap.data();
    const videoId = context.params.videoId;
    
    // Skip if captions not requested
    if (!videoData.generateCaptions) {
      console.log(`Skipping caption generation for video ${videoId}`);
      return null;
    }

    try {
      console.log(`Starting caption generation for video: ${videoId}`);
      
      // Update status
      await snap.ref.update({
        captionStatus: 'processing',
      });

      // 1. Extract audio from video
      const audioUri = await extractAudio(videoData.videoUrl, videoId);
      
      // 2. Transcribe audio with Speech-to-Text
      const captions = await transcribeAudio(audioUri, videoData.language || 'en-US');
      
      // 3. Save captions to Firestore
      await snap.ref.update({
        captions,
        captionStatus: 'completed',
        captionLanguage: videoData.language || 'en-US',
        captionTimestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`Caption generation completed for video ${videoId}`);
      
      return { success: true, captionCount: captions.length };
    } catch (error) {
      console.error('Error generating captions:', error);
      
      // Update status on error
      await snap.ref.update({
        captionStatus: 'failed',
        captionError: error.message,
      });
      
      throw error;
    }
  });

/**
 * Extract audio from video and upload to Cloud Storage
 * Returns GCS URI for Speech-to-Text API
 */
async function extractAudio(videoUrl, videoId) {
  try {
    // Note: In production, use Cloud Run or Cloud Functions with FFmpeg
    // For now, we'll use the video URL directly with Speech-to-Text's video support
    // Speech-to-Text API supports video files directly for some formats
    
    // Parse Firebase Storage URL
    const bucket = admin.storage().bucket();
    const videoPath = extractPathFromUrl(videoUrl);
    
    // Create audio extraction task (this would use FFmpeg in production)
    // For now, return the video URI directly as Speech-to-Text supports video
    const gcsUri = `gs://${bucket.name}/${videoPath}`;
    
    console.log(`Audio URI: ${gcsUri}`);
    return gcsUri;
  } catch (error) {
    console.error('Error extracting audio:', error);
    throw error;
  }
}

/**
 * Transcribe audio using Speech-to-Text API
 */
async function transcribeAudio(audioUri, languageCode = 'en-US') {
  try {
    console.log(`Transcribing audio: ${audioUri}, language: ${languageCode}`);
    
    const config = {
      encoding: 'LINEAR16',
      languageCode: languageCode,
      enableAutomaticPunctuation: true,
      enableWordTimeOffsets: true,
      enableWordConfidence: true,
      model: 'video', // Optimized for video content
      useEnhanced: true,
    };

    const audio = {
      uri: audioUri,
    };

    const request = {
      config: config,
      audio: audio,
    };

    // Use long-running recognize for videos > 1 minute
    const [operation] = await speechClient.longRunningRecognize(request);
    
    console.log('Waiting for transcription to complete...');
    const [response] = await operation.promise();
    
    // Process results into caption format
    const captions = [];
    let captionIndex = 0;

    response.results.forEach(result => {
      const alternative = result.alternatives[0];
      
      if (alternative.words && alternative.words.length > 0) {
        // Group words into caption segments (3-5 seconds each)
        let currentCaption = {
          index: captionIndex,
          text: '',
          startTime: 0,
          endTime: 0,
          words: [],
        };

        let segmentStartTime = parseFloat(alternative.words[0].startTime.seconds) + 
                               parseFloat(alternative.words[0].startTime.nanos) / 1e9;
        
        alternative.words.forEach((wordInfo, i) => {
          const startTime = parseFloat(wordInfo.startTime.seconds) + 
                           parseFloat(wordInfo.startTime.nanos) / 1e9;
          const endTime = parseFloat(wordInfo.endTime.seconds) + 
                         parseFloat(wordInfo.endTime.nanos) / 1e9;
          
          // Start new caption segment every 3-5 seconds or at punctuation
          const shouldBreak = (endTime - segmentStartTime > 4) || 
                             (wordInfo.word.match(/[.!?]$/) && i < alternative.words.length - 1);
          
          if (shouldBreak && currentCaption.text.length > 0) {
            // Save current caption
            currentCaption.endTime = endTime;
            captions.push({ ...currentCaption });
            
            // Start new caption
            captionIndex++;
            currentCaption = {
              index: captionIndex,
              text: '',
              startTime: endTime,
              endTime: 0,
              words: [],
            };
            segmentStartTime = endTime;
          }

          // Add word to current caption
          if (currentCaption.text === '') {
            currentCaption.startTime = startTime;
          }
          currentCaption.text += (currentCaption.text ? ' ' : '') + wordInfo.word;
          currentCaption.endTime = endTime;
          currentCaption.words.push({
            word: wordInfo.word,
            startTime,
            endTime,
            confidence: wordInfo.confidence,
          });
        });

        // Save final caption
        if (currentCaption.text.length > 0) {
          captions.push(currentCaption);
          captionIndex++;
        }
      }
    });

    console.log(`Transcription completed: ${captions.length} caption segments`);
    return captions;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw error;
  }
}

/**
 * Generate captions manually (callable function)
 */
exports.generateCaptionsManual = functions
  .runWith({ memory: '2GB', timeoutSeconds: 540 })
  .https
  .onCall(async (data, context) => {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Must be authenticated to generate captions'
      );
    }

    const { videoId, language = 'en-US' } = data;

    try {
      // Get video document
      const videoRef = admin.firestore().collection('videos').doc(videoId);
      const videoDoc = await videoRef.get();

      if (!videoDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Video not found');
      }

      const videoData = videoDoc.data();

      // Verify ownership
      if (videoData.userId !== context.auth.uid) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Not authorized to generate captions for this video'
        );
      }

      // Update status
      await videoRef.update({
        captionStatus: 'processing',
      });

      // Extract audio
      const audioUri = await extractAudio(videoData.videoUrl, videoId);
      
      // Transcribe
      const captions = await transcribeAudio(audioUri, language);
      
      // Save captions
      await videoRef.update({
        captions,
        captionStatus: 'completed',
        captionLanguage: language,
        captionTimestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { success: true, captions };
    } catch (error) {
      console.error('Error generating captions manually:', error);
      
      // Update status on error
      if (data.videoId) {
        await admin.firestore().collection('videos').doc(data.videoId).update({
          captionStatus: 'failed',
          captionError: error.message,
        });
      }
      
      throw new functions.https.HttpsError('internal', error.message);
    }
  });

/**
 * Translate captions to another language
 */
exports.translateCaptions = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Must be authenticated to translate captions'
    );
  }

  const { videoId, targetLanguage } = data;

  try {
    // Get video document
    const videoRef = admin.firestore().collection('videos').doc(videoId);
    const videoDoc = await videoRef.get();

    if (!videoDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Video not found');
    }

    const videoData = videoDoc.data();

    if (!videoData.captions || videoData.captions.length === 0) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Video has no captions to translate'
      );
    }

    // Use Cloud Translation API
    const { Translate } = require('@google-cloud/translate').v2;
    const translate = new Translate();

    const translatedCaptions = [];

    for (const caption of videoData.captions) {
      const [translation] = await translate.translate(caption.text, targetLanguage);
      
      translatedCaptions.push({
        ...caption,
        text: translation,
        originalText: caption.text,
        translatedFrom: videoData.captionLanguage,
      });
    }

    // Save translated captions
    await videoRef.update({
      [`captionTranslations.${targetLanguage}`]: translatedCaptions,
    });

    return { success: true, captions: translatedCaptions };
  } catch (error) {
    console.error('Error translating captions:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Helper function to extract path from Firebase Storage URL
 */
function extractPathFromUrl(url) {
  try {
    // Handle both formats:
    // https://firebasestorage.googleapis.com/v0/b/bucket/o/path%2Fto%2Ffile.mp4?...
    // gs://bucket/path/to/file.mp4
    
    if (url.startsWith('gs://')) {
      return url.split('/').slice(3).join('/');
    }
    
    const matches = url.match(/\/o\/(.+?)\?/);
    if (matches && matches[1]) {
      return decodeURIComponent(matches[1]);
    }
    
    throw new Error('Invalid Firebase Storage URL');
  } catch (error) {
    console.error('Error extracting path from URL:', error);
    throw error;
  }
}

/**
 * Get caption statistics
 */
exports.getCaptionStats = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  try {
    const userId = context.auth.uid;
    
    // Count videos with captions
    const videosSnapshot = await admin.firestore()
      .collection('videos')
      .where('userId', '==', userId)
      .get();

    let totalVideos = 0;
    let videosWithCaptions = 0;
    let processingCaptions = 0;
    let failedCaptions = 0;

    videosSnapshot.forEach(doc => {
      totalVideos++;
      const data = doc.data();
      
      if (data.captions && data.captions.length > 0) {
        videosWithCaptions++;
      }
      if (data.captionStatus === 'processing') {
        processingCaptions++;
      }
      if (data.captionStatus === 'failed') {
        failedCaptions++;
      }
    });

    return {
      totalVideos,
      videosWithCaptions,
      processingCaptions,
      failedCaptions,
      captionPercentage: totalVideos > 0 ? (videosWithCaptions / totalVideos * 100).toFixed(1) : 0,
    };
  } catch (error) {
    console.error('Error getting caption stats:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});
