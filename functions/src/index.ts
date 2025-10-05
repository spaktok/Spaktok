import * as functions from "firebase-functions";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { onCall } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { onSchedule } from "firebase-functions/v2/scheduler";

admin.initializeApp();
const db = admin.firestore();

// TODO: Set these in your Firebase environment configuration
// For Stripe: functions.config().stripe.secret_key
// For PayPal: functions.config().paypal.client_id, functions.config().paypal.client_secret

interface UserData {
  isPremiumAccount?: boolean;
  premiumSlotId?: string | null;
  isAdmin?: boolean;
  balance?: number;
  coins?: number;
  friends?: string[];
  sentFriendRequests?: string[];
  receivedFriendRequests?: string[];
  stripeAccountId?: string;
  displayName?: string; // Added for gift messages
  paypalEmail?: string; // Added for payout requests
  bankAccountDetails?: {
    bankName: string;
    accountNumber: string;
    accountHolderName: string;
    swiftCode?: string;
    iban?: string;
    country: string;
  };
  warningCount?: number;
  isBanned?: boolean;
  banExpiresAt?: admin.firestore.Timestamp | null;
  banReason?: string;
}

interface SettingsData {
  premiumPayoutPercentage: number;
  standardPayoutPercentage: number;
  maxPremiumSlots: number;
  premiumSlots: { [key: string]: string | null };
}

/**
 * Cloud Function to process gift payouts and apply premium account percentages.
 * Triggered by a Firestore write (e.g., when a gift is sent).
 */
export const processGiftPayout = onDocumentCreated(
  "sentGifts/{sentGiftId}",
  async (event) => {
    const sentGiftData = event.data?.data();
    const receiverId = sentGiftData?.receiverId;
    const senderId = sentGiftData?.senderId;
    const giftName = sentGiftData?.giftName; // Name of the gift sent (e.g., "lion")

    if (!receiverId || !senderId || !giftName) {
      console.error("Missing receiverId, senderId, or giftName in sent gift data.");
      return null;
    }

    try {
      // Get gift details from the 'gifts' collection
      const giftRef = db.collection("gifts").doc(giftName.toLowerCase());
      const giftDoc = await giftRef.get();

      if (!giftDoc.exists) {
        console.error(`Gift with name ${giftName} not found.`);
        return null;
      }
      const giftValue = giftDoc.data()?.cost; // Cost of the gift in coins

      if (!giftValue) {
        console.error(`Gift value not defined for gift ${giftName}.`);
        return null;
      }

      const userRef = db.collection("users").doc(receiverId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        console.error(`User with ID ${receiverId} not found.`);
        return null;
      }

      const userData = userDoc.data() as UserData;

      const settingsRef = db.collection("settings").doc("premium_settings");
      const settingsDoc = await settingsRef.get();

      if (!settingsDoc.exists) {
        console.error("Premium settings not found.");
        return null;
      }

      const settingsData = settingsDoc.data() as SettingsData;

      let payoutPercentage = settingsData.standardPayoutPercentage;
      if (userData.isPremiumAccount) {
        payoutPercentage = settingsData.premiumPayoutPercentage;
      }

      const amountToCredit = giftValue * payoutPercentage;

      await userRef.update({
        balance: admin.firestore.FieldValue.increment(amountToCredit),
      });

      console.log(
        `Credited ${amountToCredit} to user ${receiverId}. Premium: ${userData.isPremiumAccount}`
      );
      return null;
    } catch (error) {
      console.error("Error processing gift payout:", error);
      return null;
    }
  }
);

/**
 * Callable Cloud Function for administrators to manage premium accounts.
 */
export const managePremiumAccount = onCall(async (request) => {
  // 1. Authentication and Authorization: Only authenticated admins can call this function.
  if (!request.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Only authenticated users can manage premium accounts."
    );
  }

  const callerUid = request.auth.uid;
  const callerUserDoc = await db.collection("users").doc(callerUid).get();
  const callerUserData = callerUserDoc.data() as UserData;

  if (!callerUserData || !callerUserData.isAdmin) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only administrators can manage premium accounts."
    );
  }

  const { userId, action, slotId } = request.data;

  if (!userId || !action) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "The 'userId' and 'action' fields are required."
    );
  }

  const userRef = db.collection("users").doc(userId);
  const settingsRef = db.collection("settings").doc("premium_settings");

  try {
    return await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      const settingsDoc = await transaction.get(settingsRef);

      if (!userDoc.exists) {
        throw new functions.https.HttpsError(
          "not-found",
          `User with ID ${userId} not found.`
        );
      }

      if (!settingsDoc.exists) {
        throw new functions.https.HttpsError(
          "not-found",
          "Premium settings not found. Please initialize them."
        );
      }

      const userData = userDoc.data() as UserData;
      const settingsData = settingsDoc.data() as SettingsData;

      let currentPremiumSlots = settingsData.premiumSlots || {};
      const maxPremiumSlots = settingsData.maxPremiumSlots || 20; // Default to 20 if not set

      if (action === "assign") {
        if (!slotId) {
          throw new functions.https.HttpsError(
            "invalid-argument",
            "'slotId' is required for assigning a premium account."
          );
        }

        // Check if the slot is already taken by another user
        if (
          currentPremiumSlots[slotId] &&
          currentPremiumSlots[slotId] !== userId
        ) {
          throw new functions.https.HttpsError(
            "already-exists",
            `Premium slot ${slotId} is already occupied by another user.`
          );
        }

        // Check if the user is already premium in another slot
        const existingSlotForUser = Object.keys(currentPremiumSlots).find(
          (key) => currentPremiumSlots[key] === userId
        );
        if (existingSlotForUser && existingSlotForUser !== slotId) {
          throw new functions.https.HttpsError(
            "failed-precondition",
            `User ${userId} is already a premium account in slot ${existingSlotForUser}. Unassign first.`
          );
        }

        // Check if max premium slots reached
        const occupiedSlotsCount = Object.values(currentPremiumSlots).filter(
          (id) => id !== null
        ).length;
        if (
          !userData.isPremiumAccount &&
          occupiedSlotsCount >= maxPremiumSlots
        ) {
          throw new functions.https.HttpsError(
            "resource-exhausted",
            "Maximum number of premium slots reached."
          );
        }

        // Assign premium status
        transaction.update(userRef, {
          isPremiumAccount: true,
          premiumSlotId: slotId,
        });
        currentPremiumSlots[slotId] = userId;
        transaction.update(settingsRef, {
          premiumSlots: currentPremiumSlots,
        });

        return { success: true, message: `User ${userId} assigned to premium slot ${slotId}.` };
      } else if (action === "unassign") {
        // Unassign premium status
        transaction.update(userRef, {
          isPremiumAccount: false,
          premiumSlotId: null,
        });

        // Remove user from any premium slot they might occupy
        for (const key in currentPremiumSlots) {
          if (currentPremiumSlots[key] === userId) {
            currentPremiumSlots[key] = null; // Mark slot as empty
          }
        }
        transaction.update(settingsRef, {
          premiumSlots: currentPremiumSlots,
        });

        return { success: true, message: `User ${userId} unassigned from premium status.` };
      } else {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Invalid action. Must be 'assign' or 'unassign'."
        );
      }
    });
  } catch (error: any) {
    if (error.code) {
      throw error; // Re-throw HttpsError
    } else {
      console.error("Error managing premium account:", error);
      throw new functions.https.HttpsError(
        "internal",
        "An unexpected error occurred.",
        error.message
      );
    }
  }
});

// Initialize premium settings if they don't exist (can be done manually or via another function)
// Example of how to initialize settings (can be run once manually or via an admin function)
export const initializePremiumSettings = onCall(async (request) => {
  if (!request.auth || !request.auth.token.admin) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only administrators can initialize settings."
    );
  }

  const settingsRef = db.collection("settings").doc("premium_settings");
  const settingsDoc = await settingsRef.get();

  if (!settingsDoc.exists) {
    const initialSettings: SettingsData = {
      premiumPayoutPercentage: 0.90,
      standardPayoutPercentage: 0.50,
      maxPremiumSlots: 20,
      premiumSlots: {},
    };
    for (let i = 1; i <= 20; i++) {
      initialSettings.premiumSlots[`premium_slot_${i}`] = null;
    }
    await settingsRef.set(initialSettings);
    return { success: true, message: "Premium settings initialized." };
  } else {
    return { success: true, message: "Premium settings already exist." };
  }
});

/**
 * Callable Cloud Function to send a message in a conversation.
 */
export const sendMessage = onCall(async (request) => {
  if (!request.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Only authenticated users can send messages."
    );
  }

  const { conversationId, text, mediaUrl, mediaType, isEphemeral } = request.data;
  const senderId = request.auth.uid;

  if (!conversationId || (!text && !mediaUrl)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Conversation ID and either text or media are required."
    );
  }

  try {
    const conversationRef = db.collection("conversations").doc(conversationId);
    const conversationDoc = await conversationRef.get();

    if (!conversationDoc.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        "Conversation not found."
      );
    }

    const participants = conversationDoc.data()?.participants;
    if (!participants || !participants.includes(senderId)) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "User is not a participant in this conversation."
      );
    }

    const messageData: { [key: string]: any } = {
      senderId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      viewedBy: [],
      isEphemeral: isEphemeral || false,
    };

    if (text) messageData.text = text;
    if (mediaUrl) messageData.mediaUrl = mediaUrl;
    if (mediaType) messageData.mediaType = mediaType;

    await conversationRef.collection("messages").add(messageData);

    // Update lastMessage in conversation
    await conversationRef.update({
      lastMessage: {
        senderId,
        text: text || (mediaType ? `Sent a ${mediaType}` : ""),
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        type: mediaType || "text",
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update unread counts for other participants
    for (const participantId of participants) {
      if (participantId !== senderId) {
        const userChatRef = db.collection("users").doc(participantId).collection("userChats").doc(conversationId);
        await userChatRef.update({
          unreadCount: admin.firestore.FieldValue.increment(1),
        });
      }
    }

    return { success: true, message: "Message sent successfully." };
  } catch (error: any) {
    console.error("Error sending message:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to send message.",
      error.message
    );
  }
});

/**
 * Callable Cloud Function to update a user's location.
 */
export const updateLocation = onCall(async (request) => {
  if (!request.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Only authenticated users can update their location."
    );
  }

  const { latitude, longitude, locationPrivacy, sharedWithFriends, excludedFriends, isLiveLocationSharing, liveLocationExpiresAt } = request.data;
  const userId = request.auth.uid;

  if (typeof latitude !== "number" || typeof longitude !== "number") {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Latitude and longitude are required and must be numbers."
    );
  }

  try {
    const userRef = db.collection("users").doc(userId);
    const updateData: { [key: string]: any } = {
      lastKnownLocation: new admin.firestore.GeoPoint(latitude, longitude),
      locationUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (locationPrivacy) updateData.locationPrivacy = locationPrivacy;
    if (sharedWithFriends) updateData.sharedWithFriends = sharedWithFriends;
    if (excludedFriends) updateData.excludedFriends = excludedFriends;
    if (isLiveLocationSharing !== undefined) updateData.isLiveLocationSharing = isLiveLocationSharing;
    if (liveLocationExpiresAt) updateData.liveLocationExpiresAt = liveLocationExpiresAt;

    await userRef.update(updateData);

    return { success: true, message: "Location updated successfully." };
  } catch (error: any) {
    console.error("Error updating location:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to update location.",
      error.message
    );
  }
});

/**
 * Callable Cloud Function to send a friend request.
 */
export const sendFriendRequest = onCall(async (request) => {
  if (!request.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Only authenticated users can send friend requests."
    );
  }

  const { receiverId } = request.data;
  const senderId = request.auth.uid;

  if (!receiverId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Receiver ID is required."
    );
  }

  if (senderId === receiverId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Cannot send a friend request to yourself."
    );
  }

  try {
    const receiverDoc = await db.collection("users").doc(receiverId).get();
    if (!receiverDoc.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        "Receiver user not found."
      );
    }

    // Check if already friends
    const senderDoc = await db.collection("users").doc(senderId).get();
    const senderFriends = senderDoc.data()?.friends || [];
    if (senderFriends.includes(receiverId)) {
      throw new functions.https.HttpsError(
        "already-exists",
        "You are already friends with this user."
      );
    }

    // Check for existing pending request
    const existingRequest = await db.collection("friendRequests")
      .where("senderId", "==", senderId)
      .where("receiverId", "==", receiverId)
      .where("status", "==", "pending")
      .get();

    if (!existingRequest.empty) {
      throw new functions.https.HttpsError(
        "already-exists",
        "Friend request already sent."
      );
    }

    // Check if receiver has sent a request to sender
    const reverseRequest = await db.collection("friendRequests")
      .where("senderId", "==", receiverId)
      .where("receiverId", "==", senderId)
      .where("status", "==", "pending")
      .get();

    if (!reverseRequest.empty) {
      // If a reverse request exists, automatically accept it and make them friends
      await db.runTransaction(async (transaction) => {
        const senderUserRef = db.collection("users").doc(senderId);
        const receiverUserRef = db.collection("users").doc(receiverId);

        transaction.update(senderUserRef, {
          friends: admin.firestore.FieldValue.arrayUnion(receiverId),
          sentFriendRequests: admin.firestore.FieldValue.arrayRemove(receiverId),
        });
        transaction.update(receiverUserRef, {
          friends: admin.firestore.FieldValue.arrayUnion(senderId),
          receivedFriendRequests: admin.firestore.FieldValue.arrayRemove(senderId),
        });

        // Update the reverse request status to accepted
        reverseRequest.docs[0].ref.update({ status: "accepted" });
      });

      return { success: true, message: "Friend request accepted automatically." };
    }

    // Add new friend request
    await db.collection("friendRequests").add({
      senderId,
      receiverId,
      status: "pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Add to sender's sent requests and receiver's received requests
    await db.collection("users").doc(senderId).update({
      sentFriendRequests: admin.firestore.FieldValue.arrayUnion(receiverId),
    });
    await db.collection("users").doc(receiverId).update({
      receivedFriendRequests: admin.firestore.FieldValue.arrayUnion(senderId),
    });

    return { success: true, message: "Friend request sent." };
  } catch (error: any) {
    console.error("Error sending friend request:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to send friend request.",
      error.message
    );
  }
});

