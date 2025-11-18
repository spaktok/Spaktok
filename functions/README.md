## Cloudflare Stream Integration
Spaktok uses Cloudflare Stream for video hosting and delivery. Stream provides secure, scalable video upload and playback APIs.

**Environment variables:**
```
CLOUDFLARE_STREAM_API_TOKEN=your-stream-api-token
CLOUDFLARE_STREAM_ACCOUNT_ID=your-account-id
```

**Usage:**
- See `src/stream.js` for upload/playback helpers.
- Use `createDirectUpload()` to get a direct upload URL for client-side video upload.
- Use `getVideoInfo(videoId)` to fetch playback info (HLS, thumbnail, status).
- Use `deleteVideo(videoId)` to remove a video.

**Next steps:**
- Update video upload and playback endpoints to use Cloudflare Stream for all video content.

## Cloudflare Images Integration
Spaktok uses Cloudflare Images for image upload, compression, and optimization with automatic variants.

**Environment variables:**
```
CLOUDFLARE_IMAGES_API_TOKEN=your-images-api-token
CLOUDFLARE_IMAGES_ACCOUNT_ID=your-account-id
CLOUDFLARE_IMAGES_ACCOUNT_HASH=your-account-hash
```

**Usage:**
- See `src/images.js` for upload/delivery helpers.
- Use `uploadImage(file, metadata)` to upload images with optional metadata.
- Use `getImageUrl(imageId, variant)` to get delivery URLs with built-in variants (e.g., `public`, `thumbnail`).
- Use `deleteImage(imageId)` to remove images.
- Use `listImages(page, perPage)` for paginated listing.

**Next steps:**
- Update image upload endpoints to use Cloudflare Images for all user-uploaded content (avatars, posts, stories).
# Spaktok Cloud Functions

This directory contains Firebase Cloud Functions for Spaktok (payments, live streaming token generation, gifts system, webhooks, and supporting utilities).

## Features
- Stripe PaymentIntent creation (`createPaymentIntent`)
- Stripe webhook handler (`handleStripeWebhook`)
- Agora RTC token generation (`getAgoraToken`)
- Agora Chat App token generation (`getAgoraChatAppToken`)
- Gift catalog and transactional sending (`getGiftCatalog`, `sendGift`)
- Centralized configuration loader (`src/config.js`)

## Stripe Integration
The implementation supports two execution modes:

| Mode | Trigger | Behavior |
|------|---------|----------|
| Real Stripe | Default when `USE_STRIPE_MOCK` is not `true` | Uses the real Stripe API with `STRIPE_SECRET_KEY` |
| Mock | `USE_STRIPE_MOCK=true` | Returns deterministic fake objects; no network calls |

Environment variables (set via `.env`, Firebase config, or CI secrets):
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
USE_STRIPE_MOCK=true|false
```

### Why a Mock?
CI and local test runs shouldn't depend on external network calls. The mock allows unit tests to run deterministically. Only the success test for `createPaymentIntent` actually calls Stripe if a real secret is present.

### Switching Modes
```
# Use real Stripe
USE_STRIPE_MOCK=false npm test

# Use mock
USE_STRIPE_MOCK=true npm test
```

## Agora Token Function
`getAgoraToken` generates a one-hour RTC token. Required fields:
```
channelName: string
uid: (optional) numeric (auto-assigned if missing)
role: 'publisher' | 'subscriber' (default publisher)
```

Environment:
```
AGORA_APP_ID=...
AGORA_APP_CERTIFICATE=...
```

## Gift System
## Agora Chat Token Functions

### App-Level Token (`getAgoraChatAppToken`)
Returns an app-level token using client credentials. **Includes in-memory caching** with 5-minute safety buffer to reduce redundant API calls.

Environment:
```
CHAT_APP_KEY=711404457#1607467
CHAT_CLIENT_ID=...
CHAT_CLIENT_SECRET=...
USE_CHAT_MOCK=true|false
```

Notes:
- If `USE_CHAT_MOCK=true` or secrets are missing, a deterministic mock token is returned (suitable for CI/local tests).
- Real calls hit `https://a1.agora.io/{CHAT_APP_KEY}/token` using `grant_type=client_credentials`.
- Token is cached for ~1 hour; subsequent calls return cached value if not expired.

### Per-User Token (`getAgoraChatUserToken`)
Returns a user-specific token. Requires authenticated context (`context.auth.uid`).

Workflow:
1. Obtains app token (cached if available).
2. Calls Agora Chat REST API: `POST /{CHAT_APP_KEY}/users/{uid}/token`.
3. Returns user token with 1-hour expiry.

Use cases:
- Individual user authentication for Agora Chat SDK in mobile/web clients.
- Secure per-user messaging without sharing app credentials.

`getGiftCatalog` returns static catalog. `sendGift` performs a Firestore transaction:
1. Validates gift exists
2. Checks sender coin balance
3. Debits sender, credits receiver (optionally accumulate gift stats)
4. Writes gift record for analytics/rendering

## Configuration Loader (`src/config.js`)
Loads from `process.env` first, then Firebase runtime config, with safe fallbacks. Centralizing prevents scattered secret access.

## Testing
Run tests from the `functions` directory:
```
npm test
```

To run with mock:
```
USE_STRIPE_MOCK=true npm test
```

## Webhook Handling
`handleStripeWebhook` verifies signatures when `STRIPE_WEBHOOK_SECRET` is set; otherwise treats body as already parsed (dev convenience). In production ALWAYS set the webhook secret.

## Adding New Functions
1. Implement logic in `src/<name>.js`
2. Export from `index.js`
3. Add tests under `test/`
4. Update documentation if public behavior changes

## Security & Secrets
- Never commit real secrets—use `.env` locally and Firebase config (`firebase functions:config:set`).
- `.env.test` is gitignored.
- Webhook secret must be configured in production.

## Cloudflare R2 Integration
Spaktok uses Cloudflare R2 as the main storage for videos and images. R2 is S3-compatible and integrated via the AWS SDK.

**Environment variables:**
```
CLOUDFLARE_R2_ACCESS_KEY_ID=your-access-key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-secret-key
CLOUDFLARE_R2_BUCKET=your-bucket
CLOUDFLARE_R2_ACCOUNT_ID=your-account-id
CLOUDFLARE_R2_ENDPOINT=https://<accountid>.r2.cloudflarestorage.com
```

**Usage:**
- See `src/r2.js` for upload/download helpers.
- Use `uploadToR2(key, body, contentType)` to upload files.
- Use `getFromR2(key)` to retrieve files.

**Next steps:**
- Update upload/download endpoints to use R2 for all video/image storage.

## Deployment
Handled by CI/CD (GitHub Actions). Manual deploy:
```
firebase deploy --only functions
```

## Future Enhancements
- Add rate limiting middleware
- Expand gift catalog via dynamic Firestore collection
- Support ephemeral keys for Stripe mobile SDK
- Token caching for Agora to reduce regeneration overhead
