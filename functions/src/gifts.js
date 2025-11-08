const functions = require('firebase-functions');
const admin = require('firebase-admin');
const logger = require('firebase-functions/logger');

if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Return gift catalog. Simple example storing catalog in code; can be moved to Firestore.
 */
const GIFT_CATALOG = [
  { id: 'rose', name: 'Golden Rose', priceCoins: 10, type: 'small', asset: 'assets/animations/rose.json', sound: 'assets/sounds/rose.mp3' },
  { id: 'car', name: 'Sports Car', priceCoins: 500, type: 'special', asset: 'assets/animations/car.json', sound: 'assets/sounds/car.mp3' },
  { id: 'castle', name: 'Luxury Castle', priceCoins: 1200, type: 'epic', asset: 'assets/animations/castle.json', sound: 'assets/sounds/castle.mp3' }
];

exports.getGiftCatalog = functions.https.onCall(async (data, context) => {
  // Could read from Firestore for dynamic catalog; returning static list for now
  return { gifts: GIFT_CATALOG };
});

/**
 * Send a gift: deduct coins from sender and create gift record on Firestore for receiver/context.
 * Expected data: { giftId, receiverId, context: 'live_stream'|'profile', contextId }
 */
exports.sendGift = functions.https.onCall(async (data, context) => {
  const senderUid = context.auth && context.auth.uid;
  if (!senderUid) throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');

  const { giftId, receiverId, context: ctx, contextId } = data;
  if (!giftId || !receiverId || !ctx) throw new functions.https.HttpsError('invalid-argument', 'Missing parameters');

  const gift = GIFT_CATALOG.find((g) => g.id === giftId);
  if (!gift) throw new functions.https.HttpsError('not-found', 'Gift not found');

  const db = admin.firestore();
  const senderRef = db.collection('users').doc(senderUid);
  const receiverRef = db.collection('users').doc(receiverId);

  try {
    await db.runTransaction(async (tx) => {
      const sSnap = await tx.get(senderRef);
      const senderCoins = sSnap.exists ? (sSnap.data().coins || 0) : 0;
      if (senderCoins < gift.priceCoins) {
        throw new functions.https.HttpsError('failed-precondition', 'Insufficient coins');
      }

      // Deduct sender coins
      tx.update(senderRef, { coins: senderCoins - gift.priceCoins });

      // Credit receiver (for example, increase receivedGifts count)
      const rSnap = await tx.get(receiverRef);
      const prevReceived = rSnap.exists ? (rSnap.data().receivedGifts || 0) : 0;
      tx.set(receiverRef, { receivedGifts: prevReceived + 1 }, { merge: true });

      // Create gift record
      const giftRecord = {
        giftId: gift.id,
        sender: senderUid,
        receiver: receiverId,
        context: ctx,
        contextId: contextId || null,
        priceCoins: gift.priceCoins,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      tx.set(db.collection('gifts').doc(), giftRecord);
    });

    // Optionally: return animation and sound asset paths for client to display
    return { success: true, animation: gift.asset, sound: gift.sound };
  } catch (err) {
    logger.error('sendGift failed', { error: err.message });
    if (err instanceof functions.https.HttpsError) throw err;
    throw new functions.https.HttpsError('internal', err.message);
  }
});