/**
 * Callable Cloud Function to respond to a friend request.
 */
export const respondToFriendRequest = onCall(async (request) => {
  if (!request.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Only authenticated users can respond to friend requests."
    );
  }

  const { requestId, action } = request.data;
  const receiverId = request.auth.uid;

  if (!requestId || !action || !["accept", "decline"].includes(action)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Request ID and a valid action ('accept' or 'decline') are required."
    );
  }

  const requestRef = db.collection("friendRequests").doc(requestId);

  try {
    return await db.runTransaction(async (transaction) => {
      const requestDoc = await transaction.get(requestRef);

      if (!requestDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Friend request not found.");
      }

      const requestData = requestDoc.data();
      if (requestData?.receiverId !== receiverId) {
        throw new functions.https.HttpsError(
          "permission-denied",
          "You are not authorized to respond to this request."
        );
      }
      if (requestData?.status !== "pending") {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "This request has already been processed."
        );
      }

      const senderId = requestData.senderId;
      const senderUserRef = db.collection("users").doc(senderId);
      const receiverUserRef = db.collection("users").doc(receiverId);

      if (action === "accept") {
        transaction.update(senderUserRef, {
          friends: admin.firestore.FieldValue.arrayUnion(receiverId),
          sentFriendRequests: admin.firestore.FieldValue.arrayRemove(receiverId),
        });
        transaction.update(receiverUserRef, {
          friends: admin.firestore.FieldValue.arrayUnion(senderId),
          receivedFriendRequests: admin.firestore.FieldValue.arrayRemove(senderId),
        });
        transaction.update(requestRef, { status: "accepted", respondedAt: admin.firestore.FieldValue.serverTimestamp() });
        return { success: true, message: "Friend request accepted." };
      } else if (action === "decline") {
        transaction.update(senderUserRef, {
          sentFriendRequests: admin.firestore.FieldValue.arrayRemove(receiverId),
        });
        transaction.update(receiverUserRef, {
          receivedFriendRequests: admin.firestore.FieldValue.arrayRemove(senderId),
        });
        transaction.update(requestRef, { status: "declined", respondedAt: admin.firestore.FieldValue.serverTimestamp() });
        return { success: true, message: "Friend request declined." };
      }
      return null; // Should not reach here
    });
  } catch (error: any) {
    console.error("Error responding to friend request:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to respond to friend request.",
      error.message
    );
  }
});

/**
 * Callable Cloud Function to remove a friend.
 */
export const removeFriend = onCall(async (request) => {
  if (!request.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Only authenticated users can remove friends."
    );
  }

  const { friendId } = request.data;
  const userId = request.auth.uid;

  if (!friendId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Friend ID is required."
    );
  }

  try {
    await db.runTransaction(async (transaction) => {
      const userRef = db.collection("users").doc(userId);
      const friendRef = db.collection("users").doc(friendId);

      transaction.update(userRef, {
        friends: admin.firestore.FieldValue.arrayRemove(friendId),
      });
      transaction.update(friendRef, {
        friends: admin.firestore.FieldValue.arrayRemove(userId),
      });
    });

    return { success: true, message: "Friend removed successfully." };
  } catch (error: any) {
    console.error("Error removing friend:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to remove friend.",
      error.message
    );
  }
});

/**
 * Callable Cloud Function to purchase coins.
 */
export const purchaseCoins = onCall(async (request) => {
  if (!request.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Only authenticated users can purchase coins."
    );
  }

  const { amount, paymentMethodId, currency } = request.data;
  const userId = request.auth.uid;

  if (!amount || typeof amount !== "number" || amount <= 0) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Amount must be a positive number."
    );
  }
  if (!paymentMethodId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Payment method ID is required."
    );
  }
  if (!currency) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Currency is required."
    );
  }

  try {
    // In a real application, you would integrate with a payment gateway (e.g., Stripe, PayPal)
    // to process the actual payment using paymentMethodId.
    // For now, we'll simulate a successful payment.

    // Example: Stripe payment intent creation and confirmation
    // const stripe = require('stripe')(functions.config().stripe.secret_key);
    // const paymentIntent = await stripe.paymentIntents.create({
    //   amount: amount * 100, // amount in cents
    //   currency: currency,
    //   payment_method: paymentMethodId,
    //   confirm: true,
    //   return_url: 'https://your-app.com/payment-success',
    // });

    // if (paymentIntent.status !== 'succeeded') {
    //   throw new functions.https.HttpsError('internal', 'Payment failed.');
    // }

    await db.collection("users").doc(userId).update({
      coins: admin.firestore.FieldValue.increment(amount),
    });

    await db.collection("transactions").add({
      userId,
      type: "coin_purchase",
      amount,
      currency: "coins",
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      details: { originalAmount: amount, originalCurrency: currency, paymentMethodId },
    });

    return { success: true, message: `Successfully purchased ${amount} coins.` };
  } catch (error: any) {
    console.error("Error purchasing coins:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to purchase coins.",
      error.message
    );
  }
});

/**
 * Callable Cloud Function to send a gift.
 */
export const sendGift = onCall(async (request) => {
  if (!request.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Only authenticated users can send gifts."
    );
  }

  const { receiverId, giftId } = request.data;
  const senderId = request.auth.uid;

  if (!receiverId || !giftId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Receiver ID and Gift ID are required."
    );
  }

  try {
    return await db.runTransaction(async (transaction) => {
      const senderRef = db.collection("users").doc(senderId);
      const receiverRef = db.collection("users").doc(receiverId);
      const giftDocRef = db.collection("gifts").doc(giftId);

      const senderDoc = await transaction.get(senderRef);
      const receiverDoc = await transaction.get(receiverRef);
      const giftDoc = await transaction.get(giftDocRef);

      if (!senderDoc.exists || !receiverDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Sender or receiver not found.");
      }
      if (!giftDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Gift not found.");
      }

      const senderData = senderDoc.data() as UserData;
      const giftCost = giftDoc.data()?.cost;

      if (!giftCost || senderData.coins === undefined || senderData.coins < giftCost) {
        throw new functions.https.HttpsError("failed-precondition", "Insufficient coins to send this gift.");
      }

      // Deduct coins from sender
      transaction.update(senderRef, {
        coins: admin.firestore.FieldValue.increment(-giftCost),
      });

      // Add sent gift record (this will trigger processGiftPayout)
      const sentGiftData = {
        senderId,
        receiverId,
        giftId,
        giftName: giftDoc.data()?.name,
        giftCost,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      };
      transaction.set(db.collection("sentGifts").doc(), sentGiftData);

      // Record transaction
      transaction.set(db.collection("transactions").doc(), {
        userId: senderId,
        type: "gift_sent",
        amount: -giftCost,
        currency: "coins",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        details: { receiverId, giftId, giftName: giftDoc.data()?.name },
      });

      return { success: true, message: `Gift ${giftDoc.data()?.name} sent to ${receiverId}.` };
    });
  } catch (error: any) {
    console.error("Error sending gift:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to send gift.",
      error.message
    );
  }
});

/**
 * Callable Cloud Function to request a payout.
 */
export const requestPayout = onCall(async (request) => {
  if (!request.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Only authenticated users can request payouts."
    );
  }

  const { amount, payoutMethod, payoutDetails } = request.data;
  const userId = request.auth.uid;

  if (!amount || typeof amount !== "number" || amount <= 0) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Amount must be a positive number."
    );
  }
  if (!payoutMethod || !["paypal", "bank_transfer"].includes(payoutMethod)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Payout method must be 'paypal' or 'bank_transfer'."
    );
  }
  if (!payoutDetails) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Payout details are required."
    );
  }

  try {
    return await db.runTransaction(async (transaction) => {
      const userRef = db.collection("users").doc(userId);
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists) {
        throw new functions.https.HttpsError("not-found", "User not found.");
      }

      const userData = userDoc.data() as UserData;
      if (userData.balance === undefined || userData.balance < amount) {
        throw new functions.https.HttpsError("failed-precondition", "Insufficient balance for payout.");
      }

      // Deduct amount from user's balance
      transaction.update(userRef, {
        balance: admin.firestore.FieldValue.increment(-amount),
      });

      // Create payout request
      const payoutRequestData = {
        userId,
        amount,
        payoutMethod,
        payoutDetails,
        status: "pending", // pending, approved, rejected, completed
        requestedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      const payoutRequestRef = db.collection("payoutRequests").doc();
      transaction.set(payoutRequestRef, payoutRequestData);

      // Record transaction
      transaction.set(db.collection("transactions").doc(), {
        userId,
        type: "payout_request",
        amount: -amount,
        currency: "usd", // Assuming balance is in USD
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        details: { payoutMethod, payoutRequestId: payoutRequestRef.id },
      });

      return { success: true, message: "Payout request submitted successfully." };
    });
  } catch (error: any) {
    console.error("Error requesting payout:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to submit payout request.",
      error.message
    );
  }
});

/**
 * Callable Cloud Function for administrators to process payout requests.
 */
export const processPayout = onCall(async (request) => {
  if (!request.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Only authenticated users can process payouts."
    );
  }

  const callerUid = request.auth.uid;
  const callerUserDoc = await db.collection("users").doc(callerUid).get();
  const callerUserData = callerUserDoc.data() as UserData;

  if (!callerUserData || !callerUserData.isAdmin) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only administrators can process payouts."
    );
  }

  const { payoutRequestId, action } = request.data;

  if (!payoutRequestId || !action || !["approve", "reject"].includes(action)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Payout request ID and a valid action ('approve' or 'reject') are required."
    );
  }

  const payoutRequestRef = db.collection("payoutRequests").doc(payoutRequestId);

  try {
    return await db.runTransaction(async (transaction) => {
      const payoutRequestDoc = await transaction.get(payoutRequestRef);

      if (!payoutRequestDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Payout request not found.");
      }

      const payoutRequestData = payoutRequestDoc.data();
      if (payoutRequestData?.status !== "pending") {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "This payout request has already been processed."
        );
      }

      const userId = payoutRequestData.userId;
      const amount = payoutRequestData.amount;
      const payoutMethod = payoutRequestData.payoutMethod;
      const payoutDetails = payoutRequestData.payoutDetails;

      if (action === "approve") {
        // In a real application, you would integrate with PayPal Payouts or a bank transfer API here.
        // Example: PayPal Payouts
        // const paypal = require('@paypal/payouts-sdk');
        // const environment = new paypal.core.LiveEnvironment(functions.config().paypal.client_id, functions.config().paypal.client_secret);
        // const client = new paypal.core.PayPalHttpClient(environment);
        // const request = new paypal.payouts.PayoutsPostRequest();
        // request.requestBody({
        //   sender_batch_header: {
        //     sender_batch_id: `Spaktok_Payout_${payoutRequestId}`,
        //     email_subject: 'Your Spaktok Payout',
        //   },
        //   items: [{
        //     recipient_type: 'EMAIL',
        //     receiver: payoutDetails.email, // Assuming PayPal email is in payoutDetails
        //     amount: {
        //       value: amount.toFixed(2),
        //       currency: 'USD',
        //     },
        //   }],
        // });
        // const payoutResponse = await client.execute(request);
        // if (payoutResponse.statusCode !== 201) {
        //   throw new functions.https.HttpsError('internal', 'PayPal payout failed.');
        // }

        transaction.update(payoutRequestRef, { status: "completed", processedAt: admin.firestore.FieldValue.serverTimestamp(), processorId: callerUid });

        // Record platform revenue share (e.g., 10% of payout amount)
        const platformShare = amount * 0.10; // Example: 10% platform fee on payouts
        transaction.set(db.collection("platformRevenue").doc(), {
          type: "payout_fee",
          amount: platformShare,
          currency: "usd",
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          details: { payoutRequestId, userId },
        });

        return { success: true, message: "Payout approved and processed." };
      } else if (action === "reject") {
        // Return funds to user's balance
        const userRef = db.collection("users").doc(userId);
        transaction.update(userRef, {
          balance: admin.firestore.FieldValue.increment(amount),
        });
        transaction.update(payoutRequestRef, { status: "rejected", processedAt: admin.firestore.FieldValue.serverTimestamp(), processorId: callerUid });

        // Record transaction for returned funds
        transaction.set(db.collection("transactions").doc(), {
          userId,
          type: "payout_rejected_refund",
          amount,
          currency: "usd",
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          details: { payoutRequestId },
        });

        return { success: true, message: "Payout rejected and funds returned to user." };
      }
      return null; // Should not reach here
    });
  } catch (error: any) {
    console.error("Error processing payout:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to process payout.",
      error.message
    );
  }
});

/**
 * Callable Cloud Function to retrieve active ads based on type and targeting criteria.
 */
export const getAds = onCall(async (request) => {
  if (!request.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Only authenticated users can retrieve ads."
    );
  }

  const { type } = request.data;
  const userId = request.auth.uid;

  try {
    let adsQuery: admin.firestore.Query = db.collection("ads").where("isActive", "==", true);

    if (type) {
      adsQuery = adsQuery.where("type", "==", type);
    }

    // Basic targeting (can be expanded)
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data() as UserData;

    // Example: Filter by country if available in user data and ad targeting
    // if (userData.country) {
    //   adsQuery = adsQuery.where("targetAudience.country", "==", userData.country);
    // }

    const now = admin.firestore.Timestamp.now();
    adsQuery = adsQuery.where("startDate", "<=", now).where("endDate", ">=", now);

    const snapshot = await adsQuery.get();
    const ads = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return { success: true, ads };
  } catch (error: any) {
    console.error("Error getting ads:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to retrieve ads.",
      error.message
    );
  }
});

