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
    // Determine the correct redirect URL based on environment
    const getRedirectUrl = () => {
      // In production, use the production domain
      if (typeof window !== 'undefined') {
        const currentOrigin = window.location.origin;
        
        // If we're on localhost, keep using localhost for development
        if (currentOrigin.includes('localhost')) {
          return `${currentOrigin}/auth/callback`;
        }
        
        // For production, use the current domain
        return `${currentOrigin}/auth/callback`;
      }
      
      // Fallback (should not happen in browser)
      return process.env.NEXT_PUBLIC_APP_URL ? 
        `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback` : 
        `${window.location.origin}/auth/callback`;
    };

    const redirectUrl = getRedirectUrl();
    console.log('OAuth redirect URL:', redirectUrl);
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider,
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
        scopes: provider === 'google' ? 'openid email profile' : undefined
      }
    });

    if (error) {
      console.error(`${provider} OAuth error:`, error);
      throw error;
    }
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

    // Find the correct user ID (might be different from auth user ID)
    let targetUserId = user.id;
    
    // Check if user exists with auth ID
    const { data: authUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single();

    // If not found, try email lookup
    if (!authUser && user.email) {
      const { data: emailUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', user.email)
        .single();
      
      if (emailUser) {
        targetUserId = emailUser.id;
        console.log('🔄 Using email-based user ID for passkey registration:', targetUserId);
      }
    }

    // Generate registration options from server
    const response = await fetch('/api/auth/passkey/register-options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: targetUserId })
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

    // Start WebAuthn registration
    const credential = await startRegistration(options);

    // Verify registration with server
    const verifyResponse = await fetch('/api/auth/passkey/register-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        userId: targetUserId,
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
    console.log('🔐 Starting passkey authentication...');
    
    // Generate authentication options from server
    const response = await fetch('/api/auth/passkey/auth-options', {
      method: 'GET'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const options = await response.json();
    console.log('📝 Authentication options received:', options);

    // Start WebAuthn authentication
    const credential = await startAuthentication(options);
    console.log('🔑 WebAuthn authentication completed:', credential);

    // Verify authentication with server
    console.log('🌐 Making verification request to:', '/api/auth/passkey/auth-verify');
    console.log('📦 Request payload:', { 
      credential: { id: credential.id, type: credential.type },
      challenge: options._challenge || options.challenge
    });
    
    const verifyResponse = await fetch('/api/auth/passkey/auth-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        credential,
        challenge: options._challenge || options.challenge
      })
    });
    
    console.log('📡 Response status:', verifyResponse.status, verifyResponse.statusText);

    if (!verifyResponse.ok) {
      const error = await verifyResponse.json();
      throw new Error(error.message || `HTTP ${verifyResponse.status}`);
    }

    const result = await verifyResponse.json();
    console.log('✅ Passkey verification successful:', result);

    if (result.success && result.user) {
      // Create a Supabase session for the authenticated user
      console.log('🔄 Creating Supabase session for passkey user...');
      
      try {
        const sessionResponse = await fetch('/api/auth/passkey/create-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userEmail: result.user.email })
        });

        if (!sessionResponse.ok) {
          const sessionError = await sessionResponse.json();
          throw new Error(sessionError.error || 'Failed to create session');
        }

        const sessionData = await sessionResponse.json();
        console.log('📧 Session link generated, redirecting user...');

        // Use the magic link to sign in the user
        if (sessionData.authUrl) {
          // Extract the token from the magic link
          const url = new URL(sessionData.authUrl);
          const token = url.searchParams.get('token');
          const type = url.searchParams.get('type');

          if (token && type) {
            // Use the token to create a session
            const { data: authResult, error: authError } = await supabase.auth.verifyOtp({
              token_hash: token,
              type: type
            });

            if (authError) {
              console.error('❌ Failed to verify auth token:', authError);
              throw new Error('Failed to create session');
            }

            console.log('✅ Supabase session created successfully');
            return { 
              success: true, 
              user: authResult.user, 
              session: authResult.session,
              error: null 
            };
          }
        }

        // Fallback: return success but require manual refresh
        return { 
          success: true, 
          user: result.user,
          requiresRefresh: true,
          error: null 
        };

      } catch (sessionError) {
        console.error('Session creation error:', sessionError);
        return { 
          success: false, 
          user: null,
          error: `Session creation failed: ${sessionError.message}`
        };
      }
    }

    return { success: false, user: null, error: 'Authentication verification failed' };
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

    // Find the correct user ID (might be different from auth user ID)
    let targetUserId = user.id;
    
    // Check if user exists with auth ID
    const { data: authUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single();

    // If not found, try email lookup
    if (!authUser && user.email) {
      const { data: emailUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', user.email)
        .single();
      
      if (emailUser) {
        targetUserId = emailUser.id;
        console.log('🔄 Using email-based user ID for passkey toggle:', targetUserId);
      }
    }

    const { data, error } = await supabase.rpc('toggle_passkey', {
      p_user_id: targetUserId,
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
    console.log('🗑️ removePasskeyCredential called with:', credentialId);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    console.log('👤 Current user:', user.id);

    // Find the correct user ID (might be different from auth user ID)
    let targetUserId = user.id;
    
    // Check if user exists with auth ID
    const { data: authUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single();

    // If not found, try email lookup
    if (!authUser && user.email) {
      const { data: emailUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', user.email)
        .single();
      
      if (emailUser) {
        targetUserId = emailUser.id;
        console.log('🔄 Using email-based user ID for passkey deletion:', targetUserId);
      }
    }

    // Use the dedicated deletion API
    const response = await fetch('/api/auth/passkey/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        credentialId,
        userId: targetUserId
      })
    });

    console.log('📡 API response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ API error response:', errorData);
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ API success response:', result);

    return { 
      success: result.success, 
      error: result.success ? null : result.error,
      message: result.message
    };
  } catch (error) {
    console.error('❌ Error in removePasskeyCredential:', error);
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
  try {
    // Basic WebAuthn API check
    const hasBasicSupport = !!(
      navigator.credentials && 
      navigator.credentials.create && 
      navigator.credentials.get
    );

    // Additional checks for better mobile support
    const hasPublicKeyCredential = !!(window.PublicKeyCredential);
    const hasConditionalMediation = !!(
      window.PublicKeyCredential && 
      PublicKeyCredential.isConditionalMediationAvailable
    );

    // Platform detection for better debugging
    const userAgent = navigator.userAgent;
    const isMobile = /iPhone|iPad|iPod|Android|Mobile|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isIOS = /iPhone|iPad|iPod/.test(userAgent);
    const isAndroid = /Android/.test(userAgent);
    const isChrome = /Chrome/.test(userAgent) && !/Edge/.test(userAgent);
    const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
    const isSecureContext = window.isSecureContext;
    
    // Enhanced localhost detection - includes network access to development server
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname.endsWith('.local') ||
                       window.location.hostname.match(/^192\.168\.\d+\.\d+$/) || // Local network
                       window.location.hostname.match(/^10\.\d+\.\d+\.\d+$/) ||   // Private network
                       window.location.hostname.match(/^172\.1[6-9]\.\d+\.\d+$/) || // Private network
                       window.location.hostname.match(/^172\.2[0-9]\.\d+\.\d+$/) || // Private network  
                       window.location.hostname.match(/^172\.3[0-1]\.\d+\.\d+$/);  // Private network

    // Enhanced iOS version detection with better patterns
    let iosVersion = 0;
    if (isIOS) {
      // Try multiple patterns for iOS version detection
      const patterns = [
        /OS (\d+)_(\d+)/,           // "OS 15_0"
        /iPhone OS (\d+)_(\d+)/,   // "iPhone OS 15_0"
        /Version\/(\d+)\.(\d+)/,    // "Version/15.0"
        /Mobile\/\d+[A-Z]+ Safari\/(\d+)/  // Mobile Safari pattern
      ];
      
      for (const pattern of patterns) {
        const match = userAgent.match(pattern);
        if (match) {
          iosVersion = parseInt(match[1]);
          break;
        }
      }
      
      // If no version detected, assume modern iOS for iPhone 15 and newer devices
      if (iosVersion === 0 && userAgent.includes('iPhone')) {
        // iPhone 15 would be iOS 17+, but let's be safe and assume 16+
        iosVersion = 16; 
      }
    }

    // Enhanced Android Chrome version detection
    let chromeVersion = 0;
    if (isAndroid) {
      const chromeMatch = userAgent.match(/Chrome\/(\d+)/);
      chromeVersion = chromeMatch ? parseInt(chromeMatch[1]) : 0;
    }

    // Log detailed support information for debugging
    console.log('🔍 WebAuthn Support Check:', {
      hasBasicSupport,
      hasPublicKeyCredential,
      hasConditionalMediation,
      platform: {
        isMobile,
        isIOS,
        isAndroid,
        isChrome,
        isSafari,
        iosVersion: isIOS ? iosVersion : 'N/A',
        chromeVersion: isAndroid ? chromeVersion : 'N/A',
        userAgent: userAgent.slice(0, 100) + '...' // Truncate for readability
      },
      security: {
        isSecureContext,
        isLocalhost,
        protocol: window.location.protocol,
        hostname: window.location.hostname,
        origin: window.location.origin
      }
    });

    // For mobile devices, be more permissive
    if (isMobile) {
      // iOS Safari 14+ and Chrome for iOS support WebAuthn
      if (isIOS) {
        // For development servers (localhost or local network), be very lenient
        if (isLocalhost) {
          console.log('🏠 Development server detected - enabling iOS WebAuthn');
          if (hasBasicSupport) {
            console.log('✅ iOS WebAuthn support enabled (development mode)');
            return true;
          } else {
            console.log('⚠️ Basic WebAuthn APIs not available, but forcing enable for development');
            return true; // Force enable for development testing
          }
        }
        
        // Production iOS checks - be more permissive for modern devices
        if (iosVersion >= 14 || iosVersion === 0) { 
          console.log(`✅ iOS WebAuthn support detected (iOS ${iosVersion || 'modern device'})`);
          return hasBasicSupport || iosVersion >= 16; // Force true for iOS 16+
        } else {
          console.log(`❌ iOS version too old (iOS ${iosVersion}, requires 14+)`);
          return false;
        }
      }
      
      // Android Chrome 70+ supports WebAuthn
      if (isAndroid) {
        // For development servers, be more lenient
        if (isLocalhost && hasBasicSupport) {
          console.log('✅ Android WebAuthn support enabled (development mode)');
          return true;
        }
        
        if (chromeVersion >= 70 || chromeVersion === 0) {
          console.log(`✅ Android Chrome WebAuthn support detected (Chrome ${chromeVersion || 'unknown'})`);
          return hasBasicSupport;
        } else {
          console.log(`❌ Chrome version too old (Chrome ${chromeVersion}, requires 70+)`);
          return false;
        }
      }
    }

    // For desktop, use standard checks but be lenient with localhost
    const isSupported = hasBasicSupport && hasPublicKeyCredential && (isSecureContext || isLocalhost);
    
    if (isSupported) {
      console.log('✅ WebAuthn support confirmed');
    } else {
      console.log('❌ WebAuthn not supported. Missing:', {
        basicSupport: !hasBasicSupport,
        publicKeyCredential: !hasPublicKeyCredential,
        secureContext: !isSecureContext && !isLocalhost
      });
    }

    return isSupported;
  } catch (error) {
    console.error('❌ Error checking WebAuthn support:', error);
    // For development, return true even if detection fails
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname.match(/^192\.168\.\d+\.\d+$/);
    if (isLocalhost) {
      console.log('🔧 WebAuthn detection failed, but enabling for localhost development');
      return true;
    }
    return false;
  }
};

// Get user's passkey credentials
export const getUserPasskeys = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    // First try with the auth user ID
    let { data, error } = await supabase
      .from('users')
      .select('passkey_credentials, passkey_enabled')
      .eq('id', user.id)
      .single();

    // If no data found with auth user ID, try with email
    if (!data && user.email && (!error || error.code === 'PGRST116')) {
      console.log('🔍 No passkey data found by ID, trying email lookup...');
      
      const { data: emailData, error: emailError } = await supabase
        .from('users')
        .select('passkey_credentials, passkey_enabled')
        .eq('email', user.email)
        .single();

      if (!emailError || emailError.code === 'PGRST116') {
        data = emailData;
        error = emailError;
      }
    }

    if (error && error.code !== 'PGRST116') throw error;

    return {
      credentials: data?.passkey_credentials || [],
      enabled: data?.passkey_enabled || false,
      error: null
    };
  } catch (error) {
    console.error('Error fetching passkeys:', error);
    return { credentials: [], enabled: false, error: error.message };
  }
}; 