---
description: Spaktok Advanced Quick Start - Complete Setup Guide
alwaysApply: true
---

# ⚡ SPAKTOK ADVANCED QUICK START GUIDE

**Status**: ✅ Ready to Use | **Time to First Run**: 15-30 minutes  
**Platforms**: All (Android, iOS, Web, Windows, macOS, Linux)

---

## 🎯 YOUR FIRST 30 MINUTES

### Minute 1-5: Understand the Platform

**What is Spaktok?**
- TikTok-like short-form videos
- Snapchat-like messaging & AR
- Agora-powered live streaming
- Creator monetization platform
- Real-time collaboration features

**Key Features**:
- ✅ Live streaming with Agora RTC
- ✅ Short video creation & editing
- ✅ Real-time messaging
- ✅ Gift system with monetization
- ✅ AR filters & effects
- ✅ Creator analytics
- ✅ Payment processing

### Minute 5-10: Check Prerequisites

```bash
# Check Flutter
flutter --version
# Expected: >=3.16.0

# Check Node.js
node --version
# Expected: >=18.0.0

# Check npm
npm --version
# Expected: >=9.0.0

# Check Docker
docker --version
# Expected: >=20.0.0
```

### Minute 10-15: Set Up Environment

```bash
# Clone or navigate to repo
cd c:\Users\A\spaktok

# Create .env file
cp backend/.env.example backend/.env

# Edit .env with your credentials
# Add: Agora credentials, Firebase config, Stripe keys, DB credentials
```

### Minute 15-30: Run Locally

```bash
# Terminal 1: Start Backend
cd backend
npm install
npm run dev
# Expected: Server running on port 5000

# Terminal 2: Start Frontend
flutter pub get
flutter run
# or: flutter run -d chrome (for web)
# Expected: App starts on device/emulator

# Terminal 3: Optional - Start Firebase Emulator
firebase emulators:start
```

---

## 🏗️ ARCHITECTURE QUICK REFERENCE

```
User Device (Flutter App)
    ↓↑
API Gateway (Nginx)
    ↓↑
Backend Services (Node.js)
    ↓↑
Databases (PostgreSQL/MongoDB)
    ↓↑
External Services (Agora, Stripe, Firebase)
```

**Key Components**:
- **Frontend**: Flutter (Dart) - 6 platforms
- **Backend**: Express.js - REST API + WebSockets
- **Database**: PostgreSQL + MongoDB
- **Cache**: Redis
- **RTC**: Agora (video/audio)
- **Auth**: Firebase Auth + JWT
- **Payments**: Stripe
- **Storage**: Firebase Cloud Storage

---

## 📋 SETUP CHECKLIST

### ✅ Backend Setup (10 minutes)

- [ ] Navigate to backend directory
- [ ] Run `npm install`
- [ ] Copy `.env.example` to `.env`
- [ ] Add Agora App ID and Certificate
- [ ] Add Firebase credentials
- [ ] Add Stripe keys
- [ ] Add Database URLs
- [ ] Run `npm run dev`
- [ ] Verify: `curl http://localhost:5000/api/agora/health`

### ✅ Frontend Setup (10 minutes)

- [ ] Navigate to project root
- [ ] Run `flutter pub get`
- [ ] Update Firebase configuration
- [ ] Update app_config.dart
- [ ] Run `flutter run`
- [ ] Test on device/emulator
- [ ] Verify login screen appears

### ✅ Database Setup (5 minutes)

- [ ] PostgreSQL running
- [ ] MongoDB running
- [ ] Run migrations
- [ ] Verify tables created
- [ ] Add test data (optional)

### ✅ Firebase Setup (5 minutes)

- [ ] Project created
- [ ] Auth enabled
- [ ] Firestore created
- [ ] Storage bucket created
- [ ] Credentials downloaded
- [ ] Added to app

---

## 🚀 DEPLOYMENT QUICK START

### Deploy Backend (Docker)

```bash
# Build image
docker build -t spaktok-backend .

# Run container
docker run -d \
  -p 5000:5000 \
  --env-file .env \
  --name spaktok-backend \
  spaktok-backend

# Verify
curl http://localhost:5000/api/agora/health
```

### Deploy Frontend (Flutter Web)

