const admin = require("firebase-admin");

/**
 * SPAKTOK REALTIME SERVICE - PHASE 1
 * Real-time features for live chat, reactions, and presence
 * 
 * Features:
 * - User presence tracking
 * - Live chat and comments
 * - Real-time reactions
 * - Live streaming coordination
 * - Typing indicators
 */

class RealtimeService {
  constructor() {
    this.db = admin.database();
    this.activeConnections = new Map();
  }

  /**
   * Set user online status
   * @param {string} userId - User ID
   * @param {Object} metadata - Additional metadata (socketId, device, etc.)
   */
  async setUserOnline(userId, metadata = {}) {
    try {
      await this.db.ref(`presence/${userId}`).set({
        online: true,
        lastSeen: admin.database.ServerValue.TIMESTAMP,
        ...metadata
      });

      // Set up disconnect handler
      await this.db.ref(`presence/${userId}`).onDisconnect().update({
        online: false,
        lastSeen: admin.database.ServerValue.TIMESTAMP
      });

      return true;
    } catch (error) {
      console.error(`Error setting user ${userId} online:`, error);
      return false;
    }
  }

  /**
   * Set user offline status
   * @param {string} userId - User ID
   */
  async setUserOffline(userId) {
    try {
      await this.db.ref(`presence/${userId}`).update({
        online: false,
        lastSeen: admin.database.ServerValue.TIMESTAMP
      });
      return true;
    } catch (error) {
      console.error(`Error setting user ${userId} offline:`, error);
      return false;
    }
  }

  /**
   * Get user online status
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - User presence data
   */
  async getUserPresence(userId) {
    try {
      const snapshot = await this.db.ref(`presence/${userId}`).once("value");
      return snapshot.val() || { online: false, lastSeen: null };
    } catch (error) {
      console.error(`Error getting user ${userId} presence:`, error);
      return { online: false, lastSeen: null };
    }
  }

  /**
   * Send live chat message
   * @param {string} roomId - Room/Live session ID
   * @param {Object} message - Message data
   */
  async sendLiveMessage(roomId, message) {
    try {
      const messageRef = this.db.ref(`live/${roomId}/messages`).push();
      await messageRef.set({
        ...message,
        timestamp: admin.database.ServerValue.TIMESTAMP
      });
      return messageRef.key;
    } catch (error) {
      console.error(`Error sending live message to room ${roomId}:`, error);
      return null;
    }
  }

  /**
   * Get live messages
   * @param {string} roomId - Room/Live session ID
   * @param {number} limit - Number of messages to fetch
   * @returns {Promise<Array>} - Array of messages
   */
  async getLiveMessages(roomId, limit = 50) {
    try {
      const snapshot = await this.db.ref(`live/${roomId}/messages`)
        .orderByChild("timestamp")
        .limitToLast(limit)
        .once("value");
      
      const messages = [];
      snapshot.forEach((child) => {
        messages.push({ id: child.key, ...child.val() });
      });
      
      return messages;
    } catch (error) {
      console.error(`Error getting live messages for room ${roomId}:`, error);
      return [];
    }
  }

  /**
   * Update live room stats
   * @param {string} roomId - Room/Live session ID
   * @param {Object} stats - Stats to update (viewerCount, likes, etc.)
   */
  async updateLiveStats(roomId, stats) {
    try {
      await this.db.ref(`live/${roomId}/stats`).update({
        ...stats,
        lastUpdate: admin.database.ServerValue.TIMESTAMP
      });
      return true;
    } catch (error) {
      console.error(`Error updating live stats for room ${roomId}:`, error);
      return false;
    }
  }

  /**
   * Increment live stat counter
   * @param {string} roomId - Room/Live session ID
   * @param {string} statName - Stat name (viewerCount, likes, etc.)
   * @param {number} amount - Amount to increment
   */
  async incrementLiveStat(roomId, statName, amount = 1) {
    try {
      const ref = this.db.ref(`live/${roomId}/stats/${statName}`);
      await ref.transaction((current) => {
        return (current || 0) + amount;
      });
      return true;
    } catch (error) {
      console.error(`Error incrementing ${statName} for room ${roomId}:`, error);
      return false;
    }
  }

  /**
   * Set typing indicator
   * @param {string} chatId - Chat ID
   * @param {string} userId - User ID
   * @param {boolean} isTyping - Typing status
   */
  async setTypingIndicator(chatId, userId, isTyping) {
    try {
      if (isTyping) {
        await this.db.ref(`typing/${chatId}/${userId}`).set({
          typing: true,
          timestamp: admin.database.ServerValue.TIMESTAMP
        });

        // Auto-remove after 5 seconds
        await this.db.ref(`typing/${chatId}/${userId}`).onDisconnect().remove();
        setTimeout(async () => {
          await this.db.ref(`typing/${chatId}/${userId}`).remove();
        }, 5000);
      } else {
        await this.db.ref(`typing/${chatId}/${userId}`).remove();
      }
      return true;
    } catch (error) {
      console.error(`Error setting typing indicator:`, error);
      return false;
    }
  }

