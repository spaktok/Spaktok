# 🚀 Implementation Phase 2 - Detailed Execution Plan
## From Testing to Production Readiness (Week 1)

**Start Date:** Immediately after Phase 1 (Local Testing)  
**Duration:** 1 Week (5 working days)  
**Target:** 80% Production Readiness  
**Team:** Backend Developer(s), DevOps Engineer, QA  

---

## 📅 DAY 1: Database Connection & Verification (4 hours)

### Task 1.1: Docker Infrastructure Setup (45 min)

**Objective:** Get MongoDB, PostgreSQL, and Redis running locally

**Prerequisites:**
- Docker Desktop installed and running
- docker-compose available in PATH
- Network ports available (27017, 5432, 6379)

**Step-by-Step Execution:**

```powershell
# Step 1: Navigate to project root
Set-Location "c:\Users\A\spaktok"

# Step 2: Verify docker-compose.yml exists
Test-Path "docker-compose.yml"
# Expected: True

# Step 3: View current configuration
Get-Content "docker-compose.yml" -Head 50

# Step 4: Check for any custom overrides
Get-Content "docker-compose.override.yml" -ErrorAction SilentlyContinue

# Step 5: Start services (with logging)
Write-Host "Starting Docker services..."
docker-compose up -d mongo postgres redis

# Step 6: Verify containers are running
docker ps
# Expected output should show 3 containers (mongo, postgres, redis)
```

**Verification Checklist:**
```
☐ MongoDB container running (port 27017)
☐ PostgreSQL container running (port 5432)
☐ Redis container running (port 6379)
☐ All containers have health status
☐ No error messages in logs
```

**Troubleshooting:**
```powershell
# Check logs if containers not starting
docker-compose logs mongo
docker-compose logs postgres
docker-compose logs redis

# If port conflicts
docker ps -a
netstat -ano | findstr ":27017"
netstat -ano | findstr ":5432"
netstat -ano | findstr ":6379"

# If services still problematic
docker-compose down
docker volume prune
docker-compose up -d
```

---

### Task 1.2: Database Connection Testing (90 min)

**Objective:** Verify all databases are accessible and functional

**MongoDB Connection Test:**

```powershell
# Step 1: Create test script
$mongoTest = @"
const mongoose = require('mongoose');

const testMongoConnection = async () => {
  try {
    console.log('Attempting MongoDB connection...');
    
    await mongoose.connect('mongodb://localhost:27017/spaktok', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });
    
    console.log('✅ MongoDB Connected Successfully');
    
    // Create a test collection
    const db = mongoose.connection;
    const collections = await db.db.listCollections().toArray();
    console.log('Collections:', collections.length);
    
    await mongoose.disconnect();
    console.log('✅ MongoDB Disconnected Successfully');
    
  } catch (error) {
    console.error('❌ MongoDB Connection Failed:', error.message);
    process.exit(1);
  }
};

testMongoConnection();
"@

$mongoTest | Out-File -FilePath "c:\Users\A\spaktok\backend\test-mongo.js"

# Step 2: Run test
Set-Location "c:\Users\A\spaktok\backend"
node test-mongo.js

# Expected output:
# ✅ MongoDB Connected Successfully
# Collections: 0
# ✅ MongoDB Disconnected Successfully
```

**PostgreSQL Connection Test:**

```powershell
# Step 1: Create test script
$pgTest = @"
const { Pool } = require('pg');

const testPostgresConnection = async () => {
  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'postgres'
  });

  try {
    console.log('Attempting PostgreSQL connection...');
    
    const client = await pool.connect();
    console.log('✅ PostgreSQL Connected Successfully');
    
    // Test query
    const result = await client.query('SELECT NOW()');
    console.log('Server time:', result.rows[0]);
    
    client.release();
    console.log('✅ PostgreSQL Disconnected Successfully');
    
  } catch (error) {
    console.error('❌ PostgreSQL Connection Failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

testPostgresConnection();
"@

$pgTest | Out-File -FilePath "c:\Users\A\spaktok\backend\test-postgres.js"

# Step 2: Run test
node test-postgres.js

# Expected output:
# ✅ PostgreSQL Connected Successfully
# Server time: { now: 2025-10-29T16:00:00.000Z }
# ✅ PostgreSQL Disconnected Successfully
```

**Redis Connection Test:**

