const express = require('express');
const router = express.Router();
const r2Service = require('../services/cloudflare-r2-service');
const streamService = require('../services/cloudflare-stream-service');

/**
 * POST /api/cloudflare/r2/upload
 * Upload a file to Cloudflare R2
 * Body: { key: string, body: string|Buffer, contentType: string }
 */
router.post('/r2/upload', async (req, res) => {
  try {
    const { key, body, contentType } = req.body;
    if (!key || !body) {
      return res.status(400).json({ error: 'Missing key or body' });
    }
    const result = await r2Service.uploadObject({ key, body, contentType: contentType || 'application/octet-stream' });
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('R2 upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/cloudflare/r2/download/:key
 * Download a file from Cloudflare R2
 */
router.get('/r2/download/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const stream = await r2Service.getObjectStream({ key });
    stream.pipe(res);
  } catch (error) {
    console.error('R2 download error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/cloudflare/stream/upload-url
 * Generate a direct upload URL for Cloudflare Stream
 */
router.post('/stream/upload-url', async (req, res) => {
  try {
    const result = await streamService.createDirectUploadUrl();
    res.json({ success: true, uploadURL: result.uploadURL, uid: result.uid });
  } catch (error) {
    console.error('Stream upload URL error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/cloudflare/stream/playback/:uid
 * Get the playback URL for a video by UID
 */
router.get('/stream/playback/:uid', (req, res) => {
  try {
    const { uid } = req.params;
    const playbackUrl = streamService.getPlaybackUrl(uid);
    res.json({ success: true, uid, playbackUrl });
  } catch (error) {
    console.error('Stream playback error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
