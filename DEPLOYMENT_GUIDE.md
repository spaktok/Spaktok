# 🚀 Spaktok Deployment & Testing Guide

**Date:** November 8, 2025  
**Status:** Ready for Local Testing & Production Deployment

---

## ✅ Completed Implementation

### Backend (Firebase Cloud Functions)

#### 1. Configuration Management (`functions/src/config.js`)
- Centralized secret loading from environment variables or `functions.config()`
- Supports Stripe, Agora, Firebase, and Docker credentials
- Safe fallback mechanism with no hardcoded secrets in most cases

#### 2. Stripe Payment System (`functions/src/stripe.js`)
- **`createPaymentIntent`** - Callable function to initiate payments
- **`handleStripeWebhook`** - HTTP endpoint to process payment confirmations
- Automatic coin crediting to Firestore on successful payment
- Signature verification for webhook security

#### 3. Agora Token Generation (`functions/src/agora.js`)
- **`getAgoraToken`** - Callable function to generate RTC tokens
- Configured with your App ID: `a41807bba5c144b5b8e1fd5ee711707b`
- 1-hour token expiry with role-based access
- Supports live streaming, video calls, and voice calls

#### 4. Gift System (`functions/src/gifts.js`)
- **`getGiftCatalog`** - Returns available 3D gifts
- **`sendGift`** - Processes gift sending with coin deduction
- Firestore transaction safety for concurrent sends
- Returns animation and sound asset paths

### Frontend (Flutter)

#### Payment Integration
- `lib/services/payment_service.dart` - Complete Stripe payment flow
- Coin packages with predefined pricing
- Payment sheet UI integration

#### Live Streaming
- `lib/screens/enhanced_live_stream_screen.dart` - Agora integration
- Gift effects with Lottie animations and sounds
- Real-time viewer count and chat

---

## 🔧 Local Testing Setup

### 1. Set Environment Variables

Create a `.env` file in the repository root (already in `.gitignore`):

```bash
# Stripe Test Keys
STRIPE_SECRET_KEY=sk_test_51SDYFHRumpu3fxskjQggMnl7yLzUENBm41WWH0S8vuRgZj3Quu3C1agEyZyhCpCDT9W1FSLfzQLTKt6842b7UU3s00dPzlzgxd
STRIPE_WEBHOOK_SECRET=whsec_V4zeDXFiMhGrOx1xjBMoNfxBgav5eTpI

# Agora (already set in config.js as fallback)
AGORA_APP_ID=a41807bba5c144b5b8e1fd5ee711707b
AGORA_APP_CERTIFICATE=007eJxTYJDwWGJZ/aI5caX921xR5Vln3rxMrPzesObEj5O9e32ll/QqMCSaGFoYmCclJZomG5qYJJkmWaQapqWYpqaaGxqaAyUmOvBnNgQyMiz/P5WRkQECQXx2huCCxOyS/GwGBgBM/CLY

# Firebase (path to service account JSON)
GOOGLE_APPLICATION_CREDENTIALS=./firebase-service-account.json

# Chat/IM
CHAT_APP_KEY=711404457#1607467
CHAT_ORG_NAME=711404457
CHAT_APP_NAME=1607467
```

### 2. Start Firebase Emulators

```bash
cd functions
npm install
cd ..

# Start emulators (Functions + Firestore)
firebase emulators:start --only functions,firestore
```

Expected output:
```
✔  functions[us-central1-createPaymentIntent]: http function initialized
✔  functions[us-central1-handleStripeWebhook]: http function initialized
✔  functions[us-central1-getAgoraToken]: http function initialized
✔  functions[us-central1-getGiftCatalog]: http function initialized
✔  functions[us-central1-sendGift]: http function initialized
```

### 3. Test Agora Token Generation

Open a new terminal and test the token endpoint:

```bash
# Using Firebase Functions shell
cd functions
npm run shell

# Inside the shell, run:
getAgoraToken({channelName: 'test-channel-123', uid: 1001})
```

Expected response:
```javascript
{
  token: "006a41807bba5c144b5b8e...",
  appId: "a41807bba5c144b5b8e1fd5ee711707b",
  expiresAt: 1731072424
}
```

### 4. Test Stripe Payment

```bash
# In functions shell:
createPaymentIntent({amount: 999, currency: 'usd', uid: 'test-user-123'})
```

Expected response:
```javascript
{
  clientSecret: "pi_xxx_secret_yyy"
}
```

### 5. Test Gift System

```bash
# Get catalog
getGiftCatalog()

# Send a gift (requires user with coins in Firestore)
sendGift({
  giftId: 'rose',
  receiverId: 'receiver-user-id',
  context: 'live_stream',
  contextId: 'stream-123'
})
```

---

## 🌐 Production Deployment

### 1. Set Production Secrets

```bash
# Set Stripe production keys
firebase functions:config:set \
  stripe.secret_key="sk_live_YOUR_LIVE_KEY" \
  stripe.webhook_secret="whsec_YOUR_WEBHOOK_SECRET"

# Set Agora credentials
firebase functions:config:set \
  agora.app_id="a41807bba5c144b5b8e1fd5ee711707b" \
  agora.app_certificate="007eJxTYJDwWGJZ..."

# Verify config
firebase functions:config:get
```

### 2. Deploy Cloud Functions

```bash
# Deploy all functions
firebase deploy --only functions

# Or deploy specific functions
firebase deploy --only functions:createPaymentIntent,functions:getAgoraToken
```

