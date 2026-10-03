# Spaktok Authentication System

## Overview

The Spaktok authentication system provides a secure, enterprise-grade authentication solution with support for:

- Email/Password authentication
- JWT token management
- Biometric authentication (Face ID, Fingerprint)
- Rate limiting and brute-force protection
- Session management with auto-refresh
- Device tracking and management
- Secure credential storage

## Architecture

### Core Components

1. **Auth Service** (`src/services/auth.ts`)
   - Handles API calls for authentication operations
   - Login, registration, password reset, OAuth integration

2. **Auth Store** (`src/store/auth.ts`)
   - Zustand-based state management
   - User and token persistence

3. **useAuth Hook** (`src/hooks/useAuth.ts`)
   - React hook for easy authentication integration
   - Login, register, logout, password reset functions

4. **Token Manager** (`src/utils/tokenManager.ts`)
   - JWT token parsing and validation
   - Token expiration checking
   - Payload extraction

5. **Session Manager** (`src/utils/sessionManager.ts`)
   - Session lifecycle management
   - Automatic token refresh before expiration
   - Session validation

6. **Secure Storage** (`src/utils/secureStorage.ts`)
   - Platform-native secure credential storage
   - Keychain/Keystore integration

7. **Rate Limiter** (`src/utils/rateLimiter.ts`)
   - Brute-force attack prevention
   - Configurable attempt limits
   - Automatic blocking after max attempts

8. **Biometric Manager** (`src/utils/biometric.ts`)
   - Face ID and Fingerprint support
   - Device compatibility checking

## Usage

### Basic Login

```typescript
import { useAuth } from '@/hooks';

function LoginScreen() {
  const { loginUser, loading, error } = useAuth();

  const handleLogin = async (email: string, password: string) => {
    const result = await loginUser({ email, password });
    if (result.success) {
      // User logged in successfully
    } else {
      // Handle error: result.error
    }
  };

  return (
    // UI implementation
  );
}
```

### User Registration

```typescript
import { useAuth } from '@/hooks';

function RegisterScreen() {
  const { registerUser, loading, error } = useAuth();

  const handleRegister = async (data) => {
    const result = await registerUser({
      email: data.email,
      password: data.password,
      confirmPassword: data.password,
      username: data.username,
      displayName: data.displayName,
      acceptTerms: true,
    });

    if (result.success) {
      // User registered and logged in
    }
  };

  return (
    // UI implementation
  );
}
```

### Accessing User Data

```typescript
import { useAuthStore } from '@/store';

function UserProfile() {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Text>Not logged in</Text>;
  }

  return <Text>{user.displayName}</Text>;
}
```

### Password Reset

```typescript
import { useAuth } from '@/hooks';

function ForgotPasswordScreen() {
  const { resetPassword, loading } = useAuth();

  const handleReset = async (email: string) => {
    const result = await resetPassword(email);
    if (result.success) {
      // Email sent
    }
  };

  return (
    // UI implementation
  );
}
```

### Biometric Authentication

```typescript
import { biometricManager } from '@/utils';

async function enableFaceID() {
  const success = await biometricManager.enableBiometric();
  if (success) {
    console.log('Face ID enabled');
  }
}

async function authenticateWithBiometric() {
  const authenticated = await biometricManager.authenticate('Unlock Spaktok');
  if (authenticated) {
    // User authenticated
  }
}
```

## Security Best Practices

### 1. Token Management

- Tokens are stored in platform-native secure storage (Keychain/Keystore)
- Tokens are automatically refreshed before expiration
- Expired tokens trigger automatic logout

### 2. Password Security

- Passwords must be at least 8 characters
- Must contain uppercase, lowercase, numbers, and special characters
- Never stored in logs or local storage

### 3. Rate Limiting

- Login attempts: 5 attempts per 15 minutes
- Registration: 3 attempts per hour
- API requests: 100 per minute

### 4. Session Management

- Sessions automatically expire after inactivity
- Token refresh happens 5 minutes before expiration
- Failed refresh triggers logout

### 5. Device Tracking

- Each device gets a unique ID
- Device info is stored securely
- Used for suspicious activity detection

### 6. Biometric Authentication

- Leverages device's secure enclave
- Biometric data never leaves device
- Requires explicit user consent

## Configuration

### Environment Variables

```env
# API Configuration
EXPO_PUBLIC_API_URL=http://localhost:3000/api

# Firebase (if using Firebase Auth)
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_auth_domain
FIREBASE_PROJECT_ID=your_project_id

# OAuth (optional)
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_google_client_id
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your_google_ios_client_id
FACEBOOK_APP_ID=your_facebook_app_id
```

### Session Configuration

Edit `src/utils/sessionManager.ts`:

```typescript
const DEFAULT_CONFIG: SessionConfig = {
  refreshThreshold: 5 * 60 * 1000,    // Refresh 5 min before expiry
  maxRetries: 3,                       // Max token refresh attempts
  retryDelay: 1000,                    // Delay between retries (ms)
};
```

## API Endpoints

### Authentication

- `POST /auth/login` - Login with email/password
- `POST /auth/register` - Create new account
- `POST /auth/logout` - Logout user
- `POST /auth/refresh` - Refresh access token
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password with token
- `POST /auth/change-password` - Change password (authenticated)
- `POST /auth/2fa/setup` - Setup two-factor authentication
- `POST /auth/2fa/verify` - Verify 2FA code
- `POST /auth/google` - Google OAuth login
- `POST /auth/facebook` - Facebook OAuth login

## Error Handling

The authentication system provides user-friendly error messages:

```typescript
const { error, clearError } = useAuth();

// Error is automatically set on auth failures
if (error) {
  console.log(error); // "Invalid email or password."
  clearError(); // Clear error message
}
```

## Testing

### Test Accounts

Use these credentials for testing:

- Email: `test@spaktok.com`
- Password: `TestPassword123!`

### API Mock Mode

For development without backend:

1. Set `EXPO_PUBLIC_API_URL=mock://localhost`
2. Implement mock responses in `src/services/auth.ts`

## Troubleshooting

### Tokens Not Refreshing

- Check `sessionManager` is initialized
- Verify `RefreshToken` is stored in secure storage
- Check network connectivity

### Biometric Not Working

- Ensure device has biometric capabilities
- Check permissions in `app.json`
- Verify user has enrolled biometrics

### Rate Limiting Issues

- Clear rate limit cache: `loginRateLimiter.reset(email)`
- Check system time synchronization
- Verify rate limit configuration

## Security Checklist

- [ ] Environment variables configured
- [ ] API uses HTTPS
- [ ] Tokens validated on each request
- [ ] Rate limiting enabled
- [ ] Session timeout configured
- [ ] Biometric enabled for production
- [ ] Error messages don't leak sensitive info
- [ ] Credentials validated on both client and server
- [ ] CORS properly configured
- [ ] Security headers implemented

## Future Enhancements

- [ ] Social media login (Google, Facebook, Apple)
- [ ] Magic link authentication
- [ ] Passwordless login
- [ ] Advanced threat detection
- [ ] Device management dashboard
- [ ] Security audit logs
- [ ] IP-based access control

## Support

For authentication issues, contact: support@spaktok.com

## References

- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Expo Secure Store](https://docs.expo.dev/versions/latest/sdk/securestore/)
- [React Native Security](https://reactnative.dev/docs/security)
