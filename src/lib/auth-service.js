import { supabase } from './supabase';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';

// Helper function to safely log errors
const safeErrorLog = (error, context = '') => {
  if (error && typeof error === 'object') {
    return {
      message: error.message || 'Unknown error',
      code: error.code || 'NO_CODE',
      details: error.details || 'No details',
      hint: error.hint || 'No hint',
      context
    };
  }
  return { message: String(error), context };
};

// OAuth Sign In
export const signInWithOAuth = async (provider) => {
  try {
    console.log(`🔄 Starting ${provider} OAuth sign-in...`);
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
        scopes: provider === 'google' ? 'openid email profile' : undefined
      }
    });

    console.log(`${provider} OAuth response:`, { data, error });

    if (error) {
      console.error(`❌ ${provider} OAuth error:`, error);
      throw error;
    }

    console.log(`✅ ${provider} OAuth redirect initiated successfully`);
    return { data, error: null };
  } catch (error) {
    console.error(`❌ ${provider} OAuth error:`, error);
    return { data: null, error: error.message };
  }
};

// Link OAuth account to existing user
export const linkOAuthAccount = async (provider, providerId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    // Update user profile with provider ID (Google only)
    if (provider !== 'google') {
      throw new Error('Only Google OAuth is currently supported');
    }
    
    const { error } = await supabase
      .from('users')
      .update({ 
        google_id: providerId,
        auth_provider: provider,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    console.error('Error linking OAuth account:', error);
    return { success: false, error: error.message };
  }
};

// Check if phone verification is required
export const checkPhoneVerification = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const { data: userProfile, error } = await supabase
      .from('users')
      .select('phone_verified, phone')
      .eq('id', userId)
      .single();

    if (error) {
      // If user doesn't exist, phone verification is required
      if (error.code === 'PGRST116') {
        console.log('User profile not found, phone verification will be required');
        return { required: true, hasPhone: false, error: null };
      }
      throw error;
    }

    // If user exists but phone_verified column is null/undefined, assume false
    const phoneVerified = userProfile?.phone_verified || false;
    const hasPhone = !!userProfile?.phone;
    
    return {
      required: !phoneVerified,
      hasPhone: hasPhone,
      error: null
    };
  } catch (error) {
    console.error('Error checking phone verification:', safeErrorLog(error, `userId: ${userId}`));
    return { required: true, hasPhone: false, error: error.message || 'Unknown error occurred' };
  }
};

// WebAuthn/Passkey Registration
export const registerPasskey = async () => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    // Generate registration options from server
    const response = await fetch('/api/auth/passkey/register-options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id })
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const error = await response.json();
        errorMessage = error.message || error.error || errorMessage;
      } catch (parseError) {
        console.warn('Failed to parse error response:', parseError);
      }
      throw new Error(errorMessage);
    }

    const options = await response.json();
    console.log('Registration options received:', options);

    // Start WebAuthn registration
    const credential = await startRegistration(options);
    console.log('WebAuthn registration completed:', credential);

    // Verify registration with server
    const verifyResponse = await fetch('/api/auth/passkey/register-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        userId: user.id,
        credential,
        deviceName: getDeviceName()
      })
    });

    if (!verifyResponse.ok) {
      let errorMessage = `HTTP ${verifyResponse.status}: ${verifyResponse.statusText}`;
      try {
        const error = await verifyResponse.json();
        errorMessage = error.message || error.error || errorMessage;
      } catch (parseError) {
        console.warn('Failed to parse verify error response:', parseError);
      }
      throw new Error(errorMessage);
    }

    const result = await verifyResponse.json();
    return { success: true, credential: result.credential, error: null };
  } catch (error) {
    console.error('Passkey registration error:', error);
    return { success: false, credential: null, error: error.message };
  }
};

// WebAuthn/Passkey Authentication
export const authenticateWithPasskey = async () => {
  try {
    // Generate authentication options from server
    const response = await fetch('/api/auth/passkey/auth-options', {
      method: 'GET'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const options = await response.json();

    // Start WebAuthn authentication
    const credential = await startAuthentication(options);

    // Verify authentication with server
    const verifyResponse = await fetch('/api/auth/passkey/auth-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential })
    });

    if (!verifyResponse.ok) {
      const error = await verifyResponse.json();
      throw new Error(error.message);
    }

    const result = await verifyResponse.json();
    return { success: true, user: result.user, error: null };
  } catch (error) {
    console.error('Passkey authentication error:', error);
    return { success: false, user: null, error: error.message };
  }
};

// Toggle passkey authentication
export const togglePasskey = async (enabled) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const { data, error } = await supabase.rpc('toggle_passkey', {
      p_user_id: user.id,
      p_enabled: enabled
    });

    if (error) throw error;
    
    if (!data.success) {
      throw new Error(data.error);
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error toggling passkey:', error);
    return { success: false, error: error.message };
  }
};

// Remove passkey credential
export const removePasskeyCredential = async (credentialId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    // Get current credentials
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('passkey_credentials')
      .eq('id', user.id)
      .single();

    if (fetchError) throw fetchError;

    // Filter out the credential to remove
    const updatedCredentials = userData.passkey_credentials.filter(
      cred => cred.credentialId !== credentialId
    );

    // Update user
    const { error: updateError } = await supabase
      .from('users')
      .update({
        passkey_credentials: updatedCredentials,
        passkey_enabled: updatedCredentials.length > 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) throw updateError;

    return { success: true, error: null };
  } catch (error) {
    console.error('Error removing passkey:', error);
    return { success: false, error: error.message };
  }
};

// Helper function to get device name
const getDeviceName = () => {
  const userAgent = navigator.userAgent;
  const platform = navigator.platform;
  
  // Try to detect device type
  if (/iPhone|iPad|iPod/.test(userAgent)) {
    return `iOS ${platform}`;
  } else if (/Android/.test(userAgent)) {
    return 'Android Device';
  } else if (/Windows/.test(userAgent)) {
    return 'Windows PC';
  } else if (/Mac/.test(userAgent)) {
    return 'Mac';
  } else if (/Linux/.test(userAgent)) {
    return 'Linux Device';
  }
  
  return 'Unknown Device';
};

// Check if WebAuthn is supported
export const isWebAuthnSupported = () => {
  return !!(navigator.credentials && navigator.credentials.create && navigator.credentials.get);
};

// Get user's passkey credentials
export const getUserPasskeys = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const { data, error } = await supabase
      .from('users')
      .select('passkey_credentials, passkey_enabled')
      .eq('id', user.id)
      .single();

    if (error) throw error;

    return {
      credentials: data.passkey_credentials || [],
      enabled: data.passkey_enabled || false,
      error: null
    };
  } catch (error) {
    console.error('Error fetching passkeys:', error);
    return { credentials: [], enabled: false, error: error.message };
  }
}; 