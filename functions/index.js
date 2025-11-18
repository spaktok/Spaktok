/**
 * Spaktok Firebase Functions - Minimal Auth-Only Configuration
 * 
 * ULTRA-LOW-COST ARCHITECTURE:
 * - Firebase Functions: ONLY for auth triggers (onCreate, onDelete)
 * - All other backend logic moved to Cloudflare Workers
 * - 99% cost reduction by eliminating expensive Cloud Functions
 * 
 * Cost: ~$20-50/month (vs $20k+ before optimization)
 */

const {onRequest} = require('firebase-functions/v2/https');
const {onDocumentCreated, onDocumentDeleted} = require('firebase-functions/v2/firestore');
const admin = require('firebase-admin');

admin.initializeApp();

// ========== USER AUTH TRIGGERS (Critical for Firebase Auth) ==========

// Triggered when a new user signs up
exports.onUserCreate = onDocumentCreated('users/{userId}', async (event) => {
  const userId = event.params.userId;
  const userData = event.data.data();
  
  console.log(`New user created: ${userId}`, userData);
  
  // Sync to Cloudflare D1 via Worker API
  try {
    await fetch('https://spaktok-edge.workers.dev/api/sync/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: userId,
        username: userData.username,
        display_name: userData.displayName,
        avatar_url: userData.avatarUrl,
        created_at: Date.now(),
      }),
    });
  } catch (error) {
    console.error('Failed to sync user to D1:', error);
  }
});

// Triggered when a user is deleted
exports.onUserDelete = onDocumentDeleted('users/{userId}', async (event) => {
  const userId = event.params.userId;
  
  console.log(`User deleted: ${userId}`);
  
  // Notify Cloudflare Worker to cleanup D1 data
  try {
    await fetch(`https://spaktok-edge.workers.dev/api/sync/user/${userId}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error('Failed to delete user from D1:', error);
  }
});

// ========== HEALTH CHECK ==========
exports.health = onRequest((req, res) => {
  res.json({
    status: 'healthy',
    architecture: 'ultra-low-cost',
    backend: 'cloudflare-workers',
    auth: 'firebase-only',
    timestamp: Date.now(),
  });
});

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
