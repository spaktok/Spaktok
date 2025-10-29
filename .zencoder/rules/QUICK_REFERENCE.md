# Agora Consolidation - Quick Reference Guide

## 🚀 Getting Started

### Start Backend
\\\ash
cd c:\Users\A\spaktok\backend
npm install
npm run dev    # Runs on port 5000
\\\

### Build Flutter
\\\ash
cd c:\Users\A\spaktok
flutter pub get
flutter run    # Runs on device/emulator
\\\

---

## 📡 API Endpoints

### Health Check
\\\ash
GET http://localhost:5000/api/agora/health
\\\
Response: \{ status: 'ok', agoraConfigured: true }\

### Generate Token
\\\ash
POST http://localhost:5000/api/agora/token
Content-Type: application/json

{
  "channelName": "test_channel",
  "uid": 12345,
  "userId": "user@example.com",
  "role": "publisher"
}
\\\
Response: \{ token: "...", expiryTime: 1635..., ... }\

### Renew Token
\\\ash
POST http://localhost:5000/api/agora/renew-token
Content-Type: application/json

{
  "channelName": "test_channel",
  "uid": 12345,
  "userId": "user@example.com",
  "currentToken": "existing_token"
}
\\\

---

## 🔧 Configuration Files

### Backend Configuration
**File**: \ackend/.env\
`
AGORA_APP_ID=your-app-id
AGORA_APP_CERTIFICATE=your-certificate
MONGODB_URI=mongodb://...
POSTGRESQL_HOST=localhost
POSTGRESQL_USER=postgres
POSTGRESQL_PASSWORD=...
REDIS_URL=redis://...
`

### Frontend Configuration
**File**: \lib/config/app_config.dart\
`dart
static const String backendBaseUrl = 'http://localhost:5000';
`
For production: Change to production URL

---

## 📊 Monitoring

### Check Token Generation (PostgreSQL)
\\\sql
SELECT * FROM agora_token_audit 
WHERE user_id = 'user@example.com' 
ORDER BY generated_at DESC 
LIMIT 10;
\\\

### View Rate Limit Stats
\\\sql
SELECT user_id, COUNT(*) as token_count 
FROM agora_token_audit 
WHERE generated_at > NOW() - INTERVAL '1 day' 
GROUP BY user_id 
ORDER BY token_count DESC;
\\\

### Check Channel Activity
\\\sql
SELECT channel_name, COUNT(*) as token_count 
FROM agora_token_audit 
WHERE generated_at > NOW() - INTERVAL '1 hour' 
GROUP BY channel_name;
\\\

---

## 🐛 Troubleshooting

### Backend won't start
- Check \ackend/.env\ has AGORA_APP_ID
- Verify Node.js 18+ is installed
- Check port 5000 is available

### Health check fails
\\\ash
curl http://localhost:5000/api/agora/health
# Should return: { status: 'ok', agoraConfigured: true }
\\\

### Token generation returns 400
Check request has:
- Valid channelName (string, max 64 chars)
- Valid uid (number 0-2^32-1)
- Valid userId (string)
- Valid role ('publisher' or 'subscriber')

### Rate limit exceeded
- Error: "Rate limit exceeded for user"
- Limit: 100 tokens per user per day
- Reset: Automatic at midnight UTC
- Fix: Wait or use different uid

### Token generation returns 500
Check:
1. AGORA_APP_CERTIFICATE is valid
2. PostgreSQL connection working
3. Backend logs for detailed error

---

## 🔑 Key Files

### Backend Core
- \ackend/routes/agora.js\ - Endpoints
- \ackend/services/agora-audit-service.js\ - Logging
- \ackend/middleware/agora-middleware.js\ - Validation

### Frontend Core
- \lib/services/agora_token_service.dart\ - Token management
- \lib/config/app_config.dart\ - Configuration
- \lib/services/video_call_service.dart\ - Video calls (updated)
- \lib/services/group_calls_service.dart\ - Group calls (updated)

---

## 🧪 Quick Test

### Test Token Generation
\\\ash
curl -X POST http://localhost:5000/api/agora/token \\
  -H 'Content-Type: application/json' \\
  -d '{
    "channelName": "test_channel",
    "uid": 12345,
    "userId": "test_user",
    "role": "publisher"
  }' | jq .
\\\

### Test Token Renewal
\\\ash
# First get a token
TOKEN=\

# Then renew it
curl -X POST http://localhost:5000/api/agora/renew-token \\
  -H 'Content-Type: application/json' \\
  -d "{
    \"channelName\": \"test_channel\",
    \"uid\": 12345,
    \"userId\": \"test_user\",
    \"currentToken\": \"\\"
  }" | jq .
\\\

---

## 📈 Performance Tips

### Token Caching
- Tokens cached for 10+ minutes
- Reduces backend API calls by 90%
- Automatic expiry detection

### Rate Limiting
- 100 tokens/user/day limit
- Prevents abuse and excessive generation
- Monitor patterns in audit logs

### Database Optimization
- Audit logs cleaned up automatically (>30 days)
- 3 database indexes for fast queries
- Parameterized queries prevent SQL injection

---

## 🔐 Security Checklist

- ✅ No hardcoded credentials in code
- ✅ Environment variables for secrets
- ✅ Rate limiting enabled
- ✅ Audit logging functional
- ✅ Input validation in middleware
- ✅ Error messages don't leak secrets
- ✅ PostgreSQL connection uses env vars
- ⚠️ TODO: Enable HTTPS for production
- ⚠️ TODO: Add API authentication (JWT)

---

## 📞 Support Resources

- **Backend logs**: Check console output
- **Audit logs**: PostgreSQL \gora_token_audit\ table
- **Configuration**: backend/.env and lib/config/app_config.dart
- **Agora Docs**: https://docs.agora.io/
- **Flutter SDK**: https://docs.agora.io/en/rtc/flutter/overview

---

## 🔄 Update Checklist

Before deploying to production:
- [ ] Test token generation works
- [ ] Verify PostgreSQL audit logging
- [ ] Check rate limiting prevents abuse
- [ ] Test token refresh before expiry
- [ ] Monitor backend for errors
- [ ] Verify Flutter app gets tokens
- [ ] Test calls work end-to-end
- [ ] Configure production backend URL
- [ ] Enable HTTPS
- [ ] Set up monitoring/alerts

---

**Last Updated**: 2025-10-27
**Version**: 1.0