/**
 * Callable Cloud Function to record an ad impression and credit coins for rewarded ads.
 */
export const recordAdImpression = onCall(async (request) => {
  if (!request.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Only authenticated users can record ad impressions."
    );
  }

  const { adId, duration, isRewarded } = request.data;
  const userId = request.auth.uid;

  if (!adId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Ad ID is required."
    );
  }

  try {
    const adRef = db.collection("ads").doc(adId);
    const adDoc = await adRef.get();

    if (!adDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Ad not found.");
    }

    const adData = adDoc.data();
    const impressionData: { [key: string]: any } = {
      adId,
      userId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      duration: duration || null,
      isRewarded: isRewarded || false,
    };

    await db.collection("adImpressions").add(impressionData);

    if (isRewarded && adData?.rewardCoins) {
      const rewardCoins = adData.rewardCoins;
      const userRef = db.collection("users").doc(userId);

      await userRef.update({
        coins: admin.firestore.FieldValue.increment(rewardCoins),
      });

      // Record the transaction for rewarded coins
      await db.collection("transactions").add({
        userId,
        type: "ad_reward",
        amount: rewardCoins,
        currency: "coins",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        details: { adId, rewardType: "coins" },
      });

      return { success: true, message: `Ad impression recorded and ${rewardCoins} coins rewarded.` };
    }

    return { success: true, message: "Ad impression recorded." };
  } catch (error: any) {
    console.error("Error recording ad impression:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to record ad impression.",
      error.message
    );
  }
});

/**
 * Callable Cloud Function to record an ad click.
 */
export const recordAdClick = onCall(async (request) => {
  if (!request.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Only authenticated users can record ad clicks."
    );
  }

  const { adId } = request.data;
  const userId = request.auth.uid;

  if (!adId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Ad ID is required."
    );
  }

  try {
    const clickData = {
      adId,
      userId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    };
    await db.collection("adClicks").add(clickData);

    return { success: true, message: "Ad click recorded." };
  } catch (error: any) {
    console.error("Error recording ad click:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to record ad click.",
      error.message
    );
  }
});

/**
 * Scheduled Cloud Function for administrators to process ad revenue.
 * This function should be configured to run periodically (e.g., daily or weekly).
 */
export const processAdRevenue = onSchedule("every 24 hours", async (context) => {
  try {
    // This function is intended for admin-level processing, so no request.auth check is needed.
    // However, it should only be triggered by a trusted source (e.g., Firebase Scheduler).

    const now = admin.firestore.Timestamp.now();
    const twentyFourHoursAgo = admin.firestore.Timestamp.fromMillis(now.toMillis() - (24 * 60 * 60 * 1000));

    // Fetch ad impressions and clicks within the last 24 hours
    const impressionsSnapshot = await db.collection("adImpressions")
      .where("timestamp", ">=", twentyFourHoursAgo)
      .where("timestamp", "<=", now)
      .get();

    const clicksSnapshot = await db.collection("adClicks")
      .where("timestamp", ">=", twentyFourHoursAgo)
      .where("timestamp", "<=", now)
      .get();

    let totalRevenue = 0;
    const adRevenueDetails: { [adId: string]: { impressions: number, clicks: number, revenue: number } } = {};

    // Process impressions
    for (const doc of impressionsSnapshot.docs) {
      const impression = doc.data();
      const adId = impression.adId;
      const adDoc = await db.collection("ads").doc(adId).get();
      const adData = adDoc.data();

      if (adData?.cpm) {
        const cpm = adData.cpm;
        const revenuePerImpression = cpm / 1000;
        totalRevenue += revenuePerImpression;
        if (!adRevenueDetails[adId]) adRevenueDetails[adId] = { impressions: 0, clicks: 0, revenue: 0 };
        adRevenueDetails[adId].impressions++;
        adRevenueDetails[adId].revenue += revenuePerImpression;
      }
    }

    // Process clicks
    for (const doc of clicksSnapshot.docs) {
      const click = doc.data();
      const adId = click.adId;
      const adDoc = await db.collection("ads").doc(adId).get();
      const adData = adDoc.data();

      if (adData?.cpc) {
        const cpc = adData.cpc;
        totalRevenue += cpc;
        if (!adRevenueDetails[adId]) adRevenueDetails[adId] = { impressions: 0, clicks: 0, revenue: 0 };
        adRevenueDetails[adId].clicks++;
        adRevenueDetails[adId].revenue += cpc;
      }
    }

    // Record Spaktok's share of revenue
    if (totalRevenue > 0) {
      await db.collection("platformRevenue").add({
        type: "ad_revenue",
        amount: totalRevenue,
        currency: "usd", // Assuming ads are billed in USD
        timestamp: now,
        details: adRevenueDetails,
        periodStart: twentyFourHoursAgo,
        periodEnd: now,
      });
      console.log(`Processed ad revenue: ${totalRevenue} for the last 24 hours.`);
    } else {
      console.log("No ad revenue to process for the last 24 hours.");
    }

    return null;
  } catch (error: any) {
    console.error("Error processing ad revenue:", error);
    // In a real application, you might want to log this error to a monitoring system
    return null;
  }
});

/**
 * Callable Cloud Function to allow users to submit a report against an entity.
 */
export const submitReport = onCall(async (request) => {
  if (!request.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Only authenticated users can submit reports."
    );
  }

  const { reportedEntityId, reportedEntityType, reason, description } = request.data;
  const reporterId = request.auth.uid;

  if (!reportedEntityId || !reportedEntityType || !reason) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Reported entity ID, type, and reason are required."
    );
  }

  try {
    const reportData = {
      reporterId,
      reportedEntityId,
      reportedEntityType,
      reason,
      description: description || null,
      status: "pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await db.collection("reports").add(reportData);

    return { success: true, message: "Report submitted successfully." };
  } catch (error: any) {
    console.error("Error submitting report:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to submit report.",
      error.message
    );
  }
});

/**
 * Firestore Trigger Cloud Function to automatically process new reports and apply penalties.
 */
export const processReport = onDocumentCreated(
  "reports/{reportId}",
  async (event) => {
    const reportData = event.data?.data();
    const reportId = event.params.reportId;

    if (!reportData) {
      console.error("No data found for report.");
      return null;
    }

    const reportedEntityId = reportData.reportedEntityId;
    const reportedEntityType = reportData.reportedEntityType;
    const reason = reportData.reason;

    let reportedUserId: string | null = null;

    // Determine the user ID associated with the reported entity
    if (reportedEntityType === "user") {
      reportedUserId = reportedEntityId;
    } else if (reportedEntityType === "video") {
      const videoDoc = await db.collection("videos").doc(reportedEntityId).get();
      reportedUserId = videoDoc.data()?.userId;
    } else if (reportedEntityType === "comment") {
      const commentDoc = await db.collection("comments").doc(reportedEntityId).get();
      reportedUserId = commentDoc.data()?.userId;
    } else if (reportedEntityType === "message") {
      // For messages, we need to find the sender of the message
      // This might require a more complex query depending on how messages are stored
      // For simplicity, let's assume messageId directly links to the sender for now
      // In a real app, you'd likely have a 'messages' collection with senderId
      const messageDoc = await db.collection("messages").doc(reportedEntityId).get();
      reportedUserId = messageDoc.data()?.senderId;
    } else if (reportedEntityType === "stream") {
      const streamDoc = await db.collection("streams").doc(reportedEntityId).get();
      reportedUserId = streamDoc.data()?.hostId;
    }

    if (!reportedUserId) {
      console.error(`Could not determine user ID for reported entity ${reportedEntityId} of type ${reportedEntityType}.`);
      await db.collection("reports").doc(reportId).update({
        status: "rejected",
        actionTaken: "no_user_found",
        resolvedAt: admin.firestore.FieldValue.serverTimestamp(),
        resolvedBy: "system_auto",
      });
      return null;
    }

    const userRef = db.collection("users").doc(reportedUserId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      console.error(`Reported user with ID ${reportedUserId} not found.`);
      await db.collection("reports").doc(reportId).update({
        status: "rejected",
        actionTaken: "reported_user_not_found",
        resolvedAt: admin.firestore.FieldValue.serverTimestamp(),
        resolvedBy: "system_auto",
      });
      return null;
    }

    const userData = userDoc.data() as UserData;
    let warningCount = userData.warningCount || 0;
    let actionTaken = "";
    let banExpiresAt: admin.firestore.Timestamp | null = null;
    let isBanned = false;
    let banReason = "";

    // Simple tiered penalty logic
    warningCount++;

    if (warningCount === 1) {
      actionTaken = "warning_1";
      banReason = "First content violation warning.";
    } else if (warningCount === 2) {
      actionTaken = "warning_2";
      banReason = "Second content violation warning.";
    } else if (warningCount === 3) {
      actionTaken = "temporary_ban";
      isBanned = true;
      banExpiresAt = admin.firestore.Timestamp.fromMillis(admin.firestore.Timestamp.now().toMillis() + (3 * 24 * 60 * 60 * 1000)); // 3 days ban
      banReason = "Temporary ban for repeated content violations.";
      warningCount = 0; // Reset warnings after a ban
    } else if (warningCount >= 4) {
      actionTaken = "permanent_ban";
      isBanned = true;
      banExpiresAt = null; // Permanent ban
      banReason = "Permanent ban for severe or repeated content violations.";
      warningCount = 0; // Reset warnings after a ban
    }

    // Update user's penalty status
    await userRef.update({
      warningCount: warningCount,
      isBanned: isBanned,
      banExpiresAt: banExpiresAt,
      banReason: banReason,
    });

    // Record the violation
    await db.collection("violations").add({
      userId: reportedUserId,
      reportId: reportId,
      type: reason, // Using report reason as violation type for now
      level: warningCount, // Or a more specific severity level
      action: actionTaken,
      banExpiresAt: banExpiresAt,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update report status
    await db.collection("reports").doc(reportId).update({
      status: "resolved",
      actionTaken: actionTaken,
      resolvedAt: admin.firestore.FieldValue.serverTimestamp(),
      resolvedBy: "system_auto",
    });

    // TODO: Send notification to reported user about warning/ban

    console.log(`Report ${reportId} processed. User ${reportedUserId} received action: ${actionTaken}`);
    return null;
  }
);

/**
 * Callable Cloud Function to check if a user is currently banned.
 */
export const checkBanStatus = onCall(async (request) => {
  if (!request.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Only authenticated users can check ban status."
    );
  }

  const userId = request.data.userId || request.auth.uid;

  try {
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      throw new functions.https.HttpsError("not-found", "User not found.");
    }

    const userData = userDoc.data() as UserData;
    const isBanned = userData.isBanned || false;
    const banExpiresAt = userData.banExpiresAt || null;
    const banReason = userData.banReason || null;

    // If banned, check if ban has expired
    if (isBanned && banExpiresAt && banExpiresAt.toMillis() < admin.firestore.Timestamp.now().toMillis()) {
      // Ban has expired, unban the user automatically
      await db.collection("users").doc(userId).update({
        isBanned: false,
        banExpiresAt: null,
        banReason: null,
        warningCount: 0, // Reset warnings after ban expiration
      });
      return { isBanned: false, banExpiresAt: null, banReason: null, message: "Ban expired and user unbanned." };
    }

    return { isBanned, banExpiresAt, banReason };
  } catch (error: any) {
    console.error("Error checking ban status:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to check ban status.",
      error.message
    );
  }
});

/**
 * Callable Cloud Function for administrators to manually unban a user.
 */
export const unbanUser = onCall(async (request) => {
  if (!request.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Only authenticated users can unban users."
    );
  }

  const callerUid = request.auth.uid;
  const callerUserDoc = await db.collection("users").doc(callerUid).get();
  const callerUserData = callerUserDoc.data() as UserData;

  if (!callerUserData || !callerUserData.isAdmin) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only administrators can unban users."
    );
  }

  const { userId } = request.data;

  if (!userId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "User ID is required."
    );
  }

  try {
    const userRef = db.collection("users").doc(userId);
    await userRef.update({
      isBanned: false,
      banExpiresAt: null,
      banReason: null,
      warningCount: 0,
    });

    return { success: true, message: `User ${userId} has been unbanned.` };
  } catch (error: any) {
    console.error("Error unbanning user:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to unban user.",
      error.message
    );
  }
});

/**
 * Scheduled Cloud Function to generate a summary of reports and violations for the past month.
 */
export const generateMonthlyReports = onSchedule("0 0 1 * *", async (context) => {
  try {
    const now = admin.firestore.Timestamp.now();
    const oneMonthAgo = admin.firestore.Timestamp.fromMillis(now.toMillis() - (30 * 24 * 60 * 60 * 1000)); // Approximately one month

    // Fetch reports from the last month
    const reportsSnapshot = await db.collection("reports")
      .where("createdAt", ">=", oneMonthAgo)
      .where("createdAt", "<=", now)
      .get();

    // Fetch violations from the last month
    const violationsSnapshot = await db.collection("violations")
      .where("createdAt", ">=", oneMonthAgo)
      .where("createdAt", "<=", now)
      .get();

    const totalReports = reportsSnapshot.size;
    const totalViolations = violationsSnapshot.size;

    const reportsByReason: { [key: string]: number } = {};
    reportsSnapshot.forEach(doc => {
      const reason = doc.data().reason;
      reportsByReason[reason] = (reportsByReason[reason] || 0) + 1;
    });

    const violationsByAction: { [key: string]: number } = {};
    violationsSnapshot.forEach(doc => {
      const action = doc.data().action;
      violationsByAction[action] = (violationsByAction[action] || 0) + 1;
    });

    // Get currently banned users
    const bannedUsersSnapshot = await db.collection("users")
      .where("isBanned", "==", true)
      .get();
    const activeBansCount = bannedUsersSnapshot.size;

    const monthlyReportData = {
      periodStart: oneMonthAgo,
      periodEnd: now,
      totalReports,
      totalViolations,
      reportsByReason,
      violationsByAction,
      activeBansCount,
      generatedAt: now,
    };

    await db.collection("monthlyReports").add(monthlyReportData);

    console.log("Monthly report generated successfully.", monthlyReportData);
    return null;
  } catch (error: any) {
    console.error("Error generating monthly report:", error);
    return null;
  }
});