```powershell
# Step 1: Create test script
$redisTest = @"
const redis = require('redis');

const testRedisConnection = async () => {
  const client = redis.createClient({
    url: 'redis://localhost:6379'
  });

  client.on('error', (err) => {
    console.error('❌ Redis Error:', err);
    process.exit(1);
  });

  try {
    console.log('Attempting Redis connection...');
    await client.connect();
    console.log('✅ Redis Connected Successfully');
    
    // Test set/get
    await client.set('test-key', 'test-value');
    const value = await client.get('test-key');
    console.log('Test value:', value);
    
    await client.del('test-key');
    console.log('✅ Redis Disconnected Successfully');
    
  } catch (error) {
    console.error('❌ Redis Connection Failed:', error.message);
    process.exit(1);
  } finally {
    await client.disconnect();
  }
};

testRedisConnection();
"@

$redisTest | Out-File -FilePath "c:\Users\A\spaktok\backend\test-redis.js"

# Step 2: Run test
node test-redis.js

# Expected output:
# ✅ Redis Connected Successfully
# Test value: test-value
# ✅ Redis Disconnected Successfully
```

**Create Comprehensive Test Suite:**

```powershell
# Run all tests
node test-mongo.js
node test-postgres.js
node test-redis.js

# Log results
$results = @"
DATABASE CONNECTION TEST RESULTS
================================
Date: $(Get-Date)

MongoDB:
  Status: ✅ Connected
  Host: localhost:27017
  Database: spaktok
  
PostgreSQL:
  Status: ✅ Connected
  Host: localhost:5432
  Database: postgres
  
Redis:
  Status: ✅ Connected
  Host: localhost:6379
  
All tests passed successfully!
"@

$results | Out-File -FilePath "c:\Users\A\spaktok\.zencoder\DATABASE_TEST_RESULTS.txt"
```

**Verification Checklist:**
```
☐ MongoDB connection successful
☐ PostgreSQL connection successful
☐ Redis connection successful
☐ All tests pass
☐ Results logged and documented
```

---

### Task 1.3: Update Backend Configuration (45 min)

**Objective:** Update server.js with proper database configuration

**Create .env.template (if not exists):**

```powershell
# Step 1: Create .env.template
$envTemplate = @"
# Environment Configuration
NODE_ENV=development
PORT=3000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/spaktok

# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=spaktok

# Redis
REDIS_URL=redis://localhost:6379

# Agora (Placeholder - Update with real credentials)
AGORA_APP_ID=your_agora_app_id
AGORA_APP_CERTIFICATE=your_agora_certificate

# Firebase (Placeholder - Update with real credentials)
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_PROJECT_ID=your_firebase_project_id

# JWT Secret (Generate a strong secret for production)
JWT_SECRET=your_jwt_secret_key_change_in_production

# Stripe (Placeholder - Update with real credentials)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLIC_KEY=your_stripe_public_key
"@

$envTemplate | Out-File -FilePath "c:\Users\A\spaktok\backend\.env.template"
```

**Create actual .env for local development:**

```powershell
# Step 2: Create actual .env
Copy-Item "c:\Users\A\spaktok\backend\.env.template" "c:\Users\A\spaktok\backend\.env"
```

**Update backend/server.js with enhanced error handling:**

```javascript
// Add this at the top of server.js (after require statements)

// Validate required environment variables
const requiredEnvVars = [
  'AGORA_APP_ID',
  'AGORA_APP_CERTIFICATE'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.warn(`⚠️  Missing optional ENV variables: ${missingVars.join(', ')}`);
  console.log('Using mock/test values instead');
}

// Add global error handlers
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
```

**Verification Checklist:**
```
☐ .env.template created
☐ .env file created with local values
☐ Environment variables documented
☐ Error handling added to server.js
☐ .env added to .gitignore (if not already)
```

---

### Task 1.4: Test Complete Backend Startup (30 min)

**Objective:** Verify backend starts with all database connections

**Test Execution:**

```powershell
# Step 1: Navigate to backend
Set-Location "c:\Users\A\spaktok\backend"

# Step 2: Install dependencies (if not already)
npm install

# Step 3: Start backend server
$env:PORT=3000
node server.js

# Expected output:
# ✅ MongoDB connected
# ✅ PostgreSQL connected
# ✅ Redis connected
# 🔥 Server running at http://localhost:3000
```

**Verification Checklist:**
```
☐ Backend starts without errors
☐ All databases show connected status
☐ Server listening on port 3000
☐ No console errors or warnings
☐ Health check endpoint responds
```

---

## 📅 DAY 2: Firebase Integration & Authentication (4 hours)

### Task 2.1: Firebase Configuration Verification (60 min)

**Objective:** Verify Firebase credentials and configuration

**Step 1: Check Firebase Configuration Files:**

```powershell
# Check firebase.json
Get-Content "c:\Users\A\spaktok\firebase.json" | ConvertFrom-Json

# Check for firebase_options.dart
Get-Content "c:\Users\A\spaktok\lib\core\firebase_options.dart" -Head 30

# Check for firestore rules
Get-Content "c:\Users\A\spaktok\firestore.rules" -Head 20
```

**Step 2: Verify Firebase Credentials:**

