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
