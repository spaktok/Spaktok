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

// ============================================================================
// PROFILE SYSTEM FUNCTIONS
// ============================================================================

/**
 * Update User Profile
 */
export const updateProfile = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new Error("Authentication required");
  }

  try {
    const {
      displayName,
      bio,
      website,
      socialLinks,
      location,
      gender,
      language,
      theme,
    } = request.data;

    // Validate bio length
    if (bio && bio.length > 150) {
      throw new Error("Bio must be 150 characters or less");
    }

    // Validate website URL
    if (website && !isValidUrl(website)) {
      throw new Error("Invalid website URL");
    }

    // Check rate limiting (once per hour)
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data();
    const lastUpdate = userData?.updatedAt?.toMillis() || 0;
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    if (lastUpdate > oneHourAgo) {
      throw new Error("Profile can only be updated once per hour");
    }

    // Update profile
    const updateData: any = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (displayName !== undefined) updateData.displayName = displayName;
    if (bio !== undefined) updateData.bio = bio;
    if (website !== undefined) updateData.website = website;
    if (socialLinks !== undefined) updateData.socialLinks = socialLinks;
    if (location !== undefined) updateData.location = location;
    if (gender !== undefined) updateData.gender = gender;
    if (language !== undefined) updateData.language = language;
    if (theme !== undefined) updateData.theme = theme;

    await db.collection("users").doc(userId).update(updateData);

    // Update denormalized data in related collections (async)
    updateDenormalizedUserData(userId, displayName, userData?.profileImage);

    return {
      success: true,
      message: "Profile updated successfully",
    };
  } catch (error: any) {
    console.error("Error in updateProfile:", error);
    throw new Error(error.message || "Failed to update profile");
  }
});

/**
 * Helper function to validate URL
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Helper function to update denormalized user data
 */
async function updateDenormalizedUserData(
  userId: string,
  displayName?: string,
  profileImage?: string
) {
  try {
    const batch = db.batch();
    let count = 0;

    // Update in videos
    const videosSnapshot = await db.collection("videos")
      .where("userId", "==", userId)
      .limit(500)
      .get();

    for (const doc of videosSnapshot.docs) {
      const updates: any = {};
      if (displayName) updates.username = displayName;
      if (profileImage) updates.userProfileImage = profileImage;
      
      if (Object.keys(updates).length > 0) {
        batch.update(doc.ref, updates);
        count++;
      }

      if (count >= 500) {
        await batch.commit();
        count = 0;
      }
    }

    // Update in stories
    const storiesSnapshot = await db.collection("stories")
      .where("userId", "==", userId)
      .limit(500)
      .get();

    for (const doc of storiesSnapshot.docs) {
      const updates: any = {};
      if (displayName) updates.username = displayName;
      if (profileImage) updates.userProfileImage = profileImage;
      
      if (Object.keys(updates).length > 0) {
        batch.update(doc.ref, updates);
        count++;
      }

      if (count >= 500) {
        await batch.commit();
        count = 0;
      }
    }

    if (count > 0) {
      await batch.commit();
    }
  } catch (error) {
    console.error("Error updating denormalized user data:", error);
  }
}

/**
 * Upload Profile Image
 */
export const uploadProfileImage = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new Error("Authentication required");
  }

  try {
    const { imageType } = request.data; // 'profile' or 'cover'

    if (!imageType || !['profile', 'cover'].includes(imageType)) {
      throw new Error("Invalid image type");
    }

    // Generate signed upload URL
    const bucket = admin.storage().bucket();
    const fileName = `profiles/${userId}/${imageType}_${Date.now()}.jpg`;
    const file = bucket.file(fileName);

    const [signedUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      contentType: 'image/jpeg',
    });

    return {
      success: true,
      uploadUrl: signedUrl,
      fileName,
      message: "Upload URL generated",
    };
  } catch (error: any) {
    console.error("Error in uploadProfileImage:", error);
    throw new Error(error.message || "Failed to generate upload URL");
  }
});

/**
 * Confirm Profile Image Upload
 */
export const confirmProfileImageUpload = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new Error("Authentication required");
  }

  try {
    const { fileName, imageType } = request.data;

    // Get public URL
    const bucket = admin.storage().bucket();
    const file = bucket.file(fileName);
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    // Update user document
    const updateField = imageType === 'profile' ? 'profileImage' : 'coverImage';
    await db.collection("users").doc(userId).update({
      [updateField]: publicUrl,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Delete old image (async)
    deleteOldProfileImage(userId, imageType);

    return {
      success: true,
      imageUrl: publicUrl,
      message: "Profile image updated",
    };
  } catch (error: any) {
    console.error("Error in confirmProfileImageUpload:", error);
    throw new Error(error.message || "Failed to confirm upload");
  }
});

/**
 * Helper function to delete old profile image
 */
async function deleteOldProfileImage(userId: string, imageType: string) {
  try {
    const bucket = admin.storage().bucket();
    const prefix = `profiles/${userId}/${imageType}_`;
    
    const [files] = await bucket.getFiles({ prefix });
    
    // Keep only the most recent file, delete others
    if (files.length > 1) {
      const sortedFiles = files.sort((a, b) => {
        const aTime = a.metadata.timeCreated || '';
        const bTime = b.metadata.timeCreated || '';
        return bTime.localeCompare(aTime);
      });

      // Delete all except the first (most recent)
      for (let i = 1; i < sortedFiles.length; i++) {
        await sortedFiles[i].delete();
      }
    }
  } catch (error) {
    console.error("Error deleting old profile image:", error);
  }
}

/**
 * Get User Profile
 */
export const getProfile = onCall(async (request) => {
  const viewerId = request.auth?.uid;
  const { userId } = request.data;

  if (!userId) {
    throw new Error("User ID is required");
  }

  try {
    // Get user document
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      throw new Error("User not found");
    }

    const userData = userDoc.data();

    // Check if viewer is blocked
    if (viewerId) {
      const blockedDoc = await db.collection("users").doc(userId)
        .collection("blockedUsers").doc(viewerId).get();
      
      if (blockedDoc.exists) {
        throw new Error("You are blocked by this user");
      }
    }

    // Check privacy settings
    const isPrivate = userData?.isPrivate || false;
    const isOwner = viewerId === userId;

    let canViewProfile = true;
    if (isPrivate && !isOwner) {
      // Check if viewer is following
      if (viewerId) {
        const followerDoc = await db.collection("followers")
          .doc(`${viewerId}_${userId}`).get();
        canViewProfile = followerDoc.exists;
      } else {
        canViewProfile = false;
      }
    }

    if (!canViewProfile) {
      return {
        success: true,
        profile: {
          userId: userData?.userId,
          username: userData?.username,
          displayName: userData?.displayName,
          profileImage: userData?.profileImage,
          isPrivate: true,
          followerCount: userData?.followerCount || 0,
          followingCount: userData?.followingCount || 0,
        },
        isPrivate: true,
      };
    }

    // Record profile view (async)
    if (viewerId && viewerId !== userId) {
      recordProfileView(userId, viewerId);
    }

    // Return full profile
    return {
      success: true,
      profile: {
        userId: userData?.userId,
        username: userData?.username,
        displayName: userData?.displayName,
        bio: userData?.bio,
        profileImage: userData?.profileImage,
        coverImage: userData?.coverImage,
        website: userData?.website,
        socialLinks: userData?.socialLinks,
        location: userData?.location,
        followerCount: userData?.followerCount || 0,
        followingCount: userData?.followingCount || 0,
        videoCount: userData?.videoCount || 0,
        likeCount: userData?.likeCount || 0,
        viewCount: userData?.viewCount || 0,
        isVerified: userData?.isVerified || false,
        isPremiumAccount: userData?.isPremiumAccount || false,
        isPrivate: userData?.isPrivate || false,
        level: userData?.level || 1,
        badges: userData?.badges || [],
        createdAt: userData?.createdAt,
      },
      isOwner,
    };
  } catch (error: any) {
    console.error("Error in getProfile:", error);
    throw new Error(error.message || "Failed to get profile");
  }
});

/**
 * Helper function to record profile view
 */
async function recordProfileView(profileId: string, viewerId: string) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const viewId = `${profileId}_${viewerId}_${today}`;

    await db.collection("profileViews").doc(viewId).set({
      profileId,
      viewerId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      source: "direct",
    }, { merge: true });
  } catch (error) {
    console.error("Error recording profile view:", error);
  }
}

/**
 * Search Users
 */
export const searchUsers = onCall(async (request) => {
  try {
    const { query, limit = 20 } = request.data;

    if (!query || query.trim().length === 0) {
      throw new Error("Search query is required");
    }

    const searchTerm = query.toLowerCase().trim();

    // Search by username (prefix match)
    const usernameResults = await db.collection("users")
      .where("username", ">=", searchTerm)
      .where("username", "<=", searchTerm + '\uf8ff')
      .limit(limit)
      .get();

    const users = usernameResults.docs.map(doc => {
      const data = doc.data();
      return {
        userId: data.userId,
        username: data.username,
        displayName: data.displayName,
        profileImage: data.profileImage,
        isVerified: data.isVerified || false,
        followerCount: data.followerCount || 0,
      };
    });

    return {
      success: true,
      users,
    };
  } catch (error: any) {
    console.error("Error in searchUsers:", error);
    throw new Error(error.message || "Failed to search users");
  }
});

/**
 * Follow User
 */
export const followUser = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new Error("Authentication required");
  }

  try {
    const { targetUserId } = request.data;

    if (userId === targetUserId) {
      throw new Error("Cannot follow yourself");
    }

    // Get target user
    const targetUserDoc = await db.collection("users").doc(targetUserId).get();
    if (!targetUserDoc.exists) {
      throw new Error("User not found");
    }

    const targetUserData = targetUserDoc.data();
    const isPrivate = targetUserData?.isPrivate || false;

    // Check if already following
    const followerId = `${userId}_${targetUserId}`;
    const followerDoc = await db.collection("followers").doc(followerId).get();

    if (followerDoc.exists) {
      throw new Error("Already following this user");
    }

    if (isPrivate) {
      // Create follow request
      const requestId = `${userId}_${targetUserId}`;
      const userDoc = await db.collection("users").doc(userId).get();
      const userData = userDoc.data();

      await db.collection("followRequests").doc(requestId).set({
        requesterId: userId,
        targetId: targetUserId,
        requesterUsername: userData?.displayName || "Unknown",
        requesterProfileImage: userData?.profileImage || "",
        status: "pending",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Send notification
      await db.collection("notifications").add({
        userId: targetUserId,
        type: "follow_request",
        actorId: userId,
        actorName: userData?.displayName || "Someone",
        actorProfileImage: userData?.profileImage || "",
        message: `${userData?.displayName || "Someone"} requested to follow you`,
        isRead: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        status: "pending",
        message: "Follow request sent",
      };
    } else {
      // Direct follow
      const userDoc = await db.collection("users").doc(userId).get();
      const userData = userDoc.data();

      await db.collection("followers").doc(followerId).set({
        followerId: userId,
        followingId: targetUserId,
        followerUsername: userData?.displayName || "Unknown",
        followingUsername: targetUserData?.displayName || "Unknown",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        notificationsEnabled: true,
      });

      // Update counts
      await db.collection("users").doc(userId).update({
        followingCount: admin.firestore.FieldValue.increment(1),
      });

      await db.collection("users").doc(targetUserId).update({
        followerCount: admin.firestore.FieldValue.increment(1),
      });

      // Send notification
      await db.collection("notifications").add({
        userId: targetUserId,
        type: "new_follower",
        actorId: userId,
        actorName: userData?.displayName || "Someone",
        actorProfileImage: userData?.profileImage || "",
        message: `${userData?.displayName || "Someone"} started following you`,
        isRead: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        status: "following",
        message: "Now following user",
      };
    }
  } catch (error: any) {
    console.error("Error in followUser:", error);
    throw new Error(error.message || "Failed to follow user");
  }
});

/**
 * Unfollow User
 */
export const unfollowUser = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new Error("Authentication required");
  }

  try {
    const { targetUserId } = request.data;

    const followerId = `${userId}_${targetUserId}`;
    const followerDoc = await db.collection("followers").doc(followerId).get();

    if (!followerDoc.exists) {
      throw new Error("Not following this user");
    }

    // Delete follower relationship
    await db.collection("followers").doc(followerId).delete();

    // Update counts
    await db.collection("users").doc(userId).update({
      followingCount: admin.firestore.FieldValue.increment(-1),
    });

    await db.collection("users").doc(targetUserId).update({
      followerCount: admin.firestore.FieldValue.increment(-1),
    });

    return {
      success: true,
      message: "Unfollowed user",
    };
  } catch (error: any) {
    console.error("Error in unfollowUser:", error);
    throw new Error(error.message || "Failed to unfollow user");
  }
});

/**
 * Accept Follow Request
 */
export const acceptFollowRequest = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new Error("Authentication required");
  }

  try {
    const { requesterId } = request.data;

    const requestId = `${requesterId}_${userId}`;
    const requestDoc = await db.collection("followRequests").doc(requestId).get();

    if (!requestDoc.exists) {
      throw new Error("Follow request not found");
    }

    const requestData = requestDoc.data();

    if (requestData?.status !== "pending") {
      throw new Error("Request already processed");
    }

    // Create follower relationship
    const followerId = `${requesterId}_${userId}`;
    await db.collection("followers").doc(followerId).set({
      followerId: requesterId,
      followingId: userId,
      followerUsername: requestData.requesterUsername,
      followingUsername: "", // Will be filled by denormalization
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      notificationsEnabled: true,
    });

    // Update request status
    await db.collection("followRequests").doc(requestId).update({
      status: "accepted",
      respondedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update counts
    await db.collection("users").doc(requesterId).update({
      followingCount: admin.firestore.FieldValue.increment(1),
    });

    await db.collection("users").doc(userId).update({
      followerCount: admin.firestore.FieldValue.increment(1),
    });

    // Send notification
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data();

    await db.collection("notifications").add({
      userId: requesterId,
      type: "follow_request_accepted",
      actorId: userId,
      actorName: userData?.displayName || "Someone",
      actorProfileImage: userData?.profileImage || "",
      message: `${userData?.displayName || "Someone"} accepted your follow request`,
      isRead: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      message: "Follow request accepted",
    };
  } catch (error: any) {
    console.error("Error in acceptFollowRequest:", error);
    throw new Error(error.message || "Failed to accept request");
  }
});

/**
 * Reject Follow Request
 */
export const rejectFollowRequest = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new Error("Authentication required");
  }

  try {
    const { requesterId } = request.data;

    const requestId = `${requesterId}_${userId}`;
    const requestDoc = await db.collection("followRequests").doc(requestId).get();

    if (!requestDoc.exists) {
      throw new Error("Follow request not found");
    }

    // Update request status
    await db.collection("followRequests").doc(requestId).update({
      status: "rejected",
      respondedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      message: "Follow request rejected",
    };
  } catch (error: any) {
    console.error("Error in rejectFollowRequest:", error);
    throw new Error(error.message || "Failed to reject request");
  }
});

