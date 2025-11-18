// Cloudflare Images integration for Spaktok backend
// Provides image upload, optimization, and variant delivery

const axios = require('axios');
const config = require('./config');

const images = config.cloudflareImages;
const API_BASE = `https://api.cloudflare.com/client/v4/accounts/${images.accountId}/images/v1`;

function getAuthHeaders() {
  return {
    Authorization: `Bearer ${images.apiToken}`,
  };
}

// Upload an image to Cloudflare Images
async function uploadImage(file, metadata = {}) {
  const formData = new FormData();
  formData.append('file', file);
  if (metadata.id) formData.append('id', metadata.id);
  if (metadata.metadata) formData.append('metadata', JSON.stringify(metadata.metadata));
  
  const res = await axios.post(API_BASE, formData, {
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data.result;
}

// Get image delivery URL with optional variant
function getImageUrl(imageId, variant = 'public') {
  return `https://imagedelivery.net/${images.accountHash}/${imageId}/${variant}`;
}

// Delete an image by ID
async function deleteImage(imageId) {
  await axios.delete(`${API_BASE}/${imageId}`, {
    headers: getAuthHeaders(),
  });
  return true;
}

// List uploaded images (paginated)
async function listImages(page = 1, perPage = 50) {
  const res = await axios.get(API_BASE, {
    headers: getAuthHeaders(),
    params: { page, per_page: perPage },
  });
  return res.data.result;
}

module.exports = {
  uploadImage,
  getImageUrl,
  deleteImage,
  listImages,
};