// ============================================================================
// SHORT VIDEOS (REELS/FEED) SYSTEM FUNCTIONS
// ============================================================================

/**
 * Upload Video - Initiate video upload and return signed URL
 */
export const uploadVideo = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new Error("Authentication required");
  }

  try {
    const { fileName, contentType } = request.data;

    // Check user upload limits (10 videos per day for standard users)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const uploadsToday = await db.collection("videos")
      .where("userId", "==", userId)
      .where("uploadedAt", ">=", admin.firestore.Timestamp.fromDate(today))
      .count()
      .get();

    if (uploadsToday.data().count >= 10) {
      throw new Error("Daily upload limit reached");
    }

    // Generate unique videoId
    const videoId = db.collection("videos").doc().id;
    const storagePath = `videos/${userId}/${videoId}/${fileName}`;

    // Create initial video document
    await db.collection("videos").doc(videoId).set({
      videoId,
      userId,
      status: "processing",
      uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Generate signed upload URL (valid for 15 minutes)
    const bucket = admin.storage().bucket();
    const file = bucket.file(storagePath);
    const [signedUrl] = await file.getSignedUrl({
      version: "v4",
      action: "write",
      expires: Date.now() + 15 * 60 * 1000,
      contentType: contentType || "video/mp4",
    });

    return {
      success: true,
      videoId,
      uploadUrl: signedUrl,
      storagePath,
    };
  } catch (error: any) {
    console.error("Error in uploadVideo:", error);
    throw new Error(error.message || "Failed to initiate video upload");
  }
});

/**
 * Process Video Upload - Handle video after upload completes
 */
export const processVideoUpload = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new Error("Authentication required");
  }

  try {
    const {
      videoId,
      videoUrl,
      thumbnailUrl,
      caption,
      hashtags,
      mentions,
      soundId,
      duration,
      width,
      height,
      fileSize,
      privacy,
      allowComments,
      allowDuet,
      allowStitch,
      location,
      challengeId,
      effects,
      language,
    } = request.data;

    // Get user data
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data() as UserData;

    // Update video document with complete data
    await db.collection("videos").doc(videoId).update({
      username: userData.displayName || "Unknown",
      userProfileImage: userData.profileImage || "",
      videoUrl,
      thumbnailUrl,
      caption: caption || "",
      hashtags: hashtags || [],
      mentions: mentions || [],
      soundId: soundId || null,
      duration: duration || 0,
      width: width || 0,
      height: height || 0,
      fileSize: fileSize || 0,
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      saves: 0,
      location: location || null,
      privacy: privacy || "public",
      allowComments: allowComments !== false,
      allowDuet: allowDuet !== false,
      allowStitch: allowStitch !== false,
      isAgeRestricted: false,
      status: "active",
      moderationStatus: "approved", // TODO: Implement auto-moderation
      publishedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastModified: admin.firestore.FieldValue.serverTimestamp(),
      engagementScore: 0,
      trendingScore: 0,
      challengeId: challengeId || null,
      effects: effects || [],
      language: language || "en",
    });

    // Update hashtag statistics
    if (hashtags && hashtags.length > 0) {
      const batch = db.batch();
      for (const tag of hashtags) {
        const hashtagRef = db.collection("hashtags").doc(tag.toLowerCase());
        batch.set(hashtagRef, {
          tag: tag.toLowerCase(),
          usageCount: admin.firestore.FieldValue.increment(1),
          lastUsed: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
      }
      await batch.commit();
    }

    // Update sound statistics
    if (soundId) {
      await db.collection("sounds").doc(soundId).update({
        usageCount: admin.firestore.FieldValue.increment(1),
      });
    }

    // Update challenge statistics
    if (challengeId) {
      await db.collection("challenges").doc(challengeId).update({
        participantCount: admin.firestore.FieldValue.increment(1),
        videoCount: admin.firestore.FieldValue.increment(1),
      });
    }

    // Generate feed entries for followers (async, don't wait)
    generateFeedEntriesForFollowers(userId, videoId);

    return {
      success: true,
      videoId,
      message: "Video processed successfully",
    };
  } catch (error: any) {
    console.error("Error in processVideoUpload:", error);
    throw new Error(error.message || "Failed to process video");
  }
});

/**
 * Helper function to generate feed entries for followers
 */
async function generateFeedEntriesForFollowers(userId: string, videoId: string) {
  try {
    // Get user's followers
    const followersSnapshot = await db.collection("followers")
      .where("followingId", "==", userId)
      .get();

    const batch = db.batch();
    let count = 0;

    for (const doc of followersSnapshot.docs) {
      const followerId = doc.data().followerId;
      const feedRef = db.collection("users").doc(followerId)
        .collection("feed").doc(videoId);

      batch.set(feedRef, {
        videoId,
        score: 100, // High score for followed users
        reason: "following",
        addedAt: admin.firestore.FieldValue.serverTimestamp(),
        viewed: false,
      });

      count++;
      if (count >= 500) {
        await batch.commit();
        count = 0;
      }
    }

    if (count > 0) {
      await batch.commit();
    }
  } catch (error) {
    console.error("Error generating feed entries:", error);
  }
}

/**
 * Delete Video
 */
export const deleteVideo = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new Error("Authentication required");
  }

  try {
    const { videoId } = request.data;

    // Get video document
    const videoDoc = await db.collection("videos").doc(videoId).get();
    if (!videoDoc.exists) {
      throw new Error("Video not found");
    }

    const videoData = videoDoc.data();

    // Verify user is owner or admin
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data() as UserData;

    if (videoData?.userId !== userId && !userData?.isAdmin) {
      throw new Error("Permission denied");
    }

    // Update video status
    await db.collection("videos").doc(videoId).update({
      status: "removed",
      lastModified: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Delete from Storage (async)
    deleteVideoFromStorage(videoId, videoData?.userId);

    return {
      success: true,
      message: "Video deleted successfully",
    };
  } catch (error: any) {
    console.error("Error in deleteVideo:", error);
    throw new Error(error.message || "Failed to delete video");
  }
});

/**
 * Helper function to delete video from Storage
 */
async function deleteVideoFromStorage(videoId: string, userId: string) {
  try {
    const bucket = admin.storage().bucket();
    await bucket.deleteFiles({
      prefix: `videos/${userId}/${videoId}/`,
    });
  } catch (error) {
    console.error("Error deleting video from storage:", error);
  }
}

/**
 * Like Video
 */
export const likeVideo = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new Error("Authentication required");
  }

  try {
    const { videoId, action } = request.data; // action: 'like' or 'unlike'

    const likeId = `${userId}_${videoId}`;
    const likeRef = db.collection("videoLikes").doc(likeId);
    const likeDoc = await likeRef.get();

    if (action === "like") {
      if (likeDoc.exists) {
        return { success: true, message: "Already liked" };
      }

      // Create like document
      await likeRef.set({
        userId,
        videoId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Increment like count
      await db.collection("videos").doc(videoId).update({
        likes: admin.firestore.FieldValue.increment(1),
        engagementScore: admin.firestore.FieldValue.increment(2),
      });

      // Send notification to video owner (async)
      sendLikeNotification(videoId, userId);

      return { success: true, liked: true };
    } else {
      if (!likeDoc.exists) {
        return { success: true, message: "Not liked" };
      }

      // Delete like document
      await likeRef.delete();

      // Decrement like count
      await db.collection("videos").doc(videoId).update({
        likes: admin.firestore.FieldValue.increment(-1),
        engagementScore: admin.firestore.FieldValue.increment(-2),
      });

      return { success: true, liked: false };
    }
  } catch (error: any) {
    console.error("Error in likeVideo:", error);
    throw new Error(error.message || "Failed to like video");
  }
});

/**
 * Helper function to send like notification
 */
async function sendLikeNotification(videoId: string, likerId: string) {
  try {
    const videoDoc = await db.collection("videos").doc(videoId).get();
    const videoData = videoDoc.data();

    if (!videoData || videoData.userId === likerId) {
      return; // Don't notify if user likes their own video
    }

    const likerDoc = await db.collection("users").doc(likerId).get();
    const likerData = likerDoc.data();

    await db.collection("notifications").add({
      userId: videoData.userId,
      type: "video_like",
      actorId: likerId,
      actorName: likerData?.displayName || "Someone",
      actorProfileImage: likerData?.profileImage || "",
      videoId,
      videoThumbnail: videoData.thumbnailUrl,
      message: `${likerData?.displayName || "Someone"} liked your video`,
      isRead: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error("Error sending like notification:", error);
  }
}

/**
 * Comment on Video
 */
export const commentOnVideo = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new Error("Authentication required");
  }

  try {
    const { videoId, text, parentCommentId } = request.data;

    if (!text || text.trim().length === 0) {
      throw new Error("Comment text is required");
    }

    if (text.length > 500) {
      throw new Error("Comment is too long (max 500 characters)");
    }

    // Get user data
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data() as UserData;

    // Create comment document
    const commentRef = await db.collection("videoComments").add({
      videoId,
      userId,
      username: userData.displayName || "Unknown",
      userProfileImage: userData.profileImage || "",
      text: text.trim(),
      parentCommentId: parentCommentId || null,
      likes: 0,
      replies: 0,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      isEdited: false,
      isPinned: false,
      moderationStatus: "active",
    });

    // Increment comment count on video
    await db.collection("videos").doc(videoId).update({
      comments: admin.firestore.FieldValue.increment(1),
      engagementScore: admin.firestore.FieldValue.increment(3),
    });

    // If reply, increment reply count on parent comment
    if (parentCommentId) {
      await db.collection("videoComments").doc(parentCommentId).update({
        replies: admin.firestore.FieldValue.increment(1),
      });
    }

    // Send notification (async)
    sendCommentNotification(videoId, userId, parentCommentId);

    return {
      success: true,
      commentId: commentRef.id,
      message: "Comment posted successfully",
    };
  } catch (error: any) {
    console.error("Error in commentOnVideo:", error);
    throw new Error(error.message || "Failed to post comment");
  }
});

/**
 * Helper function to send comment notification
 */
async function sendCommentNotification(videoId: string, commenterId: string, parentCommentId: string | null) {
  try {
    const videoDoc = await db.collection("videos").doc(videoId).get();
    const videoData = videoDoc.data();
    const commenterDoc = await db.collection("users").doc(commenterId).get();
    const commenterData = commenterDoc.data();

    if (!videoData) return;

    // Determine recipient
    let recipientId = videoData.userId;
    let notificationType = "video_comment";

    if (parentCommentId) {
      const parentCommentDoc = await db.collection("videoComments").doc(parentCommentId).get();
      const parentCommentData = parentCommentDoc.data();
      if (parentCommentData) {
        recipientId = parentCommentData.userId;
        notificationType = "comment_reply";
      }
    }

    // Don't notify if user comments on their own content
    if (recipientId === commenterId) {
      return;
    }

    await db.collection("notifications").add({
      userId: recipientId,
      type: notificationType,
      actorId: commenterId,
      actorName: commenterData?.displayName || "Someone",
      actorProfileImage: commenterData?.profileImage || "",
      videoId,
      videoThumbnail: videoData.thumbnailUrl,
      message: `${commenterData?.displayName || "Someone"} commented on your video`,
      isRead: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error("Error sending comment notification:", error);
  }
}

/**
 * Share Video
 */
export const shareVideo = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new Error("Authentication required");
  }

  try {
    const { videoId, shareMethod } = request.data;

    // Create share record
    await db.collection("videoShares").add({
      userId,
      videoId,
      shareMethod: shareMethod || "internal",
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Increment share count
    await db.collection("videos").doc(videoId).update({
      shares: admin.firestore.FieldValue.increment(1),
      engagementScore: admin.firestore.FieldValue.increment(5),
      trendingScore: admin.firestore.FieldValue.increment(10),
    });

    // Generate share URL
    const shareUrl = `https://spaktok.app/video/${videoId}?ref=${userId}`;

    return {
      success: true,
      shareUrl,
      message: "Video shared successfully",
    };
  } catch (error: any) {
    console.error("Error in shareVideo:", error);
    throw new Error(error.message || "Failed to share video");
  }
});

/**
 * Save Video
 */
export const saveVideo = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new Error("Authentication required");
  }

  try {
    const { videoId, collectionId, action } = request.data; // action: 'save' or 'unsave'

    const saveId = `${userId}_${videoId}`;
    const saveRef = db.collection("videoSaves").doc(saveId);
    const saveDoc = await saveRef.get();

    if (action === "save") {
      if (saveDoc.exists) {
        return { success: true, message: "Already saved" };
      }

      // Create save document
      await saveRef.set({
        userId,
        videoId,
        collectionId: collectionId || null,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Increment save count
      await db.collection("videos").doc(videoId).update({
        saves: admin.firestore.FieldValue.increment(1),
        engagementScore: admin.firestore.FieldValue.increment(4),
      });

      return { success: true, saved: true };
    } else {
      if (!saveDoc.exists) {
        return { success: true, message: "Not saved" };
      }

      // Delete save document
      await saveRef.delete();

      // Decrement save count
      await db.collection("videos").doc(videoId).update({
        saves: admin.firestore.FieldValue.increment(-1),
        engagementScore: admin.firestore.FieldValue.increment(-4),
      });

      return { success: true, saved: false };
    }
  } catch (error: any) {
    console.error("Error in saveVideo:", error);
    throw new Error(error.message || "Failed to save video");
  }
});

/**
 * Record Video View
 */
