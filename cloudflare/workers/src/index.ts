/*
 * Spaktok Cloudflare Worker - Ultra-Low-Cost Global Backend
 * 
 * Architecture:
 * - R2: Video/image storage ($0.015/GB, FREE egress)
 * - Stream: Video transcoding & adaptive streaming
 * - KV: Metadata, user sessions, rate limits
 * - D1: Relational data (comments, likes, follows)
 * - Durable Objects: Live stream state & WebRTC signaling
 * - Workers AI: Content moderation, captions, translation
 * - Queues: Background processing
 * 
 * Cost Target: $15k-$25k/month @ 100M MAU
 */

interface Env {
  // Stripe (payments only - 2.9% + $0.30 fee passed to users)
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  
  // Cloudflare Bindings
  R2: R2Bucket;
  KV_CACHE: KVNamespace;
  D1_DB: D1Database;
  QUEUE_EVENTS: Queue;
  AI: Ai; // Workers AI for moderation/captions
  
  // Cloudflare Stream
  CLOUDFLARE_STREAM_ACCOUNT_ID: string;
  CLOUDFLARE_STREAM_API_TOKEN: string;
  
  // WebRTC Signaling (Cloudflare Calls API)
  CALLS_APP_ID: string;
  CALLS_APP_SECRET: string;
  
  // Durable Objects
  LIVE_STREAMS: DurableObjectNamespace;
  WEBRTC_SIGNALING: DurableObjectNamespace;
}

// Utility JSON response
function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
    status: init.status || 200,
  });
}

async function createPaymentIntent(request: Request, env: Env) {
  if (!env.STRIPE_SECRET_KEY) return json({ error: 'Stripe not configured' }, { status: 500 });
  const body = await request.json().catch(() => ({}));
  const amount = body.amount || 100;
  const currency = body.currency || 'usd';
  const metadata = body.metadata || {};
  // Edge call to Stripe API
  const res = await fetch('https://api.stripe.com/v1/payment_intents', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ amount: String(amount), currency, ...Object.entries(metadata).reduce((acc, [k,v]) => { acc[`metadata[${k}]`] = String(v); return acc; }, {} as Record<string,string>) }),
  });
  const data = await res.json();
  if (!res.ok) return json({ error: data }, { status: res.status });
  return json({ clientSecret: data.client_secret, id: data.id });
}

// ========== VIDEO UPLOAD TO R2 + STREAM ==========
async function uploadVideoChunk(env: Env, request: Request) {
  const url = new URL(request.url);
  const uploadId = url.searchParams.get('uploadId');
  const chunkIndex = url.searchParams.get('chunkIndex');
  const userId = url.searchParams.get('userId');
  
  if (!uploadId || !chunkIndex || !userId) {
    return json({ error: 'Missing uploadId, chunkIndex, or userId' }, { status: 400 });
  }
  
  const chunkKey = `uploads/${userId}/${uploadId}/chunk-${chunkIndex}`;
  await env.R2.put(chunkKey, request.body);
  
  return json({ success: true, chunkKey, uploadId, chunkIndex });
}

async function finalizeVideoUpload(env: Env, request: Request) {
  const body = await request.json() as { uploadId: string; userId: string; totalChunks: number; metadata?: any };
  const { uploadId, userId, totalChunks, metadata } = body;
  
  // Merge chunks from R2
  const chunks: ArrayBuffer[] = [];
  for (let i = 0; i < totalChunks; i++) {
    const chunkKey = `uploads/${userId}/${uploadId}/chunk-${i}`;
    const obj = await env.R2.get(chunkKey);
    if (obj) chunks.push(await obj.arrayBuffer());
  }
  
  // Combine chunks
  const totalSize = chunks.reduce((acc, chunk) => acc + chunk.byteLength, 0);
  const combined = new Uint8Array(totalSize);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(new Uint8Array(chunk), offset);
    offset += chunk.byteLength;
  }
  
  // Upload to Cloudflare Stream for transcoding
  const streamRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_STREAM_ACCOUNT_ID}/stream`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.CLOUDFLARE_STREAM_API_TOKEN}`,
    },
    body: combined,
  });
  
  const streamData = await streamRes.json() as any;
  const videoId = streamData.result?.uid;
  
  // Store metadata in D1
  await env.D1_DB.prepare(
    'INSERT INTO videos (id, user_id, stream_uid, metadata, created_at) VALUES (?, ?, ?, ?, ?)'
  ).bind(uploadId, userId, videoId, JSON.stringify(metadata || {}), Date.now()).run();
  
  // Clean up chunks
  for (let i = 0; i < totalChunks; i++) {
    await env.R2.delete(`uploads/${userId}/${uploadId}/chunk-${i}`);
  }
  
  return json({ success: true, videoId, uploadId, streamUid: videoId });
}

