/*
 * Spaktok Cloudflare Worker (Edge API Layer)
 * Provides: payment intent creation, Agora token stub, Stream upload URL, image optimization placeholder, gift send placeholder.
 * Heavy workloads migrated from Firebase Functions will be relocated here.
 */

const memoryCache = new Map<string, string>();

interface Env {
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  AGORA_APP_ID: string;
  AGORA_APP_CERTIFICATE: string;
  CHAT_APP_KEY: string;
  CHAT_CLIENT_ID: string;
  CHAT_CLIENT_SECRET: string;
  CLOUDFLARE_STREAM_ACCOUNT_ID: string;
  CLOUDFLARE_STREAM_API_TOKEN: string;
  R2: R2Bucket;
  KV_CACHE: KVNamespace;
  D1_DB: D1Database;
  QUEUE_EVENTS: Queue;
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

async function createStreamDirectUpload(env: Env) {
  if (!env.CLOUDFLARE_STREAM_API_TOKEN || !env.CLOUDFLARE_STREAM_ACCOUNT_ID) return json({ error: 'Stream not configured' }, { status: 500 });
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_STREAM_ACCOUNT_ID}/stream/direct_upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.CLOUDFLARE_STREAM_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });
  const data = await res.json();
  if (!res.ok) return json({ error: data }, { status: res.status });
  return json(data.result);
}

async function getAgoraToken(env: Env) {
  // Placeholder (proper token generation requires Agora access token lib - not native in Workers).
  const cacheKey = 'agora:rtc:token';
  if (env.KV_CACHE && typeof env.KV_CACHE.get === 'function') {
    const cached = await env.KV_CACHE.get(cacheKey);
    if (cached) return json({ token: cached, cached: true, storage: 'kv' });
    const fakeToken = `FAKE_AGORA_${Date.now()}`;
    await env.KV_CACHE.put(cacheKey, fakeToken, { expirationTtl: 300 });
    return json({ token: fakeToken, cached: false, storage: 'kv', note: 'Replace with real Agora token generation.' });
  } else {
    const cached = memoryCache.get(cacheKey);
    if (cached) return json({ token: cached, cached: true, storage: 'memory' });
    const fakeToken = `FAKE_AGORA_${Date.now()}`;
    memoryCache.set(cacheKey, fakeToken);
    return json({ token: fakeToken, cached: false, storage: 'memory', note: 'KV binding not configured. Using ephemeral cache.' });
  }
}

async function imageOptimize(env: Env, request: Request) {
  // Placeholder for Cloudflare Images: would call Images API or use built-in delivery variants
  const url = new URL(request.url);
  const src = url.searchParams.get('src');
  if (!src) return json({ error: 'Missing src parameter' }, { status: 400 });
  return json({ optimized: true, src, variants: ['public/cdn-cf-images/width=640', 'public/cdn-cf-images/width=1280'] });
}

async function giftSend(env: Env, request: Request) {
  // Placeholder: original logic uses Firestore transactions; here we enqueue an event for processing.
  const body = await request.json().catch(() => ({}));
  if (!body.giftId || !body.receiverId || !body.senderId) return json({ error: 'Missing parameters' }, { status: 400 });
  const event = { type: 'gift.send', ts: Date.now(), payload: body };
  if (env.QUEUE_EVENTS && typeof env.QUEUE_EVENTS.send === 'function') {
    await env.QUEUE_EVENTS.send(event);
    return json({ queued: true, event });
  }
  return json({ queued: false, event, note: 'Queue binding not configured' });
}

const router: Record<string, (req: Request, env: Env) => Promise<Response>> = {
  'POST /api/payment-intent': (req, env) => createPaymentIntent(req, env),
  'POST /api/stream/upload': (_req, env) => createStreamDirectUpload(env),
  'GET /api/agora/token': (_req, env) => getAgoraToken(env),
  'GET /api/image/optimize': (req, env) => imageOptimize(env, req),
  'POST /api/gift/send': (req, env) => giftSend(env, req),
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
