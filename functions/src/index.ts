import * as functions from "firebase-functions";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { onCall } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

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
  bankAccountDetails?: { // Added for payout requests
    bankName: string;
    accountNumber: string;
    accountHolderName: string;
    swiftCode?: string;
    iban?: string;
    country: string;
  };
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
    throw new functions.https.HttpsError(      "invalid-argument",
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
      // If a reverse request exists, accept it automatically
      const requestId = reverseRequest.docs[0].id;
      await db.collection("friendRequests").doc(requestId).update({ status: "accepted" });
      await db.collection("users").doc(senderId).update({ friends: admin.firestore.FieldValue.arrayUnion(receiverId) });
      await db.collection("users").doc(receiverId).update({ friends: admin.firestore.FieldValue.arrayUnion(senderId) });
      return { success: true, message: "Friend request accepted automatically." };
    }

    await db.collection("friendRequests").add({
      senderId,
      receiverId,
      status: "pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

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
 * Callable Cloud Function to accept a friend request.
 */
export const acceptFriendRequest = onCall(async (request) => {
  if (!request.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Only authenticated users can accept friend requests."
    );
  }

  const { requestId } = request.data;
  const receiverId = request.auth.uid;

  if (!requestId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Request ID is required."
    );
  }

  try {
    const requestRef = db.collection("friendRequests").doc(requestId);
    const requestDoc = await requestRef.get();

    if (!requestDoc.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        "Friend request not found."
      );
    }

    const requestData = requestDoc.data();
    if (requestData?.receiverId !== receiverId) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "You are not authorized to accept this request."
      );
    }
    if (requestData?.status !== "pending") {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Friend request is not pending."
      );
    }

    const senderId = requestData.senderId;

    await db.runTransaction(async (transaction) => {
      transaction.update(requestRef, { status: "accepted" });
      transaction.update(db.collection("users").doc(senderId), {
        friends: admin.firestore.FieldValue.arrayUnion(receiverId),
        sentFriendRequests: admin.firestore.FieldValue.arrayRemove(receiverId),
      });
      transaction.update(db.collection("users").doc(receiverId), {
        friends: admin.firestore.FieldValue.arrayUnion(senderId),
        receivedFriendRequests: admin.firestore.FieldValue.arrayRemove(senderId),
      });
    });

    return { success: true, message: "Friend request accepted." };
  } catch (error: any) {
    console.error("Error accepting friend request:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to accept friend request.",
      error.message
    );
  }
});

/**
 * Callable Cloud Function to decline a friend request.
 */
export const declineFriendRequest = onCall(async (request) => {
  if (!request.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Only authenticated users can decline friend requests."
    );
  }

  const { requestId } = request.data;
  const receiverId = request.auth.uid;

  if (!requestId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Request ID is required."
    );
  }

  try {
    const requestRef = db.collection("friendRequests").doc(requestId);
    const requestDoc = await requestRef.get();

    if (!requestDoc.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        "Friend request not found."
      );
    }

    const requestData = requestDoc.data();
    if (requestData?.receiverId !== receiverId) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "You are not authorized to decline this request."
      );
    }
    if (requestData?.status !== "pending") {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Friend request is not pending."
      );
    }

    const senderId = requestData.senderId;

    await db.runTransaction(async (transaction) => {
      transaction.update(requestRef, { status: "declined" });
      transaction.update(db.collection("users").doc(senderId), {
        sentFriendRequests: admin.firestore.FieldValue.arrayRemove(receiverId),
      });
      transaction.update(db.collection("users").doc(receiverId), {
        receivedFriendRequests: admin.firestore.FieldValue.arrayRemove(senderId),
      });
    });

    return { success: true, message: "Friend request declined." };
  } catch (error: any) {
    console.error("Error declining friend request:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to decline friend request.",
      error.message
    );
  }
});

/**
 * Cloud Function to delete ephemeral messages after they have been viewed by all participants.
 * Triggered by a Firestore update on a message document.
 */
export const deleteEphemeralMessage = onDocumentCreated(
  "conversations/{conversationId}/messages/{messageId}",
  async (event) => {
    const messageData = event.data?.data();
    const conversationId = event.params.conversationId;
    const messageId = event.params.messageId;

    if (!messageData || !messageData.isEphemeral) {
      return null; // Not an ephemeral message
    }

    // For simplicity, we'll delete ephemeral messages after a short delay or after being viewed once.
    // A more robust solution would involve tracking all participants' views.
    // For now, let's assume it's a 1-on-1 chat and delete after one view.
    // This function will be triggered on creation, so we can schedule a deletion.

    // Schedule deletion after a short period (e.g., 10 seconds) for demonstration.
    // In a real app, this might be more complex, e.g., triggered by a client-side view event.
    setTimeout(async () => {
      try {
        await db.collection("conversations").doc(conversationId).collection("messages").doc(messageId).delete();
        console.log(`Ephemeral message ${messageId} in conversation ${conversationId} deleted.`);
      } catch (error) {
        console.error(`Error deleting ephemeral message ${messageId}:`, error);
      }
    }, 10000); // Delete after 10 seconds

    return null;
  }
);