// ========== WEBRTC SIGNALING (Replace Agora) ==========
async function createWebRTCSession(env: Env, request: Request) {
  const body = await request.json() as { streamId: string; userId: string; role: 'host' | 'viewer' };
  const { streamId, userId, role } = body;
  
  // Generate ICE servers configuration (Cloudflare TURN/STUN)
  const iceServers = [
    { urls: 'stun:stun.cloudflare.com:3478' },
  ];
  
  // Store session in KV
  const sessionKey = `webrtc:${streamId}:${userId}`;
  await env.KV_CACHE.put(sessionKey, JSON.stringify({ streamId, userId, role, createdAt: Date.now() }), { expirationTtl: 3600 });
  
  return json({ iceServers, sessionKey, streamId, role });
}

async function webrtcSignaling(env: Env, request: Request) {
  const body = await request.json() as { streamId: string; userId: string; signal: any };
  const { streamId, userId, signal } = body;
  
  // Use Durable Object for real-time signaling
  const id = env.WEBRTC_SIGNALING.idFromName(streamId);
  const stub = env.WEBRTC_SIGNALING.get(id);
  
  const response = await stub.fetch(request.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, signal }),
  });
  
  return response;
}

// ========== CONTENT MODERATION (Workers AI) ==========
async function moderateContent(env: Env, request: Request) {
  const body = await request.json() as { imageUrl?: string; text?: string; videoId?: string };
  
  let result: any = { safe: true };
  
  // Image moderation using Workers AI
  if (body.imageUrl) {
    const imageRes = await fetch(body.imageUrl);
    const imageData = await imageRes.arrayBuffer();
    
    const aiResult = await env.AI.run('@cf/microsoft/resnet-50', {
      image: [...new Uint8Array(imageData)],
    });
    
    result.image = aiResult;
  }
  
  // Text moderation using Workers AI
  if (body.text) {
    const aiResult = await env.AI.run('@cf/huggingface/distilbert-sst-2-int8', {
      text: body.text,
    });
    
    result.text = aiResult;
  }
  
  // Cache result in KV
  const cacheKey = `moderation:${body.imageUrl || body.text || body.videoId}`;
  await env.KV_CACHE.put(cacheKey, JSON.stringify(result), { expirationTtl: 86400 });
  
  return json(result);
}

// ========== AUTO CAPTIONS (Workers AI) ==========
async function generateCaptions(env: Env, request: Request) {
  const body = await request.json() as { audioUrl: string; videoId: string };
  
  // Download audio
  const audioRes = await fetch(body.audioUrl);
  const audioData = await audioRes.arrayBuffer();
  
  // Use Workers AI for speech-to-text (Whisper)
  const captions = await env.AI.run('@cf/openai/whisper', {
    audio: [...new Uint8Array(audioData)],
  });
  
  // Store in D1
  await env.D1_DB.prepare(
    'UPDATE videos SET captions = ? WHERE id = ?'
  ).bind(JSON.stringify(captions), body.videoId).run();
  
  return json({ videoId: body.videoId, captions });
}