```bash
# Build web
flutter build web --release

# Deploy to Firebase
firebase deploy --only hosting

# Verify
curl https://spaktok.web.app
```

### Deploy Full Stack (Docker Compose)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all
docker-compose down
```

---

## 📱 TESTING QUICK START

### Frontend Tests

```bash
# Run all tests
flutter test

# Run specific test
flutter test test/agora_integration_test.dart

# Generate coverage
flutter test --coverage

# View coverage
open coverage/lcov-report/index.html
```

### Backend Tests

```bash
# Run integration tests
npm test

# Or run specific test file
npm test -- test-integration.js

# Watch mode
npm run test:watch
```

### Manual Testing

**Test User Creation**:
1. Open app
2. Click "Sign Up"
3. Fill form (email, password, username)
4. Click "Register"
5. Verify user created

**Test Video Upload**:
1. Login to app
2. Click camera icon
3. Record or select video
4. Add title & description
5. Click upload
6. Verify in feed

**Test Live Stream**:
1. Click "Start Live Stream"
2. Fill stream details
3. Click "Go Live"
4. In another app, search for stream
5. Click to join
6. Verify video connection

---

## 🔧 COMMON SETUP ISSUES

### "npm ERR! Missing credentials"

```bash
# Solution: Add credentials to .env
nano backend/.env

# Add these:
AGORA_APP_ID=your_app_id
AGORA_APP_CERTIFICATE=your_certificate
FIREBASE_API_KEY=your_key
```

### "Flutter not found"

```bash
# Solution: Add Flutter to PATH
export PATH="$PATH:$(flutter --version | cut -d' ' -f3)/bin"

# Or install Flutter:
# https://flutter.dev/docs/get-started/install
```

### "Port 5000 already in use"

```bash
# Solution 1: Kill process
lsof -ti:5000 | xargs kill -9

# Solution 2: Use different port
PORT=5001 npm run dev

# Solution 3: Change in .env
SERVER_PORT=5001
```

### "Database connection failed"

```bash
# Solution: Check PostgreSQL
psql -h localhost -U admin -d spaktok_db

# If not running, start it:
# macOS: brew services start postgresql
# Windows: services.msc > PostgreSQL > Start
# Linux: sudo systemctl start postgresql
```

### "Firebase initialization failed"

```bash
# Solution: Check Firebase config
cat lib/core/firebase_options.dart

# Ensure it matches your Firebase project credentials
# Update if needed with your firebase-config.json
```

---

## 📊 KEY ENDPOINTS TO TEST

### Health Check

```bash
curl http://localhost:5000/api/agora/health
# Expected: {"status":"ok"}
```

### Generate RTC Token

```bash
TOKEN="your_jwt_token"
curl -X POST http://localhost:5000/api/agora/token \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "channel": "test-channel",
    "role": "publisher"
  }'
```

### Get User Profile

```bash
curl http://localhost:5000/api/users/me \
  -H "Authorization: Bearer $TOKEN"
```

### Upload Video

```bash
curl -X POST http://localhost:5000/api/content/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "video_file=@video.mp4" \
  -F "title=My Video"
```

---

## 🎮 INTERACTIVE TESTING

### Using Postman

1. Download Postman
2. Import collection: `postman_collection.json`
3. Set variables:
   - `base_url`: http://localhost:5000
   - `token`: Your JWT token
4. Test endpoints one by one

### Using cURL Script

```bash
#!/bin/bash
# test_api.sh

BASE_URL="http://localhost:5000"

# Register user
RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"password123",
    "username":"testuser"
  }')

TOKEN=$(echo $RESPONSE | jq -r '.token')

# Test health
curl -s $BASE_URL/api/agora/health | jq .

# Test token generation
curl -s -X POST $BASE_URL/api/agora/token \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "channel": "test-channel",
    "role": "publisher"
  }' | jq .