/**
 * Callable Cloud Function for users to purchase coins.
 * This function should integrate with a payment provider like Stripe or PayPal.
 */
export const purchaseCoins = onCall(async (request) => {
  if (!request.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Only authenticated users can purchase coins."
    );
  }

  const { amount, paymentMethodToken } = request.data;
  const userId = request.auth.uid;

  if (!amount || !paymentMethodToken) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Amount and payment method token are required."
    );
  }

  // TODO: Implement payment processing with Stripe or another payment provider.
  // This is a placeholder for the actual payment logic.
  // Example with Stripe:
  // const stripe = new Stripe(functions.config().stripe.secret_key, { apiVersion: "2022-11-15" });
  // const charge = await stripe.charges.create({
  //   amount: amount * 100, // Amount in cents
  //   currency: "usd",
  //   source: paymentMethodToken,
  //   description: `Coin purchase by user ${userId}`,
  // });

  // For now, we will just simulate a successful payment.
  const coinsPurchased = amount; // Assuming 1 coin = 1 unit of currency

  try {
    const userRef = db.collection("users").doc(userId);
    await userRef.update({
      coins: admin.firestore.FieldValue.increment(coinsPurchased),
    });

    // Record the transaction
    await db.collection("transactions").add({
      userId,
      type: "purchase",
      amount: coinsPurchased,
      currency: "coins",
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      details: {
        paymentProvider: "simulated",
        // chargeId: charge.id, // From real payment provider
      },
    });

    return { success: true, message: `${coinsPurchased} coins purchased successfully.` };
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
 * Callable Cloud Function for users to request a payout of their balance.
 */
export const requestPayout = onCall(async (request) => {
  if (!request.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Only authenticated users can request a payout."
    );
  }

  const { amount, payoutMethod, payoutDetails } = request.data;
  const userId = request.auth.uid;

  if (!amount || !payoutMethod) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Amount and payout method are required."
    );
  }

  try {
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new functions.https.HttpsError("not-found", "User not found.");
    }

    const userData = userDoc.data() as UserData;
    const currentBalance = userData.balance || 0;

    if (amount > currentBalance) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Requested payout amount exceeds current balance."
      );
    }

    // Create a payout request
    const payoutRequestRef = await db.collection("payoutRequests").add({
      userId,
      amount,
      status: "pending",
      payoutMethod, // e.g., "paypal", "bank_transfer"
      payoutDetails, // e.g., { email: "user@example.com" } or bank account info
      requestedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Deduct the requested amount from the user's balance and move it to a pending state
    await userRef.update({
      balance: admin.firestore.FieldValue.increment(-amount),
    });

    return { success: true, message: "Payout request submitted successfully.", requestId: payoutRequestRef.id };
  } catch (error: any) {
    console.error("Error requesting payout:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to request payout.",
      error.message
    );
  }
});

/**
 * Callable Cloud Function for administrators to process a payout request.
 */
export const processPayout = onCall(async (request) => {
  if (!request.auth || !request.auth.token.admin) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only administrators can process payouts."
    );
  }

  const { requestId, action } = request.data; // action can be "approve" or "reject"

  if (!requestId || !action) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Request ID and action are required."
    );
  }

  try {
    const requestRef = db.collection("payoutRequests").doc(requestId);
    const requestDoc = await requestRef.get();

    if (!requestDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Payout request not found.");
    }

    const requestData = requestDoc.data();
    if (requestData?.status !== "pending") {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Payout request is not in a pending state."
      );
    }

    if (action === "approve") {
      // TODO: Implement actual payout logic with PayPal or Stripe Connect.
      // This is a placeholder for the actual payout logic.

      // On successful payout, update the request status.
      await requestRef.update({
        status: "completed",
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
        processedBy: request.auth?.uid,
      });

      // Record the transaction for the platform's revenue
      const platformFee = requestData.amount * 0.1; // Example: 10% platform fee
      await db.collection("platformRevenue").add({
        payoutRequestId: requestId,
        userId: requestData.userId,
        amount: platformFee,
        currency: "usd", // Or the currency of the payout
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });


      return { success: true, message: "Payout request approved and processed." };
    } else if (action === "reject") {
      // If rejected, refund the amount to the user's balance.
      await db.runTransaction(async (transaction) => {
        const userRef = db.collection("users").doc(requestData.userId);
        transaction.update(userRef, {
          balance: admin.firestore.FieldValue.increment(requestData.amount),
        });
        transaction.update(requestRef, {
          status: "rejected",
          processedAt: admin.firestore.FieldValue.serverTimestamp(),
          processedBy: request.auth?.uid,
        });
      });

      return { success: true, message: "Payout request rejected." };
    } else {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid action. Must be a approve or reject."
      );
    }
  } catch (error: any) {
    console.error("Error processing payout:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to process payout.",
      error.message
    );
  }
});

