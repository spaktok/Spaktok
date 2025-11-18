# Cloudflare Workers - Spaktok Edge API

This directory contains Cloudflare Workers for Spaktok backend edge functions, providing a globally distributed, serverless API layer for:
- Payment intent creation (Stripe)
- Agora RTC token generation (placeholder)
- Cloudflare Stream direct upload URL generation
- Image optimization stubs (Cloudflare Images)
- Gift send event queuing

## Setup

1. Install dependencies:
```bash
cd cloudflare/workers
npm install
```

2. Configure environment in Wrangler dashboard or via CLI:
```bash
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET
wrangler secret put AGORA_APP_CERTIFICATE
wrangler secret put CHAT_CLIENT_SECRET
wrangler secret put CLOUDFLARE_STREAM_API_TOKEN
```

3. Provision resources (R2, KV, D1, Queue) and bind them in `wrangler.toml`.

	Create KV namespace:
	```bash
	wrangler kv:namespace create KV_CACHE
	wrangler kv:namespace create KV_CACHE --preview
	```

	Create D1 database:
	```bash
	wrangler d1 create spaktok
	wrangler d1 execute spaktok --file=schema.sql
	```

	Create Queue:
	```bash
	wrangler queues create spaktok-events
	```

	Deploy queue consumer:
	```bash
	wrangler deploy --config wrangler-consumer.toml
	```

## Development

Run locally:
```bash
npm run dev
```

Deploy to Cloudflare:
```bash
npm run deploy
```

## API Routes

- `POST /api/payment-intent` - Create Stripe PaymentIntent
- `POST /api/stream/upload` - Get Cloudflare Stream upload URL
- `GET /api/agora/token` - Get Agora RTC token (cached in KV)
- `GET /api/image/optimize?src=<url>` - Optimize image (placeholder)
- `POST /api/gift/send` - Send gift (queued to QUEUE_EVENTS)

## Migration Status

Heavy/latency-sensitive Firebase Functions should be migrated to these Workers for lower latency and global edge distribution. Next steps:
1. Implement full Agora token generation (requires Agora access token lib or manual JWT generation).
2. Implement full Cloudflare Images integration with variants and signing.
3. Connect D1 for user/gift queries instead of Firestore.
4. Set up Queue consumers for async processing (chat events, gift processing).

## Security

- All secrets stored as Wrangler secrets (never in code or wrangler.toml vars).
- Validate authentication headers (e.g., Firebase ID tokens) before executing sensitive actions.
- WAF/DDoS protection via Cloudflare dashboard.
