// Cloudflare Stream integration for Spaktok backend
// Provides video upload and playback API helpers

const axios = require('axios');
const config = require('./config');

const stream = config.cloudflareStream;
const API_BASE = `https://api.cloudflare.com/client/v4/accounts/${stream.accountId}/stream`;

function getAuthHeaders() {
  return {
    Authorization: `Bearer ${stream.apiToken}`,
    'Content-Type': 'application/json',
  };
}

// Upload a video to Cloudflare Stream (direct upload URL)
async function createDirectUpload() {
  const res = await axios.post(`${API_BASE}/direct_upload`, {}, {
    headers: getAuthHeaders(),
  });
  return res.data.result;
}

// Get video playback info by video UID
async function getVideoInfo(videoId) {
  const res = await axios.get(`${API_BASE}/videos/${videoId}`, {
    headers: getAuthHeaders(),
  });
  return res.data.result;
}

// Delete a video by video UID
async function deleteVideo(videoId) {
  await axios.delete(`${API_BASE}/videos/${videoId}`, {
    headers: getAuthHeaders(),
  });
  return true;
}

module.exports = {
  createDirectUpload,
  getVideoInfo,
  deleteVideo,
};
