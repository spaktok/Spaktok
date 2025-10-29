---
description: Spaktok Complete Troubleshooting & Problem Solving Guide
alwaysApply: true
---

# 🔧 SPAKTOK TROUBLESHOOTING & PROBLEM SOLVING GUIDE

**Status**: ✅ Complete | **Last Updated**: 2025-10-28  
**Updated By**: Technical Support Team

---

## TABLE OF CONTENTS

1. [Installation Issues](#installation-issues)
2. [Deployment Issues](#deployment-issues)
3. [Database Issues](#database-issues)
4. [API Issues](#api-issues)
5. [Frontend Issues](#frontend-issues)
6. [Performance Issues](#performance-issues)
7. [Security Issues](#security-issues)
8. [Production Issues](#production-issues)

---

## INSTALLATION ISSUES

### Issue: "Flutter not found"

**Problem**: 
```
Command 'flutter' not found
```

**Root Cause**:
- Flutter SDK not installed
- Flutter not added to PATH

**Solutions**:

```bash
# Solution 1: Add Flutter to PATH
export PATH="$PATH:/path/to/flutter/bin"

# Solution 2: Install Flutter
# macOS (using Homebrew)
brew install flutter

# Windows
choco install flutter

# Linux
git clone https://github.com/flutter/flutter.git -b stable
export PATH="$PATH:`pwd`/flutter/bin"

# Verify installation
flutter doctor
```

**Prevention**:
- Add Flutter to `.bashrc` or `.zshrc` permanently
- Use version manager (asdf, fvm)

---

### Issue: "npm ERR! Missing credentials"

**Problem**:
```
npm ERR! code ENOGIT
npm ERR! No git
```

**Root Cause**:
- Git not installed
- Missing environment variables

**Solutions**:

```bash
# Solution 1: Install Git
# macOS
brew install git

# Windows
choco install git

# Linux
sudo apt-get install git

# Solution 2: Configure git
git config --global user.email "you@example.com"
git config --global user.name "Your Name"

# Solution 3: Clear npm cache
npm cache clean --force
npm install
```

---

### Issue: "Node version incompatibility"

**Problem**:
```
The version of Node.js is not supported for x package
```

**Root Cause**:
- Node version <18
- Package requires specific Node version

**Solutions**:

```bash
# Check current version
node --version

# Update Node
# Using nvm (recommended)
nvm install 18
nvm use 18

# Or upgrade directly
npm install -g n
n 18

# Verify
node --version  # Should show >=18.0.0
```

---

## DEPLOYMENT ISSUES

### Issue: "Port already in use"

**Problem**:
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Root Cause**:
- Another service using port 5000
- Previous process not terminated

**Solutions**:

```bash
# Solution 1: Kill process on port
# macOS/Linux
lsof -ti:5000 | xargs kill -9

# Windows (PowerShell)
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process

# Solution 2: Use different port
PORT=5001 npm start

# Solution 3: Find what's using port
# macOS/Linux
lsof -i :5000

# Windows
netstat -ano | findstr :5000
```

---

### Issue: "Docker build fails"

**Problem**:
```
Step 1/5 : FROM node:18
ERROR: pull access denied for node, repository does not exist or may require 'docker login'
```

**Root Cause**:
- Docker not logged in
- No internet connection
- Docker daemon not running

**Solutions**:

```bash
# Solution 1: Start Docker daemon
# macOS
open -a Docker

# Windows
# Open Docker Desktop from Start menu

# Linux
sudo systemctl start docker

# Solution 2: Login to Docker
docker login

# Solution 3: Pull base image first
docker pull node:18
docker build .

# Solution 4: Check internet
ping google.com
```

---

### Issue: "docker-compose not found"

**Problem**:
```
Command 'docker-compose' not found
```

**Root Cause**:
- docker-compose not installed
- Using Docker without compose

**Solutions**:

```bash
# Solution 1: Install docker-compose
# macOS (Homebrew)
brew install docker-compose

# Windows (with Docker Desktop)
# Already included

# Linux
sudo curl -L "https://github.com/docker/compose/releases/download/v2.0.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify
docker-compose --version

# Solution 2: Use docker compose (newer syntax)
docker compose up -d
```

---

## DATABASE ISSUES

### Issue: "Connection refused" (PostgreSQL)

**Problem**:
```
ECONNREFUSED 127.0.0.1:5432
```

**Root Cause**:
- PostgreSQL not running
- Wrong connection string
- Firewall blocking

**Solutions**:

```bash
# Solution 1: Start PostgreSQL
# macOS
brew services start postgresql

# Windows
# Services.msc → PostgreSQL → Start

# Linux
sudo systemctl start postgresql

# Solution 2: Verify connection
psql -h localhost -U admin -d spaktok_db

# Solution 3: Check credentials in .env
cat backend/.env | grep POSTGRES

# Solution 4: Create database if missing
psql -U admin -c "CREATE DATABASE spaktok_db;"
```

---

### Issue: "Connection refused" (MongoDB)

**Problem**:
```
MongoServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017
```

**Root Cause**:
- MongoDB not running
- Wrong connection string

**Solutions**:

```bash
# Solution 1: Start MongoDB
# macOS
brew services start mongodb-community

# Windows
# Services.msc → MongoDB → Start

# Linux
sudo systemctl start mongod

# Solution 2: Check connection
mongo --eval "db.version()"

# Solution 3: Verify connection string in .env
cat backend/.env | grep MONGO_URI

# Solution 4: Create user if needed
mongo admin --eval "db.createUser({user: 'admin', pwd: 'password', roles: ['root']})"
```

---

### Issue: "Database already exists"

**Problem**:
```
FATAL: database "spaktok_db" already exists
```

**Root Cause**:
- Database already created
- Migration ran twice

**Solutions**:

```bash
# Solution 1: Drop and recreate
psql -U admin -c "DROP DATABASE spaktok_db;"
psql -U admin -c "CREATE DATABASE spaktok_db;"

# Solution 2: Run migrations only once
npm run migrate  # Run once

# Solution 3: Check migration status
npm run migrate:status
```

---

## API ISSUES

### Issue: "Agora token generation fails"

**Problem**:
```
Error: Agora token generation failed
```

**Root Cause**:
- Invalid Agora credentials
- Agora service down

**Solutions**:

```bash
# Solution 1: Verify credentials
cat backend/.env | grep AGORA

# Should show:
# AGORA_APP_ID=xxx
# AGORA_APP_CERTIFICATE=xxx

# Solution 2: Test token generation
curl -X POST http://localhost:5000/api/agora/token \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test",
    "channel": "test",
    "role": "publisher"
  }'

# Solution 3: Check Agora status
curl https://api.agora.io/v1/health

# Solution 4: Regenerate credentials in Agora console
# 1. Login to Agora console
# 2. Get new App ID and Certificate
# 3. Update .env file
```

---

### Issue: "401 Unauthorized"

**Problem**:
```json
{
  "success": false,
  "error": "Unauthorized",
  "error_code": "INVALID_TOKEN"
}
```

**Root Cause**:
- No token provided
- Invalid token
- Expired token
- Wrong token format

**Solutions**:

```bash
# Solution 1: Get valid token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password"
  }'

# Solution 2: Include token in headers
curl http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer $TOKEN"

# Solution 3: Check token expiration
# Tokens expire in 24 hours
# Get new one with refresh endpoint

# Solution 4: Verify token format
# Should be: Bearer <jwt_token>
# Not: Bearer Token <jwt_token>
```

---

### Issue: "429 Rate Limited"

**Problem**:
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "error_code": "RATE_LIMIT_EXCEEDED"
}
```

**Root Cause**:
- Too many requests
- Hit API rate limits

**Solutions**:

```bash
# Solution 1: Wait before retrying
# Check reset time header
curl -I http://localhost:5000/api/agora/token | grep X-RateLimit-Reset

# Solution 2: Implement exponential backoff
# Wait: 1s, 2s, 4s, 8s before retrying

# Solution 3: Batch requests
# Instead of 100 individual requests
# Send 1 batch request

# Solution 4: Request rate limit increase
# Contact support with use case
```

---

## FRONTEND ISSUES

### Issue: "Flutter app won't start"

**Problem**:
```
FAILURE: Build failed with an exception
```

**Root Cause**:
- Gradle error
- Dependency issue
- Android SDK issue

**Solutions**:

```bash
# Solution 1: Clean build
flutter clean
flutter pub get
flutter run

# Solution 2: Update Flutter
flutter upgrade

# Solution 3: Check gradle
cd android
./gradlew clean
cd ..

# Solution 4: Accept licenses
flutter doctor --android-licenses

# Solution 5: Check Android SDK
flutter doctor -v
```

---

### Issue: "Agora SDK initialization fails"

**Problem**:
```
Error: Failed to initialize Agora Engine
```

**Root Cause**:
- Permissions not granted
- AppId not set
- Device not supported

**Solutions**:

```dart
// Solution 1: Check permissions
final status = await Permission.camera.request();
if (status.isDenied) {
  // Permission denied
}

// Solution 2: Verify AppId
const agoraAppId = 'YOUR_APP_ID';
if (agoraAppId.isEmpty) {
  throw Exception('Agora App ID not configured');
}

// Solution 3: Check device compatibility
const minHeight = 416;
const minWidth = 234;

// Solution 4: Add to AndroidManifest.xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
```

---

### Issue: "Hot reload not working"

**Problem**:
```
Changes were not picked up
```

**Root Cause**:
- File not saved
- Hot reload not enabled
- Native code changed

**Solutions**:

```bash
# Solution 1: Ensure file is saved
# In VS Code: Ctrl+S

# Solution 2: Hot reload manually
# Press 'r' in terminal

# Solution 3: Full restart
# Press 'R' in terminal

# Solution 4: Rebuild if native code changed
flutter clean
flutter run
```

---

## PERFORMANCE ISSUES

### Issue: "App crashes with OutOfMemory"

**Problem**:
```
java.lang.OutOfMemoryError: Java heap space
```

**Root Cause**:
- Memory leak
- Large video processing
- Too many cached items

**Solutions**:

```dart
// Solution 1: Clear cache
Future<void> clearCache() async {
  final cache = await getApplicationDocumentsDirectory();
  cache.delete(recursive: true);
}

// Solution 2: Optimize video processing
// Use lower resolution
// Process in chunks
// Clean up temporary files

// Solution 3: Implement garbage collection
// Dispose resources properly
@override
void dispose() {
  _controller.dispose();
  super.dispose();
}

// Solution 4: Monitor memory
if (kDebugMode) {
  debugPrintBeginFrame('Memory start');
  // Your code
  debugPrintEndFrame('Memory end');
}
```

---

### Issue: "Slow API responses"

**Problem**:
```
Response time: >2000ms (target: <100ms)
```

**Root Cause**:
- Unoptimized queries
- No caching
- Network issues

**Solutions**:

```javascript
// Solution 1: Add caching
const cached = await redis.get(key);
if (cached) return JSON.parse(cached);

// Solution 2: Optimize database queries
// Add indexes
CREATE INDEX idx_videos_created_at ON videos(created_at DESC);

// Solution 3: Use pagination
GET /api/videos?page=1&limit=20

// Solution 4: Enable compression
app.use(compression());

// Solution 5: Monitor performance
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`${req.path} took ${Date.now() - start}ms`);
  });
  next();
});
```

---

## SECURITY ISSUES

### Issue: "Credentials exposed in code"

**Problem**:
```
Found hardcoded API key in source code
```

**Root Cause**:
- Credentials committed to git
- .env file not in .gitignore
- Secrets exposed in logs

**Solutions**:

```bash
# Solution 1: Move to .env
# In .env:
AGORA_APP_ID=xxx
API_KEY=yyy

# In code:
const appId = process.env.AGORA_APP_ID;

# Solution 2: Add .env to .gitignore
echo ".env" >> .gitignore

# Solution 3: Remove exposed secrets from git
git rm --cached .env
git commit -m "Remove .env file"

# Solution 4: Rotate credentials
# Get new keys from service provider
```

---

### Issue: "CORS error"

**Problem**:
```
Access to XMLHttpRequest blocked by CORS policy
```

**Root Cause**:
- CORS not configured
- Wrong origin
- Missing headers

**Solutions**:

```javascript
// Solution 1: Enable CORS
const cors = require('cors');
app.use(cors());

// Solution 2: Configure CORS for specific domain
app.use(cors({
  origin: 'https://spaktok.web.app',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

// Solution 3: Add headers manually
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  next();
});
```

---

## PRODUCTION ISSUES

### Issue: "Service down"

**Problem**:
```
503 Service Unavailable
```

**Root Cause**:
- Deployment failed
- Out of memory
- Database connection lost

**Solutions**:

```bash
# Solution 1: Check service status
kubectl get pods
docker-compose ps

# Solution 2: Check logs
kubectl logs -f deployment/spaktok-backend
docker-compose logs backend

# Solution 3: Restart service
kubectl restart deployment/spaktok-backend
docker-compose restart

# Solution 4: Scale up
kubectl scale deployment spaktok-backend --replicas=3

# Solution 5: Rollback
kubectl rollout undo deployment/spaktok-backend
```

---

### Issue: "Database connection pool exhausted"

**Problem**:
```
Error: FATAL: remaining connection slots are reserved
```

**Root Cause**:
- Too many connections
- Connections not closed
- Leak in connection pool

**Solutions**:

```sql
-- Solution 1: Check active connections
SELECT datname, count(*) FROM pg_stat_activity 
GROUP BY datname;

-- Solution 2: Kill long-running connections
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE datname = 'spaktok_db' 
AND pid <> pg_backend_pid();

-- Solution 3: Increase pool size
-- In backend connection config:
max: 20,
min: 5,
idleTimeoutMillis: 30000
```

---

### Issue: "High CPU/Memory usage"

**Problem**:
```
CPU: 95% | Memory: 90%
```

**Root Cause**:
- Infinite loop
- Memory leak
- Heavy processing

**Solutions**:

```javascript
// Solution 1: Profile CPU usage
// Use Node.js profiler
node --prof server.js
node --prof-process isolate-*.log > profile.txt

// Solution 2: Fix infinite loops
// Check for missing break statements

// Solution 3: Monitor memory
const usage = process.memoryUsage();
console.log(`Memory: ${Math.round(usage.heapUsed / 1024 / 1024)}MB`);

// Solution 4: Implement caching
// Avoid recalculating same data

// Solution 5: Use stream for large files
fs.createReadStream('large-file.txt')
  .pipe(response);
```

---

## 🆘 EMERGENCY PROCEDURES

### If all else fails:

```bash
# 1. Stop everything
docker-compose down -v
killall node

# 2. Clean and reinstall
rm -rf node_modules package-lock.json
rm -rf ~/.pub-cache
npm install
flutter pub get

# 3. Reset database
dropdb spaktok_db
createdb spaktok_db
npm run migrate

# 4. Start fresh
npm run dev
flutter run

# 5. If still broken: Contact support with:
# - Error logs
# - Steps to reproduce
# - System info (OS, versions)
# - Screenshot of error
```

---

## 📞 SUPPORT RESOURCES

| Issue Type | Resource |
|-----------|----------|
| API | API_REFERENCE.md |
| Database | DATABASE_SCHEMA.md |
| Config | CONFIGURATION_GUIDE.md |
| Deployment | CONSOLIDATED_MASTER_GUIDE.md |
| Code | COMPREHENSIVE_ANALYSIS_AND_DEVELOPMENT_PLAN.md |

---

## 📝 CREATING BUG REPORTS

When reporting a bug, include:

```
**Description**: What happened?

**Expected Behavior**: What should happen?

**Steps to Reproduce**:
1. Step 1
2. Step 2
3. Step 3

**Error Logs**:
[Paste error message/logs here]

**Environment**:
- OS: macOS/Windows/Linux
- Flutter version: [result of flutter --version]
- Node version: [result of node --version]
- Docker version: [result of docker --version]

**Screenshots/Videos**: [Attach if applicable]
```

---

**Last Updated**: 2025-10-28  
**Status**: ✅ Complete  
**Questions**: Open issue in GitHub