export const recordVideoView = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new Error("Authentication required");
  }

  try {
    const { videoId, watchTime, completionRate, source } = request.data;

    const viewId = `${userId}_${videoId}`;
    const viewRef = db.collection("videoViews").doc(viewId);
    const viewDoc = await viewRef.get();

    if (viewDoc.exists) {
      // Update existing view
      await viewRef.update({
        watchTime: admin.firestore.FieldValue.increment(watchTime || 0),
        completionRate: completionRate || 0,
        lastViewedAt: admin.firestore.FieldValue.serverTimestamp(),
        viewCount: admin.firestore.FieldValue.increment(1),
      });
    } else {
      // Create new view record
      await viewRef.set({
        userId,
        videoId,
        watchTime: watchTime || 0,
        completionRate: completionRate || 0,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        lastViewedAt: admin.firestore.FieldValue.serverTimestamp(),
        viewCount: 1,
        source: source || "feed",
      });

      // Increment view count (only once per user)
      await db.collection("videos").doc(videoId).update({
        views: admin.firestore.FieldValue.increment(1),
        engagementScore: admin.firestore.FieldValue.increment(1),
      });
    }

    // Update feed entry if exists
    const feedRef = db.collection("users").doc(userId).collection("feed").doc(videoId);
    const feedDoc = await feedRef.get();
    if (feedDoc.exists) {
      await feedRef.update({ viewed: true });
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error in recordVideoView:", error);
    throw new Error(error.message || "Failed to record view");
  }
});

/**
 * Get User Feed
 */
export const getUserFeed = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new Error("Authentication required");
  }

  try {
    const { limit = 20, lastVideoId } = request.data;

    // Get cached feed entries
    let query = db.collection("users").doc(userId).collection("feed")
      .where("viewed", "==", false)
      .orderBy("score", "desc")
      .limit(limit);

    if (lastVideoId) {
      const lastDoc = await db.collection("users").doc(userId)
        .collection("feed").doc(lastVideoId).get();
      if (lastDoc.exists) {
        query = query.startAfter(lastDoc);
      }
    }

    const feedSnapshot = await query.get();
    const videoIds = feedSnapshot.docs.map(doc => doc.data().videoId);

    // Fetch video details
    const videos = [];
    for (const videoId of videoIds) {
      const videoDoc = await db.collection("videos").doc(videoId).get();
      if (videoDoc.exists && videoDoc.data()?.status === "active") {
        videos.push({
          id: videoDoc.id,
          ...videoDoc.data(),
        });
      }
    }

    return {
      success: true,
      videos,
      hasMore: videos.length === limit,
    };
  } catch (error: any) {
    console.error("Error in getUserFeed:", error);
    throw new Error(error.message || "Failed to get feed");
  }
});

/**
 * Get Trending Videos
 */
export const getTrendingVideos = onCall(async (request) => {
  try {
    const { limit = 20, lastVideoId } = request.data;

    // Get videos with high trending scores from last 48 hours
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    let query = db.collection("videos")
      .where("status", "==", "active")
      .where("publishedAt", ">=", admin.firestore.Timestamp.fromDate(twoDaysAgo))
      .orderBy("publishedAt", "desc")
      .orderBy("trendingScore", "desc")
      .limit(limit);

    if (lastVideoId) {
      const lastDoc = await db.collection("videos").doc(lastVideoId).get();
      if (lastDoc.exists) {
        query = query.startAfter(lastDoc);
      }
    }

    const videosSnapshot = await query.get();
    const videos = videosSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return {
      success: true,
      videos,
      hasMore: videos.length === limit,
    };
  } catch (error: any) {
    console.error("Error in getTrendingVideos:", error);
    throw new Error(error.message || "Failed to get trending videos");
  }
});

/**
 * Search Videos
 */
export const searchVideos = onCall(async (request) => {
  try {
    const { query, limit = 20 } = request.data;

    if (!query || query.trim().length === 0) {
      throw new Error("Search query is required");
    }

    // Simple search implementation (in production, use Algolia or similar)
    const videosSnapshot = await db.collection("videos")
      .where("status", "==", "active")
      .orderBy("engagementScore", "desc")
      .limit(100)
      .get();

    const searchTerm = query.toLowerCase();
    const matchingVideos = videosSnapshot.docs
      .filter(doc => {
        const data = doc.data();
        return (
          data.caption?.toLowerCase().includes(searchTerm) ||
          data.username?.toLowerCase().includes(searchTerm) ||
          data.hashtags?.some((tag: string) => tag.toLowerCase().includes(searchTerm))
        );
      })
      .slice(0, limit)
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

    return {
      success: true,
      videos: matchingVideos,
      hasMore: false,
    };
  } catch (error: any) {
    console.error("Error in searchVideos:", error);
    throw new Error(error.message || "Failed to search videos");
  }
});

/**
 * Get Videos by Hashtag
 */
export const getVideosByHashtag = onCall(async (request) => {
  try {
    const { hashtag, limit = 20, lastVideoId } = request.data;

    if (!hashtag) {
      throw new Error("Hashtag is required");
    }

    let query = db.collection("videos")
      .where("status", "==", "active")
      .where("hashtags", "array-contains", hashtag.toLowerCase())
      .orderBy("publishedAt", "desc")
      .limit(limit);

    if (lastVideoId) {
      const lastDoc = await db.collection("videos").doc(lastVideoId).get();
      if (lastDoc.exists) {
        query = query.startAfter(lastDoc);
      }
    }

    const videosSnapshot = await query.get();
    const videos = videosSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Update hashtag view count
    await db.collection("hashtags").doc(hashtag.toLowerCase()).update({
      viewCount: admin.firestore.FieldValue.increment(1),
    });

    return {
      success: true,
      videos,
      hasMore: videos.length === limit,
    };
  } catch (error: any) {
    console.error("Error in getVideosByHashtag:", error);
    throw new Error(error.message || "Failed to get videos by hashtag");
  }
});

/**
 * Get Trending Hashtags
 */
export const getTrendingHashtags = onCall(async (request) => {
  try {
    const { limit = 20 } = request.data;

    const hashtagsSnapshot = await db.collection("hashtags")
      .orderBy("trendingScore", "desc")
      .limit(limit)
      .get();

    const hashtags = hashtagsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return {
      success: true,
      hashtags,
    };
  } catch (error: any) {
    console.error("Error in getTrendingHashtags:", error);
    throw new Error(error.message || "Failed to get trending hashtags");
  }
});

/**
 * Update Video Analytics - Scheduled function
 */
export const updateVideoAnalytics = onSchedule("every 15 minutes", async (event) => {
  try {
    console.log("Starting video analytics update...");

    // Get videos from last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const videosSnapshot = await db.collection("videos")
      .where("status", "==", "active")
      .where("publishedAt", ">=", admin.firestore.Timestamp.fromDate(sevenDaysAgo))
      .get();

    const batch = db.batch();
    let count = 0;

    for (const doc of videosSnapshot.docs) {
      const data = doc.data();
      const videoAge = Date.now() - (data.publishedAt?.toMillis() || Date.now());
      const ageInHours = videoAge / (1000 * 60 * 60);

      // Calculate engagement score
      const engagementScore = (data.likes || 0) * 2 +
        (data.comments || 0) * 3 +
        (data.shares || 0) * 5 +
        (data.saves || 0) * 4 +
        (data.views || 0) * 1;

      // Calculate trending score (engagement velocity with time decay)
      const engagementRate = (data.views || 0) > 0 ?
        ((data.likes || 0) + (data.comments || 0) + (data.shares || 0)) / (data.views || 1) : 0;
      const freshnessMultiplier = Math.max(0.1, 1 - (ageInHours / 168)); // Decay over 7 days
      const trendingScore = engagementScore * engagementRate * freshnessMultiplier;

      batch.update(doc.ref, {
        engagementScore,
        trendingScore,
      });

      count++;
      if (count >= 500) {
        await batch.commit();
        count = 0;
      }
    }

    if (count > 0) {
      await batch.commit();
    }

    console.log("Video analytics update completed");
    return null;
  } catch (error: any) {
    console.error("Error updating video analytics:", error);
    return null;
  }
});

// ============================================================================
// STORIES SYSTEM FUNCTIONS
// ============================================================================

/**
 * Create Story
 */
export const createStory = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new Error("Authentication required");
  }

  try {
    const {
      type,
      mediaUrl,
      thumbnailUrl,
      duration,
      width,
      height,
      caption,
      textOverlay,
      stickers,
      filters,
      music,
      mentions,
      hashtags,
      location,
      privacy,
      customAudience,
      allowReplies,
      allowSharing,
    } = request.data;

    // Get user data
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data() as UserData;

    // Calculate expiration time (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Create story document
    const storyRef = await db.collection("stories").add({
      userId,
      username: userData.displayName || "Unknown",
      userProfileImage: userData.profileImage || "",
      type: type || "photo",
      mediaUrl,
      thumbnailUrl: thumbnailUrl || null,
      duration: duration || 5,
      width: width || 0,
      height: height || 0,
      caption: caption || "",
      textOverlay: textOverlay || null,
      stickers: stickers || [],
      filters: filters || [],
      music: music || null,
      interactiveElements: [],
      mentions: mentions || [],
      hashtags: hashtags || [],
      location: location || null,
      privacy: privacy || "public",
      customAudience: customAudience || [],
      allowReplies: allowReplies !== false,
      allowSharing: allowSharing !== false,
      views: 0,
      replies: 0,
      shares: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
      isExpired: false,
      isHighlighted: false,
      highlightIds: [],
      status: "active",
      moderationStatus: "approved",
    });

    // Notify followers (async)
    notifyFollowersOfNewStory(userId, storyRef.id);

    return {
      success: true,
      storyId: storyRef.id,
      expiresAt: expiresAt.toISOString(),
      message: "Story created successfully",
    };
  } catch (error: any) {
    console.error("Error in createStory:", error);
    throw new Error(error.message || "Failed to create story");
  }
});

/**
 * Helper function to notify followers of new story
 */
async function notifyFollowersOfNewStory(userId: string, storyId: string) {
  try {
    const followersSnapshot = await db.collection("followers")
      .where("followingId", "==", userId)
      .limit(100) // Limit to prevent excessive notifications
      .get();

    const batch = db.batch();
    let count = 0;

    for (const doc of followersSnapshot.docs) {
      const followerId = doc.data().followerId;
      const notificationRef = db.collection("notifications").doc();

      batch.set(notificationRef, {
        userId: followerId,
        type: "new_story",
        actorId: userId,
        storyId,
        message: "Posted a new story",
        isRead: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      count++;
      if (count >= 500) {
        await batch.commit();
        count = 0;
      }
    }

    if (count > 0) {
      await batch.commit();
    }
  } catch (error) {
    console.error("Error notifying followers of new story:", error);
  }
}

/**
 * Delete Story
 */
export const deleteStory = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new Error("Authentication required");
  }

  try {
    const { storyId } = request.data;

    // Get story document
    const storyDoc = await db.collection("stories").doc(storyId).get();
    if (!storyDoc.exists) {
      throw new Error("Story not found");
    }

    const storyData = storyDoc.data();

    // Verify user is owner
    if (storyData?.userId !== userId) {
      throw new Error("Permission denied");
    }

    // Update story status
    await db.collection("stories").doc(storyId).update({
      status: "deleted",
    });

    return {
      success: true,
      message: "Story deleted successfully",
    };
  } catch (error: any) {
    console.error("Error in deleteStory:", error);
    throw new Error(error.message || "Failed to delete story");
  }
});

/**
 * Expire Stories - Scheduled function
 */
export const expireStories = onSchedule("every 1 hours", async (event) => {
  try {
    console.log("Starting story expiration process...");

    const now = admin.firestore.Timestamp.now();

    // Get expired stories
    const expiredStoriesSnapshot = await db.collection("stories")
      .where("status", "==", "active")
      .where("expiresAt", "<=", now)
      .get();

    const batch = db.batch();
    let count = 0;

    for (const doc of expiredStoriesSnapshot.docs) {
      const storyData = doc.data();

      // Update story status
      batch.update(doc.ref, {
        isExpired: true,
        status: "expired",
      });

      // Archive story if not highlighted
      if (!storyData.isHighlighted) {
        const archiveRef = db.collection("users").doc(storyData.userId)
          .collection("storyArchive").doc(doc.id);

        batch.set(archiveRef, {
          storyId: doc.id,
          archivedAt: admin.firestore.FieldValue.serverTimestamp(),
          originalCreatedAt: storyData.createdAt,
          mediaUrl: storyData.mediaUrl,
          thumbnailUrl: storyData.thumbnailUrl,
          metadata: {
            type: storyData.type,
            views: storyData.views,
            replies: storyData.replies,
          },
        });
      }

      count++;
      if (count >= 500) {
        await batch.commit();
        count = 0;
      }
    }

    if (count > 0) {
      await batch.commit();
    }

    console.log(`Expired ${expiredStoriesSnapshot.size} stories`);
    return null;
  } catch (error: any) {
    console.error("Error expiring stories:", error);
    return null;
  }
});

/**
 * Record Story View
 */
