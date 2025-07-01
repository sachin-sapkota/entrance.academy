# Production Deployment Guide

## Google OAuth Production Setup

### 1. Google Cloud Console Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Find your **OAuth 2.0 Client ID** and click **Edit**
4. Update **Authorized redirect URIs** to include:
   ```
   https://your-production-domain.com/auth/callback
   https://exbbjbxhasdfdoyftivq.supabase.co/auth/v1/callback
   ```
5. **Remove localhost URLs** for production security

### 2. Supabase Dashboard Configuration

1. Go to [Supabase Dashboard](https://app.supabase.com/project/exbbjbxhasdfdoyftivq)
2. Navigate to **Authentication** → **URL Configuration**
3. Set **Site URL** to: `https://your-production-domain.com`
4. Add **Redirect URLs**: `https://your-production-domain.com/**`

### 3. Environment Variables

Update your production environment variables:

```bash
NEXT_PUBLIC_APP_URL=https://your-production-domain.com
NEXT_PUBLIC_SUPABASE_URL=https://exbbjbxhasdfdoyftivq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### 4. Deployment Platform Configuration

#### For Vercel:
1. Go to **Project Settings** → **Environment Variables**
2. Add the production environment variables
3. **Redeploy** the application

#### For Netlify:
1. Go to **Site Settings** → **Environment Variables**
2. Add the production environment variables
3. **Redeploy** the application

### 5. Testing OAuth in Production

1. **Clear browser cache** and cookies
2. Navigate to your production domain
3. Try **Google Sign-in**
4. Verify it redirects to your production domain, not localhost

## Troubleshooting

### Issue: Still redirecting to localhost
- **Check Google Cloud Console** redirect URIs
- **Verify environment variables** are set correctly
- **Clear browser cache** completely
- **Check Supabase** URL configuration

### Issue: OAuth error in production
- **Verify domain ownership** in Google Cloud Console
- **Check HTTPS** is enabled on your domain
- **Ensure Supabase** authentication settings are correct

## Security Notes

- **Never expose** service role keys in client-side code
- **Use HTTPS** for all production URLs
- **Remove development URLs** from OAuth configuration in production
- **Enable domain verification** in Google Cloud Console 