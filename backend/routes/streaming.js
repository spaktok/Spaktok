const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Basic video streaming endpoint
router.get('/video', (req, res) => {
    const videoPath = path.join(__dirname, '../sample.mp4'); // Assuming sample.mp4 is in the backend directory
    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(videoPath, { start, end });
        const head = {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': 'video/mp4',
        };

        res.writeHead(206, head);
        file.pipe(res);
    } else {
        const head = {
            'Content-Length': fileSize,
            'Content-Type': 'video/mp4',
        };
        res.writeHead(200, head);
        fs.createReadStream(videoPath).pipe(res);
    }
});

// Agora token generator (RTC)
// GET /streaming/agora/token?channel=...&uid=...
router.get('/agora/token', (req, res) => {
  try {
    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERT;
    const channelName = req.query.channel;
    const uid = req.query.uid || '0';
    const expireSeconds = parseInt(process.env.AGORA_TOKEN_TTL || '3600', 10);

    if (!appId || !appCertificate) {
      return res.status(501).json({ error: 'Agora not configured' });
    }
    if (!channelName) {
      return res.status(400).json({ error: 'channel is required' });
    }

    // Minimal placeholder: return a dummy signed token shape for wiring.
    // TODO: Replace with official Agora RTCTokenBuilder for production.
    const payload = `${appId}:${channelName}:${uid}:${Date.now() + expireSeconds * 1000}`;
    const token = crypto.createHmac('sha256', appCertificate).update(payload).digest('hex');
    return res.json({ appId, channel: channelName, uid, token, expiresIn: expireSeconds });
  } catch (e) {
    console.error('/agora/token error:', e);
    return res.status(500).json({ error: e.message });
  }
});

module.exports = router;

