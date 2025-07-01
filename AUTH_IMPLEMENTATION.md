# Authentication Implementation Guide

This document outlines the complete authentication system implementation for the MCQ Test Platform.

## Features Implemented

### 1. **Google and Apple OAuth Sign-in**
- Integrated OAuth providers for seamless authentication
- Automatic user profile creation on first sign-in
- Support for linking OAuth accounts to existing users

### 2. **Phone Number Verification**
- Mandatory phone verification for all new users (first-time only)
- OTP-based verification system with 6-digit codes
- Rate limiting (5 attempts max, 30-minute lockout)
- Phone number becomes non-editable after verification
- 10-minute OTP expiry time

### 3. **Passkey/Biometric Authentication**
- WebAuthn implementation for passwordless authentication
- Support for Face ID, Touch ID, Windows Hello, etc.
- Disabled by default, can be enabled in profile settings
- Multiple passkeys per user support
- Platform authenticator preference (built-in biometrics)

## Database Schema Updates

### New Columns in Users Table:
```sql
- auth_provider TEXT DEFAULT 'email'
- google_id TEXT UNIQUE
- apple_id TEXT UNIQUE
- passkey_enabled BOOLEAN DEFAULT false
- passkey_credentials JSONB DEFAULT '[]'
- phone_verification_code TEXT
- phone_verification_expires TIMESTAMP
- phone_verification_attempts INTEGER DEFAULT 0
- phone_locked_until TIMESTAMP
```

## OAuth Configuration

### Supabase Dashboard Setup:
1. **Google OAuth**:
   - Enable Google provider in Supabase Auth settings
   - Add your Google OAuth credentials
   - Set redirect URL: `https://your-domain.com/auth/callback`

2. **Apple OAuth**:
   - Enable Apple provider in Supabase Auth settings
   - Configure Apple Sign In credentials
   - Set redirect URL: `https://your-domain.com/auth/callback`

## Phone Verification Flow

1. User signs up/signs in
2. System checks if phone is verified
3. If not verified, redirects to `/phone-verify`
4. User enters phone number and receives OTP
5. User enters OTP to verify
6. Phone becomes verified and non-editable

### Development Mode:
- OTP is displayed in the UI for testing
- Set `app.environment` to 'development' in database

### Production Mode:
- Integrate with SMS provider (Twilio, SendGrid, etc.)
- Update `send_phone_verification` function to send actual SMS

## Passkey Authentication

### Setup Requirements:
1. HTTPS is required in production
2. Valid domain configuration
3. Browser support for WebAuthn

### User Flow:
1. User enables passkey in profile settings
2. Browser prompts for biometric authentication
3. Credential is stored in database
4. User can sign in with passkey from login page

## API Endpoints

### Phone Verification:
- `POST /api/auth/phone/send-otp` - Send verification OTP
- `POST /api/auth/phone/verify-otp` - Verify OTP

### Passkey Management:
- `POST /api/auth/passkey/register-options` - Get registration options
- `POST /api/auth/passkey/register-verify` - Verify registration
- `GET /api/auth/passkey/auth-options` - Get authentication options
- `POST /api/auth/passkey/auth-verify` - Verify authentication

## Security Considerations

1. **Phone Verification**:
   - Rate limiting to prevent brute force
   - OTP expiry to limit window of attack
   - Account lockout after failed attempts

2. **Passkey Authentication**:
   - Platform authenticators only (more secure)
   - User verification required
   - Counter tracking to prevent replay attacks

3. **OAuth**:
   - State parameter for CSRF protection
   - Secure redirect URI validation
   - Profile data validation

## Environment Variables

Add to your `.env.local`:
```env
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Migration Steps

1. Run the migration:
   ```sql
   -- Execute the contents of 009_auth_enhancements.sql
   ```

2. Install dependencies:
   ```bash
   npm install @simplewebauthn/browser @simplewebauthn/server
   ```

3. Configure OAuth providers in Supabase

4. Test the implementation thoroughly

## Troubleshooting

### Common Issues:

1. **Passkey not working**:
   - Ensure HTTPS is enabled
   - Check browser compatibility
   - Verify domain configuration

2. **OAuth redirect issues**:
   - Check redirect URI configuration
   - Ensure callback page is accessible
   - Verify OAuth credentials

3. **Phone verification failing**:
   - Check SMS provider integration
   - Verify phone number format
   - Check rate limiting status

## Future Enhancements

1. **SMS Provider Integration**:
   - Integrate Twilio/SendGrid for production
   - Add SMS templates
   - Implement delivery tracking

2. **Enhanced Security**:
   - Add 2FA support
   - Implement device tracking
   - Add suspicious activity detection

3. **User Experience**:
   - Remember device option
   - Social account linking UI
   - Better error messages 