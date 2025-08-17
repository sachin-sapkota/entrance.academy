import { NextResponse } from 'next/server';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { supabaseServer } from '@/lib/supabase-server';

// Simple in-memory rate limiting (in production, use Redis)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5;

// Rate limiting function
const checkRateLimit = (userId) => {
  const now = Date.now();
  const userRequests = rateLimitMap.get(userId) || [];
  
  // Remove old requests outside the window
  const recentRequests = userRequests.filter(time => now - time < RATE_LIMIT_WINDOW);
  
  if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  
  // Add current request
  recentRequests.push(now);
  rateLimitMap.set(userId, recentRequests);
  
  // Clean up old entries periodically
  if (rateLimitMap.size > 1000) {
    const cutoff = now - RATE_LIMIT_WINDOW;
    for (const [key, requests] of rateLimitMap.entries()) {
      if (requests.every(time => time < cutoff)) {
        rateLimitMap.delete(key);
      }
    }
  }
  
  return true;
};

// Input validation function
const validateUserId = (userId) => {
  if (!userId || typeof userId !== 'string') {
    return { valid: false, error: 'User ID must be a non-empty string' };
  }
  
  // Check UUID format (assuming Supabase uses UUIDs)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId)) {
    return { valid: false, error: 'Invalid user ID format' };
  }
  
  return { valid: true };
};

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId } = body;

    // Input validation
    const validation = validateUserId(userId);
    if (!validation.valid) {
      return NextResponse.json({ 
        error: validation.error 
      }, { status: 400 });
    }

    // Rate limiting
    if (!checkRateLimit(userId)) {
      return NextResponse.json({ 
        error: 'Too many requests. Please try again later.' 
      }, { status: 429 });
    }

    // Get user info with proper error handling
    const { data: userProfile, error: userError } = await supabaseServer
      .from('users')
      .select('email, full_name, passkey_enabled')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Database error:', userError);
      return NextResponse.json({ 
        error: 'User lookup failed' 
      }, { status: 500 });
    }

    if (!userProfile) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 });
    }

    // Check if user already has passkeys enabled (optional security measure)
    if (userProfile.passkey_enabled) {
      console.log('User already has passkeys enabled:', userId);
    }

    // Generate registration options
    const rpName = 'Entrance.academy';
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // Get the current request URL to determine the domain
    const requestUrl = new URL(request.url);
    const currentDomain = requestUrl.hostname;
    
    // For development, always use localhost regardless of the URL
    // For production, use the actual domain from the request
    const rpID = isDevelopment ? 'localhost' : currentDomain;
    
    console.log('🔍 Passkey registration config:', {
      isDevelopment,
      currentDomain,
      rpID,
      NODE_ENV: process.env.NODE_ENV,
      requestUrl: request.url
    });
    
    const userID = userId;
    const userName = userProfile.email;
    const userDisplayName = userProfile.full_name || userProfile.email;
    const timeout = 60000; // 60 seconds
    const attestationType = 'none'; // We don't need attestation for our use case

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID,
      userName,
      userDisplayName,
      timeout,
      attestationType,
      excludeCredentials: [], // TODO: Add existing credentials to prevent duplicates
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
        authenticatorAttachment: 'platform' // Platform authenticators only (built-in)
      },
      supportedAlgorithmIDs: [-7, -257] // ES256, RS256
    });

    // Store challenge temporarily (in production, use Redis or similar)
    // For now, we'll store it in the user's session
    const { error: updateError } = await supabaseServer
      .from('users')
      .update({
        meta_data: {
          ...userProfile.meta_data,
          webauthn_challenge: options.challenge,
          webauthn_challenge_expires: new Date(Date.now() + timeout).toISOString()
        }
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error storing challenge:', updateError);
      return NextResponse.json({ 
        error: 'Failed to generate options',
        details: 'Challenge storage failed'
      }, { status: 500 });
    }

    return NextResponse.json(options);
  } catch (error) {
    console.error('Error generating registration options:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 