/**
 * Get Followers
 */
export const getFollowers = onCall(async (request) => {
  try {
    const { userId, limit = 20, lastFollowerId } = request.data;

    if (!userId) {
      throw new Error("User ID is required");
    }

    let query = db.collection("followers")
      .where("followingId", "==", userId)
      .orderBy("timestamp", "desc")
      .limit(limit);

    if (lastFollowerId) {
      const lastDoc = await db.collection("followers").doc(lastFollowerId).get();
      if (lastDoc.exists) {
        query = query.startAfter(lastDoc);
      }
    }

    const followersSnapshot = await query.get();
    const followers = followersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return {
      success: true,
      followers,
      hasMore: followers.length === limit,
    };
  } catch (error: any) {
    console.error("Error in getFollowers:", error);
    throw new Error(error.message || "Failed to get followers");
  }
});

/**
 * Get Following
 */
export const getFollowing = onCall(async (request) => {
  try {
    const { userId, limit = 20, lastFollowingId } = request.data;

    if (!userId) {
      throw new Error("User ID is required");
    }

    let query = db.collection("followers")
      .where("followerId", "==", userId)
      .orderBy("timestamp", "desc")
      .limit(limit);

    if (lastFollowingId) {
      const lastDoc = await db.collection("followers").doc(lastFollowingId).get();
      if (lastDoc.exists) {
        query = query.startAfter(lastDoc);
      }
    }

    const followingSnapshot = await query.get();
    const following = followingSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return {
      success: true,
      following,
      hasMore: following.length === limit,
    };
  } catch (error: any) {
    console.error("Error in getFollowing:", error);
    throw new Error(error.message || "Failed to get following");
  }
});

/**
 * Block User
 */
export const blockUser = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new Error("Authentication required");
  }

  try {
    const { targetUserId, reason } = request.data;

    if (userId === targetUserId) {
      throw new Error("Cannot block yourself");
    }

    // Get target user data
    const targetUserDoc = await db.collection("users").doc(targetUserId).get();
    if (!targetUserDoc.exists) {
      throw new Error("User not found");
    }

    const targetUserData = targetUserDoc.data();

    // Add to blocked users
    await db.collection("users").doc(userId)
      .collection("blockedUsers").doc(targetUserId).set({
        blockedUserId: targetUserId,
        blockedUsername: targetUserData?.displayName || "Unknown",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        reason: reason || "",
      });

    // Remove follower relationships (both ways)
    const follower1 = `${userId}_${targetUserId}`;
    const follower2 = `${targetUserId}_${userId}`;

    const batch = db.batch();

    const follower1Doc = await db.collection("followers").doc(follower1).get();
    if (follower1Doc.exists) {
      batch.delete(follower1Doc.ref);
      batch.update(db.collection("users").doc(userId), {
        followingCount: admin.firestore.FieldValue.increment(-1),
      });
      batch.update(db.collection("users").doc(targetUserId), {
        followerCount: admin.firestore.FieldValue.increment(-1),
      });
    }

    const follower2Doc = await db.collection("followers").doc(follower2).get();
    if (follower2Doc.exists) {
      batch.delete(follower2Doc.ref);
      batch.update(db.collection("users").doc(targetUserId), {
        followingCount: admin.firestore.FieldValue.increment(-1),
      });
      batch.update(db.collection("users").doc(userId), {
        followerCount: admin.firestore.FieldValue.increment(-1),
      });
    }

    await batch.commit();

    return {
      success: true,
      message: "User blocked",
    };
  } catch (error: any) {
    console.error("Error in blockUser:", error);
    throw new Error(error.message || "Failed to block user");
  }
});

/**
 * Unblock User
 */
export const unblockUser = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new Error("Authentication required");
  }

  try {
    const { targetUserId } = request.data;

    await db.collection("users").doc(userId)
      .collection("blockedUsers").doc(targetUserId).delete();

    return {
      success: true,
      message: "User unblocked",
    };
  } catch (error: any) {
    console.error("Error in unblockUser:", error);
    throw new Error(error.message || "Failed to unblock user");
  }
});

/**
 * Update Privacy Settings
 */
export const updatePrivacySettings = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new Error("Authentication required");
  }

  try {
    const { privacySettings } = request.data;

    if (!privacySettings) {
      throw new Error("Privacy settings are required");
    }

    await db.collection("users").doc(userId).update({
      privacySettings,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // If changing to private, handle existing followers
    if (privacySettings.isPrivate === true) {
      await db.collection("users").doc(userId).update({
        isPrivate: true,
      });
    } else if (privacySettings.isPrivate === false) {
      await db.collection("users").doc(userId).update({
        isPrivate: false,
      });
    }

    return {
      success: true,
      message: "Privacy settings updated",
    };
  } catch (error: any) {
    console.error("Error in updatePrivacySettings:", error);
    throw new Error(error.message || "Failed to update privacy settings");
  }
});

/**
 * Request Verification
 */
export const requestVerification = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new Error("Authentication required");
  }

  try {
    // Get user data
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      throw new Error("User not found");
    }

    const userData = userDoc.data();

    // Check if already verified
    if (userData?.isVerified) {
      throw new Error("Account is already verified");
    }

    // Check eligibility
    const followerCount = userData?.followerCount || 0;
    const videoCount = userData?.videoCount || 0;
    const viewCount = userData?.viewCount || 0;

    if (followerCount < 10000) {
      throw new Error("Minimum 10,000 followers required");
    }

    if (viewCount < 100000) {
      throw new Error("Minimum 100,000 total views required");
    }

    if (videoCount < 5) {
      throw new Error("Minimum 5 videos required");
    }

    // Check for existing request
    const existingRequest = await db.collection("verificationRequests")
      .where("userId", "==", userId)
      .where("status", "==", "pending")
      .get();

    if (!existingRequest.empty) {
      throw new Error("Verification request already pending");
    }

    // Create verification request
    await db.collection("verificationRequests").add({
      userId,
      username: userData.displayName || "Unknown",
      profileImage: userData.profileImage || "",
      followerCount,
      videoCount,
      viewCount,
      status: "pending",
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      message: "Verification request submitted",
    };
  } catch (error: any) {
    console.error("Error in requestVerification:", error);
    throw new Error(error.message || "Failed to request verification");
  }
});

/**
 * Approve Verification (Admin Only)
 */