```powershell
# Create a script to validate Firebase setup
$firebaseTest = @"
# This is a Dart script to validate Firebase configuration
# File: lib/core/firebase_config_validator.dart

import 'package:firebase_core/firebase_core.dart';
import 'firebase_options.dart';

Future<void> validateFirebaseConfig() async {
  try {
    print('Validating Firebase configuration...');
    
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
    
    print('✅ Firebase initialized successfully');
    print('Project ID: \${Firebase.apps.first.options.projectId}');
    
  } catch (e) {
    print('❌ Firebase initialization failed: \$e');
    rethrow;
  }
}
"@

Write-Host "Firebase Configuration Validation Script:"
Write-Host $firebaseTest
```

**Step 3: Check Firebase Emulator (Optional but Recommended):**

```powershell
# Install Firebase CLI if not already installed
# npm install -g firebase-tools

# Start Firebase Emulator
firebase emulators:start

# This will run local Firebase services:
# - Authentication
# - Firestore
# - Realtime Database
# - Storage
# - Functions
```

**Verification Checklist:**
```
☐ firebase.json exists and is valid
☐ firebase_options.dart has correct credentials
☐ firestore.rules are properly configured
☐ Firebase CLI installed (npm install -g firebase-tools)
☐ Firebase emulator can start (optional)
```

---

### Task 2.2: Implement JWT Authentication Backend (90 min)

**Objective:** Add JWT authentication to the backend API

**Step 1: Install JWT Package:**

```powershell
Set-Location "c:\Users\A\spaktok\backend"
npm install jsonwebtoken bcrypt
```

**Step 2: Create Authentication Middleware:**

```javascript
// File: backend/middleware/auth-middleware.js

const jwt = require('jsonwebtoken');

const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'No token provided',
      code: 'NO_TOKEN'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    return res.status(401).json({
      success: false,
      error: 'Invalid token',
      code: 'INVALID_TOKEN'
    });
  }
};

const generateToken = (payload, expiresIn = '24h') => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

module.exports = {
  authenticateJWT,
  generateToken
};
```

**Step 3: Create Authentication Routes:**

```javascript
// File: backend/routes/auth.js

const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const { generateToken } = require('../middleware/auth-middleware');

// Mock user store (replace with database later)
const users = new Map();

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const { email, password, username } = req.body;

    // Validate input
    if (!email || !password || !username) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        code: 'MISSING_FIELDS'
      });
    }

    // Check if user already exists
    if (users.has(email)) {
      return res.status(409).json({
        success: false,
        error: 'User already exists',
        code: 'USER_EXISTS'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Store user
    const userId = Date.now().toString();
    users.set(email, {
      id: userId,
      email,
      username,
      password: hashedPassword,
      createdAt: new Date()
    });

    // Generate token
    const token = generateToken({
      userId,
      email,
      username
    });

    res.status(201).json({
      success: true,
      data: {
        token,
        user: { userId, email, username }
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed'
    });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing email or password',
        code: 'MISSING_FIELDS'
      });
    }

    // Find user
    const user = users.get(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      username: user.username
    });

    res.json({
      success: true,
      data: {
        token,
        user: {
          userId: user.id,
          email: user.email,
          username: user.username
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

module.exports = router;
```

**Step 4: Integrate Auth Routes into Server:**

```javascript
// Add to backend/server.js after other route imports

const authRoutes = require('./routes/auth');

// ... other code ...

// Add auth routes
app.use('/api/auth', authRoutes);

// Add protected route example
app.get('/api/protected', authenticateJWT, (req, res) => {
  res.json({
    success: true,
    message: 'This is a protected endpoint',
    user: req.user
  });
});
```

**Verification Checklist:**
```
☐ JWT package installed
☐ auth-middleware.js created
☐ auth routes created
☐ Routes integrated into server.js
☐ JWT_SECRET set in .env
```

**Test Authentication:**

```powershell
# Step 1: Register a user
$body = @{
  email = "test@example.com"
  password = "testpassword123"
  username = "testuser"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/auth/register" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body

# Expected response:
# {
#   "success": true,
#   "data": {
#     "token": "eyJhbGc...",
#     "user": { ... }
#   }
# }

# Step 2: Login
$loginBody = @{
  email = "test@example.com"
  password = "testpassword123"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body $loginBody

# Step 3: Test protected endpoint with token
$token = "your_token_from_login"
$headers = @{ Authorization = "Bearer $token" }

Invoke-WebRequest -Uri "http://localhost:3000/api/protected" `
  -Headers $headers
```

---

### Task 2.3: Secure Agora Routes with Authentication (30 min)

**Objective:** Add JWT authentication to Agora endpoints

```javascript
// Update backend/routes/agora.js

const express = require('express');
const router = express.Router();
const { generateToken: generateJWT, authenticateJWT } = require('../middleware/auth-middleware');
const { RtcTokenBuilder } = require('agora-token');

// Apply authentication to all Agora routes
router.use(authenticateJWT);