export const recordStoryView = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new Error("Authentication required");
  }

  try {
    const { storyId, watchTime, completionRate, source } = request.data;

    const viewId = `${storyId}_${userId}`;
    const viewRef = db.collection("storyViews").doc(viewId);
    const viewDoc = await viewRef.get();

    // Get user data
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data() as UserData;

    if (!viewDoc.exists) {
      // Create new view record
      await viewRef.set({
        storyId,
        userId,
        username: userData.displayName || "Unknown",
        userProfileImage: userData.profileImage || "",
        viewedAt: admin.firestore.FieldValue.serverTimestamp(),
        watchTime: watchTime || 0,
        completionRate: completionRate || 0,
        source: source || "feed",
      });

      // Increment view count (only once per user)
      await db.collection("stories").doc(storyId).update({
        views: admin.firestore.FieldValue.increment(1),
      });
    } else {
      // Update existing view
      await viewRef.update({
        watchTime: watchTime || 0,
        completionRate: completionRate || 0,
        viewedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error in recordStoryView:", error);
    throw new Error(error.message || "Failed to record story view");
  }
});

/**
 * Get Story Viewers
 */
export const getStoryViewers = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new Error("Authentication required");
  }

  try {
    const { storyId } = request.data;

    // Verify user is story owner
    const storyDoc = await db.collection("stories").doc(storyId).get();
    if (!storyDoc.exists) {
      throw new Error("Story not found");
    }

    const storyData = storyDoc.data();
    if (storyData?.userId !== userId) {
      throw new Error("Permission denied");
    }

    // Get viewers
    const viewersSnapshot = await db.collection("storyViews")
      .where("storyId", "==", storyId)
      .orderBy("viewedAt", "desc")
      .get();

    const viewers = viewersSnapshot.docs.map(doc => ({
      userId: doc.data().userId,
      username: doc.data().username,
      profileImage: doc.data().userProfileImage,
      viewedAt: doc.data().viewedAt,
      watchTime: doc.data().watchTime,
      completionRate: doc.data().completionRate,
    }));

    return {
      success: true,
      viewers,
      totalViews: viewers.length,
    };
  } catch (error: any) {
    console.error("Error in getStoryViewers:", error);
    throw new Error(error.message || "Failed to get story viewers");
  }
});

/**
 * Get Stories Feed
 */
export const getStoriesFeed = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new Error("Authentication required");
  }

  try {
    // Get list of users the current user follows
    const followingSnapshot = await db.collection("followers")
      .where("followerId", "==", userId)
      .get();

    const followingIds = followingSnapshot.docs.map(doc => doc.data().followingId);

    if (followingIds.length === 0) {
      return {
        success: true,
        stories: [],
      };
    }

    // Get active stories from followed users
    // Note: Firestore 'in' queries are limited to 10 items, so we need to batch
    const storyGroups = [];
    for (let i = 0; i < followingIds.length; i += 10) {
      const batch = followingIds.slice(i, i + 10);
      const storiesSnapshot = await db.collection("stories")
        .where("userId", "in", batch)
        .where("status", "==", "active")
        .where("isExpired", "==", false)
        .orderBy("createdAt", "desc")
        .get();

      storyGroups.push(...storiesSnapshot.docs);
    }

    // Group stories by user
    const storiesByUser = new Map();
    for (const doc of storyGroups) {
      const storyData = doc.data();
      const userId = storyData.userId;

      if (!storiesByUser.has(userId)) {
        storiesByUser.set(userId, {
          userId,
          username: storyData.username,
          userProfileImage: storyData.userProfileImage,
          stories: [],
        });
      }

      // Check if current user has viewed this story
      const viewDoc = await db.collection("storyViews")
        .doc(`${doc.id}_${request.auth?.uid}`)
        .get();

      storiesByUser.get(userId).stories.push({
        id: doc.id,
        ...storyData,
        hasViewed: viewDoc.exists,
      });
    }

    // Convert to array and sort (users with unseen stories first)
    const stories = Array.from(storiesByUser.values()).sort((a, b) => {
      const aHasUnseen = a.stories.some((s: any) => !s.hasViewed);
      const bHasUnseen = b.stories.some((s: any) => !s.hasViewed);

      if (aHasUnseen && !bHasUnseen) return -1;
      if (!aHasUnseen && bHasUnseen) return 1;

      // If both have unseen or both don't, sort by most recent story
      const aLatest = Math.max(...a.stories.map((s: any) => s.createdAt?.toMillis() || 0));
      const bLatest = Math.max(...b.stories.map((s: any) => s.createdAt?.toMillis() || 0));
      return bLatest - aLatest;
    });

    return {
      success: true,
      stories,
    };
  } catch (error: any) {
    console.error("Error in getStoriesFeed:", error);
    throw new Error(error.message || "Failed to get stories feed");
  }
});

/**
 * Get User Stories
 */
export const getUserStories = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new Error("Authentication required");
  }

  try {
    const { targetUserId } = request.data;

    // Get active stories for the user
    const storiesSnapshot = await db.collection("stories")
      .where("userId", "==", targetUserId)
      .where("status", "==", "active")
      .where("isExpired", "==", false)
      .orderBy("createdAt", "asc")
      .get();

    const stories = [];
    for (const doc of storiesSnapshot.docs) {
      const storyData = doc.data();

      // Check privacy settings
      if (storyData.privacy === "private" && targetUserId !== userId) {
        continue;
      }

      if (storyData.privacy === "close_friends") {
        const closeFriendDoc = await db.collection("users").doc(targetUserId)
          .collection("closeFriends").doc(userId).get();
        if (!closeFriendDoc.exists) {
          continue;
        }
      }

      if (storyData.privacy === "custom") {
        if (!storyData.customAudience.includes(userId)) {
          continue;
        }
      }

      // Check if current user has viewed
      const viewDoc = await db.collection("storyViews")
        .doc(`${doc.id}_${userId}`)
        .get();

      stories.push({
        id: doc.id,
        ...storyData,
        hasViewed: viewDoc.exists,
      });
    }

    return {
      success: true,
      stories,
    };
  } catch (error: any) {
    console.error("Error in getUserStories:", error);
    throw new Error(error.message || "Failed to get user stories");
  }
});

/**
 * Reply to Story
 */
export const replyToStory = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new Error("Authentication required");
  }

  try {
    const { storyId, messageText, messageType, reactionType, mediaUrl } = request.data;

    // Get story document
    const storyDoc = await db.collection("stories").doc(storyId).get();
    if (!storyDoc.exists) {
      throw new Error("Story not found");
    }

    const storyData = storyDoc.data();

    // Check if replies are allowed
    if (!storyData?.allowReplies) {
      throw new Error("Replies are not allowed for this story");
    }

    const recipientId = storyData.userId;

    // Create reply document
    await db.collection("storyReplies").add({
      storyId,
      senderId: userId,
      recipientId,
      messageText: messageText || "",
      messageType: messageType || "text",
      reactionType: reactionType || null,
      mediaUrl: mediaUrl || null,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      isRead: false,
    });

    // Increment reply count
    await db.collection("stories").doc(storyId).update({
      replies: admin.firestore.FieldValue.increment(1),
    });

    // Send notification
    const senderDoc = await db.collection("users").doc(userId).get();
    const senderData = senderDoc.data();

    await db.collection("notifications").add({
      userId: recipientId,
      type: "story_reply",
      actorId: userId,
      actorName: senderData?.displayName || "Someone",
      actorProfileImage: senderData?.profileImage || "",
      storyId,
      message: `Replied to your story`,
      isRead: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      message: "Reply sent successfully",
    };
  } catch (error: any) {
    console.error("Error in replyToStory:", error);
    throw new Error(error.message || "Failed to reply to story");
  }
});

/**
 * Save Story to Highlight
 */
export const saveStoryToHighlight = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new Error("Authentication required");
  }

  try {
    const { storyId, highlightId, createNew, highlightTitle, coverImageUrl } = request.data;

    // Get story document
    const storyDoc = await db.collection("stories").doc(storyId).get();
    if (!storyDoc.exists) {
      throw new Error("Story not found");
    }

    const storyData = storyDoc.data();

    // Verify user is owner
    if (storyData?.userId !== userId) {
      throw new Error("Permission denied");
    }

    let targetHighlightId = highlightId;

    // Create new highlight if requested
    if (createNew) {
      const highlightRef = await db.collection("storyHighlights").add({
        userId,
        title: highlightTitle || "Untitled",
        coverImageUrl: coverImageUrl || storyData.thumbnailUrl || storyData.mediaUrl,
        storyIds: [storyId],
        storyCount: 1,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        order: 0,
        privacy: "public",
      });
      targetHighlightId = highlightRef.id;
    } else {
      // Add to existing highlight
      await db.collection("storyHighlights").doc(targetHighlightId).update({
        storyIds: admin.firestore.FieldValue.arrayUnion(storyId),
        storyCount: admin.firestore.FieldValue.increment(1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // Update story
    await db.collection("stories").doc(storyId).update({
      isHighlighted: true,
      highlightIds: admin.firestore.FieldValue.arrayUnion(targetHighlightId),
    });

    return {
      success: true,
      highlightId: targetHighlightId,
      message: "Story saved to highlight",
    };
  } catch (error: any) {
    console.error("Error in saveStoryToHighlight:", error);
    throw new Error(error.message || "Failed to save story to highlight");
  }
});

/**
 * Get Story Highlights
 */
export const getStoryHighlights = onCall(async (request) => {
  try {
    const { userId } = request.data;

    const highlightsSnapshot = await db.collection("storyHighlights")
      .where("userId", "==", userId)
      .orderBy("order", "asc")
      .get();

    const highlights = highlightsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return {
      success: true,
      highlights,
    };
  } catch (error: any) {
    console.error("Error in getStoryHighlights:", error);
    throw new Error(error.message || "Failed to get story highlights");
  }
});

/**
 * Delete Highlight
 */
export const deleteHighlight = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new Error("Authentication required");
  }

  try {
    const { highlightId } = request.data;

    // Get highlight document
    const highlightDoc = await db.collection("storyHighlights").doc(highlightId).get();
    if (!highlightDoc.exists) {
      throw new Error("Highlight not found");
    }

    const highlightData = highlightDoc.data();

    // Verify user is owner
    if (highlightData?.userId !== userId) {
      throw new Error("Permission denied");
    }

    // Remove highlight reference from stories
    const storyIds = highlightData.storyIds || [];
    const batch = db.batch();

    for (const storyId of storyIds) {
      const storyRef = db.collection("stories").doc(storyId);
      batch.update(storyRef, {
        highlightIds: admin.firestore.FieldValue.arrayRemove(highlightId),
      });
    }

    // Delete highlight
    batch.delete(highlightDoc.ref);

    await batch.commit();

    return {
      success: true,
      message: "Highlight deleted successfully",
    };
  } catch (error: any) {
    console.error("Error in deleteHighlight:", error);
    throw new Error(error.message || "Failed to delete highlight");
  }
});

/**
 * Add to Close Friends
 */
export const addToCloseFriends = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new Error("Authentication required");
  }

  try {
    const { friendId } = request.data;

    // Get friend data
    const friendDoc = await db.collection("users").doc(friendId).get();
    if (!friendDoc.exists) {
      throw new Error("User not found");
    }

    const friendData = friendDoc.data();

    // Add to close friends
    await db.collection("users").doc(userId)
      .collection("closeFriends").doc(friendId).set({
        friendId,
        username: friendData?.displayName || "Unknown",
        profileImage: friendData?.profileImage || "",
        addedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    return {
      success: true,
      message: "Added to close friends",
    };
  } catch (error: any) {
    console.error("Error in addToCloseFriends:", error);
    throw new Error(error.message || "Failed to add to close friends");
  }
});

/**
 * Remove from Close Friends
 */
export const removeFromCloseFriends = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new Error("Authentication required");
  }

  try {
    const { friendId } = request.data;

    // Remove from close friends
    await db.collection("users").doc(userId)
      .collection("closeFriends").doc(friendId).delete();

    return {
      success: true,
      message: "Removed from close friends",
    };
  } catch (error: any) {
    console.error("Error in removeFromCloseFriends:", error);
    throw new Error(error.message || "Failed to remove from close friends");
  }
});

/**
 * Get Close Friends List
 */
export const getCloseFriendsList = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new Error("Authentication required");
  }

  try {
    const closeFriendsSnapshot = await db.collection("users").doc(userId)
      .collection("closeFriends")
      .orderBy("addedAt", "desc")
      .get();

    const closeFriends = closeFriendsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return {
      success: true,
      closeFriends,
    };
  } catch (error: any) {
    console.error("Error in getCloseFriendsList:", error);
    throw new Error(error.message || "Failed to get close friends list");
  }
});

// ============================================================================
// LIVE STREAMING SYSTEM FUNCTIONS
// ============================================================================

/**
 * Start Live Stream
 */
export const startLiveStream = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new Error("Authentication required");
  }

  try {
    const {
      title,
      category,
      tags,
      language,
      isRecorded,
      privacy,
      allowComments,
      allowGifts,
      location,
    } = request.data;

    // Check if user already has an active stream
    const activeStreams = await db.collection("liveStreams")
      .where("userId", "==", userId)
      .where("status", "==", "live")
      .get();

    if (!activeStreams.empty) {
      throw new Error("You already have an active stream");
    }

    // Get user data
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data() as UserData;

    // Generate stream credentials
    const streamId = db.collection("liveStreams").doc().id;
    const streamKey = generateStreamKey();
    const streamUrl = `rtmp://stream.spaktok.app/live/${streamKey}`;
    const playbackUrl = `https://stream.spaktok.app/hls/${streamKey}/index.m3u8`;

    // Create stream document
    await db.collection("liveStreams").doc(streamId).set({
      streamId,
      userId,
      username: userData.displayName || "Unknown",
      userProfileImage: userData.profileImage || "",
      title: title || "Live Stream",
      thumbnailUrl: userData.profileImage || "",
      streamUrl,
      streamKey,
      playbackUrl,
      status: "live",
      category: category || "general",
      tags: tags || [],
      language: language || "en",
      viewerCount: 0,
      peakViewerCount: 0,
      totalViews: 0,
      likes: 0,
      comments: 0,
      gifts: 0,
      giftRevenue: 0,
      duration: 0,
      startedAt: admin.firestore.FieldValue.serverTimestamp(),
      isRecorded: isRecorded !== false,
      isPremium: userData.isPremiumAccount || false,
      isAgeRestricted: false,
      allowComments: allowComments !== false,
      allowGifts: allowGifts !== false,
      privacy: privacy || "public",
      moderators: [],
      bannedUsers: [],
      guestUsers: [],
      location: location || null,
      filters: [],
      quality: "auto",
      moderationStatus: "active",
      violationFlags: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Notify followers (async)
    notifyFollowersOfLiveStream(userId, streamId);

    return {
      success: true,
      streamId,
      streamKey,
      streamUrl,
      playbackUrl,
      message: "Stream started successfully",
    };
  } catch (error: any) {
    console.error("Error in startLiveStream:", error);
    throw new Error(error.message || "Failed to start stream");
  }
});