export const approveVerification = onCall(async (request) => {
  const adminId = request.auth?.uid;
  if (!adminId) {
    throw new Error("Authentication required");
  }

  try {
    // Verify admin privileges
    const adminDoc = await db.collection("users").doc(adminId).get();
    const adminData = adminDoc.data();

    if (!adminData?.isAdmin) {
      throw new Error("Admin privileges required");
    }

    const { userId, requestId } = request.data;

    // Update user verification status
    await db.collection("users").doc(userId).update({
      isVerified: true,
      verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update request status
    await db.collection("verificationRequests").doc(requestId).update({
      status: "approved",
      approvedBy: adminId,
      approvedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Send notification to user
    await db.collection("notifications").add({
      userId,
      type: "verification_approved",
      message: "Congratulations! Your account has been verified",
      isRead: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      message: "Verification approved",
    };
  } catch (error: any) {
    console.error("Error in approveVerification:", error);
    throw new Error(error.message || "Failed to approve verification");
  }
});

/**
 * Get Profile Analytics
 */
export const getProfileAnalytics = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new Error("Authentication required");
  }

  try {
    const { targetUserId } = request.data;
    const profileUserId = targetUserId || userId;

    // Verify user is profile owner
    if (profileUserId !== userId) {
      throw new Error("Can only view your own analytics");
    }

    // Get profile views (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const viewsSnapshot = await db.collection("profileViews")
      .where("profileId", "==", profileUserId)
      .where("timestamp", ">=", admin.firestore.Timestamp.fromDate(thirtyDaysAgo))
      .get();

    const totalViews = viewsSnapshot.size;
    const uniqueViewers = new Set(viewsSnapshot.docs.map(doc => doc.data().viewerId)).size;

    // Get follower growth (last 30 days)
    const followersSnapshot = await db.collection("followers")
      .where("followingId", "==", profileUserId)
      .where("timestamp", ">=", admin.firestore.Timestamp.fromDate(thirtyDaysAgo))
      .get();

    const newFollowers = followersSnapshot.size;

    // Get user stats
    const userDoc = await db.collection("users").doc(profileUserId).get();
    const userData = userDoc.data();

    return {
      success: true,
      analytics: {
        profileViews: {
          total: totalViews,
          unique: uniqueViewers,
        },
        followers: {
          total: userData?.followerCount || 0,
          newFollowers,
        },
        content: {
          videos: userData?.videoCount || 0,
          totalLikes: userData?.likeCount || 0,
          totalViews: userData?.viewCount || 0,
        },
        engagement: {
          averageLikesPerVideo: userData?.videoCount > 0 
            ? Math.round((userData?.likeCount || 0) / userData.videoCount) 
            : 0,
          averageViewsPerVideo: userData?.videoCount > 0 
            ? Math.round((userData?.viewCount || 0) / userData.videoCount) 
            : 0,
        },
      },
    };
  } catch (error: any) {
    console.error("Error in getProfileAnalytics:", error);
    throw new Error(error.message || "Failed to get analytics");
  }
});

// ============================================================================
// MESSAGING & SNAPS SYSTEM FUNCTIONS
// ============================================================================

/**
 * Create Conversation
 */
export const createConversation = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new Error("Authentication required");
  }

  try {
    const { participants, type, groupName, groupDescription } = request.data;

    if (!participants || participants.length === 0) {
      throw new Error("Participants are required");
    }

    // Add creator to participants if not already included
    if (!participants.includes(userId)) {
      participants.push(userId);
    }

    // For direct conversations, check if already exists
    if (type === "direct" && participants.length === 2) {
      const existingConv = await db.collection("conversations")
        .where("type", "==", "direct")
        .where("participants", "array-contains", userId)
        .get();

      for (const doc of existingConv.docs) {
        const data = doc.data();
        if (data.participants.length === 2 && 
            data.participants.includes(participants[0]) && 
            data.participants.includes(participants[1])) {
          return {
            success: true,
            conversationId: doc.id,
            exists: true,
          };
        }
      }
    }

    // Get participant data
    const participantData = [];
    for (const participantId of participants) {
      const userDoc = await db.collection("users").doc(participantId).get();
      const userData = userDoc.data();
      participantData.push({
        userId: participantId,
        username: userData?.displayName || "Unknown",
        profileImage: userData?.profileImage || "",
      });
    }

    // Create conversation
    const conversationRef = await db.collection("conversations").add({
      type: type || "direct",
      participants,
      participantData,
      groupName: groupName || null,
      groupImage: null,
      groupDescription: groupDescription || null,
      adminIds: type === "group" ? [userId] : [],
      lastMessage: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: userId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      isArchived: false,
      isMuted: false,
      theme: "default",
      emoji: "👍",
      disappearingMode: "off",
      encryptionEnabled: false,
    });

    const conversationId = conversationRef.id;

    // Create userConversations for all participants
    const batch = db.batch();
    for (const participantId of participants) {
      const userConvRef = db.collection("users").doc(participantId)
        .collection("conversations").doc(conversationId);
      
      batch.set(userConvRef, {
        conversationId,
        otherParticipants: participantData.filter(p => p.userId !== participantId),
        lastMessage: null,
        unreadCount: 0,
        lastViewed: admin.firestore.FieldValue.serverTimestamp(),
        isPinned: false,
        isMuted: false,
        isArchived: false,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    await batch.commit();

    return {
      success: true,
      conversationId,
      exists: false,
    };
  } catch (error: any) {
    console.error("Error in createConversation:", error);
    throw new Error(error.message || "Failed to create conversation");
  }
});

/**
 * Send Message
 */
export const sendMessage = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new Error("Authentication required");
  }

  try {
    const {
      conversationId,
      text,
      type,
      mediaUrl,
      mediaType,
      mediaDuration,
      thumbnailUrl,
      location,
      sharedContent,
      replyTo,
      isEphemeral,
      expiresIn,
    } = request.data;

    // Verify user is participant
    const conversationDoc = await db.collection("conversations").doc(conversationId).get();
    if (!conversationDoc.exists) {
      throw new Error("Conversation not found");
    }

    const conversationData = conversationDoc.data();
    if (!conversationData?.participants.includes(userId)) {
      throw new Error("Not a participant in this conversation");
    }

    // Get sender data
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data();

    // Create message
    const messageData: any = {
      conversationId,
      senderId: userId,
      senderUsername: userData?.displayName || "Unknown",
      senderProfileImage: userData?.profileImage || "",
      type: type || "text",
      text: text || "",
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      status: "sent",
      isDeleted: false,
      deletedFor: [],
      isEdited: false,
      reactions: {},
      deliveredTo: [],
      readBy: [],
      readTimestamps: {},
      viewedBy: [],
    };

    if (mediaUrl) messageData.mediaUrl = mediaUrl;
    if (mediaType) messageData.mediaType = mediaType;
    if (mediaDuration) messageData.mediaDuration = mediaDuration;
    if (thumbnailUrl) messageData.thumbnailUrl = thumbnailUrl;
    if (location) messageData.location = location;
    if (sharedContent) messageData.sharedContent = sharedContent;
    if (replyTo) {
      messageData.replyTo = replyTo;
      // Get reply message data
      const replyDoc = await db.collection("conversations").doc(conversationId)
        .collection("messages").doc(replyTo).get();
      if (replyDoc.exists) {
        const replyData = replyDoc.data();
        messageData.replyToData = {
          senderId: replyData?.senderId,
          senderUsername: replyData?.senderUsername,
          text: replyData?.text,
          type: replyData?.type,
        };
      }
    }

    if (isEphemeral) {
      messageData.isEphemeral = true;
      if (expiresIn) {
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);
        messageData.expiresAt = admin.firestore.Timestamp.fromDate(expiresAt);
      }
    }

    // Add message to conversation
    const messageRef = await db.collection("conversations").doc(conversationId)
      .collection("messages").add(messageData);

    // Update conversation lastMessage
    await db.collection("conversations").doc(conversationId).update({
      lastMessage: {
        senderId: userId,
        text: text || `Sent a ${type}`,
        type: type || "text",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update userConversations for all participants
    const batch = db.batch();
    for (const participantId of conversationData.participants) {
      const userConvRef = db.collection("users").doc(participantId)
        .collection("conversations").doc(conversationId);
      
      if (participantId !== userId) {
        // Increment unread count for other participants
        batch.update(userConvRef, {
          lastMessage: {
            senderId: userId,
            text: text || `Sent a ${type}`,
            type: type || "text",
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
          },
          unreadCount: admin.firestore.FieldValue.increment(1),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Send push notification (async)
        sendMessageNotification(participantId, userId, userData?.displayName || "Someone", text || `Sent a ${type}`);
      } else {
        // Update last viewed for sender
        batch.update(userConvRef, {
          lastMessage: {
            senderId: userId,
            text: text || `Sent a ${type}`,
            type: type || "text",
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
          },
          lastViewed: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }
    await batch.commit();

    return {
      success: true,
      messageId: messageRef.id,
      message: "Message sent",
    };
  } catch (error: any) {
    console.error("Error in sendMessage:", error);
    throw new Error(error.message || "Failed to send message");
  }
});

/**
 * Helper function to send message notification
 */
async function sendMessageNotification(
  userId: string,
  senderId: string,
  senderName: string,
  messageText: string
) {
  try {
    await db.collection("notifications").add({
      userId,
      type: "new_message",
      actorId: senderId,
      actorName: senderName,
      message: messageText,
      isRead: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error("Error sending message notification:", error);
  }
}

/**
 * Mark Messages as Read
 */
export const markMessagesAsRead = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new Error("Authentication required");
  }

  try {
    const { conversationId, messageIds } = request.data;

    // Verify user is participant
    const conversationDoc = await db.collection("conversations").doc(conversationId).get();
    if (!conversationDoc.exists) {
      throw new Error("Conversation not found");
    }

    const conversationData = conversationDoc.data();
    if (!conversationData?.participants.includes(userId)) {
      throw new Error("Not a participant in this conversation");
    }

    // Update messages
    const batch = db.batch();
    for (const messageId of messageIds) {
      const messageRef = db.collection("conversations").doc(conversationId)
        .collection("messages").doc(messageId);
      
      batch.update(messageRef, {
        readBy: admin.firestore.FieldValue.arrayUnion(userId),
        [`readTimestamps.${userId}`]: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // Reset unread count
    const userConvRef = db.collection("users").doc(userId)
      .collection("conversations").doc(conversationId);
    batch.update(userConvRef, {
      unreadCount: 0,
      lastViewed: admin.firestore.FieldValue.serverTimestamp(),
    });

    await batch.commit();

    return {
      success: true,
      message: "Messages marked as read",
    };
  } catch (error: any) {
    console.error("Error in markMessagesAsRead:", error);
    throw new Error(error.message || "Failed to mark messages as read");
  }
});

/**
 * Delete Message
 */
export const deleteMessage = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new Error("Authentication required");
  }

  try {
    const { conversationId, messageId, deleteForEveryone } = request.data;

    // Get message
    const messageDoc = await db.collection("conversations").doc(conversationId)
      .collection("messages").doc(messageId).get();
    
    if (!messageDoc.exists) {
      throw new Error("Message not found");
    }

    const messageData = messageDoc.data();

    // Verify user is sender or admin
    if (messageData?.senderId !== userId && !deleteForEveryone) {
      // Delete for self only
      await db.collection("conversations").doc(conversationId)
        .collection("messages").doc(messageId).update({
          deletedFor: admin.firestore.FieldValue.arrayUnion(userId),
        });

      return {
        success: true,
        message: "Message deleted for you",
      };
    }

    if (deleteForEveryone && messageData?.senderId !== userId) {
      throw new Error("Can only delete for everyone if you are the sender");
    }

    // Delete for everyone
    if (messageData?.isEphemeral) {
      // Completely delete ephemeral messages
      await db.collection("conversations").doc(conversationId)
        .collection("messages").doc(messageId).delete();
      
      // Delete media if exists
      if (messageData.mediaUrl) {
        deleteMessageMedia(messageData.mediaUrl);
      }
    } else {
      // Mark as deleted
      await db.collection("conversations").doc(conversationId)
        .collection("messages").doc(messageId).update({
          isDeleted: true,
          text: "",
          mediaUrl: null,
        });
    }

    return {
      success: true,
      message: "Message deleted",
    };
  } catch (error: any) {
    console.error("Error in deleteMessage:", error);
    throw new Error(error.message || "Failed to delete message");
  }
});

/**
 * Helper function to delete message media
 */
async function deleteMessageMedia(mediaUrl: string) {
  try {
    const bucket = admin.storage().bucket();
    const fileName = mediaUrl.split('/').pop();
    if (fileName) {
      const file = bucket.file(`messages/${fileName}`);
      await file.delete();
    }
  } catch (error) {
    console.error("Error deleting message media:", error);
  }
}

/**
 * React to Message
 */
export const reactToMessage = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new Error("Authentication required");
  }

  try {
    const { conversationId, messageId, emoji } = request.data;

    // Verify user is participant
    const conversationDoc = await db.collection("conversations").doc(conversationId).get();
    if (!conversationDoc.exists) {
      throw new Error("Conversation not found");
    }

    const conversationData = conversationDoc.data();
    if (!conversationData?.participants.includes(userId)) {
      throw new Error("Not a participant in this conversation");
    }

    // Get message
    const messageRef = db.collection("conversations").doc(conversationId)
      .collection("messages").doc(messageId);
    const messageDoc = await messageRef.get();

    if (!messageDoc.exists) {
      throw new Error("Message not found");
    }

    const messageData = messageDoc.data();
    const reactions = messageData?.reactions || {};

    // Toggle reaction
    if (reactions[emoji] && reactions[emoji].includes(userId)) {
      // Remove reaction
      reactions[emoji] = reactions[emoji].filter((id: string) => id !== userId);
      if (reactions[emoji].length === 0) {
        delete reactions[emoji];
      }
    } else {
      // Add reaction
      if (!reactions[emoji]) {
        reactions[emoji] = [];
      }
      reactions[emoji].push(userId);
    }

    await messageRef.update({ reactions });

    // Send notification to message sender
    if (messageData?.senderId !== userId) {
      await db.collection("notifications").add({
        userId: messageData.senderId,
        type: "message_reaction",
        actorId: userId,
        message: `Reacted ${emoji} to your message`,
        isRead: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    return {
      success: true,
      reactions,
    };
  } catch (error: any) {
    console.error("Error in reactToMessage:", error);
    throw new Error(error.message || "Failed to react to message");
  }
});

/**
 * Set Typing Indicator
 */
export const setTypingIndicator = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new Error("Authentication required");
  }

  try {
    const { conversationId, isTyping } = request.data;

    // Get user data
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data();

    // Update typing indicator
    const typingId = `${conversationId}_${userId}`;
    await db.collection("typingIndicators").doc(typingId).set({
      conversationId,
      userId,
      username: userData?.displayName || "Unknown",
      isTyping: isTyping || false,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    return {
      success: true,
    };
  } catch (error: any) {
    console.error("Error in setTypingIndicator:", error);
    throw new Error(error.message || "Failed to set typing indicator");
  }
});

/**
 * Initiate Call
 */
export const initiateCall = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new Error("Authentication required");
  }

  try {
    const { conversationId, type } = request.data; // type: 'voice' or 'video'

    // Verify user is participant
    const conversationDoc = await db.collection("conversations").doc(conversationId).get();
    if (!conversationDoc.exists) {
      throw new Error("Conversation not found");
    }

    const conversationData = conversationDoc.data();
    if (!conversationData?.participants.includes(userId)) {
      throw new Error("Not a participant in this conversation");
    }

    // Get caller data
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data();

    // Create call document
    const callRef = await db.collection("calls").add({
      conversationId,
      callerId: userId,
      callerUsername: userData?.displayName || "Unknown",
      participants: conversationData.participants,
      type: type || "voice",
      status: "ringing",
      startedAt: admin.firestore.FieldValue.serverTimestamp(),
      answeredBy: [],
      missedBy: [],
      declinedBy: [],
    });

    // Generate call token (placeholder - integrate with Agora/Twilio)
    const callToken = `call_token_${callRef.id}`;

    // Send call notifications to other participants
    for (const participantId of conversationData.participants) {
      if (participantId !== userId) {
        await db.collection("notifications").add({
          userId: participantId,
          type: "incoming_call",
          actorId: userId,
          actorName: userData?.displayName || "Someone",
          callId: callRef.id,
          callType: type,
          message: `${userData?.displayName || "Someone"} is calling...`,
          isRead: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }

    return {
      success: true,
      callId: callRef.id,
      callToken,
      message: "Call initiated",
    };
  } catch (error: any) {
    console.error("Error in initiateCall:", error);
    throw new Error(error.message || "Failed to initiate call");
  }
});

/**
 * Answer Call
 */
export const answerCall = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new Error("Authentication required");
  }

  try {
    const { callId } = request.data;

    // Get call document
    const callDoc = await db.collection("calls").doc(callId).get();
    if (!callDoc.exists) {
      throw new Error("Call not found");
    }

    const callData = callDoc.data();

    // Verify user is participant
    if (!callData?.participants.includes(userId)) {
      throw new Error("Not a participant in this call");
    }

    // Update call status
    await db.collection("calls").doc(callId).update({
      status: "ongoing",
      answeredBy: admin.firestore.FieldValue.arrayUnion(userId),
    });

    // Generate call token
    const callToken = `call_token_${callId}_${userId}`;

    return {
      success: true,
      callToken,
      message: "Call answered",
    };
  } catch (error: any) {
    console.error("Error in answerCall:", error);
    throw new Error(error.message || "Failed to answer call");
  }
});

/**
 * Decline Call
 */
export const declineCall = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new Error("Authentication required");
  }

  try {
    const { callId } = request.data;

    // Get call document
    const callDoc = await db.collection("calls").doc(callId).get();
    if (!callDoc.exists) {
      throw new Error("Call not found");
    }

    const callData = callDoc.data();

    // Verify user is participant
    if (!callData?.participants.includes(userId)) {
      throw new Error("Not a participant in this call");
    }

    // Update call status
    await db.collection("calls").doc(callId).update({
      declinedBy: admin.firestore.FieldValue.arrayUnion(userId),
    });

    // If all participants declined, end call
    const declinedCount = (callData.declinedBy?.length || 0) + 1;
    const totalParticipants = callData.participants.length - 1; // Exclude caller

    if (declinedCount >= totalParticipants) {
      await db.collection("calls").doc(callId).update({
        status: "declined",
        endedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    return {
      success: true,
      message: "Call declined",
    };
  } catch (error: any) {
    console.error("Error in declineCall:", error);
    throw new Error(error.message || "Failed to decline call");
  }
});

/**
 * End Call
 */
export const endCall = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new Error("Authentication required");
  }

  try {
    const { callId } = request.data;

    // Get call document
    const callDoc = await db.collection("calls").doc(callId).get();
    if (!callDoc.exists) {
      throw new Error("Call not found");
    }

    const callData = callDoc.data();

    // Verify user is participant
    if (!callData?.participants.includes(userId)) {
      throw new Error("Not a participant in this call");
    }

    // Calculate duration
    const startedAt = callData.startedAt?.toMillis() || Date.now();
    const duration = Math.floor((Date.now() - startedAt) / 1000);

    // Update call status
    await db.collection("calls").doc(callId).update({
      status: "ended",
      endedAt: admin.firestore.FieldValue.serverTimestamp(),
      duration,
    });

    // Create call message in conversation
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data();

    await db.collection("conversations").doc(callData.conversationId)
      .collection("messages").add({
        conversationId: callData.conversationId,
        senderId: userId,
        senderUsername: userData?.displayName || "Unknown",
        type: "call",
        text: `${callData.type === 'video' ? 'Video' : 'Voice'} call - ${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        status: "sent",
        isDeleted: false,
      });

    return {
      success: true,
      duration,
      message: "Call ended",
    };
  } catch (error: any) {
    console.error("Error in endCall:", error);
    throw new Error(error.message || "Failed to end call");
  }
});

/**
 * Expire Ephemeral Messages - Scheduled function
 */
export const expireEphemeralMessages = onSchedule("every 5 minutes", async (event) => {
  try {
    console.log("Expiring ephemeral messages...");

    const now = admin.firestore.Timestamp.now();

    // Query expired messages across all conversations
    const conversationsSnapshot = await db.collection("conversations").get();

    let expiredCount = 0;

    for (const convDoc of conversationsSnapshot.docs) {
      const messagesSnapshot = await db.collection("conversations").doc(convDoc.id)
        .collection("messages")
        .where("isEphemeral", "==", true)
        .where("expiresAt", "<=", now)
        .get();

      const batch = db.batch();
      for (const msgDoc of messagesSnapshot.docs) {
        const msgData = msgDoc.data();
        
        // Delete media if exists
        if (msgData.mediaUrl) {
          deleteMessageMedia(msgData.mediaUrl);
        }

        // Delete message
        batch.delete(msgDoc.ref);
        expiredCount++;
      }

      if (messagesSnapshot.size > 0) {
        await batch.commit();
      }
    }

    console.log(`Expired ${expiredCount} ephemeral messages`);
    return null;
  } catch (error: any) {
    console.error("Error expiring ephemeral messages:", error);
    return null;
  }
});

/**
 * Clean Up Old Typing Indicators - Scheduled function
 */
export const cleanupTypingIndicators = onSchedule("every 1 minutes", async (event) => {
  try {
    console.log("Cleaning up old typing indicators...");

    const fiveSecondsAgo = new Date();
    fiveSecondsAgo.setSeconds(fiveSecondsAgo.getSeconds() - 5);

    const oldIndicators = await db.collection("typingIndicators")
      .where("timestamp", "<=", admin.firestore.Timestamp.fromDate(fiveSecondsAgo))
      .get();

    const batch = db.batch();
    for (const doc of oldIndicators.docs) {
      batch.update(doc.ref, { isTyping: false });
    }

    if (oldIndicators.size > 0) {
      await batch.commit();
    }

    console.log(`Cleaned up ${oldIndicators.size} typing indicators`);
    return null;
  } catch (error: any) {
    console.error("Error cleaning up typing indicators:", error);
    return null;
  }
});

// ============================================================================
// ADS SYSTEM FUNCTIONS
// ============================================================================

/**
 * Create Ad (Admin Only)
 */
export const createAd = onCall(async (request) => {
  const adminId = request.auth?.uid;
  if (!adminId) {
    throw new Error("Authentication required");
  }

  try {
    // Verify admin privileges
    const adminDoc = await db.collection("users").doc(adminId).get();
    const adminData = adminDoc.data();

    if (!adminData?.isAdmin) {
      throw new Error("Admin privileges required");
    }

    const {
      title,
      description,
      type,
      mediaUrl,
      mediaType,
      thumbnailUrl,
      targetUrl,
      callToAction,
      budget,
      costPerImpression,
      costPerClick,
      targetAudience,
      startDate,
      endDate,
      isActive,
    } = request.data;

    // Validate required fields
    if (!title || !type || !mediaUrl) {
      throw new Error("Title, type, and media URL are required");
    }

    // Create ad document
    const adRef = await db.collection("ads").add({
      title,
      description: description || "",
      type: type || "feed", // feed, rewarded, interstitial
      mediaUrl,
      mediaType: mediaType || "image",
      thumbnailUrl: thumbnailUrl || mediaUrl,
      targetUrl: targetUrl || "",
      callToAction: callToAction || "Learn More",
      budget: budget || 0,
      spent: 0,
      costPerImpression: costPerImpression || 0.001,
      costPerClick: costPerClick || 0.01,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      targetAudience: targetAudience || {},
      startDate: startDate ? admin.firestore.Timestamp.fromDate(new Date(startDate)) : admin.firestore.FieldValue.serverTimestamp(),
      endDate: endDate ? admin.firestore.Timestamp.fromDate(new Date(endDate)) : null,
      isActive: isActive !== false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: adminId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      adId: adRef.id,
      message: "Ad created successfully",
    };
  } catch (error: any) {
    console.error("Error in createAd:", error);
    throw new Error(error.message || "Failed to create ad");
  }
});

/**
 * Update Ad (Admin Only)
 */
export const updateAd = onCall(async (request) => {
  const adminId = request.auth?.uid;
  if (!adminId) {
    throw new Error("Authentication required");
  }

  try {
    // Verify admin privileges
    const adminDoc = await db.collection("users").doc(adminId).get();
    const adminData = adminDoc.data();

    if (!adminData?.isAdmin) {
      throw new Error("Admin privileges required");
    }

    const { adId, updates } = request.data;

    if (!adId) {
      throw new Error("Ad ID is required");
    }

    // Update ad document
    await db.collection("ads").doc(adId).update({
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      message: "Ad updated successfully",
    };
  } catch (error: any) {
    console.error("Error in updateAd:", error);
    throw new Error(error.message || "Failed to update ad");
  }
});

/**
 * Delete Ad (Admin Only)
 */
export const deleteAd = onCall(async (request) => {
  const adminId = request.auth?.uid;
  if (!adminId) {
    throw new Error("Authentication required");
  }

  try {
    // Verify admin privileges
    const adminDoc = await db.collection("users").doc(adminId).get();
    const adminData = adminDoc.data();

    if (!adminData?.isAdmin) {
      throw new Error("Admin privileges required");
    }

    const { adId } = request.data;

    if (!adId) {
      throw new Error("Ad ID is required");
    }

    // Delete ad document
    await db.collection("ads").doc(adId).delete();

    return {
      success: true,
      message: "Ad deleted successfully",
    };
  } catch (error: any) {
    console.error("Error in deleteAd:", error);
    throw new Error(error.message || "Failed to delete ad");
  }
});

/**
 * Get Ads for Feed
 */
export const getAdsForFeed = onCall(async (request) => {
  const userId = request.auth?.uid;

  try {
    const { limit = 5 } = request.data;

    // Get active feed ads
    const now = admin.firestore.Timestamp.now();
    
    let query = db.collection("ads")
      .where("type", "==", "feed")
      .where("isActive", "==", true)
      .where("startDate", "<=", now);

    // Filter by end date if exists
    const adsSnapshot = await query.limit(limit * 2).get();

    const ads = [];
    for (const doc of adsSnapshot.docs) {
      const adData = doc.data();
      
      // Check end date
      if (adData.endDate && adData.endDate.toMillis() < Date.now()) {
        continue;
      }

      // Check budget
      if (adData.budget > 0 && adData.spent >= adData.budget) {
        continue;
      }

      // Check target audience (basic filtering)
      if (userId && adData.targetAudience) {
        const userDoc = await db.collection("users").doc(userId).get();
        const userData = userDoc.data();

        // Age filter
        if (adData.targetAudience.minAge && userData?.age < adData.targetAudience.minAge) {
          continue;
        }
        if (adData.targetAudience.maxAge && userData?.age > adData.targetAudience.maxAge) {
          continue;
        }

        // Gender filter
        if (adData.targetAudience.gender && adData.targetAudience.gender.length > 0) {
          if (!adData.targetAudience.gender.includes(userData?.gender)) {
            continue;
          }
        }

        // Location filter
        if (adData.targetAudience.countries && adData.targetAudience.countries.length > 0) {
          if (!adData.targetAudience.countries.includes(userData?.location?.country)) {
            continue;
          }
        }
      }

      ads.push({
        id: doc.id,
        ...adData,
      });

      if (ads.length >= limit) {
        break;
      }
    }

    return {
      success: true,
      ads,
    };
  } catch (error: any) {
    console.error("Error in getAdsForFeed:", error);
    throw new Error(error.message || "Failed to get ads");
  }
});

/**
 * Get Rewarded Ad
 */
export const getRewardedAd = onCall(async (request) => {
  const userId = request.auth?.uid;

  try {
    // Get active rewarded ads
    const now = admin.firestore.Timestamp.now();
    
    const adsSnapshot = await db.collection("ads")
      .where("type", "==", "rewarded")
      .where("isActive", "==", true)
      .where("startDate", "<=", now)
      .limit(10)
      .get();

    const eligibleAds = [];
    for (const doc of adsSnapshot.docs) {
      const adData = doc.data();
      
      // Check end date
      if (adData.endDate && adData.endDate.toMillis() < Date.now()) {
        continue;
      }

      // Check budget
      if (adData.budget > 0 && adData.spent >= adData.budget) {
        continue;
      }

      eligibleAds.push({
        id: doc.id,
        ...adData,
      });
    }

    // Return random ad
    if (eligibleAds.length > 0) {
      const randomAd = eligibleAds[Math.floor(Math.random() * eligibleAds.length)];
      return {
        success: true,
        ad: randomAd,
      };
    }

    return {
      success: false,
      message: "No rewarded ads available",
    };
  } catch (error: any) {
    console.error("Error in getRewardedAd:", error);
    throw new Error(error.message || "Failed to get rewarded ad");
  }
});

/**
 * Record Ad Impression
 */
export const recordAdImpression = onCall(async (request) => {
  const userId = request.auth?.uid;

  try {
    const { adId } = request.data;

    if (!adId) {
      throw new Error("Ad ID is required");
    }

    // Get ad document
    const adDoc = await db.collection("ads").doc(adId).get();
    if (!adDoc.exists) {
      throw new Error("Ad not found");
    }

    const adData = adDoc.data();

    // Calculate cost
    const cost = adData?.costPerImpression || 0.001;

    // Update ad statistics
    await db.collection("ads").doc(adId).update({
      impressions: admin.firestore.FieldValue.increment(1),
      spent: admin.firestore.FieldValue.increment(cost),
    });

    // Record impression
    await db.collection("adImpressions").add({
      adId,
      userId: userId || null,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      cost,
    });

    // Update platform revenue
    await db.collection("platformRevenue").doc("summary").set({
      adRevenue: admin.firestore.FieldValue.increment(cost),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    return {
      success: true,
      message: "Impression recorded",
    };
  } catch (error: any) {
    console.error("Error in recordAdImpression:", error);
    throw new Error(error.message || "Failed to record impression");
  }
});

/**
 * Record Ad Click
 */
export const recordAdClick = onCall(async (request) => {
  const userId = request.auth?.uid;

  try {
    const { adId } = request.data;

    if (!adId) {
      throw new Error("Ad ID is required");
    }

    // Get ad document
    const adDoc = await db.collection("ads").doc(adId).get();
    if (!adDoc.exists) {
      throw new Error("Ad not found");
    }

    const adData = adDoc.data();

    // Calculate cost
    const cost = adData?.costPerClick || 0.01;

    // Update ad statistics
    await db.collection("ads").doc(adId).update({
      clicks: admin.firestore.FieldValue.increment(1),
      spent: admin.firestore.FieldValue.increment(cost),
    });

    // Record click
    await db.collection("adClicks").add({
      adId,
      userId: userId || null,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      cost,
    });

    // Update platform revenue
    await db.collection("platformRevenue").doc("summary").set({
      adRevenue: admin.firestore.FieldValue.increment(cost),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    return {
      success: true,
      targetUrl: adData?.targetUrl || "",
      message: "Click recorded",
    };
  } catch (error: any) {
    console.error("Error in recordAdClick:", error);
    throw new Error(error.message || "Failed to record click");
  }
});

/**
 * Complete Rewarded Ad
 */
export const completeRewardedAd = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new Error("Authentication required");
  }

  try {
    const { adId, rewardType, rewardAmount } = request.data;

    if (!adId) {
      throw new Error("Ad ID is required");
    }

    // Get ad document
    const adDoc = await db.collection("ads").doc(adId).get();
    if (!adDoc.exists) {
      throw new Error("Ad not found");
    }

    const adData = adDoc.data();

    // Verify ad is rewarded type
    if (adData?.type !== "rewarded") {
      throw new Error("Ad is not a rewarded ad");
    }

    // Calculate cost
    const cost = adData?.costPerImpression || 0.001;

    // Update ad statistics
    await db.collection("ads").doc(adId).update({
      conversions: admin.firestore.FieldValue.increment(1),
      spent: admin.firestore.FieldValue.increment(cost),
    });

    // Grant reward to user
    const reward = rewardAmount || 10; // Default 10 coins
    await db.collection("users").doc(userId).update({
      coins: admin.firestore.FieldValue.increment(reward),
    });

    // Record conversion
    await db.collection("adConversions").add({
      adId,
      userId,
      rewardType: rewardType || "coins",
      rewardAmount: reward,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      cost,
    });

    // Update platform revenue
    await db.collection("platformRevenue").doc("summary").set({
      adRevenue: admin.firestore.FieldValue.increment(cost),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    return {
      success: true,
      reward: {
        type: rewardType || "coins",
        amount: reward,
      },
      message: "Reward granted",
    };
  } catch (error: any) {
    console.error("Error in completeRewardedAd:", error);
    throw new Error(error.message || "Failed to complete rewarded ad");
  }
});

/**
 * Get Ad Analytics (Admin Only)
 */
export const getAdAnalytics = onCall(async (request) => {
  const adminId = request.auth?.uid;
  if (!adminId) {
    throw new Error("Authentication required");
  }

  try {
    // Verify admin privileges
    const adminDoc = await db.collection("users").doc(adminId).get();
    const adminData = adminDoc.data();

    if (!adminData?.isAdmin) {
      throw new Error("Admin privileges required");
    }

    const { adId, startDate, endDate } = request.data;

    let query: any = db.collection("ads");

    if (adId) {
      // Get specific ad analytics
      const adDoc = await db.collection("ads").doc(adId).get();
      if (!adDoc.exists) {
        throw new Error("Ad not found");
      }

      const adData = adDoc.data();

      // Get impressions
      let impressionsQuery = db.collection("adImpressions").where("adId", "==", adId);
      if (startDate) {
        impressionsQuery = impressionsQuery.where("timestamp", ">=", admin.firestore.Timestamp.fromDate(new Date(startDate)));
      }
      if (endDate) {
        impressionsQuery = impressionsQuery.where("timestamp", "<=", admin.firestore.Timestamp.fromDate(new Date(endDate)));
      }
      const impressionsSnapshot = await impressionsQuery.get();

      // Get clicks
      let clicksQuery = db.collection("adClicks").where("adId", "==", adId);
      if (startDate) {
        clicksQuery = clicksQuery.where("timestamp", ">=", admin.firestore.Timestamp.fromDate(new Date(startDate)));
      }
      if (endDate) {
        clicksQuery = clicksQuery.where("timestamp", "<=", admin.firestore.Timestamp.fromDate(new Date(endDate)));
      }
      const clicksSnapshot = await clicksQuery.get();

      // Get conversions
      let conversionsQuery = db.collection("adConversions").where("adId", "==", adId);
      if (startDate) {
        conversionsQuery = conversionsQuery.where("timestamp", ">=", admin.firestore.Timestamp.fromDate(new Date(startDate)));
      }
      if (endDate) {
        conversionsQuery = conversionsQuery.where("timestamp", "<=", admin.firestore.Timestamp.fromDate(new Date(endDate)));
      }
      const conversionsSnapshot = await conversionsQuery.get();

      const impressions = impressionsSnapshot.size;
      const clicks = clicksSnapshot.size;
      const conversions = conversionsSnapshot.size;

      return {
        success: true,
        analytics: {
          adId,
          title: adData?.title,
          type: adData?.type,
          impressions,
          clicks,
          conversions,
          ctr: impressions > 0 ? (clicks / impressions * 100).toFixed(2) : 0,
          conversionRate: clicks > 0 ? (conversions / clicks * 100).toFixed(2) : 0,
          spent: adData?.spent || 0,
          budget: adData?.budget || 0,
          isActive: adData?.isActive || false,
        },
      };
    } else {
      // Get all ads analytics
      const adsSnapshot = await db.collection("ads").get();
      
      const adsAnalytics = [];
      for (const doc of adsSnapshot.docs) {
        const adData = doc.data();
        adsAnalytics.push({
          adId: doc.id,
          title: adData.title,
          type: adData.type,
          impressions: adData.impressions || 0,
          clicks: adData.clicks || 0,
          conversions: adData.conversions || 0,
          ctr: adData.impressions > 0 ? ((adData.clicks || 0) / adData.impressions * 100).toFixed(2) : 0,
          spent: adData.spent || 0,
          budget: adData.budget || 0,
          isActive: adData.isActive || false,
        });
      }

      return {
        success: true,
        analytics: adsAnalytics,
      };
    }
  } catch (error: any) {
    console.error("Error in getAdAnalytics:", error);
    throw new Error(error.message || "Failed to get ad analytics");
  }
});

/**
 * Pause/Resume Ad (Admin Only)
 */
export const toggleAdStatus = onCall(async (request) => {
  const adminId = request.auth?.uid;
  if (!adminId) {
    throw new Error("Authentication required");
  }

  try {
    // Verify admin privileges
    const adminDoc = await db.collection("users").doc(adminId).get();
    const adminData = adminDoc.data();

    if (!adminData?.isAdmin) {
      throw new Error("Admin privileges required");
    }

    const { adId, isActive } = request.data;

    if (!adId) {
      throw new Error("Ad ID is required");
    }

    // Update ad status
    await db.collection("ads").doc(adId).update({
      isActive: isActive !== false,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      message: isActive ? "Ad activated" : "Ad paused",
    };
  } catch (error: any) {
    console.error("Error in toggleAdStatus:", error);
    throw new Error(error.message || "Failed to toggle ad status");
  }
});

// ============================================================================
// AGE & SAFETY VERIFICATION SYSTEM FUNCTIONS
// ============================================================================

/**
 * Set Birth Date
 */
export const setBirthDate = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new Error("Authentication required");
  }

  try {
    const { birthDate } = request.data;

    if (!birthDate) {
      throw new Error("Birth date is required");
    }

    // Parse birth date
    const birthDateObj = new Date(birthDate);
    if (isNaN(birthDateObj.getTime())) {
      throw new Error("Invalid birth date format");
    }

    // Calculate age
    const today = new Date();
    let age = today.getFullYear() - birthDateObj.getFullYear();
    const monthDiff = today.getMonth() - birthDateObj.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
      age--;
    }

    // Check minimum age (13 years)
    if (age < 13) {
      throw new Error("You must be at least 13 years old to use this platform");
    }

    // Check if birth date already set
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data();

    if (userData?.birthDate) {
      throw new Error("Birth date can only be set once");
    }

    // Update user document
    await db.collection("users").doc(userId).update({
      birthDate: admin.firestore.Timestamp.fromDate(birthDateObj),
      age,
      isAgeVerified: true,
      ageVerifiedAt: admin.firestore.FieldValue.serverTimestamp(),
      contentFilterLevel: age < 18 ? "strict" : "moderate",
    });

    return {
      success: true,
      age,
      message: "Birth date set successfully",
    };
  } catch (error: any) {
    console.error("Error in setBirthDate:", error);
    throw new Error(error.message || "Failed to set birth date");
  }
});

/**
 * Request ID Verification
 */
export const requestIdVerification = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new Error("Authentication required");
  }

  try {
    const { idType, idNumber, idImageUrls } = request.data;

    if (!idType || !idNumber || !idImageUrls || idImageUrls.length === 0) {
      throw new Error("ID type, number, and images are required");
    }

    // Get user data
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data();

    // Check if already verified
    if (userData?.isIdVerified) {
      throw new Error("ID is already verified");
    }

    // Check for existing pending request
    const existingRequest = await db.collection("idVerificationRequests")
      .where("userId", "==", userId)
      .where("status", "==", "pending")
      .get();

    if (!existingRequest.empty) {
      throw new Error("ID verification request already pending");
    }

    // Create verification request
    await db.collection("idVerificationRequests").add({
      userId,
      username: userData?.displayName || "Unknown",
      idType,
      idNumber,
      idImageUrls,
      status: "pending",
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      message: "ID verification request submitted",
    };
  } catch (error: any) {
    console.error("Error in requestIdVerification:", error);
    throw new Error(error.message || "Failed to request ID verification");
  }
});

/**
 * Approve ID Verification (Admin Only)
 */
export const approveIdVerification = onCall(async (request) => {
  const adminId = request.auth?.uid;
  if (!adminId) {
    throw new Error("Authentication required");
  }

  try {
    // Verify admin privileges
    const adminDoc = await db.collection("users").doc(adminId).get();
    const adminData = adminDoc.data();

    if (!adminData?.isAdmin) {
      throw new Error("Admin privileges required");
    }

    const { userId, requestId, verifiedAge } = request.data;

    // Update user verification status
    await db.collection("users").doc(userId).update({
      isIdVerified: true,
      idVerifiedAt: admin.firestore.FieldValue.serverTimestamp(),
      age: verifiedAge || null,
    });

    // Update request status
    await db.collection("idVerificationRequests").doc(requestId).update({
      status: "approved",
      approvedBy: adminId,
      approvedAt: admin.firestore.FieldValue.serverTimestamp(),
      verifiedAge,
    });

    // Send notification to user
    await db.collection("notifications").add({
      userId,
      type: "id_verification_approved",
      message: "Your ID verification has been approved",
      isRead: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      message: "ID verification approved",
    };
  } catch (error: any) {
    console.error("Error in approveIdVerification:", error);
    throw new Error(error.message || "Failed to approve ID verification");
  }
});

/**
 * Reject ID Verification (Admin Only)
 */
export const rejectIdVerification = onCall(async (request) => {
  const adminId = request.auth?.uid;
  if (!adminId) {
    throw new Error("Authentication required");
  }

  try {
    // Verify admin privileges
    const adminDoc = await db.collection("users").doc(adminId).get();
    const adminData = adminDoc.data();

    if (!adminData?.isAdmin) {
      throw new Error("Admin privileges required");
    }

    const { userId, requestId, reason } = request.data;

    // Update request status
    await db.collection("idVerificationRequests").doc(requestId).update({
      status: "rejected",
      rejectedBy: adminId,
      rejectedAt: admin.firestore.FieldValue.serverTimestamp(),
      rejectionReason: reason || "ID verification failed",
    });

    // Send notification to user
    await db.collection("notifications").add({
      userId,
      type: "id_verification_rejected",
      message: `ID verification rejected: ${reason || "Please try again with valid documents"}`,
      isRead: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      message: "ID verification rejected",
    };
  } catch (error: any) {
    console.error("Error in rejectIdVerification:", error);
    throw new Error(error.message || "Failed to reject ID verification");
  }
});

/**
 * Update Content Filter Level
 */
export const updateContentFilterLevel = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new Error("Authentication required");
  }

  try {
    const { level } = request.data; // strict, moderate, off

    if (!level || !['strict', 'moderate', 'off'].includes(level)) {
      throw new Error("Invalid content filter level");
    }

    // Get user data
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data();

    // Check age restrictions
    if (userData?.age && userData.age < 18 && level === 'off') {
      throw new Error("Users under 18 cannot turn off content filters");
    }

    // Update content filter level
    await db.collection("users").doc(userId).update({
      contentFilterLevel: level,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      message: "Content filter level updated",
    };
  } catch (error: any) {
    console.error("Error in updateContentFilterLevel:", error);
    throw new Error(error.message || "Failed to update content filter level");
  }
});

/**
 * Check Content Age Restriction
 */
export const checkContentAgeRestriction = onCall(async (request) => {
  const userId = request.auth?.uid;

  try {
    const { contentId, contentType } = request.data; // contentType: video, story, livestream

    if (!contentId || !contentType) {
      throw new Error("Content ID and type are required");
    }

    // Get content
    let contentDoc;
    if (contentType === "video") {
      contentDoc = await db.collection("videos").doc(contentId).get();
    } else if (contentType === "story") {
      contentDoc = await db.collection("stories").doc(contentId).get();
    } else if (contentType === "livestream") {
      contentDoc = await db.collection("liveStreams").doc(contentId).get();
    } else {
      throw new Error("Invalid content type");
    }

    if (!contentDoc || !contentDoc.exists) {
      throw new Error("Content not found");
    }

    const contentData = contentDoc.data();
    const ageRestriction = contentData?.ageRestriction || 0;

    // If no user, check if content is age-restricted
    if (!userId) {
      return {
        success: true,
        canView: ageRestriction === 0,
        requiresAuth: ageRestriction > 0,
        ageRestriction,
      };
    }

    // Get user age
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data();
    const userAge = userData?.age || 0;

    // Check if user can view
    const canView = userAge >= ageRestriction;

    return {
      success: true,
      canView,
      userAge,
      ageRestriction,
      message: canView ? "Content accessible" : `This content is restricted to users ${ageRestriction}+`,
    };
  } catch (error: any) {
    console.error("Error in checkContentAgeRestriction:", error);
    throw new Error(error.message || "Failed to check age restriction");
  }
});

/**
 * Set Content Age Restriction
 */
export const setContentAgeRestriction = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new Error("Authentication required");
  }

  try {
    const { contentId, contentType, ageRestriction } = request.data;

    if (!contentId || !contentType) {
      throw new Error("Content ID and type are required");
    }

    if (ageRestriction && (ageRestriction < 0 || ageRestriction > 21)) {
      throw new Error("Age restriction must be between 0 and 21");
    }

    // Get content
    let contentDoc;
    if (contentType === "video") {
      contentDoc = await db.collection("videos").doc(contentId).get();
    } else if (contentType === "story") {
      contentDoc = await db.collection("stories").doc(contentId).get();
    } else if (contentType === "livestream") {
      contentDoc = await db.collection("liveStreams").doc(contentId).get();
    } else {
      throw new Error("Invalid content type");
    }

    if (!contentDoc || !contentDoc.exists) {
      throw new Error("Content not found");
    }

    const contentData = contentDoc.data();

    // Verify user is content owner
    if (contentData?.userId !== userId) {
      throw new Error("You can only set age restrictions on your own content");
    }

    // Update content age restriction
    await contentDoc.ref.update({
      ageRestriction: ageRestriction || 0,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      message: "Age restriction updated",
    };
  } catch (error: any) {
    console.error("Error in setContentAgeRestriction:", error);
    throw new Error(error.message || "Failed to set age restriction");
  }
});

/**
 * Enable Parental Controls (Admin Only)
 */
export const enableParentalControls = onCall(async (request) => {
  const adminId = request.auth?.uid;
  if (!adminId) {
    throw new Error("Authentication required");
  }

  try {
    // Verify admin privileges
    const adminDoc = await db.collection("users").doc(adminId).get();
    const adminData = adminDoc.data();

    if (!adminData?.isAdmin) {
      throw new Error("Admin privileges required");
    }

    const { userId, settings } = request.data;

    if (!userId || !settings) {
      throw new Error("User ID and settings are required");
    }

    // Update user parental controls
    await db.collection("users").doc(userId).update({
      parentalControls: {
        enabled: true,
        restrictedMode: settings.restrictedMode || true,
        allowDirectMessages: settings.allowDirectMessages || false,
        allowComments: settings.allowComments || false,
        allowLiveStreaming: settings.allowLiveStreaming || false,
        screenTimeLimit: settings.screenTimeLimit || 0,
        contentFilterLevel: "strict",
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      message: "Parental controls enabled",
    };
  } catch (error: any) {
    console.error("Error in enableParentalControls:", error);
    throw new Error(error.message || "Failed to enable parental controls");
  }
});

/**
 * Update Age Verification Status - Scheduled function
 */
export const updateAgeVerificationStatus = onSchedule("every 24 hours", async (event) => {
  try {
    console.log("Updating age verification status...");

    // Get all users with birth dates
    const usersSnapshot = await db.collection("users")
      .where("birthDate", "!=", null)
      .get();

    const batch = db.batch();
    let updateCount = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const birthDate = userData.birthDate?.toDate();

      if (birthDate) {
        // Recalculate age
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }

        // Update age if changed
        if (userData.age !== age) {
          batch.update(userDoc.ref, {
            age,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          updateCount++;
        }

        // Update content filter level for users turning 18
        if (userData.age === 17 && age === 18 && userData.contentFilterLevel === "strict") {
          batch.update(userDoc.ref, {
            contentFilterLevel: "moderate",
          });
        }
      }

      // Commit batch every 500 updates
      if (updateCount >= 500) {
        await batch.commit();
        updateCount = 0;
      }
    }

    if (updateCount > 0) {
      await batch.commit();
    }

    console.log(`Updated age for ${updateCount} users`);
    return null;
  } catch (error: any) {
    console.error("Error updating age verification status:", error);
    return null;
  }
});

// ============================================================================
// REPORTS & PENALTIES SYSTEM FUNCTIONS
// ============================================================================

/**
 * Report Content or User
 */
export const reportContent = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new Error("Authentication required");
  }

  try {
    const {
      reportType,
      targetId,
      targetType,
      reason,
      description,
      evidence,
    } = request.data;

    if (!reportType || !targetId || !targetType || !reason) {
      throw new Error("Report type, target ID, target type, and reason are required");
    }

    // Get reporter data
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data();

    // Check for duplicate reports (same user, same target, within 24 hours)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const existingReport = await db.collection("reports")
      .where("reporterId", "==", userId)
      .where("targetId", "==", targetId)
      .where("timestamp", ">=", admin.firestore.Timestamp.fromDate(oneDayAgo))
      .get();

    if (!existingReport.empty) {
      throw new Error("You have already reported this content recently");
    }

    // Create report
    const reportRef = await db.collection("reports").add({
      reporterId: userId,
      reporterUsername: userData?.displayName || "Unknown",
      reportType, // spam, harassment, inappropriate, violence, hate_speech, copyright, other
      targetId,
      targetType, // user, video, story, comment, livestream, message
      reason,
      description: description || "",
      evidence: evidence || [],
      status: "pending",
      priority: calculateReportPriority(reportType),
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      reviewedBy: null,
      reviewedAt: null,
      action: null,
      actionReason: null,
    });

    // Increment report count on target
    if (targetType === "user") {
      await db.collection("users").doc(targetId).update({
        reportCount: admin.firestore.FieldValue.increment(1),
      });
    } else if (targetType === "video") {
      await db.collection("videos").doc(targetId).update({
        reportCount: admin.firestore.FieldValue.increment(1),
      });
    } else if (targetType === "story") {
      await db.collection("stories").doc(targetId).update({
        reportCount: admin.firestore.FieldValue.increment(1),
      });
    } else if (targetType === "livestream") {
      await db.collection("liveStreams").doc(targetId).update({
        reportCount: admin.firestore.FieldValue.increment(1),
      });
    }

    // Auto-moderate if threshold exceeded
    await checkAutoModeration(targetId, targetType);

    return {
      success: true,
      reportId: reportRef.id,
      message: "Report submitted successfully",
    };
  } catch (error: any) {
    console.error("Error in reportContent:", error);
    throw new Error(error.message || "Failed to submit report");
  }
});

/**
 * Helper function to calculate report priority
 */
function calculateReportPriority(reportType: string): string {
  const highPriority = ['violence', 'hate_speech', 'child_safety', 'self_harm'];
  const mediumPriority = ['harassment', 'inappropriate', 'bullying'];
  
  if (highPriority.includes(reportType)) {
    return "high";
  } else if (mediumPriority.includes(reportType)) {
    return "medium";
  }
  return "low";
}

/**
 * Helper function to check auto-moderation thresholds
 */
async function checkAutoModeration(targetId: string, targetType: string) {
  try {
    let doc;
    if (targetType === "video") {
      doc = await db.collection("videos").doc(targetId).get();
    } else if (targetType === "story") {
      doc = await db.collection("stories").doc(targetId).get();
    } else if (targetType === "livestream") {
      doc = await db.collection("liveStreams").doc(targetId).get();
    } else if (targetType === "user") {
      doc = await db.collection("users").doc(targetId).get();
    }

    if (!doc || !doc.exists) {
      return;
    }

    const data = doc.data();
    const reportCount = data?.reportCount || 0;

    // Auto-hide content if report threshold exceeded
    if (targetType !== "user" && reportCount >= 10) {
      await doc.ref.update({
        isHidden: true,
        hiddenReason: "auto_moderation",
        hiddenAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Notify content owner
      await db.collection("notifications").add({
        userId: data?.userId,
        type: "content_hidden",
        message: "Your content has been temporarily hidden due to multiple reports",
        isRead: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // Issue warning to user if threshold exceeded
    if (targetType === "user" && reportCount >= 5) {
      await issueWarning(targetId, "Multiple reports received", "auto_moderation");
    }
  } catch (error) {
    console.error("Error in auto-moderation check:", error);
  }
}

/**
 * Review Report (Admin Only)
 */
export const reviewReport = onCall(async (request) => {
  const adminId = request.auth?.uid;
  if (!adminId) {
    throw new Error("Authentication required");
  }

  try {
    // Verify admin privileges
    const adminDoc = await db.collection("users").doc(adminId).get();
    const adminData = adminDoc.data();

    if (!adminData?.isAdmin) {
      throw new Error("Admin privileges required");
    }

    const { reportId, action, actionReason, banDuration } = request.data;

    if (!reportId || !action) {
      throw new Error("Report ID and action are required");
    }

    // Get report
    const reportDoc = await db.collection("reports").doc(reportId).get();
    if (!reportDoc.exists) {
      throw new Error("Report not found");
    }

    const reportData = reportDoc.data();

    // Update report status
    await db.collection("reports").doc(reportId).update({
      status: action === "dismiss" ? "dismissed" : "resolved",
      action,
      actionReason: actionReason || "",
      reviewedBy: adminId,
      reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Take action based on decision
    if (action === "remove_content") {
      await removeContent(reportData?.targetId, reportData?.targetType);
    } else if (action === "hide_content") {
      await hideContent(reportData?.targetId, reportData?.targetType);
    } else if (action === "warn_user") {
      await issueWarning(reportData?.targetId, actionReason || "Violation of community guidelines", adminId);
    } else if (action === "ban_user") {
      await banUser(reportData?.targetId, banDuration || 7, actionReason || "Violation of community guidelines", adminId);
    }

    return {
      success: true,
      message: "Report reviewed successfully",
    };
  } catch (error: any) {
    console.error("Error in reviewReport:", error);
    throw new Error(error.message || "Failed to review report");
  }
});

/**
 * Helper function to remove content
 */
async function removeContent(targetId: string, targetType: string) {
  try {
    if (targetType === "video") {
      await db.collection("videos").doc(targetId).update({
        isDeleted: true,
        deletedReason: "community_guidelines_violation",
        deletedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else if (targetType === "story") {
      await db.collection("stories").doc(targetId).delete();
    } else if (targetType === "comment") {
      // Find and delete comment (implementation depends on comment structure)
      // Placeholder for comment deletion logic
    }
  } catch (error) {
    console.error("Error removing content:", error);
  }
}

/**
 * Helper function to hide content
 */
async function hideContent(targetId: string, targetType: string) {
  try {
    if (targetType === "video") {
      await db.collection("videos").doc(targetId).update({
        isHidden: true,
        hiddenReason: "community_guidelines_violation",
        hiddenAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else if (targetType === "story") {
      await db.collection("stories").doc(targetId).update({
        isHidden: true,
        hiddenReason: "community_guidelines_violation",
        hiddenAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else if (targetType === "livestream") {
      await db.collection("liveStreams").doc(targetId).update({
        status: "terminated",
        terminationReason: "community_guidelines_violation",
      });
    }
  } catch (error) {
    console.error("Error hiding content:", error);
  }
}

/**
 * Helper function to issue warning
 */
async function issueWarning(userId: string, reason: string, issuedBy: string) {
  try {
    // Get user data
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data();
    const currentWarnings = userData?.warningCount || 0;

    // Create warning record
    await db.collection("warnings").add({
      userId,
      reason,
      issuedBy,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      warningNumber: currentWarnings + 1,
    });

    // Update user warning count
    await db.collection("users").doc(userId).update({
      warningCount: admin.firestore.FieldValue.increment(1),
    });

    // Send notification
    await db.collection("notifications").add({
      userId,
      type: "warning",
      message: `Warning ${currentWarnings + 1}/3: ${reason}`,
      isRead: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Auto-ban if 3 warnings reached
    if (currentWarnings + 1 >= 3) {
      await banUser(userId, 7, "Three warnings received", "auto_moderation");
    }
  } catch (error) {
    console.error("Error issuing warning:", error);
  }
}

/**
 * Helper function to ban user
 */
async function banUser(userId: string, durationDays: number, reason: string, bannedBy: string) {
  try {
    const banExpiresAt = new Date();
    banExpiresAt.setDate(banExpiresAt.getDate() + durationDays);

    // Update user ban status
    await db.collection("users").doc(userId).update({
      isBanned: true,
      banReason: reason,
      banExpiresAt: admin.firestore.Timestamp.fromDate(banExpiresAt),
      bannedBy,
      bannedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Create ban record
    await db.collection("bans").add({
      userId,
      reason,
      duration: durationDays,
      expiresAt: admin.firestore.Timestamp.fromDate(banExpiresAt),
      bannedBy,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      isActive: true,
    });

    // Send notification
    await db.collection("notifications").add({
      userId,
      type: "account_banned",
      message: `Your account has been banned for ${durationDays} days. Reason: ${reason}`,
      isRead: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // End any active live streams
    const liveStreamsSnapshot = await db.collection("liveStreams")
      .where("userId", "==", userId)
      .where("status", "==", "live")
      .get();

    for (const doc of liveStreamsSnapshot.docs) {
      await doc.ref.update({
        status: "terminated",
        terminationReason: "user_banned",
        endedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  } catch (error) {
    console.error("Error banning user:", error);
  }
}

/**
 * Ban User (Admin Only)
 */
export const banUserManual = onCall(async (request) => {
  const adminId = request.auth?.uid;
  if (!adminId) {
    throw new Error("Authentication required");
  }

  try {
    // Verify admin privileges
    const adminDoc = await db.collection("users").doc(adminId).get();
    const adminData = adminDoc.data();

    if (!adminData?.isAdmin) {
      throw new Error("Admin privileges required");
    }

    const { userId, durationDays, reason } = request.data;

    if (!userId || !durationDays || !reason) {
      throw new Error("User ID, duration, and reason are required");
    }

    await banUser(userId, durationDays, reason, adminId);

    return {
      success: true,
      message: "User banned successfully",
    };
  } catch (error: any) {
    console.error("Error in banUserManual:", error);
    throw new Error(error.message || "Failed to ban user");
  }
});

/**
 * Unban User (Admin Only)
 */
export const unbanUser = onCall(async (request) => {
  const adminId = request.auth?.uid;
  if (!adminId) {
    throw new Error("Authentication required");
  }

  try {
    // Verify admin privileges
    const adminDoc = await db.collection("users").doc(adminId).get();
    const adminData = adminDoc.data();

    if (!adminData?.isAdmin) {
      throw new Error("Admin privileges required");
    }

    const { userId } = request.data;

    if (!userId) {
      throw new Error("User ID is required");
    }

    // Update user ban status
    await db.collection("users").doc(userId).update({
      isBanned: false,
      banReason: null,
      banExpiresAt: null,
      unbannedBy: adminId,
      unbannedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Deactivate ban records
    const bansSnapshot = await db.collection("bans")
      .where("userId", "==", userId)
      .where("isActive", "==", true)
      .get();

    const batch = db.batch();
    for (const doc of bansSnapshot.docs) {
      batch.update(doc.ref, {
        isActive: false,
        unbannedBy: adminId,
        unbannedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    await batch.commit();

    // Send notification
    await db.collection("notifications").add({
      userId,
      type: "account_unbanned",
      message: "Your account has been unbanned. Please follow our community guidelines.",
      isRead: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      message: "User unbanned successfully",
    };
  } catch (error: any) {
    console.error("Error in unbanUser:", error);
    throw new Error(error.message || "Failed to unban user");
  }
});

/**
 * Get Pending Reports (Admin Only)
 */
export const getPendingReports = onCall(async (request) => {
  const adminId = request.auth?.uid;
  if (!adminId) {
    throw new Error("Authentication required");
  }

  try {
    // Verify admin privileges
    const adminDoc = await db.collection("users").doc(adminId).get();
    const adminData = adminDoc.data();

    if (!adminData?.isAdmin) {
      throw new Error("Admin privileges required");
    }

    const { limit = 20, priority } = request.data;

    let query = db.collection("reports")
      .where("status", "==", "pending")
      .orderBy("priority", "desc")
      .orderBy("timestamp", "desc")
      .limit(limit);

    if (priority) {
      query = query.where("priority", "==", priority);
    }

    const reportsSnapshot = await query.get();
    const reports = reportsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return {
      success: true,
      reports,
    };
  } catch (error: any) {
    console.error("Error in getPendingReports:", error);
    throw new Error(error.message || "Failed to get pending reports");
  }
});

/**
 * Get Moderation Statistics (Admin Only)
 */
export const getModerationStats = onCall(async (request) => {
  const adminId = request.auth?.uid;
  if (!adminId) {
    throw new Error("Authentication required");
  }

  try {
    // Verify admin privileges
    const adminDoc = await db.collection("users").doc(adminId).get();
    const adminData = adminDoc.data();

    if (!adminData?.isAdmin) {
      throw new Error("Admin privileges required");
    }

    const { startDate, endDate } = request.data;

    // Get reports statistics
    let reportsQuery = db.collection("reports");
    if (startDate) {
      reportsQuery = reportsQuery.where("timestamp", ">=", admin.firestore.Timestamp.fromDate(new Date(startDate)));
    }
    if (endDate) {
      reportsQuery = reportsQuery.where("timestamp", "<=", admin.firestore.Timestamp.fromDate(new Date(endDate)));
    }

    const reportsSnapshot = await reportsQuery.get();
    const totalReports = reportsSnapshot.size;
    const pendingReports = reportsSnapshot.docs.filter(doc => doc.data().status === "pending").length;
    const resolvedReports = reportsSnapshot.docs.filter(doc => doc.data().status === "resolved").length;
    const dismissedReports = reportsSnapshot.docs.filter(doc => doc.data().status === "dismissed").length;

    // Get warnings statistics
    let warningsQuery = db.collection("warnings");
    if (startDate) {
      warningsQuery = warningsQuery.where("timestamp", ">=", admin.firestore.Timestamp.fromDate(new Date(startDate)));
    }
    if (endDate) {
      warningsQuery = warningsQuery.where("timestamp", "<=", admin.firestore.Timestamp.fromDate(new Date(endDate)));
    }

    const warningsSnapshot = await warningsQuery.get();
    const totalWarnings = warningsSnapshot.size;

    // Get bans statistics
    let bansQuery = db.collection("bans");
    if (startDate) {
      bansQuery = bansQuery.where("timestamp", ">=", admin.firestore.Timestamp.fromDate(new Date(startDate)));
    }
    if (endDate) {
      bansQuery = bansQuery.where("timestamp", "<=", admin.firestore.Timestamp.fromDate(new Date(endDate)));
    }

    const bansSnapshot = await bansQuery.get();
    const totalBans = bansSnapshot.size;
    const activeBans = bansSnapshot.docs.filter(doc => doc.data().isActive).length;

    return {
      success: true,
      stats: {
        reports: {
          total: totalReports,
          pending: pendingReports,
          resolved: resolvedReports,
          dismissed: dismissedReports,
        },
        warnings: {
          total: totalWarnings,
        },
        bans: {
          total: totalBans,
          active: activeBans,
        },
      },
    };
  } catch (error: any) {
    console.error("Error in getModerationStats:", error);
    throw new Error(error.message || "Failed to get moderation statistics");
  }
});

/**
 * Check and Expire Bans - Scheduled function
 */
export const checkExpiredBans = onSchedule("every 1 hours", async (event) => {
  try {
    console.log("Checking for expired bans...");

    const now = admin.firestore.Timestamp.now();

    // Get expired bans
    const expiredBans = await db.collection("bans")
      .where("isActive", "==", true)
      .where("expiresAt", "<=", now)
      .get();

    const batch = db.batch();
    const unbannedUsers = new Set<string>();

    for (const banDoc of expiredBans.docs) {
      const banData = banDoc.data();
      
      // Deactivate ban
      batch.update(banDoc.ref, {
        isActive: false,
        expiredAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      unbannedUsers.add(banData.userId);
    }

    // Update user ban status
    for (const userId of unbannedUsers) {
      batch.update(db.collection("users").doc(userId), {
        isBanned: false,
        banReason: null,
        banExpiresAt: null,
      });

      // Send notification
      await db.collection("notifications").add({
        userId,
        type: "ban_expired",
        message: "Your ban has expired. Welcome back! Please follow our community guidelines.",
        isRead: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    if (expiredBans.size > 0) {
      await batch.commit();
    }

    console.log(`Expired ${expiredBans.size} bans`);
    return null;
  } catch (error: any) {
    console.error("Error checking expired bans:", error);
    return null;
  }
});

/**
 * Generate Monthly Moderation Report - Scheduled function
 */
export const generateMonthlyModerationReport = onSchedule("0 0 1 * *", async (event) => {
  try {
    console.log("Generating monthly moderation report...");

    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get reports from last month
    const reportsSnapshot = await db.collection("reports")
      .where("timestamp", ">=", admin.firestore.Timestamp.fromDate(lastMonth))
      .where("timestamp", "<", admin.firestore.Timestamp.fromDate(thisMonth))
      .get();

    // Get warnings from last month
    const warningsSnapshot = await db.collection("warnings")
      .where("timestamp", ">=", admin.firestore.Timestamp.fromDate(lastMonth))
      .where("timestamp", "<", admin.firestore.Timestamp.fromDate(thisMonth))
      .get();

    // Get bans from last month
    const bansSnapshot = await db.collection("bans")
      .where("timestamp", ">=", admin.firestore.Timestamp.fromDate(lastMonth))
      .where("timestamp", "<", admin.firestore.Timestamp.fromDate(thisMonth))
      .get();

    // Generate report
    const report = {
      period: {
        start: lastMonth,
        end: thisMonth,
      },
      reports: {
        total: reportsSnapshot.size,
        byType: {},
        byStatus: {},
      },
      warnings: {
        total: warningsSnapshot.size,
      },
      bans: {
        total: bansSnapshot.size,
      },
      generatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Count reports by type and status
    for (const doc of reportsSnapshot.docs) {
      const data = doc.data();
      const type = data.reportType || "unknown";
      const status = data.status || "unknown";

      report.reports.byType[type] = (report.reports.byType[type] || 0) + 1;
      report.reports.byStatus[status] = (report.reports.byStatus[status] || 0) + 1;
    }

    // Save report
    await db.collection("moderationReports").add(report);

    console.log("Monthly moderation report generated");
    return null;
  } catch (error: any) {
    console.error("Error generating monthly moderation report:", error);
    return null;
  }
});

// ============================================================================
// NOTIFICATIONS SYSTEM FUNCTIONS
// ============================================================================

/**
 * Register FCM Token
 */
export const registerFcmToken = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new Error("Authentication required");
  }

  try {
    const { token, platform } = request.data; // platform: ios, android, web

    if (!token) {
      throw new Error("FCM token is required");
    }

    // Store token in user document
    await db.collection("users").doc(userId).update({
      fcmTokens: admin.firestore.FieldValue.arrayUnion({
        token,
        platform: platform || "unknown",
        registeredAt: admin.firestore.FieldValue.serverTimestamp(),
      }),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      message: "FCM token registered",
    };
  } catch (error: any) {
    console.error("Error in registerFcmToken:", error);
    throw new Error(error.message || "Failed to register FCM token");
  }
});

/**
 * Unregister FCM Token
 */
export const unregisterFcmToken = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new Error("Authentication required");
  }

  try {
    const { token } = request.data;

    if (!token) {
      throw new Error("FCM token is required");
    }

    // Get user document
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data();
    const fcmTokens = userData?.fcmTokens || [];

    // Remove token
    const updatedTokens = fcmTokens.filter((t: any) => t.token !== token);

    await db.collection("users").doc(userId).update({
      fcmTokens: updatedTokens,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      message: "FCM token unregistered",
    };
  } catch (error: any) {
    console.error("Error in unregisterFcmToken:", error);
    throw new Error(error.message || "Failed to unregister FCM token");
  }
});

/**
 * Send Push Notification
 */
async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data?: any
) {
  try {
    // Get user FCM tokens
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data();
    const fcmTokens = userData?.fcmTokens || [];

    if (fcmTokens.length === 0) {
      console.log(`No FCM tokens for user ${userId}`);
      return;
    }

    // Prepare notification payload
    const message = {
      notification: {
        title,
        body,
      },
      data: data || {},
      tokens: fcmTokens.map((t: any) => t.token),
    };

    // Send multicast message
    const response = await admin.messaging().sendMulticast(message);

    console.log(`Sent notification to ${response.successCount} devices`);

    // Remove invalid tokens
    if (response.failureCount > 0) {
      const invalidTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          invalidTokens.push(fcmTokens[idx].token);
        }
      });

      if (invalidTokens.length > 0) {
        const validTokens = fcmTokens.filter((t: any) => !invalidTokens.includes(t.token));
        await db.collection("users").doc(userId).update({
          fcmTokens: validTokens,
        });
      }
    }
  } catch (error) {
    console.error("Error sending push notification:", error);
  }
}

/**
 * Get Notifications
 */
export const getNotifications = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new Error("Authentication required");
  }

  try {
    const { limit = 20, lastNotificationId } = request.data;

    let query = db.collection("notifications")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(limit);

    if (lastNotificationId) {
      const lastDoc = await db.collection("notifications").doc(lastNotificationId).get();
      if (lastDoc.exists) {
        query = query.startAfter(lastDoc);
      }
    }

    const notificationsSnapshot = await query.get();
    const notifications = notificationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Get unread count
    const unreadSnapshot = await db.collection("notifications")
      .where("userId", "==", userId)
      .where("isRead", "==", false)
      .get();

    return {
      success: true,
      notifications,
      unreadCount: unreadSnapshot.size,
      hasMore: notifications.length === limit,
    };
  } catch (error: any) {
    console.error("Error in getNotifications:", error);
    throw new Error(error.message || "Failed to get notifications");
  }
});

/**
 * Mark Notification as Read
 */
export const markNotificationAsRead = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new Error("Authentication required");
  }

  try {
    const { notificationId } = request.data;

    if (!notificationId) {
      throw new Error("Notification ID is required");
    }

    // Get notification
    const notificationDoc = await db.collection("notifications").doc(notificationId).get();
    if (!notificationDoc.exists) {
      throw new Error("Notification not found");
    }

    const notificationData = notificationDoc.data();

    // Verify user owns notification
    if (notificationData?.userId !== userId) {
      throw new Error("Unauthorized");
    }

    // Mark as read
    await db.collection("notifications").doc(notificationId).update({
      isRead: true,
      readAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      message: "Notification marked as read",
    };
  } catch (error: any) {
    console.error("Error in markNotificationAsRead:", error);
    throw new Error(error.message || "Failed to mark notification as read");
  }
});

/**
 * Mark All Notifications as Read
 */
export const markAllNotificationsAsRead = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new Error("Authentication required");
  }

  try {
    // Get unread notifications
    const unreadNotifications = await db.collection("notifications")
      .where("userId", "==", userId)
      .where("isRead", "==", false)
      .get();

    const batch = db.batch();
    for (const doc of unreadNotifications.docs) {
      batch.update(doc.ref, {
        isRead: true,
        readAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();

    return {
      success: true,
      count: unreadNotifications.size,
      message: "All notifications marked as read",
    };
  } catch (error: any) {
    console.error("Error in markAllNotificationsAsRead:", error);
    throw new Error(error.message || "Failed to mark all notifications as read");
  }
});

/**
 * Delete Notification
 */
export const deleteNotification = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new Error("Authentication required");
  }

  try {
    const { notificationId } = request.data;

    if (!notificationId) {
      throw new Error("Notification ID is required");
    }

    // Get notification
    const notificationDoc = await db.collection("notifications").doc(notificationId).get();
    if (!notificationDoc.exists) {
      throw new Error("Notification not found");
    }

    const notificationData = notificationDoc.data();

    // Verify user owns notification
    if (notificationData?.userId !== userId) {
      throw new Error("Unauthorized");
    }

    // Delete notification
    await db.collection("notifications").doc(notificationId).delete();

    return {
      success: true,
      message: "Notification deleted",
    };
  } catch (error: any) {
    console.error("Error in deleteNotification:", error);
    throw new Error(error.message || "Failed to delete notification");
  }
});

/**
 * Update Notification Settings
 */
export const updateNotificationSettings = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new Error("Authentication required");
  }

  try {
    const { settings } = request.data;

    if (!settings) {
      throw new Error("Settings are required");
    }

    // Update user notification settings
    await db.collection("users").doc(userId).update({
      notificationSettings: settings,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      message: "Notification settings updated",
    };
  } catch (error: any) {
    console.error("Error in updateNotificationSettings:", error);
    throw new Error(error.message || "Failed to update notification settings");
  }
});

/**
 * Trigger: Send notification when video is liked
 */
export const onVideoLiked = onDocumentCreated("videoLikes/{likeId}", async (event) => {
  try {
    const likeData = event.data?.data();
    if (!likeData) return;

    const { videoId, userId } = likeData;

    // Get video
    const videoDoc = await db.collection("videos").doc(videoId).get();
    const videoData = videoDoc.data();

    if (!videoData || videoData.userId === userId) {
      return; // Don't notify if user liked their own video
    }

    // Get liker data
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data();

    // Check notification settings
    const videoOwnerDoc = await db.collection("users").doc(videoData.userId).get();
    const videoOwnerData = videoOwnerDoc.data();
    const notificationSettings = videoOwnerData?.notificationSettings || {};

    if (notificationSettings.likes === false) {
      return; // User has disabled like notifications
    }

    // Create notification
    await db.collection("notifications").add({
      userId: videoData.userId,
      type: "video_like",
      actorId: userId,
      actorName: userData?.displayName || "Someone",
      actorProfileImage: userData?.profileImage || "",
      videoId,
      videoThumbnail: videoData.thumbnailUrl || "",
      message: `${userData?.displayName || "Someone"} liked your video`,
      isRead: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Send push notification
    await sendPushNotification(
      videoData.userId,
      "New Like",
      `${userData?.displayName || "Someone"} liked your video`,
      { type: "video_like", videoId, userId }
    );
  } catch (error) {
    console.error("Error in onVideoLiked trigger:", error);
  }
});

/**
 * Trigger: Send notification when comment is added
 */
export const onCommentAdded = onDocumentCreated("comments/{commentId}", async (event) => {
  try {
    const commentData = event.data?.data();
    if (!commentData) return;

    const { videoId, userId, text } = commentData;

    // Get video
    const videoDoc = await db.collection("videos").doc(videoId).get();
    const videoData = videoDoc.data();

    if (!videoData || videoData.userId === userId) {
      return; // Don't notify if user commented on their own video
    }

    // Get commenter data
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data();

    // Check notification settings
    const videoOwnerDoc = await db.collection("users").doc(videoData.userId).get();
    const videoOwnerData = videoOwnerDoc.data();
    const notificationSettings = videoOwnerData?.notificationSettings || {};

    if (notificationSettings.comments === false) {
      return; // User has disabled comment notifications
    }

    // Create notification
    await db.collection("notifications").add({
      userId: videoData.userId,
      type: "video_comment",
      actorId: userId,
      actorName: userData?.displayName || "Someone",
      actorProfileImage: userData?.profileImage || "",
      videoId,
      videoThumbnail: videoData.thumbnailUrl || "",
      message: `${userData?.displayName || "Someone"} commented: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`,
      isRead: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Send push notification
    await sendPushNotification(
      videoData.userId,
      "New Comment",
      `${userData?.displayName || "Someone"} commented on your video`,
      { type: "video_comment", videoId, userId }
    );
  } catch (error) {
    console.error("Error in onCommentAdded trigger:", error);
  }
});

/**
 * Trigger: Send notification when live stream starts
 */
export const onLiveStreamStarted = onDocumentCreated("liveStreams/{streamId}", async (event) => {
  try {
    const streamData = event.data?.data();
    if (!streamData || streamData.status !== "live") return;

    const { userId, title } = streamData;

    // Get streamer data
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data();

    // Get followers
    const followersSnapshot = await db.collection("followers")
      .where("followingId", "==", userId)
      .where("notificationsEnabled", "==", true)
      .get();

    // Send notifications to all followers
    const batch = db.batch();
    const notificationPromises = [];

    for (const followerDoc of followersSnapshot.docs) {
      const followerData = followerDoc.data();
      const followerId = followerData.followerId;

      // Check notification settings
      const followerUserDoc = await db.collection("users").doc(followerId).get();
      const followerUserData = followerUserDoc.data();
      const notificationSettings = followerUserData?.notificationSettings || {};

      if (notificationSettings.liveStreams === false) {
        continue; // User has disabled live stream notifications
      }

      // Create notification
      const notificationRef = db.collection("notifications").doc();
      batch.set(notificationRef, {
        userId: followerId,
        type: "live_stream_started",
        actorId: userId,
        actorName: userData?.displayName || "Someone",
        actorProfileImage: userData?.profileImage || "",
        streamId: event.params.streamId,
        message: `${userData?.displayName || "Someone"} is live: ${title}`,
        isRead: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Send push notification
      notificationPromises.push(
        sendPushNotification(
          followerId,
          "Live Now!",
          `${userData?.displayName || "Someone"} is live: ${title}`,
          { type: "live_stream_started", streamId: event.params.streamId, userId }
        )
      );
    }

    await batch.commit();
    await Promise.all(notificationPromises);
  } catch (error) {
    console.error("Error in onLiveStreamStarted trigger:", error);
  }
});

/**
 * Clean Up Old Notifications - Scheduled function
 */
export const cleanupOldNotifications = onSchedule("every 24 hours", async (event) => {
  try {
    console.log("Cleaning up old notifications...");

    // Delete read notifications older than 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const oldNotifications = await db.collection("notifications")
      .where("isRead", "==", true)
      .where("createdAt", "<=", admin.firestore.Timestamp.fromDate(thirtyDaysAgo))
      .limit(500)
      .get();

    const batch = db.batch();
    for (const doc of oldNotifications.docs) {
      batch.delete(doc.ref);
    }

    if (oldNotifications.size > 0) {
      await batch.commit();
    }

    console.log(`Deleted ${oldNotifications.size} old notifications`);
    return null;
  } catch (error: any) {
    console.error("Error cleaning up old notifications:", error);
    return null;
  }
});

// ============================================================================
// ADMIN DASHBOARD & INTERNAL ECONOMY FUNCTIONS
// ============================================================================

/**
 * Get Platform Statistics (Admin Only)
 */
export const getPlatformStatistics = onCall(async (request) => {
  const adminId = request.auth?.uid;
  if (!adminId) {
    throw new Error("Authentication required");
  }

  try {
    // Verify admin privileges
    const adminDoc = await db.collection("users").doc(adminId).get();
    const adminData = adminDoc.data();

    if (!adminData?.isAdmin) {
      throw new Error("Admin privileges required");
    }

    // Get total users
    const usersSnapshot = await db.collection("users").count().get();
    const totalUsers = usersSnapshot.data().count;

    // Get active users (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const activeUsersSnapshot = await db.collection("users")
      .where("lastActive", ">=", admin.firestore.Timestamp.fromDate(sevenDaysAgo))
      .count()
      .get();
    const activeUsers = activeUsersSnapshot.data().count;

    // Get total videos
    const videosSnapshot = await db.collection("videos").count().get();
    const totalVideos = videosSnapshot.data().count;

    // Get total live streams
    const liveStreamsSnapshot = await db.collection("liveStreams")
      .where("status", "==", "live")
      .count()
      .get();
    const activeLiveStreams = liveStreamsSnapshot.data().count;

    // Get platform revenue
    const revenueDoc = await db.collection("platformRevenue").doc("summary").get();
    const revenueData = revenueDoc.data();

    // Get premium users
    const premiumUsersSnapshot = await db.collection("users")
      .where("isPremiumAccount", "==", true)
      .count()
      .get();
    const premiumUsers = premiumUsersSnapshot.data().count;

    // Get banned users
    const bannedUsersSnapshot = await db.collection("users")
      .where("isBanned", "==", true)
      .count()
      .get();
    const bannedUsers = bannedUsersSnapshot.data().count;

    return {
      success: true,
      statistics: {
        users: {
          total: totalUsers,
          active: activeUsers,
          premium: premiumUsers,
          banned: bannedUsers,
        },
        content: {
          totalVideos,
          activeLiveStreams,
        },
        revenue: {
          total: revenueData?.totalRevenue || 0,
          gifts: revenueData?.giftRevenue || 0,
          premium: revenueData?.premiumRevenue || 0,
          ads: revenueData?.adRevenue || 0,
        },
      },
    };
  } catch (error: any) {
    console.error("Error in getPlatformStatistics:", error);
    throw new Error(error.message || "Failed to get platform statistics");
  }
});

/**
 * Get User Analytics (Admin Only)
 */
export const getUserAnalytics = onCall(async (request) => {
  const adminId = request.auth?.uid;
  if (!adminId) {
    throw new Error("Authentication required");
  }

  try {
    // Verify admin privileges
    const adminDoc = await db.collection("users").doc(adminId).get();
    const adminData = adminDoc.data();

    if (!adminData?.isAdmin) {
      throw new Error("Admin privileges required");
    }

    const { startDate, endDate } = request.data;

    // Get new users
    let newUsersQuery = db.collection("users");
    if (startDate) {
      newUsersQuery = newUsersQuery.where("createdAt", ">=", admin.firestore.Timestamp.fromDate(new Date(startDate)));
    }
    if (endDate) {
      newUsersQuery = newUsersQuery.where("createdAt", "<=", admin.firestore.Timestamp.fromDate(new Date(endDate)));
    }

    const newUsersSnapshot = await newUsersQuery.count().get();
    const newUsers = newUsersSnapshot.data().count;

    // Get user engagement metrics
    const engagementMetrics = {
      averageSessionDuration: 0, // Placeholder
      averageVideosWatched: 0, // Placeholder
      averageInteractions: 0, // Placeholder
    };

    return {
      success: true,
      analytics: {
        newUsers,
        engagement: engagementMetrics,
      },
    };
  } catch (error: any) {
    console.error("Error in getUserAnalytics:", error);
    throw new Error(error.message || "Failed to get user analytics");
  }
});

/**
 * Get Revenue Analytics (Admin Only)
 */
export const getRevenueAnalytics = onCall(async (request) => {
  const adminId = request.auth?.uid;
  if (!adminId) {
    throw new Error("Authentication required");
  }

  try {
    // Verify admin privileges
    const adminDoc = await db.collection("users").doc(adminId).get();
    const adminData = adminDoc.data();

    if (!adminData?.isAdmin) {
      throw new Error("Admin privileges required");
    }

    const { startDate, endDate } = request.data;

    // Get gift revenue
    let giftTransactionsQuery = db.collection("giftTransactions");
    if (startDate) {
      giftTransactionsQuery = giftTransactionsQuery.where("timestamp", ">=", admin.firestore.Timestamp.fromDate(new Date(startDate)));
    }
    if (endDate) {
      giftTransactionsQuery = giftTransactionsQuery.where("timestamp", "<=", admin.firestore.Timestamp.fromDate(new Date(endDate)));
    }

    const giftTransactionsSnapshot = await giftTransactionsQuery.get();
    let giftRevenue = 0;
    for (const doc of giftTransactionsSnapshot.docs) {
      const data = doc.data();
      giftRevenue += data.platformFee || 0;
    }

    // Get premium revenue
    let premiumTransactionsQuery = db.collection("premiumTransactions");
    if (startDate) {
      premiumTransactionsQuery = premiumTransactionsQuery.where("timestamp", ">=", admin.firestore.Timestamp.fromDate(new Date(startDate)));
    }
    if (endDate) {
      premiumTransactionsQuery = premiumTransactionsQuery.where("timestamp", "<=", admin.firestore.Timestamp.fromDate(new Date(endDate)));
    }

    const premiumTransactionsSnapshot = await premiumTransactionsQuery.get();
    let premiumRevenue = 0;
    for (const doc of premiumTransactionsSnapshot.docs) {
      const data = doc.data();
      premiumRevenue += data.amount || 0;
    }

    // Get ad revenue
    const revenueDoc = await db.collection("platformRevenue").doc("summary").get();
    const revenueData = revenueDoc.data();
    const adRevenue = revenueData?.adRevenue || 0;

    // Get coin purchases revenue
    let coinPurchasesQuery = db.collection("coinPurchases")
      .where("status", "==", "completed");
    if (startDate) {
      coinPurchasesQuery = coinPurchasesQuery.where("timestamp", ">=", admin.firestore.Timestamp.fromDate(new Date(startDate)));
    }
    if (endDate) {
      coinPurchasesQuery = coinPurchasesQuery.where("timestamp", "<=", admin.firestore.Timestamp.fromDate(new Date(endDate)));
    }

    const coinPurchasesSnapshot = await coinPurchasesQuery.get();
    let coinRevenue = 0;
    for (const doc of coinPurchasesSnapshot.docs) {
      const data = doc.data();
      coinRevenue += data.amount || 0;
    }

    // Get payout expenses
    let payoutsQuery = db.collection("payouts")
      .where("status", "==", "completed");
    if (startDate) {
      payoutsQuery = payoutsQuery.where("timestamp", ">=", admin.firestore.Timestamp.fromDate(new Date(startDate)));
    }
    if (endDate) {
      payoutsQuery = payoutsQuery.where("timestamp", "<=", admin.firestore.Timestamp.fromDate(new Date(endDate)));
    }

    const payoutsSnapshot = await payoutsQuery.get();
    let payoutExpenses = 0;
    for (const doc of payoutsSnapshot.docs) {
      const data = doc.data();
      payoutExpenses += data.amount || 0;
    }

    const totalRevenue = giftRevenue + premiumRevenue + adRevenue + coinRevenue;
    const netRevenue = totalRevenue - payoutExpenses;

    return {
      success: true,
      analytics: {
        revenue: {
          gifts: giftRevenue,
          premium: premiumRevenue,
          ads: adRevenue,
          coins: coinRevenue,
          total: totalRevenue,
        },
        expenses: {
          payouts: payoutExpenses,
        },
        netRevenue,
      },
    };
  } catch (error: any) {
    console.error("Error in getRevenueAnalytics:", error);
    throw new Error(error.message || "Failed to get revenue analytics");
  }
});

/**
 * Get Content Analytics (Admin Only)
 */
export const getContentAnalytics = onCall(async (request) => {
  const adminId = request.auth?.uid;
  if (!adminId) {
    throw new Error("Authentication required");
  }

  try {
    // Verify admin privileges
    const adminDoc = await db.collection("users").doc(adminId).get();
    const adminData = adminDoc.data();

    if (!adminData?.isAdmin) {
      throw new Error("Admin privileges required");
    }

    const { startDate, endDate } = request.data;

    // Get videos uploaded
    let videosQuery = db.collection("videos");
    if (startDate) {
      videosQuery = videosQuery.where("createdAt", ">=", admin.firestore.Timestamp.fromDate(new Date(startDate)));
    }
    if (endDate) {
      videosQuery = videosQuery.where("createdAt", "<=", admin.firestore.Timestamp.fromDate(new Date(endDate)));
    }

    const videosSnapshot = await videosQuery.get();
    const videosUploaded = videosSnapshot.size;

    // Calculate total views, likes, comments
    let totalViews = 0;
    let totalLikes = 0;
    let totalComments = 0;

    for (const doc of videosSnapshot.docs) {
      const data = doc.data();
      totalViews += data.views || 0;
      totalLikes += data.likes || 0;
      totalComments += data.comments || 0;
    }

    // Get live streams
    let liveStreamsQuery = db.collection("liveStreams");
    if (startDate) {
      liveStreamsQuery = liveStreamsQuery.where("startedAt", ">=", admin.firestore.Timestamp.fromDate(new Date(startDate)));
    }
    if (endDate) {
      liveStreamsQuery = liveStreamsQuery.where("startedAt", "<=", admin.firestore.Timestamp.fromDate(new Date(endDate)));
    }

    const liveStreamsSnapshot = await liveStreamsQuery.get();
    const liveStreamsCount = liveStreamsSnapshot.size;

    return {
      success: true,
      analytics: {
        videos: {
          uploaded: videosUploaded,
          totalViews,
          totalLikes,
          totalComments,
          averageViews: videosUploaded > 0 ? Math.round(totalViews / videosUploaded) : 0,
          averageLikes: videosUploaded > 0 ? Math.round(totalLikes / videosUploaded) : 0,
        },
        liveStreams: {
          total: liveStreamsCount,
        },
      },
    };
  } catch (error: any) {
    console.error("Error in getContentAnalytics:", error);
    throw new Error(error.message || "Failed to get content analytics");
  }
});

/**
 * Manage User (Admin Only)
 */
export const manageUser = onCall(async (request) => {
  const adminId = request.auth?.uid;
  if (!adminId) {
    throw new Error("Authentication required");
  }

  try {
    // Verify admin privileges
    const adminDoc = await db.collection("users").doc(adminId).get();
    const adminData = adminDoc.data();

    if (!adminData?.isAdmin) {
      throw new Error("Admin privileges required");
    }

    const { userId, action, data } = request.data;

    if (!userId || !action) {
      throw new Error("User ID and action are required");
    }

    switch (action) {
      case "verify":
        await db.collection("users").doc(userId).update({
          isVerified: true,
          verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        break;

      case "unverify":
        await db.collection("users").doc(userId).update({
          isVerified: false,
          verifiedAt: null,
        });
        break;

      case "grant_premium":
        await db.collection("users").doc(userId).update({
          isPremiumAccount: true,
          premiumGrantedBy: adminId,
          premiumGrantedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        break;

      case "revoke_premium":
        await db.collection("users").doc(userId).update({
          isPremiumAccount: false,
          premiumSlotId: null,
        });
        break;

      case "adjust_balance":
        if (data && data.amount !== undefined) {
          await db.collection("users").doc(userId).update({
            balance: admin.firestore.FieldValue.increment(data.amount),
          });
        }
        break;

      case "adjust_coins":
        if (data && data.amount !== undefined) {
          await db.collection("users").doc(userId).update({
            coins: admin.firestore.FieldValue.increment(data.amount),
          });
        }
        break;

      case "delete_account":
        // Soft delete
        await db.collection("users").doc(userId).update({
          isDeleted: true,
          deletedAt: admin.firestore.FieldValue.serverTimestamp(),
          deletedBy: adminId,
        });
        break;

      default:
        throw new Error("Invalid action");
    }

    return {
      success: true,
      message: `User ${action} completed`,
    };
  } catch (error: any) {
    console.error("Error in manageUser:", error);
    throw new Error(error.message || "Failed to manage user");
  }
});

/**
 * Get All Users (Admin Only)
 */
export const getAllUsers = onCall(async (request) => {
  const adminId = request.auth?.uid;
  if (!adminId) {
    throw new Error("Authentication required");
  }

  try {
    // Verify admin privileges
    const adminDoc = await db.collection("users").doc(adminId).get();
    const adminData = adminDoc.data();

    if (!adminData?.isAdmin) {
      throw new Error("Admin privileges required");
    }

    const { limit = 50, lastUserId, filters } = request.data;

    let query: any = db.collection("users").orderBy("createdAt", "desc").limit(limit);

    // Apply filters
    if (filters) {
      if (filters.isPremium !== undefined) {
        query = query.where("isPremiumAccount", "==", filters.isPremium);
      }
      if (filters.isVerified !== undefined) {
        query = query.where("isVerified", "==", filters.isVerified);
      }
      if (filters.isBanned !== undefined) {
        query = query.where("isBanned", "==", filters.isBanned);
      }
    }

    if (lastUserId) {
      const lastDoc = await db.collection("users").doc(lastUserId).get();
      if (lastDoc.exists) {
        query = query.startAfter(lastDoc);
      }
    }

    const usersSnapshot = await query.get();
    const users = usersSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        userId: doc.id,
        username: data.username,
        displayName: data.displayName,
        email: data.email,
        profileImage: data.profileImage,
        followerCount: data.followerCount || 0,
        videoCount: data.videoCount || 0,
        balance: data.balance || 0,
        coins: data.coins || 0,
        isPremiumAccount: data.isPremiumAccount || false,
        isVerified: data.isVerified || false,
        isBanned: data.isBanned || false,
        createdAt: data.createdAt,
        lastActive: data.lastActive,
      };
    });

    return {
      success: true,
      users,
      hasMore: users.length === limit,
    };
  } catch (error: any) {
    console.error("Error in getAllUsers:", error);
    throw new Error(error.message || "Failed to get users");
  }
});

/**
 * Synchronize Internal Economy - Scheduled function
 */
export const synchronizeInternalEconomy = onSchedule("every 1 hours", async (event) => {
  try {
    console.log("Synchronizing internal economy...");

    // Calculate total platform revenue
    const giftTransactionsSnapshot = await db.collection("giftTransactions").get();
    let giftRevenue = 0;
    for (const doc of giftTransactionsSnapshot.docs) {
      const data = doc.data();
      giftRevenue += data.platformFee || 0;
    }

    // Calculate premium revenue
    const premiumTransactionsSnapshot = await db.collection("premiumTransactions").get();
    let premiumRevenue = 0;
    for (const doc of premiumTransactionsSnapshot.docs) {
      const data = doc.data();
      premiumRevenue += data.amount || 0;
    }

    // Calculate coin purchase revenue
    const coinPurchasesSnapshot = await db.collection("coinPurchases")
      .where("status", "==", "completed")
      .get();
    let coinRevenue = 0;
    for (const doc of coinPurchasesSnapshot.docs) {
      const data = doc.data();
      coinRevenue += data.amount || 0;
    }

    // Get ad revenue from existing summary
    const revenueDoc = await db.collection("platformRevenue").doc("summary").get();
    const existingRevenueData = revenueDoc.data();
    const adRevenue = existingRevenueData?.adRevenue || 0;

    // Calculate total payout expenses
    const payoutsSnapshot = await db.collection("payouts")
      .where("status", "==", "completed")
      .get();
    let payoutExpenses = 0;
    for (const doc of payoutsSnapshot.docs) {
      const data = doc.data();
      payoutExpenses += data.amount || 0;
    }

    const totalRevenue = giftRevenue + premiumRevenue + adRevenue + coinRevenue;
    const netRevenue = totalRevenue - payoutExpenses;

    // Update platform revenue summary
    await db.collection("platformRevenue").doc("summary").set({
      giftRevenue,
      premiumRevenue,
      adRevenue,
      coinRevenue,
      totalRevenue,
      payoutExpenses,
      netRevenue,
      lastSynchronized: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    // Create daily revenue log
    const today = new Date().toISOString().split('T')[0];
    await db.collection("revenueLog").doc(today).set({
      date: today,
      giftRevenue,
      premiumRevenue,
      adRevenue,
      coinRevenue,
      totalRevenue,
      payoutExpenses,
      netRevenue,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    console.log(`Economy synchronized. Total revenue: $${totalRevenue}, Net revenue: $${netRevenue}`);
    return null;
  } catch (error: any) {
    console.error("Error synchronizing internal economy:", error);
    return null;
  }
});

/**
 * Get Economy Insights (Admin Only)
 */
export const getEconomyInsights = onCall(async (request) => {
  const adminId = request.auth?.uid;
  if (!adminId) {
    throw new Error("Authentication required");
  }

  try {
    // Verify admin privileges
    const adminDoc = await db.collection("users").doc(adminId).get();
    const adminData = adminDoc.data();

    if (!adminData?.isAdmin) {
      throw new Error("Admin privileges required");
    }

    // Get platform revenue summary
    const revenueDoc = await db.collection("platformRevenue").doc("summary").get();
    const revenueData = revenueDoc.data();

    // Get total user balances
    const usersSnapshot = await db.collection("users").get();
    let totalUserBalances = 0;
    let totalUserCoins = 0;

    for (const doc of usersSnapshot.docs) {
      const data = doc.data();
      totalUserBalances += data.balance || 0;
      totalUserCoins += data.coins || 0;
    }

    // Get pending payouts
    const pendingPayoutsSnapshot = await db.collection("payouts")
      .where("status", "==", "pending")
      .get();
    let pendingPayoutAmount = 0;

    for (const doc of pendingPayoutsSnapshot.docs) {
      const data = doc.data();
      pendingPayoutAmount += data.amount || 0;
    }

    return {
      success: true,
      insights: {
        revenue: {
          total: revenueData?.totalRevenue || 0,
          gifts: revenueData?.giftRevenue || 0,
          premium: revenueData?.premiumRevenue || 0,
          ads: revenueData?.adRevenue || 0,
          coins: revenueData?.coinRevenue || 0,
        },
        expenses: {
          payouts: revenueData?.payoutExpenses || 0,
          pending: pendingPayoutAmount,
        },
        userBalances: {
          totalBalance: totalUserBalances,
          totalCoins: totalUserCoins,
        },
        netRevenue: revenueData?.netRevenue || 0,
        lastSynchronized: revenueData?.lastSynchronized,
      },
    };
  } catch (error: any) {
    console.error("Error in getEconomyInsights:", error);
    throw new Error(error.message || "Failed to get economy insights");
  }
});