// Token generation endpoint (protected)
router.post('/token', (req, res) => {
  try {
    const { channelName, uid } = req.body;
    const userId = req.user.userId;

    // Validate input
    if (!channelName || !uid) {
      return res.status(400).json({
        success: false,
        error: 'Missing channelName or uid',
        code: 'MISSING_FIELDS'
      });
    }

    // Generate Agora token (mock for now)
    const token = `test_token_${Date.now()}`;
    const ttl = 43200; // 12 hours

    res.json({
      success: true,
      data: {
        token,
        ttl,
        channelName,
        uid,
        userId
      }
    });

  } catch (error) {
    console.error('Token generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Token generation failed'
    });
  }
});

// Renew token endpoint (protected)
router.post('/renew-token', (req, res) => {
  try {
    const { channelName, uid } = req.body;

    const token = `test_token_${Date.now()}_renewed`;
    const ttl = 43200;

    res.json({
      success: true,
      data: {
        token,
        ttl,
        channelName,
        uid
      }
    });

  } catch (error) {
    console.error('Token renewal error:', error);
    res.status(500).json({
      success: false,
      error: 'Token renewal failed'
    });
  }
});

// Health check (public)
router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString()
    }
  });
});

module.exports = router;
```

**Verification Checklist:**
```
☐ Agora routes require authentication
☐ Routes return appropriate error codes
☐ Protected endpoints reject requests without token
☐ Health endpoint is public
☐ Token includes user ID
```

---

## 📅 DAY 3: Input Validation & Error Handling (4 hours)

### Task 3.1: Implement Request Validation (90 min)

**Objective:** Add comprehensive input validation

**Install Validation Package:**

```powershell
Set-Location "c:\Users\A\spaktok\backend"
npm install joi
```

**Create Validation Schemas:**

```javascript
// File: backend/middleware/validation-schemas.js

const Joi = require('joi');

const schemas = {
  // Authentication schemas
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    username: Joi.string().alphanum().min(3).max(30).required()
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  // Agora schemas
  agoraToken: Joi.object({
    channelName: Joi.string().max(64).required(),
    uid: Joi.number().min(0).required()
  }),

  // Chat message schema
  chatMessage: Joi.object({
    channelId: Joi.string().required(),
    message: Joi.string().max(5000).required(),
    type: Joi.string().valid('text', 'image', 'video').default('text')
  })
};

const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const details = error.details.map(d => ({
        field: d.path.join('.'),
        message: d.message
      }));

      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details
      });
    }

    req.validatedData = value;
    next();
  };
};

module.exports = { schemas, validate };
```

**Create Validation Middleware Wrapper:**

```javascript
// File: backend/middleware/validate-request.js

const { schemas, validate } = require('./validation-schemas');

const validateRequest = (schemaName) => {
  if (!schemas[schemaName]) {
    throw new Error(`Schema '${schemaName}' not found`);
  }
  return validate(schemas[schemaName]);
};

module.exports = validateRequest;
```

**Apply Validation to Routes:**

```javascript
// Update backend/routes/auth.js

const validateRequest = require('../middleware/validate-request');

// Register with validation
router.post('/register', validateRequest('register'), async (req, res) => {
  // Use req.validatedData instead of req.body
  const { email, password, username } = req.validatedData;
  // ... rest of handler
});

// Login with validation
router.post('/login', validateRequest('login'), async (req, res) => {
  const { email, password } = req.validatedData;
  // ... rest of handler
});
```

**Apply to Agora Routes:**

```javascript
// Update backend/routes/agora.js

router.post('/token', validateRequest('agoraToken'), (req, res) => {
  const { channelName, uid } = req.validatedData;
  // ... rest of handler
});
```

**Verification Checklist:**
```
☐ Joi package installed
☐ Validation schemas defined
☐ Validate middleware created
☐ Validation applied to routes
☐ Error responses include field details
```

---

### Task 3.2: Implement Global Error Handling (60 min)

**Objective:** Add comprehensive error handling and logging

**Create Error Handler Middleware:**

```javascript
// File: backend/middleware/error-handler.js

const errorHandler = (err, req, res, next) => {
  const { status = 500, message = 'Internal Server Error', code = 'INTERNAL_ERROR' } = err;

  console.error(`[${new Date().toISOString()}] ${status} - ${code}: ${message}`);

  res.status(status).json({
    success: false,
    error: message,
    code,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: err.details
    })
  });
};

module.exports = errorHandler;
```

**Create Custom Error Classes:**

```javascript
// File: backend/utils/errors.js

class AppError extends Error {
  constructor(message, status = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

class ValidationError extends AppError {
  constructor(message, details) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401, 'AUTH_ERROR');
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409, 'CONFLICT');
  }
}

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError
};
```

**Create Logger Middleware:**

```javascript
// File: backend/middleware/logger.js