/**
 * Helper function to generate stream key
 */
function generateStreamKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let key = "";
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

/**
 * Helper function to notify followers of live stream
 */
async function notifyFollowersOfLiveStream(userId: string, streamId: string) {
  try {
    const followersSnapshot = await db.collection("followers")
      .where("followingId", "==", userId)
      .limit(1000)
      .get();

    const batch = db.batch();
    let count = 0;

    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data();

    for (const doc of followersSnapshot.docs) {
      const followerId = doc.data().followerId;
      const notificationRef = db.collection("notifications").doc();

      batch.set(notificationRef, {
        userId: followerId,
        type: "live_stream",
        actorId: userId,
        actorName: userData?.displayName || "Someone",
        actorProfileImage: userData?.profileImage || "",
        streamId,
        message: `${userData?.displayName || "Someone"} is live now!`,
        isRead: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      count++;
      if (count >= 500) {
        await batch.commit();
        count = 0;
      }
    }

    if (count > 0) {
      await batch.commit();
    }
  } catch (error) {
    console.error("Error notifying followers of live stream:", error);
  }
}

/**
 * End Live Stream
 */
export const endLiveStream = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new Error("Authentication required");
  }

  try {
    const { streamId } = request.data;

    // Get stream document
    const streamDoc = await db.collection("liveStreams").doc(streamId).get();
    if (!streamDoc.exists) {
      throw new Error("Stream not found");
    }

    const streamData = streamDoc.data();

    // Verify user is broadcaster
    if (streamData?.userId !== userId) {
      throw new Error("Permission denied");
    }

    // Calculate duration
    const startedAt = streamData.startedAt?.toMillis() || Date.now();
    const duration = Math.floor((Date.now() - startedAt) / 1000);

    // Update stream document
    await db.collection("liveStreams").doc(streamId).update({
      status: "ended",
      endedAt: admin.firestore.FieldValue.serverTimestamp(),
      duration,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Mark all viewers as inactive
    const viewersSnapshot = await db.collection("streamViewers")
      .where("streamId", "==", streamId)
      .where("isActive", "==", true)
      .get();

    const batch = db.batch();
    for (const doc of viewersSnapshot.docs) {
      batch.update(doc.ref, {
        isActive: false,
        leftAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    await batch.commit();

    return {
      success: true,
      duration,
      peakViewers: streamData.peakViewerCount,
      totalViews: streamData.totalViews,
      revenue: streamData.giftRevenue,
      message: "Stream ended successfully",
    };
  } catch (error: any) {
    console.error("Error in endLiveStream:", error);
    throw new Error(error.message || "Failed to end stream");
  }
});

/**
 * Join Live Stream
 */
export const joinLiveStream = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new Error("Authentication required");
  }

  try {
    const { streamId } = request.data;

    // Get stream document
    const streamDoc = await db.collection("liveStreams").doc(streamId).get();
    if (!streamDoc.exists) {
      throw new Error("Stream not found");
    }

    const streamData = streamDoc.data();

    // Check if stream is live
    if (streamData?.status !== "live") {
      throw new Error("Stream is not live");
    }

    // Check if user is banned
    if (streamData.bannedUsers?.includes(userId)) {
      throw new Error("You are banned from this stream");
    }

    // Get user data
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data() as UserData;

    // Create/update viewer document
    const viewerId = `${streamId}_${userId}`;
    const viewerRef = db.collection("streamViewers").doc(viewerId);
    const viewerDoc = await viewerRef.get();

    if (viewerDoc.exists) {
      // Returning viewer
      await viewerRef.update({
        isActive: true,
        lastHeartbeat: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      // New viewer
      await viewerRef.set({
        streamId,
        userId,
        username: userData.displayName || "Unknown",
        userProfileImage: userData.profileImage || "",
        joinedAt: admin.firestore.FieldValue.serverTimestamp(),
        leftAt: null,
        watchTime: 0,
        isActive: true,
        lastHeartbeat: admin.firestore.FieldValue.serverTimestamp(),
        giftsSent: 0,
        commentsPosted: 0,
      });

      // Increment total views (only for new viewers)
      await db.collection("liveStreams").doc(streamId).update({
        totalViews: admin.firestore.FieldValue.increment(1),
      });
    }

    // Increment viewer count
    await db.collection("liveStreams").doc(streamId).update({
      viewerCount: admin.firestore.FieldValue.increment(1),
    });

    // Update peak viewer count if necessary
    const updatedStream = await db.collection("liveStreams").doc(streamId).get();
    const updatedData = updatedStream.data();
    if (updatedData && updatedData.viewerCount > updatedData.peakViewerCount) {
      await db.collection("liveStreams").doc(streamId).update({
        peakViewerCount: updatedData.viewerCount,
      });
    }

    // Send join message to chat
    await db.collection("streamComments").add({
      streamId,
      userId,
      username: userData.displayName || "Unknown",
      userProfileImage: userData.profileImage || "",
      text: "joined the stream",
      type: "join",
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      isPinned: false,
      isDeleted: false,
    });

    return {
      success: true,
      playbackUrl: streamData.playbackUrl,
      streamData: {
        title: streamData.title,
        broadcasterName: streamData.username,
        broadcasterImage: streamData.userProfileImage,
        viewerCount: updatedData?.viewerCount || 0,
        likes: streamData.likes,
      },
    };
  } catch (error: any) {
    console.error("Error in joinLiveStream:", error);
    throw new Error(error.message || "Failed to join stream");
  }
});

/**
 * Leave Live Stream
 */
export const leaveLiveStream = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new Error("Authentication required");
  }

  try {
    const { streamId } = request.data;

    const viewerId = `${streamId}_${userId}`;
    const viewerRef = db.collection("streamViewers").doc(viewerId);
    const viewerDoc = await viewerRef.get();

    if (viewerDoc.exists) {
      const viewerData = viewerDoc.data();
      const joinedAt = viewerData?.joinedAt?.toMillis() || Date.now();
      const watchTime = Math.floor((Date.now() - joinedAt) / 1000);

      await viewerRef.update({
        isActive: false,
        leftAt: admin.firestore.FieldValue.serverTimestamp(),
        watchTime: admin.firestore.FieldValue.increment(watchTime),
      });

      // Decrement viewer count
      await db.collection("liveStreams").doc(streamId).update({
        viewerCount: admin.firestore.FieldValue.increment(-1),
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error in leaveLiveStream:", error);
    throw new Error(error.message || "Failed to leave stream");
  }
});

/**
 * Send Stream Comment
 */
export const sendStreamComment = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new Error("Authentication required");
  }

  try {
    const { streamId, text } = request.data;

    if (!text || text.trim().length === 0) {
      throw new Error("Comment text is required");
    }

    // Get stream document
    const streamDoc = await db.collection("liveStreams").doc(streamId).get();
    if (!streamDoc.exists) {
      throw new Error("Stream not found");
    }

    const streamData = streamDoc.data();

    // Check if comments are allowed
    if (!streamData?.allowComments) {
      throw new Error("Comments are disabled for this stream");
    }

    // Check if user is banned
    if (streamData.bannedUsers?.includes(userId)) {
      throw new Error("You are banned from this stream");
    }

    // Get user data
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data() as UserData;

    // Create comment
    await db.collection("streamComments").add({
      streamId,
      userId,
      username: userData.displayName || "Unknown",
      userProfileImage: userData.profileImage || "",
      text: text.trim(),
      type: "text",
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      isPinned: false,
      isDeleted: false,
    });

    // Increment comment count
    await db.collection("liveStreams").doc(streamId).update({
      comments: admin.firestore.FieldValue.increment(1),
    });

    // Update viewer stats
    const viewerId = `${streamId}_${userId}`;
    await db.collection("streamViewers").doc(viewerId).update({
      commentsPosted: admin.firestore.FieldValue.increment(1),
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error in sendStreamComment:", error);
    throw new Error(error.message || "Failed to send comment");
  }
});

/**
 * Like Stream
 */
export const likeStream = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new Error("Authentication required");
  }

  try {
    const { streamId } = request.data;

    const likeId = `${streamId}_${userId}`;
    const likeRef = db.collection("streamLikes").doc(likeId);
    const likeDoc = await likeRef.get();

    if (likeDoc.exists) {
      // Increment like count
      await likeRef.update({
        likeCount: admin.firestore.FieldValue.increment(1),
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      // Create new like
      await likeRef.set({
        streamId,
        userId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        likeCount: 1,
      });
    }

    // Increment stream likes
    await db.collection("liveStreams").doc(streamId).update({
      likes: admin.firestore.FieldValue.increment(1),
    });

    // Send like notification to chat
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data();

    await db.collection("streamComments").add({
      streamId,
      userId,
      username: userData?.displayName || "Unknown",
      userProfileImage: userData?.profileImage || "",
      text: "liked the stream",
      type: "like",
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      isPinned: false,
      isDeleted: false,
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error in likeStream:", error);
    throw new Error(error.message || "Failed to like stream");
  }
});

/**
 * Ban User from Stream
 */
export const banUserFromStream = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new Error("Authentication required");
  }

  try {
    const { streamId, targetUserId, reason } = request.data;

    // Get stream document
    const streamDoc = await db.collection("liveStreams").doc(streamId).get();
    if (!streamDoc.exists) {
      throw new Error("Stream not found");
    }

    const streamData = streamDoc.data();

    // Verify user is broadcaster or moderator
    if (streamData?.userId !== userId && !streamData?.moderators?.includes(userId)) {
      throw new Error("Permission denied");
    }

    // Add to banned list
    await db.collection("liveStreams").doc(streamId).update({
      bannedUsers: admin.firestore.FieldValue.arrayUnion(targetUserId),
    });

    // Remove from active viewers
    const viewerId = `${streamId}_${targetUserId}`;
    await db.collection("streamViewers").doc(viewerId).update({
      isActive: false,
      leftAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Log moderation action
    await db.collection("streamModerationLog").add({
      streamId,
      moderatorId: userId,
      action: "ban",
      targetUserId,
      reason: reason || "No reason provided",
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, message: "User banned from stream" };
  } catch (error: any) {
    console.error("Error in banUserFromStream:", error);
    throw new Error(error.message || "Failed to ban user");
  }
});

/**
 * Get Live Streams Feed
 */
export const getLiveStreamsFeed = onCall(async (request) => {
  try {
    const { limit = 20, category, lastStreamId } = request.data;

    let query = db.collection("liveStreams")
      .where("status", "==", "live")
      .where("privacy", "==", "public");

    if (category) {
      query = query.where("category", "==", category);
    }

    query = query.orderBy("viewerCount", "desc").limit(limit);

    if (lastStreamId) {
      const lastDoc = await db.collection("liveStreams").doc(lastStreamId).get();
      if (lastDoc.exists) {
        query = query.startAfter(lastDoc);
      }
    }

    const streamsSnapshot = await query.get();
    const streams = streamsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return {
      success: true,
      streams,
      hasMore: streams.length === limit,
    };
  } catch (error: any) {
    console.error("Error in getLiveStreamsFeed:", error);
    throw new Error(error.message || "Failed to get live streams");
  }
});

/**
 * Cleanup Inactive Viewers - Scheduled function
 */
export const cleanupInactiveViewers = onSchedule("every 1 minutes", async (event) => {
  try {
    console.log("Cleaning up inactive viewers...");

    const twoMinutesAgo = new Date();
    twoMinutesAgo.setMinutes(twoMinutesAgo.getMinutes() - 2);

    const inactiveViewers = await db.collection("streamViewers")
      .where("isActive", "==", true)
      .where("lastHeartbeat", "<=", admin.firestore.Timestamp.fromDate(twoMinutesAgo))
      .get();

    const batch = db.batch();
    const streamUpdates = new Map<string, number>();

    for (const doc of inactiveViewers.docs) {
      const viewerData = doc.data();

      batch.update(doc.ref, {
        isActive: false,
        leftAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Track viewer count decrements per stream
      const count = streamUpdates.get(viewerData.streamId) || 0;
      streamUpdates.set(viewerData.streamId, count + 1);
    }

    await batch.commit();

    // Update viewer counts for affected streams
    const streamBatch = db.batch();
    for (const [streamId, count] of streamUpdates.entries()) {
      const streamRef = db.collection("liveStreams").doc(streamId);
      streamBatch.update(streamRef, {
        viewerCount: admin.firestore.FieldValue.increment(-count),
      });
    }
    await streamBatch.commit();

    console.log(`Cleaned up ${inactiveViewers.size} inactive viewers`);
    return null;
  } catch (error: any) {
    console.error("Error cleaning up inactive viewers:", error);
    return null;
  }
});

// ============================================================================
// GIFT SYSTEM FUNCTIONS
// ============================================================================

/**
 * Send Gift
 */
export const sendGift = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new Error("Authentication required");
  }

  try {
    const {
      giftId,
      receiverId,
      context,
      contextId,
      quantity = 1,
      message,
      isAnonymous = false,
    } = request.data;

    // Get gift details
    const giftDoc = await db.collection("gifts").doc(giftId).get();
    if (!giftDoc.exists) {
      throw new Error("Gift not found");
    }

    const giftData = giftDoc.data();

    if (!giftData?.isAvailable) {
      throw new Error("Gift is not available");
    }

    // Calculate total cost
    const totalCost = (giftData.coinCost || 0) * quantity;
    const totalValueUSD = (giftData.realValueUSD || 0) * quantity;

    // Get sender data
    const senderDoc = await db.collection("users").doc(userId).get();
    const senderData = senderDoc.data() as UserData;

    // Check if sender has sufficient coins
    if ((senderData.coins || 0) < totalCost) {
      throw new Error("Insufficient coins");
    }

    // Get receiver data
    const receiverDoc = await db.collection("users").doc(receiverId).get();
    if (!receiverDoc.exists) {
      throw new Error("Receiver not found");
    }

    const receiverData = receiverDoc.data() as UserData;

    // Calculate revenue shares
    const isPremium = receiverData.isPremiumAccount || false;
    const revenueSharePercentage = isPremium ? 90 : 50;
    const broadcasterShare = totalValueUSD * (revenueSharePercentage / 100);
    const platformShare = totalValueUSD - broadcasterShare;

    // Use Firestore transaction to ensure atomicity
    await db.runTransaction(async (transaction) => {
      // Deduct coins from sender
      transaction.update(senderDoc.ref, {
        coins: admin.firestore.FieldValue.increment(-totalCost),
      });

      // Add balance to receiver
      transaction.update(receiverDoc.ref, {
        balance: admin.firestore.FieldValue.increment(broadcasterShare),
      });

      // Update platform revenue
      const platformRevenueRef = db.collection("platformRevenue").doc("summary");
      transaction.set(platformRevenueRef, {
        totalRevenue: admin.firestore.FieldValue.increment(platformShare),
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      // Create gift transaction
      const transactionRef = db.collection("giftTransactions").doc();
      transaction.set(transactionRef, {
        transactionId: transactionRef.id,
        giftId,
        giftName: giftData.name,
        giftImageUrl: giftData.imageUrl,
        giftAnimationUrl: giftData.animationUrl,
        senderId: userId,
        senderUsername: senderData.displayName || "Unknown",
        senderProfileImage: senderData.profileImage || "",
        receiverId,
        receiverUsername: receiverData.displayName || "Unknown",
        receiverProfileImage: receiverData.profileImage || "",
        context: context || "profile",
        contextId: contextId || null,
        quantity,
        coinCost: totalCost,
        realValueUSD: totalValueUSD,
        broadcasterShare,
        platformShare,
        isPremiumReceiver: isPremium,
        revenueSharePercentage,
        message: message || "",
        isAnonymous,
        status: "completed",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Update gift statistics
      transaction.update(giftDoc.ref, {
        totalSent: admin.firestore.FieldValue.increment(quantity),
      });

      // Update context-specific data
      if (context === "live_stream" && contextId) {
        const streamRef = db.collection("liveStreams").doc(contextId);
        transaction.update(streamRef, {
          gifts: admin.firestore.FieldValue.increment(quantity),
          giftRevenue: admin.firestore.FieldValue.increment(totalValueUSD),
        });

        // Create stream gift record
        const streamGiftRef = db.collection("streamGifts").doc();
        transaction.set(streamGiftRef, {
          streamId: contextId,
          giftId,
          senderId: userId,
          senderUsername: senderData.displayName || "Unknown",
          receiverId,
          receiverUsername: receiverData.displayName || "Unknown",
          giftName: giftData.name,
          giftImageUrl: giftData.imageUrl,
          giftAnimationUrl: giftData.animationUrl,
          coinCost: totalCost,
          realValueUSD: totalValueUSD,
          broadcasterShare,
          platformShare,
          isPremiumBroadcaster: isPremium,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          isCombo: quantity > 1,
          comboCount: quantity,
        });

        // Create chat notification
        const commentRef = db.collection("streamComments").doc();
        transaction.set(commentRef, {
          streamId: contextId,
          userId,
          username: isAnonymous ? "Anonymous" : (senderData.displayName || "Unknown"),
          userProfileImage: isAnonymous ? "" : (senderData.profileImage || ""),
          text: `sent ${quantity > 1 ? quantity + "x " : ""}${giftData.name}`,
          type: "gift",
          giftId,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          isPinned: false,
          isDeleted: false,
        });
      }
    });

    // Send notification to receiver (async)
    if (!isAnonymous) {
      sendGiftNotification(userId, receiverId, giftId, giftData.name, quantity);
    }

    // Update user gift stats (async)
    updateUserGiftStats(userId, receiverId, totalCost, broadcasterShare);

    return {
      success: true,
      transactionId: db.collection("giftTransactions").doc().id,
      animationUrl: giftData.animationUrl,
      message: "Gift sent successfully",
    };
  } catch (error: any) {
    console.error("Error in sendGift:", error);
    throw new Error(error.message || "Failed to send gift");
  }
});

/**
 * Helper function to send gift notification
 */
async function sendGiftNotification(
  senderId: string,
  receiverId: string,
  giftId: string,
  giftName: string,
  quantity: number
) {
  try {
    const senderDoc = await db.collection("users").doc(senderId).get();
    const senderData = senderDoc.data();

    await db.collection("notifications").add({
      userId: receiverId,
      type: "gift_received",
      actorId: senderId,
      actorName: senderData?.displayName || "Someone",
      actorProfileImage: senderData?.profileImage || "",
      giftId,
      giftName,
      quantity,
      message: `${senderData?.displayName || "Someone"} sent you ${quantity > 1 ? quantity + "x " : ""}${giftName}`,
      isRead: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error("Error sending gift notification:", error);
  }
}

/**
 * Helper function to update user gift statistics
 */
async function updateUserGiftStats(
  senderId: string,
  receiverId: string,
  coinsSpent: number,
  revenueEarned: number
) {
  try {
    // Update sender stats
    const senderStatsRef = db.collection("users").doc(senderId)
      .collection("giftStats").doc("summary");
    await senderStatsRef.set({
      totalGiftsSent: admin.firestore.FieldValue.increment(1),
      totalCoinsSpent: admin.firestore.FieldValue.increment(coinsSpent),
      lastGiftSent: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    // Update receiver stats
    const receiverStatsRef = db.collection("users").doc(receiverId)
      .collection("giftStats").doc("summary");
    await receiverStatsRef.set({
      totalGiftsReceived: admin.firestore.FieldValue.increment(1),
      totalRevenueEarned: admin.firestore.FieldValue.increment(revenueEarned),
      lastGiftReceived: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.error("Error updating user gift stats:", error);
  }
}

/**
 * Purchase Coins
 */
export const purchaseCoins = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new Error("Authentication required");
  }

  try {
    const { packageId } = request.data;

    // Get package details
    const packageDoc = await db.collection("coinPackages").doc(packageId).get();
    if (!packageDoc.exists) {
      throw new Error("Package not found");
    }

    const packageData = packageDoc.data();

    if (!packageData?.isAvailable) {
      throw new Error("Package is not available");
    }

    // Create purchase record
    const purchaseRef = await db.collection("coinPurchases").add({
      userId,
      packageId,
      coinAmount: packageData.coinAmount,
      bonusCoins: packageData.bonusCoins || 0,
      totalCoins: packageData.coinAmount + (packageData.bonusCoins || 0),
      priceUSD: packageData.priceUSD,
      status: "pending",
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    // In production, integrate with Stripe/PayPal here
    // For now, return purchase ID
    return {
      success: true,
      purchaseId: purchaseRef.id,
      amount: packageData.priceUSD,
      message: "Purchase initiated. Complete payment to receive coins.",
    };
  } catch (error: any) {
    console.error("Error in purchaseCoins:", error);
    throw new Error(error.message || "Failed to purchase coins");
  }
});

/**
 * Confirm Coin Purchase (called after payment confirmation)
 */
export const confirmCoinPurchase = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new Error("Authentication required");
  }

  try {
    const { purchaseId, paymentIntentId } = request.data;

    // Get purchase record
    const purchaseDoc = await db.collection("coinPurchases").doc(purchaseId).get();
    if (!purchaseDoc.exists) {
      throw new Error("Purchase not found");
    }

    const purchaseData = purchaseDoc.data();

    // Verify purchase belongs to user
    if (purchaseData?.userId !== userId) {
      throw new Error("Permission denied");
    }

    // Verify purchase is pending
    if (purchaseData?.status !== "pending") {
      throw new Error("Purchase already processed");
    }

    // Update purchase status
    await db.collection("coinPurchases").doc(purchaseId).update({
      status: "completed",
      paymentIntentId,
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Add coins to user balance
    await db.collection("users").doc(userId).update({
      coins: admin.firestore.FieldValue.increment(purchaseData.totalCoins || 0),
    });

    // Record transaction
    await db.collection("transactions").add({
      userId,
      type: "coin_purchase",
      amount: purchaseData.totalCoins,
      currency: "coins",
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      status: "completed",
      description: `Purchased ${purchaseData.totalCoins} coins`,
    });

    return {
      success: true,
      coinsAdded: purchaseData.totalCoins,
      message: "Coins added to your account",
    };
  } catch (error: any) {
    console.error("Error in confirmCoinPurchase:", error);
    throw new Error(error.message || "Failed to confirm purchase");
  }
});

/**
 * Get Gift Catalog
 */
export const getGiftCatalog = onCall(async (request) => {
  try {
    const { category } = request.data;

    let query = db.collection("gifts")
      .where("isAvailable", "==", true);

    if (category) {
      query = query.where("category", "==", category);
    }

    query = query.orderBy("sortOrder", "asc");

    const giftsSnapshot = await query.get();
    const gifts = giftsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return {
      success: true,
      gifts,
    };
  } catch (error: any) {
    console.error("Error in getGiftCatalog:", error);
    throw new Error(error.message || "Failed to get gift catalog");
  }
});

/**
 * Get Coin Packages
 */
export const getCoinPackages = onCall(async (request) => {
  try {
    const packagesSnapshot = await db.collection("coinPackages")
      .where("isAvailable", "==", true)
      .orderBy("sortOrder", "asc")
      .get();

    const packages = packagesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return {
      success: true,
      packages,
    };
  } catch (error: any) {
    console.error("Error in getCoinPackages:", error);
    throw new Error(error.message || "Failed to get coin packages");
  }
});

/**
 * Get User Gift Stats
 */
export const getUserGiftStats = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new Error("Authentication required");
  }

  try {
    const { targetUserId } = request.data;
    const userIdToQuery = targetUserId || userId;

    const statsDoc = await db.collection("users").doc(userIdToQuery)
      .collection("giftStats").doc("summary").get();

    const stats = statsDoc.exists ? statsDoc.data() : {
      totalGiftsSent: 0,
      totalGiftsReceived: 0,
      totalCoinsSpent: 0,
      totalRevenueEarned: 0,
    };

    return {
      success: true,
      stats,
    };
  } catch (error: any) {
    console.error("Error in getUserGiftStats:", error);
    throw new Error(error.message || "Failed to get gift stats");
  }
});

/**
 * Get Gift Leaderboard
 */
export const getGiftLeaderboard = onCall(async (request) => {
  try {
    const { period = "weekly", type = "senders" } = request.data;

    const leaderboardId = `${period}_${type}`;
    const leaderboardDoc = await db.collection("giftLeaderboards")
      .doc(leaderboardId).get();

    if (!leaderboardDoc.exists) {
      return {
        success: true,
        rankings: [],
      };
    }

    const leaderboardData = leaderboardDoc.data();

    return {
      success: true,
      rankings: leaderboardData?.rankings || [],
      lastUpdated: leaderboardData?.lastUpdated,
    };
  } catch (error: any) {
    console.error("Error in getGiftLeaderboard:", error);
    throw new Error(error.message || "Failed to get leaderboard");
  }
});

/**
 * Update Gift Leaderboards - Scheduled function
 */
export const updateGiftLeaderboards = onSchedule("every 1 hours", async (event) => {
  try {
    console.log("Updating gift leaderboards...");

    const now = new Date();
    const periods = [
      { name: "daily", days: 1 },
      { name: "weekly", days: 7 },
      { name: "monthly", days: 30 },
    ];

    for (const period of periods) {
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - period.days);

      // Top senders
      const sendersSnapshot = await db.collection("giftTransactions")
        .where("timestamp", ">=", admin.firestore.Timestamp.fromDate(startDate))
        .get();

      const senderTotals = new Map<string, number>();
      for (const doc of sendersSnapshot.docs) {
        const data = doc.data();
        const current = senderTotals.get(data.senderId) || 0;
        senderTotals.set(data.senderId, current + (data.coinCost || 0));
      }

      const topSenders = Array.from(senderTotals.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 100);

      const senderRankings = [];
      for (let i = 0; i < topSenders.length; i++) {
        const [userId, value] = topSenders[i];
        const userDoc = await db.collection("users").doc(userId).get();
        const userData = userDoc.data();

        senderRankings.push({
          userId,
          username: userData?.displayName || "Unknown",
          profileImage: userData?.profileImage || "",
          value,
          rank: i + 1,
          change: 0, // TODO: Calculate change from previous period
        });
      }

      await db.collection("giftLeaderboards").doc(`${period.name}_senders`).set({
        period: period.name,
        type: "senders",
        rankings: senderRankings,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        nextUpdate: admin.firestore.Timestamp.fromDate(new Date(now.getTime() + 3600000)),
      });

      // Top receivers
      const receiverTotals = new Map<string, number>();
      for (const doc of sendersSnapshot.docs) {
        const data = doc.data();
        const current = receiverTotals.get(data.receiverId) || 0;
        receiverTotals.set(data.receiverId, current + (data.broadcasterShare || 0));
      }

      const topReceivers = Array.from(receiverTotals.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 100);

      const receiverRankings = [];
      for (let i = 0; i < topReceivers.length; i++) {
        const [userId, value] = topReceivers[i];
        const userDoc = await db.collection("users").doc(userId).get();
        const userData = userDoc.data();

        receiverRankings.push({
          userId,
          username: userData?.displayName || "Unknown",
          profileImage: userData?.profileImage || "",
          value,
          rank: i + 1,
          change: 0,
        });
      }

      await db.collection("giftLeaderboards").doc(`${period.name}_receivers`).set({
        period: period.name,
        type: "receivers",
        rankings: receiverRankings,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        nextUpdate: admin.firestore.Timestamp.fromDate(new Date(now.getTime() + 3600000)),
      });
    }

    console.log("Gift leaderboards updated successfully");
    return null;
  } catch (error: any) {
    console.error("Error updating gift leaderboards:", error);
    return null;
  }
});