  /**
   * Get typing users in chat
   * @param {string} chatId - Chat ID
   * @returns {Promise<Array>} - Array of typing user IDs
   */
  async getTypingUsers(chatId) {
    try {
      const snapshot = await this.db.ref(`typing/${chatId}`).once("value");
      const typingUsers = [];
      snapshot.forEach((child) => {
        if (child.val().typing) {
          typingUsers.push(child.key);
        }
      });
      return typingUsers;
    } catch (error) {
      console.error(`Error getting typing users for chat ${chatId}:`, error);
      return [];
    }
  }

  /**
   * Record reaction in realtime
   * @param {string} targetType - Target type (video, post, comment)
   * @param {string} targetId - Target ID
   * @param {string} userId - User ID
   * @param {string} reactionType - Reaction type (like, love, wow, etc.)
   */
  async addReaction(targetType, targetId, userId, reactionType) {
    try {
      await this.db.ref(`reactions/${targetType}/${targetId}/${userId}`).set({
        type: reactionType,
        timestamp: admin.database.ServerValue.TIMESTAMP
      });

      // Increment counter
      await this.incrementReactionCount(targetType, targetId, reactionType);
      
      return true;
    } catch (error) {
      console.error(`Error adding reaction:`, error);
      return false;
    }
  }

  /**
   * Remove reaction
   * @param {string} targetType - Target type
   * @param {string} targetId - Target ID
   * @param {string} userId - User ID
   */
  async removeReaction(targetType, targetId, userId) {
    try {
      const snapshot = await this.db.ref(`reactions/${targetType}/${targetId}/${userId}`).once("value");
      const reactionType = snapshot.val()?.type;
      
      await this.db.ref(`reactions/${targetType}/${targetId}/${userId}`).remove();
      
      if (reactionType) {
        await this.decrementReactionCount(targetType, targetId, reactionType);
      }
      
      return true;
    } catch (error) {
      console.error(`Error removing reaction:`, error);
      return false;
    }
  }

  /**
   * Increment reaction count
   */
  async incrementReactionCount(targetType, targetId, reactionType) {
    try {
      const ref = this.db.ref(`reactionCounts/${targetType}/${targetId}/${reactionType}`);
      await ref.transaction((current) => {
        return (current || 0) + 1;
      });
      return true;
    } catch (error) {
      console.error(`Error incrementing reaction count:`, error);
      return false;
    }
  }

  /**
   * Decrement reaction count
   */
  async decrementReactionCount(targetType, targetId, reactionType) {
    try {
      const ref = this.db.ref(`reactionCounts/${targetType}/${targetId}/${reactionType}`);
      await ref.transaction((current) => {
        return Math.max((current || 0) - 1, 0);
      });
      return true;
    } catch (error) {
      console.error(`Error decrementing reaction count:`, error);
      return false;
    }
  }

  /**
   * Get reaction counts
   * @param {string} targetType - Target type
   * @param {string} targetId - Target ID
   * @returns {Promise<Object>} - Reaction counts
   */
  async getReactionCounts(targetType, targetId) {
    try {
      const snapshot = await this.db.ref(`reactionCounts/${targetType}/${targetId}`).once("value");
      return snapshot.val() || {};
    } catch (error) {
      console.error(`Error getting reaction counts:`, error);
      return {};
    }
  }

  /**
   * Listen to presence changes
   * @param {string} userId - User ID
   * @param {Function} callback - Callback function
   */
  listenToPresence(userId, callback) {
    const ref = this.db.ref(`presence/${userId}`);
    ref.on("value", (snapshot) => {
      callback(snapshot.val());
    });
    return () => ref.off("value");
  }

  /**
   * Listen to live messages
   * @param {string} roomId - Room ID
   * @param {Function} callback - Callback function
   */
  listenToLiveMessages(roomId, callback) {
    const ref = this.db.ref(`live/${roomId}/messages`);
    ref.on("child_added", (snapshot) => {
      callback({ id: snapshot.key, ...snapshot.val() });
    });
    return () => ref.off("child_added");
  }

  /**
   * Clean up old data
   * @param {number} olderThan - Timestamp threshold
   */
  async cleanupOldData(olderThan) {
    try {
      // Clean up old typing indicators
      const typingRef = this.db.ref("typing");
      const typingSnapshot = await typingRef.once("value");
      const updates = {};
      
      typingSnapshot.forEach((chatSnap) => {
        chatSnap.forEach((userSnap) => {
          if (userSnap.val().timestamp < olderThan) {
            updates[`typing/${chatSnap.key}/${userSnap.key}`] = null;
          }
        });
      });
      
      await this.db.ref().update(updates);
      console.log("✅ Realtime data cleanup completed");
      return true;
    } catch (error) {
      console.error("Error cleaning up old data:", error);
      return false;
    }
  }
}

// Singleton instance
const realtimeService = new RealtimeService();

module.exports = realtimeService;