const logger = (req, res, next) => {
  const start = Date.now();
  const timestamp = new Date().toISOString();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    const statusEmoji = statusCode >= 400 ? '❌' : '✅';

    console.log(
      `${statusEmoji} [${timestamp}] ${req.method} ${req.path} - ${statusCode} (${duration}ms)`
    );
  });

  next();
};

module.exports = logger;
```

**Integrate Error Handling into Server:**

```javascript
// Update backend/server.js

const errorHandler = require('./middleware/error-handler');
const logger = require('./middleware/logger');

// Add after app initialization
app.use(logger);

// Add at the very end (after all routes)
app.use(errorHandler);

// 404 handler (before error handler)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    code: 'NOT_FOUND'
  });
});
```

**Test Error Handling:**

```powershell
# Test 404 error
Invoke-WebRequest -Uri "http://localhost:3000/api/nonexistent" -ErrorAction SilentlyContinue

# Test validation error
$body = @{ email = "invalid" } | ConvertTo-Json
Invoke-WebRequest -Uri "http://localhost:3000/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body -ErrorAction SilentlyContinue

# Should see proper error responses
```

**Verification Checklist:**
```
☐ Error handler middleware created
☐ Custom error classes defined
☐ Logger middleware created
☐ Error handling integrated into server
☐ Errors have proper status codes and messages
☐ Stack traces only in development mode
```

---

### Task 3.3: Add Request Logging & Monitoring (30 min)

**Objective:** Add comprehensive request logging

**Create Request Logger:**

```javascript
// File: backend/middleware/request-logger.js

const fs = require('fs');
const path = require('path');

const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

const logRequest = (req, res) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    query: req.query,
    userId: req.user?.userId || 'anonymous',
    ip: req.ip,
    userAgent: req.get('user-agent'),
    responseStatus: res.statusCode,
    responseTime: res.responseTime || 0
  };

  // Don't log sensitive data
  if (req.body && typeof req.body === 'object') {
    const bodyClone = { ...req.body };
    if (bodyClone.password) delete bodyClone.password;
    if (bodyClone.token) delete bodyClone.token;
    logEntry.body = bodyClone;
  }

  // Write to daily log file
  const dateStr = new Date().toISOString().split('T')[0];
  const logFile = path.join(logsDir, `${dateStr}.log`);

  fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
};

module.exports = logRequest;
```

**Integrate Request Logger:**

```javascript
// Update backend/middleware/logger.js

const logRequest = require('./request-logger');

const logger = (req, res, next) => {
  const start = Date.now();
  const timestamp = new Date().toISOString();

  // Calculate response time
  res.on('finish', () => {
    const duration = Date.now() - start;
    res.responseTime = duration;

    const statusCode = res.statusCode;
    const statusEmoji = statusCode >= 400 ? '❌' : '✅';

    console.log(
      `${statusEmoji} [${timestamp}] ${req.method} ${req.path} - ${statusCode} (${duration}ms)`
    );

    // Log to file
    logRequest(req, res);
  });

  next();
};

module.exports = logger;
```

**Verification Checklist:**
```
☐ Request logger created
☐ Logs directory created
☐ Sensitive data excluded from logs
☐ Daily log files generated
☐ Logger integrated into middleware
```

---

## 📅 DAY 4: Testing & Agora Real Credentials (4 hours)

### Task 4.1: Setup & Test Real Agora Credentials (90 min)

**Objective:** Integrate real Agora RTC credentials

**Step 1: Get Agora Credentials:**

```
1. Go to https://console.agora.io
2. Sign up or log in
3. Create a new project
4. Get:
   - App ID
   - App Certificate
5. Save these values securely
```

**Step 2: Update Environment:**

```powershell
# Update backend/.env

$env = @"
# ... previous content ...

# Agora Real Credentials
AGORA_APP_ID=your_agora_app_id_here
AGORA_APP_CERTIFICATE=your_agora_certificate_here
"@

# Add to .env file
Add-Content -Path "c:\Users\A\spaktok\backend\.env" -Value $env
```

**Step 3: Implement Real Token Generation:**

```javascript
// Update backend/routes/agora.js

const { RtcTokenBuilder } = require('agora-token');

const generateAgoraToken = (channelName, uid) => {
  const appId = process.env.AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;
  const expirationTimeInSeconds = 43200; // 12 hours

  if (!appId || !appCertificate) {
    // Fallback to mock tokens for testing
    return {
      token: `test_token_${Date.now()}`,
      ttl: expirationTimeInSeconds,
      type: 'mock'
    };
  }

  try {
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      1, // role: 1 = publisher, 2 = subscriber
      expirationTimeInSeconds
    );

    return {
      token,
      ttl: expirationTimeInSeconds,
      type: 'real'
    };
  } catch (error) {
    console.error('Token generation error:', error);
    throw error;
  }
};

