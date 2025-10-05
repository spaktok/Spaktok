
import * as functions from "firebase-functions";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { onCall } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

interface UserData {
  isPremiumAccount?: boolean;
  premiumSlotId?: string | null;
  isAdmin?: boolean;
  balance?: number;
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
 * This is a placeholder and needs to be integrated with the actual gift sending mechanism.
 */
export const processGiftPayout = onDocumentCreated(
  "gifts/{giftId}",
  async (event) => {
    const giftData = event.data?.data();
    const receiverId = giftData?.receiverId;
    const giftValue = giftData?.value; // Value of the gift in coins/currency

    if (!receiverId || !giftValue) {
      console.error("Missing receiverId or giftValue in gift data.");
      return null;
    }

    try {
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
      "The \'userId\' and \'action\' fields are required."
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
            "\'slotId\' is required for assigning a premium account."
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
          "Invalid action. Must be \'assign\' or \'unassign\'."
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

// Initialize premium settings if they don\'t exist (can be done manually or via another function)
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

