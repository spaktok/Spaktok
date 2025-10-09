import * as admin from 'firebase-admin';
import {onSchedule} from 'firebase-functions/v2/scheduler';

admin.initializeApp();
const firestore = admin.firestore();

export const deleteDisappearingMessages = onSchedule('every 1 minutes', async (event): Promise<void> => {
  const now = admin.firestore.Timestamp.now();
  const messagesRef = firestore.collectionGroup('messages');

  // Query for messages that are disappearing and have been viewed
  const snapshot = await messagesRef
    .where('isDisappearing', '==', true)
    .where('viewedTimestamp', '<=', now)
    .get();

  const batch = firestore.batch();
  let deletedCount = 0;

  snapshot.docs.forEach((doc) => {
    const message = doc.data();
    const viewedTimestamp = message.viewedTimestamp as admin.firestore.Timestamp;
    const disappearDuration = message.disappearDuration as number;

    if (viewedTimestamp && disappearDuration) {
      const expirationTime = viewedTimestamp.toDate().getTime() + (disappearDuration * 1000);
      if (now.toDate().getTime() >= expirationTime) {
        batch.delete(doc.ref);
        deletedCount++;
      }
    } else if (disappearDuration) {
      // Handle messages that disappear after creation if not viewed (e.g., a default duration)
      // This part needs more specific logic based on how \'disappear after creation\' is defined
      // For simplicity, we\'ll assume \'viewedTimestamp\' is always set for disappearing messages.
      // If a message is set to disappear but never viewed, it won\'t be deleted by this logic.
      // A separate mechanism might be needed for \'disappear after creation regardless of view\'.
    }
  });

  if (deletedCount > 0) {
    await batch.commit();
    console.log(`Deleted ${deletedCount} disappearing messages.`);
  } else {
    console.log('No disappearing messages to delete.');
  }
});