// ========== GIFT/COINS SYSTEM ==========
async function sendGift(env: Env, request: Request) {
  const body = await request.json() as { giftId: string; receiverId: string; senderId: string; coins: number };
  
  // Deduct coins from sender and credit receiver in D1 transaction
  const results = await env.D1_DB.batch([
    env.D1_DB.prepare('UPDATE users SET coins = coins - ? WHERE id = ?').bind(body.coins, body.senderId),
    env.D1_DB.prepare('UPDATE users SET coins = coins + ? WHERE id = ?').bind(body.coins, body.receiverId),
    env.D1_DB.prepare('INSERT INTO gifts (id, gift_id, sender_id, receiver_id, coins, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(crypto.randomUUID(), body.giftId, body.senderId, body.receiverId, body.coins, Date.now()),
  ]);
  
  return json({ success: true, results });
}

// ========== ROUTER ==========
const router: Record<string, (req: Request, env: Env) => Promise<Response>> = {
  // Payments
  'POST /api/payment-intent': (req, env) => createPaymentIntent(req, env),
  
  // Video Upload (Chunked)
  'POST /api/video/chunk': (req, env) => uploadVideoChunk(env, req),
  'POST /api/video/finalize': (req, env) => finalizeVideoUpload(env, req),
  
  // WebRTC Live Streaming
  'POST /api/webrtc/session': (req, env) => createWebRTCSession(env, req),
  'POST /api/webrtc/signal': (req, env) => webrtcSignaling(env, req),
  
  // Content Moderation
  'POST /api/moderate': (req, env) => moderateContent(env, req),
  
  // Captions
  'POST /api/captions': (req, env) => generateCaptions(env, req),
  
  // Gifts
  'POST /api/gift/send': (req, env) => sendGift(env, req),
  
  // Simple metadata
  'GET /api/video/:id': async (req, env) => {
    const url = new URL(req.url);
    const id = url.pathname.split('/').pop()!;
    const stmt = await env.D1_DB.prepare('SELECT * FROM videos WHERE id = ?').bind(id).first();
    if (!stmt) return json({ error: 'Not found' }, { status: 404 });
    return json(stmt);
  },
  
  // Chat
  'GET /api/chat/messages': async (req, env) => {
    const url = new URL(req.url);
    const roomId = url.searchParams.get('roomId');
    if (!roomId) return json([], { status: 200 });
    const rows = await env.D1_DB.prepare(
      'SELECT * FROM messages WHERE chat_room_id = ? ORDER BY timestamp DESC LIMIT 200'
    ).bind(roomId).all();
    return json(rows.results || []);
  },
  'POST /api/chat/send': async (req, env) => {
    const body = await req.json();
    await env.D1_DB.prepare(
      'INSERT INTO messages (id, chat_room_id, sender_id, type, text, media_url, timestamp, status, is_ephemeral) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      body.id, body.chatRoomId, body.senderId, body.type, body.text, body.mediaUrl,
      body.timestamp, body.status, body.isEphemeral ? 1 : 0
    ).run();
    return json({ ok: true });
  },
  'GET /api/chat/typing': async (req, env) => {
    const url = new URL(req.url);
    const chatRoomId = url.searchParams.get('chatRoomId') || '';
    const userId = url.searchParams.get('userId') || '';
    const v = await env.KV_CACHE.get(`typing:${chatRoomId}:${userId}`);
    return json({ isTyping: v === '1' });
  },
  'POST /api/chat/typing': async (req, env) => {
    const body = await req.json();
    const key = `typing:${body.chatRoomId}:${body.userId}`;
    await env.KV_CACHE.put(key, body.isTyping ? '1' : '0', { expirationTtl: 10 });
    return json({ ok: true });
  },
  
  // R2 upload (generic small files)
  'PUT /api/r2/upload': async (req, env) => {
    const url = new URL(req.url);
    const path = url.searchParams.get('path');
    if (!path) return json({ error: 'Missing path' }, { status: 400 });
    const obj = await env.R2.put(path, req.body);
    const publicUrl = `https://r2.spaktok-cdn.com/${path}`; // adjust to your public domain
    return json({ key: obj?.key, url: publicUrl });
  },
  
  // AR endpoints (stubs)
  'POST /api/ar/object': async (req, env) => {
    const body = await req.json();
    await env.D1_DB.prepare(
      'INSERT INTO ar_objects (id, user_id, object_url, transform, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(body.id, body.userId, body.objectUrl, JSON.stringify(body.transform), JSON.stringify(body.metadata), body.timestamp).run();
    return json({ ok: true });
  },
  'POST /api/ar/experience': async (req, env) => {
    const body = await req.json();
    const id = crypto.randomUUID();
    await env.D1_DB.prepare(
      'INSERT INTO ar_experiences (id, user_id, title, description, object_urls, thumbnail_url, settings, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(id, body.userId, body.title, body.description, JSON.stringify(body.objectUrls), body.thumbnailUrl, JSON.stringify(body.settings || {}), Date.now()).run();
    return json({ id });
  },
  'GET /api/ar/experience': async (req, env) => {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    const limit = Number(url.searchParams.get('limit') || '20');
    const q = userId ?
      await env.D1_DB.prepare('SELECT * FROM ar_experiences WHERE user_id = ? ORDER BY created_at DESC LIMIT ?').bind(userId, limit).all() :
      await env.D1_DB.prepare('SELECT * FROM ar_experiences ORDER BY created_at DESC LIMIT ?').bind(limit).all();
    return json(q.results || []);
  },
  'POST /api/ar/experience/:id/use': async (req, env) => {
    const id = new URL(req.url).pathname.split('/').slice(-2)[0];
    await env.D1_DB.prepare('UPDATE ar_experiences SET usage_count = COALESCE(usage_count,0)+1 WHERE id = ?').bind(id).run();
    return json({ ok: true });
  },
  'POST /api/ar/recording': async (req, env) => {
    const body = await req.json();
    const id = crypto.randomUUID();
    await env.D1_DB.prepare(
      'INSERT INTO ar_recordings (id, user_id, video_url, thumbnail_url, placed_objects, duration, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(id, body.userId, body.videoUrl, body.thumbnailUrl, JSON.stringify(body.placedObjects || []), body.duration || 0, Date.now()).run();
    return json({ id });
  },
};

function routeKey(request: Request): string {
  const url = new URL(request.url);
  return `${request.method.toUpperCase()} ${url.pathname}`;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const key = routeKey(request);
    const handler = router[key];
    if (!handler) return json({ error: 'Not found', key }, { status: 404 });
    try {
      return await handler(request, env);
    } catch (e: any) {
      return json({ error: e?.message || 'Internal error' }, { status: 500 });
    }
  },
};