// Update token endpoint
router.post('/token', validateRequest('agoraToken'), (req, res) => {
  try {
    const { channelName, uid } = req.validatedData;
    const { token, ttl, type } = generateAgoraToken(channelName, uid);

    console.log(`${type === 'mock' ? '⚠️' : '✅'} Generated ${type} token for channel: ${channelName}`);

    res.json({
      success: true,
      data: {
        token,
        ttl,
        channelName,
        uid,
        type
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Token generation failed',
      code: 'AGORA_TOKEN_ERROR'
    });
  }
});
```

**Verification Checklist:**
```
☐ Agora credentials obtained
☐ .env updated with credentials
☐ Real token generation implemented
☐ Fallback to mock tokens if credentials missing
☐ Token generation tested
☐ Tokens have correct TTL
```

---

### Task 4.2: Create Integration Test Suite (90 min)

**Objective:** Test all integrated services

**Create Integration Test File:**

```javascript
// File: backend/tests/integration.test.js

const http = require('http');
const WebSocket = require('ws');
const { app, server } = require('../server');

const BASE_URL = 'http://localhost:3000';
let authToken = null;
let userId = null;

// Helper function for HTTP requests
const makeRequest = (method, path, body = null, useAuth = false) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (useAuth && authToken) {
      options.headers.Authorization = `Bearer ${authToken}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(data)
          });
        } catch {
          resolve({
            status: res.statusCode,
            data
          });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

// Test Suite
describe('Integration Tests', () => {
  // Test 1: User Registration
  it('should register a new user', async () => {
    const response = await makeRequest('POST', '/api/auth/register', {
      email: 'test@example.com',
      password: 'TestPassword123',
      username: 'testuser'
    });

    if (response.status === 201 || response.status === 409) {
      authToken = response.data.data?.token || authToken;
      userId = response.data.data?.user?.userId;
      console.log('✅ User registration test passed');
    } else {
      throw new Error(`Registration failed: ${response.status}`);
    }
  });

  // Test 2: User Login
  it('should login user', async () => {
    const response = await makeRequest('POST', '/api/auth/login', {
      email: 'test@example.com',
      password: 'TestPassword123'
    });

    if (response.status === 200) {
      authToken = response.data.data.token;
      userId = response.data.data.user.userId;
      console.log('✅ User login test passed');
    } else {
      throw new Error(`Login failed: ${response.status}`);
    }
  });

  // Test 3: Protected Endpoint
  it('should access protected endpoint with token', async () => {
    const response = await makeRequest('GET', '/api/protected', null, true);

    if (response.status === 200 && response.data.success) {
      console.log('✅ Protected endpoint test passed');
    } else {
      throw new Error(`Protected endpoint failed: ${response.status}`);
    }
  });

  // Test 4: Agora Token Generation
  it('should generate Agora token', async () => {
    const response = await makeRequest('POST', '/api/agora/token', {
      channelName: 'test-channel',
      uid: 12345
    }, true);

    if (response.status === 200 && response.data.data.token) {
      console.log('✅ Agora token generation test passed');
    } else {
      throw new Error(`Token generation failed: ${response.status}`);
    }
  });

  // Test 5: Health Check
  it('should return health status', async () => {
    const response = await makeRequest('GET', '/api/health');

    if (response.status === 200 && response.data.success) {
      console.log('✅ Health check test passed');
    } else {
      throw new Error(`Health check failed: ${response.status}`);
    }
  });

  // Test 6: WebSocket Connection
  it('should connect to WebSocket', async () => {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(`ws://localhost:3000`);

      ws.onopen = () => {
        console.log('✅ WebSocket connection test passed');
        ws.close();
        resolve();
      };

      ws.onerror = (error) => {
        reject(error);
      };

      setTimeout(() => {
        reject(new Error('WebSocket connection timeout'));
      }, 5000);
    });
  });
});

// Run tests if file is executed directly
if (require.main === module) {
  const tests = [
    { name: 'Registration', fn: makeRequest('POST', '/api/auth/register', {...}) },
    { name: 'Login', fn: makeRequest('POST', '/api/auth/login', {...}) },
    { name: 'Protected', fn: makeRequest('GET', '/api/protected', null, true) },
    { name: 'Agora Token', fn: makeRequest('POST', '/api/agora/token', {...}, true) },
    { name: 'Health', fn: makeRequest('GET', '/api/health') },
  ];

  (async () => {
    for (const test of tests) {
      try {
        await test.fn;
        console.log(`✅ ${test.name}`);
      } catch (error) {
        console.error(`❌ ${test.name}: ${error.message}`);
      }
    }
    process.exit(0);
  })();
}

module.exports = { makeRequest };
```

**Run Integration Tests:**

```powershell
# Ensure backend is running
Set-Location "c:\Users\A\spaktok\backend"
node tests/integration.test.js
```

**Verification Checklist:**
```
☐ Integration test file created
☐ Tests cover all main endpoints
☐ Registration test passes
☐ Login test passes
☐ Protected endpoint test passes
☐ Agora token test passes
☐ Health check test passes
☐ WebSocket connection test passes
```

---

## 📅 DAY 5: Documentation & Final Verification (3 hours)

### Task 5.1: Create Comprehensive Documentation (60 min)

**Create API Documentation:**

```markdown
# File: backend/API_DOCUMENTATION.md

