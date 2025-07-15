import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create singleton client to avoid multiple instances
let supabaseClientInstance = null;

export const supabase = (() => {
  if (!supabaseClientInstance) {
    supabaseClientInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        storageKey: 'supabase.auth.token',
        flowType: 'pkce'
      }
    });
  }
  return supabaseClientInstance;
})();

// Export supabase client instance directly (no need for createClient wrapper)

// Request deduplication cache
const requestCache = new Map();

// Helper function to make authenticated API requests
export const authenticatedFetch = async (url, options = {}) => {
  try {
    // Create a cache key for this request
    const cacheKey = `${options.method || 'GET'}:${url}:${JSON.stringify(options.body || '')}`;
    
    // Check if there's already a pending request for this URL
    if (requestCache.has(cacheKey)) {
      console.log('🔄 Request already in progress, waiting for existing request:', url);
      return await requestCache.get(cacheKey);
    }

    // Get current session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error);
      throw new Error(`Authentication error: ${error.message}`);
    }
    
    if (!session) {
      console.warn('No valid session for authenticated request to:', url);
      // Instead of falling back to unauthenticated request, throw an error
      throw new Error('No active session. Please log in again.');
    }

    // Verify the session is not expired
    if (session.expires_at && new Date(session.expires_at * 1000) < new Date()) {
      console.warn('Session has expired');
      throw new Error('Session expired. Please log in again.');
    }

    // Add authentication headers
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
      'Authorization': `Bearer ${session.access_token}`,
      'X-Supabase-Auth': session.access_token
    };

    console.log('🔐 Making authenticated request to:', url);
    console.log('🔑 Using access token:', session.access_token.substring(0, 20) + '...');
    
    // Create the request promise and cache it
    const requestPromise = (async () => {
      try {
        const response = await fetch(url, {
          ...options,
          headers
        });

        // If we get a 401, the session might be invalid
        if (response.status === 401) {
          console.error('Received 401 Unauthorized. Session may be invalid.');
          // Try to refresh the session
          const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError || !refreshedSession) {
            console.error('Failed to refresh session:', refreshError);
            throw new Error('Session invalid. Please log in again.');
          }
          
          console.log('🔄 Session refreshed, retrying request...');
          
          // Retry with refreshed session
          const refreshedHeaders = {
            'Content-Type': 'application/json',
            ...options.headers,
            'Authorization': `Bearer ${refreshedSession.access_token}`,
            'X-Supabase-Auth': refreshedSession.access_token
          };
          
          return fetch(url, {
            ...options,
            headers: refreshedHeaders
          });
        }
        
        return response;
      } finally {
        // Remove from cache when request completes (success or failure)
        requestCache.delete(cacheKey);
      }
    })();

    // Cache the request promise
    requestCache.set(cacheKey, requestPromise);
    
    return await requestPromise;
  } catch (error) {
    console.error('Error making authenticated request:', error);
    throw error; // Re-throw instead of falling back to unauthenticated request
  }
};

// Auth helpers
export const signUp = async (email, password) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })
  return { data, error }
}

export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getCurrentUser = async () => {
  try {
    // First check if there's an active session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      return { user: null, error: sessionError }
    }
    
    // If no session exists, return null user (not an error)
    if (!session) {
      return { user: null, error: null }
    }
    
    // Only get user if session exists
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  } catch (error) {
    console.error('Error getting current user:', error)
    return { user: null, error }
  }
} 