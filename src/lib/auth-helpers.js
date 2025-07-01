import { createClient } from '@supabase/supabase-js';
import { logger } from './logger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create a Supabase client for server-side operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);

export async function getAuthenticatedUser(request) {
  try {
    let user = null;
    let error = null;

    logger.debug('Attempting user authentication');

    // First try to get user from Authorization header (JWT token)
    const authHeader = request.headers.get('Authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      logger.debug('Found Authorization header, checking token');
      const token = authHeader.replace('Bearer ', '');
      const { data: { user: tokenUser }, error: tokenError } = await supabaseAdmin.auth.getUser(token);
      
      if (tokenUser && !tokenError) {
        logger.debug('Token authentication successful', { email: tokenUser.email });
        user = tokenUser;
      } else {
        logger.debug('Token authentication failed', { error: tokenError?.message });
      }
    }

    // Try X-Supabase-Auth header (custom header for session token)
    if (!user) {
      const customAuthHeader = request.headers.get('X-Supabase-Auth');
      if (customAuthHeader) {
        logger.debug('Found custom auth header, checking token');
        const { data: { user: customUser }, error: customError } = await supabaseAdmin.auth.getUser(customAuthHeader);
        
        if (customUser && !customError) {
          logger.debug('Custom header authentication successful', { email: customUser.email });
          user = customUser;
        } else {
          logger.debug('Custom header authentication failed', { error: customError?.message });
        }
      }
    }

    // If no user from token, try to get from cookies (session-based auth)
    if (!user) {
      logger.debug('Checking cookies for session');
      
      // Get cookies from request
      const cookies = request.headers.get('cookie');
      
      if (cookies) {
        try {
          // Parse cookies manually to find Supabase session tokens
          const cookieObj = {};
          cookies.split(';').forEach(cookie => {
            const [name, value] = cookie.trim().split('=');
            if (name && value) {
              cookieObj[name] = decodeURIComponent(value);
            }
          });

          logger.debug('Available cookies', { cookieNames: Object.keys(cookieObj) });

          // Look for Supabase session cookies (try multiple possible names)
          const possibleTokenNames = [
            'sb-access-token',
            'supabase-auth-token', 
            'sb-localhost-auth-token',
            'supabase.auth.token',
            `sb-${supabaseUrl.split('//')[1]?.split('.')[0]}-auth-token`,
            'sb-auth-token'
          ];

          let accessToken = null;
          for (const tokenName of possibleTokenNames) {
            if (cookieObj[tokenName]) {
              accessToken = cookieObj[tokenName];
              logger.debug('Found access token in cookie', { tokenName });
              break;
            }
          }

          // Also try to find session data in structured format
          if (!accessToken) {
            // Look for session data in JSON format
            for (const [name, value] of Object.entries(cookieObj)) {
              if (name.includes('supabase') || name.includes('sb-')) {
                try {
                  const parsed = JSON.parse(value);
                  if (parsed.access_token) {
                    accessToken = parsed.access_token;
                    logger.debug('Found access token in JSON cookie', { cookieName: name });
                    break;
                  }
                } catch (e) {
                  // Not JSON, continue
                }
              }
            }
          }

          if (accessToken) {
            logger.debug('Verifying access token');
            
            // Try to get user with the access token
            const { data: { user: sessionUser }, error: sessionError } = await supabaseAdmin.auth.getUser(accessToken);
            
            if (sessionUser && !sessionError) {
              logger.debug('Cookie authentication successful', { email: sessionUser.email });
              user = sessionUser;
            } else {
              logger.debug('Cookie authentication failed', { error: sessionError?.message });
              error = sessionError?.message || 'Invalid session token';
            }
          } else {
            logger.debug('No valid session token found in cookies');
            error = 'No session token in cookies';
          }
        } catch (cookieError) {
          logger.warn('Error parsing cookies', { error: cookieError.message });
          error = 'Failed to parse session cookies';
        }
      } else {
        logger.debug('No cookies found in request');
        error = 'No cookies found';
      }
    }

    if (!user) {
      logger.debug('All authentication methods failed', { error: error || 'No user found' });
      return { user: null, error: error || 'Auth session missing!' };
    }

    logger.debug('User authenticated successfully', { email: user.email });

    // Try to get user profile from database, but don't fail if it doesn't exist
    let profile = null;
    try {
      const { data: existingProfile, error: profileError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profileError && existingProfile) {
        profile = existingProfile;
        logger.debug('User profile found in database');
      } else if (profileError && profileError.code !== 'PGRST116') {
        // PGRST116 means no rows found, which is ok
        logger.warn('Error fetching user profile', { error: profileError.message });
      } else {
        logger.debug('No user profile found in database, will create one');
      }
    } catch (profileFetchError) {
      logger.warn('Failed to fetch user profile', { error: profileFetchError.message });
    }

    // If no profile exists, create a minimal one in the background but don't wait for it
    if (!profile) {
      // Create profile asynchronously without blocking the request
      const profileData = {
        id: user.id,
        email: user.email,
        role: user.email === 'admin@entrance.academy' ? 'admin' : (user.user_metadata?.role || 'free_user'),
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        is_active: true
      };

      supabaseAdmin
        .from('users')
        .insert([profileData])
        .then(() => logger.debug('User profile created successfully'))
        .catch(err => logger.warn('Failed to create user profile', { error: err.message }));

      // Use a fallback profile
      profile = profileData;
    }

    return { user: { ...user, profile }, error: null };
  } catch (error) {
    logger.error('Authentication error', { error: error.message });
    return { user: null, error: error.message };
  }
}

export function isAdmin(user) {
  // Fallback: check if email is the admin email (highest priority)
  if (user?.email === 'admin@entrance.academy') {
    return true;
  }
  
  // Check user metadata for role
  if (user?.user_metadata?.role === 'admin') {
    return true;
  }
  
  // Check if user has admin role in profile
  if (user?.profile?.role === 'admin') {
    return true;
  }
  
  return false;
}

export function requireAdmin(user) {
  if (!user || !user.profile) {
    throw new Error('Authentication required');
  }
  
  if (!isAdmin(user)) {
    throw new Error('Admin access required');
  }
  
  return true;
} 