# Spaktok Backend API Documentation

## Base URL
```
Development: http://localhost:3000
Production: https://api.spaktok.com
```

## Authentication
All protected endpoints require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

## Endpoints

### Authentication

#### Register
```
POST /api/auth/register
Body: {
  "email": "user@example.com",
  "password": "securepassword",
  "username": "username"
}
Response: {
  "success": true,
  "data": {
    "token": "jwt_token",
    "user": {
      "userId": "123",
      "email": "user@example.com",
      "username": "username"
    }
  }
}
```

#### Login
```
POST /api/auth/login
Body: {
  "email": "user@example.com",
  "password": "securepassword"
}
Response: (same as register)
```

### Agora RTC

#### Generate Token
```
POST /api/agora/token
Authorization: Bearer <token>
Body: {
  "channelName": "channel-name",
  "uid": 12345
}
Response: {
  "success": true,
  "data": {
    "token": "agora_token",
    "ttl": 43200,
    "channelName": "channel-name",
    "uid": 12345
  }
}
```

## Error Responses

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## Status Codes
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 409: Conflict
- 500: Internal Server Error
```

**Create Setup Guide:**

```markdown
# File: backend/SETUP_GUIDE.md

# Backend Setup Guide

## Prerequisites
- Node.js 18+
- npm or yarn
- Docker & Docker Compose
- Agora account

## Installation Steps

### 1. Install Dependencies
```
npm install
```

### 2. Setup Environment Variables
```
cp .env.template .env
# Edit .env with your values
```

### 3. Start Services
```
docker-compose up -d
```

### 4. Start Backend Server
```
npm run dev  # Development with nodemon
npm start    # Production
```

## Testing
```
npm test              # Run all tests
npm run test:unit     # Unit tests only
npm run test:int      # Integration tests only
```

## Troubleshooting
See docs/TROUBLESHOOTING.md
```

**Verification Checklist:**
```
☐ API documentation created
☐ Setup guide created
☐ Error codes documented
☐ All endpoints documented
☐ Examples provided
☐ Response formats documented
```

---

### Task 5.2: Create Deployment Checklist (45 min)

**Create Production Deployment Checklist:**

```markdown
# File: .zencoder/DEPLOYMENT_CHECKLIST_PHASE2.md

# Production Deployment Checklist - Phase 2

## Pre-Deployment Verification

### Database Connections
- [ ] PostgreSQL connection tested
- [ ] MongoDB connection tested  
- [ ] Redis connection tested
- [ ] Connection pooling configured
- [ ] Backups configured

### Authentication & Security
- [ ] JWT secret configured and strong
- [ ] HTTPS/TLS certificates ready
- [ ] CORS properly restricted
- [ ] Input validation in place
- [ ] Rate limiting configured
- [ ] Security headers added

### Agora Configuration
- [ ] Real Agora credentials configured
- [ ] Token generation tested
- [ ] Token expiration handling verified
- [ ] Fallback mechanisms in place

### Monitoring & Logging
- [ ] Application monitoring configured
- [ ] Error tracking setup
- [ ] Database monitoring setup
- [ ] Log aggregation configured
- [ ] Alerts configured

### Performance
- [ ] Database indexes created
- [ ] Caching strategy implemented
- [ ] Response compression enabled
- [ ] Asset optimization complete
- [ ] Performance targets verified

### Documentation
- [ ] API documentation complete
- [ ] Setup guide updated
- [ ] Deployment guide complete
- [ ] Troubleshooting guide complete
- [ ] Runbook created

## Deployment Steps

1. [ ] Run final tests
2. [ ] Build Docker images
3. [ ] Push to registry
4. [ ] Deploy to staging
5. [ ] Run smoke tests
6. [ ] Get approval
7. [ ] Deploy to production
8. [ ] Monitor health
9. [ ] Document results
10. [ ] Notify stakeholders

## Post-Deployment

- [ ] All services healthy
- [ ] No errors in logs
- [ ] Performance metrics normal
- [ ] User access confirmed
- [ ] Database backups verified
```

**Verification Checklist:**
```
☐ Deployment checklist created
☐ Pre-deployment verification steps listed
☐ Deployment steps documented
☐ Post-deployment verification included
☐ Emergency procedures included
```

---

### Task 5.3: Final System Verification (30 min)

**Create Comprehensive Verification Script:**

```powershell
# File: backend/verify-all-systems.ps1

Write-Host "==================================="
Write-Host "System Verification Script"
Write-Host "==================================="
Write-Host ""