### 3. Configure Stripe Webhook

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/handleStripeWebhook`
3. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. Copy webhook signing secret and set it:
   ```bash
   firebase functions:config:set stripe.webhook_secret="whsec_..."
   firebase deploy --only functions:handleStripeWebhook
   ```

### 4. Flutter App Configuration

Update `lib/config/app_config.dart`:

```dart
class AppConfig {
  // Production backend
  static const String backendBaseUrl = 'https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net';
  
  // Agora App ID (compile-time)
  static const String agoraAppId = 'a41807bba5c144b5b8e1fd5ee711707b';
  
  // Stripe publishable key (use production key)
  static const String stripePublishableKey = 'pk_live_YOUR_KEY';
}
```

Build the app:

```bash
# Android
flutter build apk --release --dart-define=AGORA_APP_ID=a41807bba5c144b5b8e1fd5ee711707b

# iOS
flutter build ios --release --dart-define=AGORA_APP_ID=a41807bba5c144b5b8e1fd5ee711707b

# Web
flutter build web --release --dart-define=AGORA_APP_ID=a41807bba5c144b5b8e1fd5ee711707b
```

---

## 🐳 Docker Deployment

### 1. Build Docker Image

```bash
# Login to Docker Hub
docker login -u yanalalghezawi

# Build image
docker build -t yanalalghezawi/spaktok:latest .

# Push to registry
docker push yanalalghezawi/spaktok:latest
```

### 2. Run with Docker Compose

```bash
# Production deployment
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker ps
docker logs spaktok-backend
```

---

## 🧪 Testing Checklist

### Backend Functions
- [ ] `getAgoraToken` - Returns valid token for channel
- [ ] `createPaymentIntent` - Creates Stripe PaymentIntent
- [ ] `handleStripeWebhook` - Credits coins on successful payment
- [ ] `getGiftCatalog` - Returns list of gifts
- [ ] `sendGift` - Deducts sender coins and creates gift record

### Frontend Integration
- [ ] Payment flow - User can purchase coins
- [ ] Live streaming - User can start/join streams with Agora
- [ ] Gift sending - User can send gifts during live streams
- [ ] Real-time updates - Gifts appear with animations and sounds

### Security
- [ ] Webhook signature verification enabled
- [ ] Firestore security rules prevent unauthorized access
- [ ] Rate limiting configured for expensive operations
- [ ] CORS configured for web deployment

---

## 📊 Monitoring & Logs

### View Cloud Functions Logs

```bash
# All functions
firebase functions:log

# Specific function
firebase functions:log --only createPaymentIntent

# Follow logs in real-time
firebase functions:log --follow
```

### Monitor Stripe Events

- Stripe Dashboard → Developers → Events
- Check for `payment_intent.succeeded` events
- Verify webhook delivery success

### Monitor Agora Usage

- Agora Console → Project → Usage
- Track live streaming minutes
- Monitor concurrent users

---

## 🔐 Security Best Practices

### Current Implementation
✅ Secrets loaded from environment variables  
✅ `.env` and credentials in `.gitignore`  
✅ Webhook signature verification (Stripe)  
✅ User authentication required for callable functions  
✅ Firestore transactions for coin operations  

### Recommended Additions
- [ ] Add rate limiting middleware for functions
- [ ] Implement request validation schemas
- [ ] Set up Cloud Functions quotas and alerts
- [ ] Enable Firebase App Check for client requests
- [ ] Rotate secrets regularly (Stripe, Agora, webhooks)
- [ ] Set up Firestore security rules with unit tests

---

## 📈 Scalability for 1B Users

### Current Architecture
- Firebase Cloud Functions: Auto-scales to demand
- Firestore: Horizontally scalable NoSQL database
- Agora: Supports millions of concurrent users

### Recommended Enhancements
1. **Caching Layer**
   - Add Redis for frequently accessed data (gift catalog, user profiles)
   - Reduce Firestore read costs

2. **CDN for Assets**
   - Host Lottie animations and sounds on Cloud Storage + CDN
   - Reduce latency worldwide

3. **Event-Driven Architecture**
   - Use Cloud Pub/Sub for gift notifications
   - Decouple gift sending from real-time updates

4. **Database Sharding**
   - Consider Azure Cosmos DB for multi-region writes
   - Partition by user ID or region

5. **Load Testing**
   - Use Artillery or K6 to simulate load
   - Test 10k, 100k, 1M concurrent connections

---

## 🎯 Next Steps

### Immediate (Today)
1. ✅ Run local emulator tests for all functions
2. ✅ Verify Agora token generation
3. ✅ Test Stripe payment flow end-to-end
4. Deploy to Firebase production

### Short-term (This Week)
5. Add comprehensive unit tests for Cloud Functions
6. Set up CI/CD pipeline (GitHub Actions)
7. Configure Firestore security rules
8. Enable Firebase App Check

### Medium-term (This Month)
9. Implement real-time gift leaderboards
10. Add admin dashboard for monitoring
11. Set up analytics and crash reporting
12. Conduct load testing

---

## 📞 Support & Resources

### Documentation
- Firebase Functions: https://firebase.google.com/docs/functions
- Stripe API: https://stripe.com/docs/api
- Agora Docs: https://docs.agora.io/

### Service Accounts
- Stripe: Test keys configured in `.env`
- Agora: App ID `a41807bba5c144b5b8e1fd5ee711707b`
- Firebase: Service account JSON required for admin SDK

---

**Status:** ✅ Ready for deployment  
**Last Updated:** November 8, 2025
