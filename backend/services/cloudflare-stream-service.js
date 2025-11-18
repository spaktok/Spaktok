const { CLOUDFLARE_STREAM_API_TOKEN, CLOUDFLARE_STREAM_ACCOUNT_ID } = process.env;

const API = 'https://api.cloudflare.com/client/v4/accounts';

async function createDirectUploadUrl() {
  if (!CLOUDFLARE_STREAM_API_TOKEN || !CLOUDFLARE_STREAM_ACCOUNT_ID) {
    throw new Error('Cloudflare Stream not configured');
  }
  const res = await fetch(`${API}/${CLOUDFLARE_STREAM_ACCOUNT_ID}/stream/direct_upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${CLOUDFLARE_STREAM_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json));
  // json.result contains: uploadURL, uid
  return json.result;
}

function getPlaybackUrl(uid) {
  if (!uid) throw new Error('uid required');
  // Use videodelivery.net HLS URL (no account hash required)
  return `https://videodelivery.net/${uid}/manifest/video.m3u8`;
}

module.exports = { createDirectUploadUrl, getPlaybackUrl };