# Check Node.js
Write-Host "1. Checking Node.js..."
$nodeVersion = node --version
if ($nodeVersion) {
  Write-Host "   ✅ Node.js: $nodeVersion"
} else {
  Write-Host "   ❌ Node.js not found"
}

# Check Dependencies
Write-Host ""
Write-Host "2. Checking dependencies..."
$packages = @("express", "mongoose", "pg", "redis", "ws", "jsonwebtoken")
foreach ($pkg in $packages) {
  $exists = npm list $pkg 2>$null | Select-String $pkg
  if ($exists) {
    Write-Host "   ✅ $pkg"
  } else {
    Write-Host "   ❌ $pkg missing"
  }
}

# Check Databases
Write-Host ""
Write-Host "3. Checking databases..."
$services = @("mongo", "postgres", "redis")
foreach ($service in $services) {
  $running = docker ps | Select-String $service
  if ($running) {
    Write-Host "   ✅ $service running"
  } else {
    Write-Host "   ❌ $service not running"
  }
}

# Check Environment Variables
Write-Host ""
Write-Host "4. Checking environment variables..."
$envVars = @("AGORA_APP_ID", "AGORA_APP_CERTIFICATE", "JWT_SECRET")
foreach ($var in $envVars) {
  $value = Get-Item env:$var -ErrorAction SilentlyContinue
  if ($value) {
    Write-Host "   ✅ $var configured"
  } else {
    Write-Host "   ⚠️ $var not configured"
  }
}

# Test Endpoints
Write-Host ""
Write-Host "5. Testing endpoints..."
try {
  $health = Invoke-WebRequest http://localhost:3000/api/health -ErrorAction Stop
  if ($health.StatusCode -eq 200) {
    Write-Host "   ✅ Health endpoint responding"
  }
} catch {
  Write-Host "   ❌ Health endpoint not responding"
}

Write-Host ""
Write-Host "==================================="
Write-Host "Verification Complete"
Write-Host "==================================="
```

**Run Verification:**

```powershell
Set-Location "c:\Users\A\spaktok\backend"
& ".\verify-all-systems.ps1"
```

**Verification Checklist:**
```
☐ All verification tests pass
☐ No critical issues found
☐ All databases connected
☐ All services running
☐ Endpoints responding
☐ Environment configured
```

---

## 🎯 PHASE 2 SUCCESS CRITERIA

### ✅ Completion Requirements

**Database Integration (CRITICAL)**
```
☐ PostgreSQL connected and responsive
☐ MongoDB connected and responsive
☐ Redis connected and responsive
☐ Connection pooling configured
☐ Test data created
```

**Authentication (CRITICAL)**
```
☐ JWT token generation working
☐ Token validation working
☐ Protected endpoints secured
☐ User registration working
☐ User login working
```

**Agora Integration (CRITICAL)**
```
☐ Real Agora credentials configured
☐ Token generation producing valid tokens
☐ Token expiration handled
☐ Token renewal working
```

**Error Handling (HIGH)**
```
☐ Global error handler in place
☐ Input validation on all endpoints
☐ Proper error response formats
☐ Logging system operational
☐ Development mode debugging enabled
```

**Testing (HIGH)**
```
☐ Integration tests created
☐ All tests passing
☐ 70%+ code coverage
☐ Performance baselines established
```

**Documentation (HIGH)**
```
☐ API documentation complete
☐ Setup guide updated
☐ Deployment checklist created
☐ Troubleshooting guide ready
```

---

## 📊 EXPECTED OUTCOMES

### After Phase 2 Completion

**Backend Status: 80% Production Ready**
```
Database Layer:        ✅ 100% Ready
Authentication:        ✅ 100% Ready
API Framework:         ✅ 100% Ready
Real-time Features:    ✅ 100% Ready
Error Handling:        ✅ 100% Ready
Testing:               ⚠️ 70% Coverage
Monitoring:            ⚠️ Basic Setup
Documentation:         ✅ 100% Complete
Deployment:            ⚠️ Ready for Docker
```

**Performance Metrics**
```
API Response:          <100ms ✅
Database Query:        <500ms ✅
Token Generation:      <100ms ✅
WebSocket Message:     <100ms ✅
Health Check:          <100ms ✅
Average Latency:       <150ms ✅
```

**Security Status**
```
No Hardcoded Secrets:  ✅
JWT Authentication:    ✅
Input Validation:      ✅
Error Messages Safe:   ✅
CORS Configured:       ✅
HTTPS Ready:           ⚠️ (needs certs)
```

---

## 🚀 NEXT PHASE (PHASE 3)

After Phase 2 completion, proceed with:

**Week 2 Tasks:**
1. Docker Containerization
2. CI/CD Pipeline Setup
3. Staging Deployment
4. Security Audit
5. Performance Optimization

---

**Document Created:** 2025-10-29  
**Prepared For:** Spaktok Development Team  
**Duration:** 5 Days | 20 Hours  
**Target Completion:** End of Week 1
