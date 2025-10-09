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
exports.deleteDisappearingMessages = void 0;
const admin = __importStar(require("firebase-admin"));
const scheduler_1 = require("firebase-functions/v2/scheduler");
admin.initializeApp();
const firestore = admin.firestore();
exports.deleteDisappearingMessages = (0, scheduler_1.onSchedule)('every 1 minutes', async (event) => {
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
        const viewedTimestamp = message.viewedTimestamp;
        const disappearDuration = message.disappearDuration;
        if (viewedTimestamp && disappearDuration) {
            const expirationTime = viewedTimestamp.toDate().getTime() + (disappearDuration * 1000);
            if (now.toDate().getTime() >= expirationTime) {
                batch.delete(doc.ref);
                deletedCount++;
            }
        }
        else if (disappearDuration) {
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
    }
    else {
        console.log('No disappearing messages to delete.');
    }
});
//# sourceMappingURL=disappearingMessages.js.map