```

---

## 📚 LEARNING PATHS

### For Frontend Developers

**Day 1**:
1. Review flutter structure: `lib/` directory
2. Check main entry: `lib/main.dart`
3. Explore screens: `lib/screens/`
4. Read: `lib/services/agora_token_service.dart`

**Day 2-3**:
1. Create simple screen
2. Integrate with backend
3. Add state management with Provider
4. Create a test

**Week 2**:
1. Build complete feature
2. Add to main navigation
3. Implement testing
4. Deploy to device

### For Backend Developers

**Day 1**:
1. Review structure: `backend/` directory
2. Check main entry: `backend/server.js`
3. Explore routes: `backend/routes/`
4. Explore services: `backend/services/`

**Day 2-3**:
1. Create new API endpoint
2. Add to database
3. Write tests
4. Deploy

**Week 2**:
1. Build complete feature
2. Add authentication
3. Add caching
4. Deploy to production

### For DevOps Engineers

**Day 1**:
1. Review Docker setup: `Dockerfile`, `docker-compose.yml`
2. Build images: `docker-compose build`
3. Start services: `docker-compose up`
4. Check logs

**Day 2-3**:
1. Set up Kubernetes (optional)
2. Configure CI/CD
3. Set up monitoring
4. Create deployment script

**Week 2**:
1. Deploy to cloud (AWS/GCP/Azure)
2. Set up auto-scaling
3. Configure CDN
4. Optimize performance

---

## 🎯 NEXT STEPS (CHOOSE YOUR PATH)

### 👨‍💻 I'm a Developer

1. ✅ Complete setup above
2. ⏳ Read `CONSOLIDATED_MASTER_GUIDE.md` (dev section)
3. ⏳ Explore codebase
4. ⏳ Make first feature
5. ⏳ Submit PR

### 🔧 I'm DevOps

1. ✅ Complete setup above
2. ⏳ Read `CONSOLIDATED_MASTER_GUIDE.md` (ops section)
3. ⏳ Set up monitoring
4. ⏳ Configure CI/CD
5. ⏳ Plan deployment

### 📊 I'm a Manager

1. ✅ Understand architecture (above)
2. ⏳ Read `CONSOLIDATED_MASTER_GUIDE.md`
3. ⏳ Review `COMPREHENSIVE_ANALYSIS_AND_DEVELOPMENT_PLAN.md`
4. ⏳ Plan sprints
5. ⏳ Track progress

---

## 📞 GETTING HELP

### Documentation

- **Architecture**: CONSOLIDATED_MASTER_GUIDE.md
- **API Reference**: API_REFERENCE.md
- **Troubleshooting**: TROUBLESHOOTING_GUIDE.md
- **Configuration**: CONFIGURATION_GUIDE.md
- **Database**: DATABASE_SCHEMA.md

### Common Issues

1. **"Agora not working"** → See TROUBLESHOOTING_GUIDE.md
2. **"Database error"** → Check DATABASE_SCHEMA.md
3. **"Deployment failed"** → Check CONSOLIDATED_MASTER_GUIDE.md
4. **"API not responding"** → Check API_REFERENCE.md

### Getting Support

1. Check documentation
2. Search issue tracker
3. Ask in team chat
4. Escalate to tech lead

---

## ⚡ PERFORMANCE TIPS

### Frontend Optimization

```dart
// ✅ Use Provider for state management
final provider = Provider.of<DataService>(context);

// ✅ Lazy load images
CachedNetworkImage(
  imageUrl: url,
  placeholder: (context, url) => Shimmer.loading(),
)

// ✅ Optimize videos
VideoPlayer(
  dataSource: url,
  autoPlay: false,
)
```

### Backend Optimization

```javascript
// ✅ Cache frequently accessed data
const cached = await redis.get(key);

// ✅ Use pagination
GET /api/videos?page=1&limit=20

// ✅ Index database queries
CREATE INDEX idx_users_id ON users(id);
```

---

## 📈 SUCCESS METRICS

After setup, verify:

- ✅ Backend: `curl http://localhost:5000/api/agora/health` → "ok"
- ✅ Frontend: App launches without crashes
- ✅ Database: Can login and create account
- ✅ Tests: `npm test` and `flutter test` pass
- ✅ Deploy: `docker-compose up` starts all services

---

## 🎉 YOU'RE READY!

**Congratulations! You've successfully:**

✅ Set up Spaktok locally
✅ Verified all components
✅ Understood the architecture
✅ Learned key concepts
✅ Ready to start developing!

**Next**: Choose your path (Dev/DevOps/Manager) and begin!

---

**Last Updated**: 2025-10-28  
**Version**: 2.0  
**Time to Complete**: 30 minutes
