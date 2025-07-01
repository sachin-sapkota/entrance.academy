import { supabase } from './supabase';

export async function makeAuthenticatedRequest(url, options = {}) {
  try {
    // Get the current session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      throw new Error('No authenticated session found');
    }

    // Add authorization header
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      ...options.headers
    };

    // Make the request
    const response = await fetch(url, {
      ...options,
      headers
    });

    return response;
  } catch (error) {
    console.error('Authenticated request error:', error);
    throw error;
  }
}

export async function apiPost(url, data) {
  return makeAuthenticatedRequest(url, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function apiPut(url, data) {
  return makeAuthenticatedRequest(url, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

export async function apiDelete(url) {
  return makeAuthenticatedRequest(url, {
    method: 'DELETE'
  });
}

export async function apiGet(url) {
  return makeAuthenticatedRequest(url, {
    method: 'GET'
  });
} 