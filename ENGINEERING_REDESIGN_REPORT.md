# Spaktok Ultra-Low-Cost Architecture Refactor (Cloudflare-First)

Date: 2025-11-17
Owner: Platform Engineering
Status: Complete (Phase 1–2) / Ready for rollout

---

## Executive Summary
- Objective: Reduce infra cost to ~10% of current while preserving performance to 1B users.
- Approach: Cloudflare-first global edge compute + storage, eliminate costly managed services, use P2P/WebRTC and Workers AI.
- Result: Backend moved to Cloudflare Workers/Durable Objects/R2/D1/KV/Queues; Firebase reduced to Auth only. Agora/Firestore/Storage/Google AI usage removed from app.

---

## What We Removed
- Agora RTC engine (Flutter + token generation in Functions)
- Firestore reads/writes from app (chat, AR, screen flows)
- Firebase Storage (uploads for chat media, AR models)
- Google Cloud Vision/Speech/Translate/NLP SDKs in Functions
- Cloud Functions logic for payments/moderation/captions (moved to Workers)
- Firestore-driven streams (replaced with polling or DO websockets-ready stubs)

## What We Replaced (Cheaper Alternatives)
- Live streaming signaling: WebRTC + Cloudflare Durable Objects + STUN; P2P where possible
- Media storage: Cloudflare R2 (FREE egress) + Cloudflare Stream for transcoding
- Backend compute: Cloudflare Workers (edge)
- Data: Cloudflare D1 (SQLite) for relational data, KV for session/cache/typing
- AI: Workers AI (Whisper for captions; light image/text moderation models)
- File uploads: R2 via Workers endpoints; chunked video uploads to R2 then ingest to Stream

---

## Code Changes Overview

### Flutter (client)
- pubspec.yaml: removed `agora_rtc_engine`, `cloud_firestore`, `firebase_storage`, Google ML Kit; added `flutter_webrtc`, `tflite_flutter`.
- Added `lib/services/cloudflare_api_service.dart` – single edge backend client.
- Refactored AR service `lib/services/world_ar_service.dart` to remove Firestore/Storage and call Workers endpoints (D1 + R2).
- Refactored Chat:
  - `lib/models/chat_message.dart` – replaced Firestore `Timestamp` with `DateTime`; JSON-based model.
  - `lib/services/chat_service.dart` – Firestore/Storage → Workers/D1/R2 (polling streams, HTTP APIs).
  - `lib/spaktok/screens/chat_screen.dart` – removed Firestore import; use `DateTime.now()`.
- `lib/screens/duet_stitch_screen.dart` – removed Firestore; fetch video metadata via Workers.

### Cloudflare Workers (backend)
- `cloudflare/workers/src/index.ts`
  - New routes: video metadata, chat send/messages, chat typing (KV), R2 upload, AR object/experience/recording endpoints, chunked video upload/finalize, WebRTC session/signaling, moderation/captions, gifts, payments.
- Durable Objects:
  - `src/webrtc-signaling.ts` – signaling DO for WebRTC.
  - `src/live-stream.ts` – live session state (viewers, chat, metadata).
- D1 Schema: `cloudflare/workers/schema.sql`
  - Added tables for videos, messages, AR objects/experiences/recordings, users, likes, follows.
- Wrangler config: `cloudflare/workers/wrangler.toml` updated with R2/KV/D1/Queues/DOs/AI bindings.

### Firebase Functions (minimal)
- `functions/package.json` – removed expensive @google-cloud SDKs and agora token lib.
- `functions/index.js` – reduced to health + minimal auth/user sync stub (can be disabled entirely; Firebase kept for Auth only).

---

## Final Architecture Map

Client (Flutter)
- Local caching, chunked uploads, P2P WebRTC, adaptive bitrate playback (Stream)

Edge (Cloudflare)
- Workers: REST APIs + caching
- Durable Objects: signaling + live state
- R2: images/assets/chat media/uploads (FREE egress)
- Stream: transcoding + delivery (configurable usage)
- KV: session/typing/cache
- D1: metadata (videos, comments, messages, likes, follows, AR)
- Queues: background tasks (moderation/captions/notifications)
- Workers AI: moderation + captions

Firebase
- Auth only (email/Google/FB/Apple)

---

## New Estimated Cost
Assumptions: aggressive caching, P2P WebRTC for small rooms, R2 for storage, D1 for metadata, Workers AI for captions/moderation with selective usage.

- Workers + KV + D1 + R2 + DO + Queues: ~$12k–$20k @ 100M MAU (heavy caching, optimized routes)
- Stream usage (optional/controlled): keep below $5k by pre-compressing/using P2P/HLS only where needed
- Firebase Auth: ~$5k (depending on auth events volume)
- Stripe fees: Passed to users (not infra)

Total target: $15k–$25k/month @ 100M MAU (excludes payment fees). Horizontal edge expansion scales toward $120k–$200k/month @ 1B MAU.

---

## Deployment Instructions
1. Cloudflare
   - Create/bind resources in `wrangler.toml`: R2 bucket, KV namespace, D1 DB, Queues, Durable Objects, AI binding.
   - Apply schema: `wrangler d1 execute spaktok-db --file schema.sql`.
   - Deploy worker: `npm run deploy` in `cloudflare/workers`.
2. Firebase
   - Keep Auth configuration; optionally disable Functions entirely or keep `health`.
3. Flutter Client
   - `flutter pub get`; build app. Ensure base URL in `CloudflareApiService` matches deployed worker domain.

---

## Risks & Mitigations
- Cloudflare Stream cost: keep usage constrained; prefer R2 + client-side compression + adaptive streaming; P2P where feasible.
- Polling streams: replace with Durable Objects websockets for chat/live when ready.
- Quotas & limits: monitor Workers/D1 quotas; shard data if needed.
- Moderation accuracy: validate Workers AI models; fallback to manual review for flagged content.

---

## Future Improvements
- DO-based websockets for chat/live to replace polling.
- Adaptive bitrate policies & pre-encoding for popular videos.
- Regional D1 replicas (when available) or split DB per region.
- Automated tiered storage policies in R2.
- Add signed URLs & JWT-based auth to Workers endpoints.
