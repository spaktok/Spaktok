# Cloudflare Workers Integration Complete

## ✅ What's Ready

### Backend Services
- **R2 Service** (`backend/services/cloudflare-r2-service.js`)
  - Upload objects to R2
  - Download/stream objects from R2
  - Uses `@aws-sdk/client-s3` (S3-compatible)

- **Stream Service** (`backend/services/cloudflare-stream-service.js`)
  - Create direct upload URLs
  - Generate HLS playback URLs
  - Uses Cloudflare Stream API

### Backend API Routes
- `POST /api/cloudflare/r2/upload` - Upload file to R2
- `GET /api/cloudflare/r2/download/:key` - Download from R2
- `POST /api/cloudflare/stream/upload-url` - Get Stream upload URL
- `GET /api/cloudflare/stream/playback/:uid` - Get video playback URL

### Workers Edge API
- `POST /api/payment-intent` - Create Stripe payment (edge)
- `POST /api/stream/upload` - Stream direct upload URL
- `GET /api/agora/token` - Agora RTC token (cached)
- `GET /api/image/optimize` - Image optimization placeholder
- `POST /api/gift/send` - Queue gift send event

## 🔧 Environment Setup

### Backend (.env)
```bash
# Cloudflare R2
CLOUDFLARE_R2_ACCESS_KEY_ID=<your_r2_access_key>
CLOUDFLARE_R2_SECRET_ACCESS_KEY=<your_r2_secret>
CLOUDFLARE_R2_ACCOUNT_ID=b62ed7e1cf0e1dc886f363573bad4bdb
CLOUDFLARE_R2_BUCKET=spaktok-media
CLOUDFLARE_R2_ENDPOINT=https://b62ed7e1cf0e1dc886f363573bad4bdb.r2.cloudflarestorage.com

# Cloudflare Stream
CLOUDFLARE_STREAM_API_TOKEN=<your_stream_token>
CLOUDFLARE_STREAM_ACCOUNT_ID=b62ed7e1cf0e1dc886f363573bad4bdb
```

### Workers (wrangler.toml)
Edit `cloudflare/workers/wrangler.toml` and fill in:
```toml
[vars]
STRIPE_SECRET_KEY = "sk_live_..."
AGORA_APP_ID = "your_app_id"
AGORA_APP_CERTIFICATE = "your_certificate"
CLOUDFLARE_STREAM_API_TOKEN = "your_token"
```

## 📦 Create Cloudflare Resources

### 1. R2 Bucket
```bash
wrangler r2 bucket create spaktok-media
```

### 2. KV Namespace (for caching)
```bash
wrangler kv:namespace create "GIFTS_KV"
wrangler kv:namespace create "GIFTS_KV" --preview
```

### 3. D1 Database (optional)
```bash
wrangler d1 create spaktok
```

### 4. Queue (optional)
```bash
wrangler queues create spaktok-events
```

Then uncomment and update bindings in `wrangler.toml`.

## 🚀 Deploy Workers

```bash
cd cloudflare/workers
npx wrangler deploy
```

## 🧪 Test Backend Routes

```bash
# Test R2 upload
curl -X POST http://localhost:5000/api/cloudflare/r2/upload \
  -H "Content-Type: application/json" \
  -d '{"key":"test.txt","body":"Hello R2","contentType":"text/plain"}'

# Test Stream upload URL
curl -X POST http://localhost:5000/api/cloudflare/stream/upload-url

# Test Stream playback
curl http://localhost:5000/api/cloudflare/stream/playback/VIDEO_UID
```

## 📝 Next Steps

1. **Create R2 bucket** and update env vars
2. **Get Stream API token** from Cloudflare dashboard
3. **Deploy Workers** with `wrangler deploy`
4. **Wire frontend** to use new endpoints
5. **Migrate heavy Functions** to Workers for cost optimization
