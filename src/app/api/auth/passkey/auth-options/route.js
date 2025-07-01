import { NextResponse } from 'next/server';
import { generateAuthenticationOptions } from '@simplewebauthn/server';

export async function GET(request) {
  try {
    const timeout = 60000; // 60 seconds
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // Get the current request URL to determine the domain
    const requestUrl = new URL(request.url);
    const currentDomain = requestUrl.hostname;
    
    // For development, always use localhost regardless of the URL
    // For production, use the actual domain from the request
    const rpID = isDevelopment ? 'localhost' : currentDomain;
    
    console.log('🔍 Passkey auth config:', {
      isDevelopment,
      currentDomain,
      rpID,
      NODE_ENV: process.env.NODE_ENV,
      requestUrl: request.url
    });

    const options = await generateAuthenticationOptions({
      rpID,
      timeout,
      userVerification: 'preferred',
      allowCredentials: [] // Empty for now - in production, you might want to include user's credentials
    });

    // Store challenge temporarily (in production, use Redis or session storage)
    // For now, we'll include it in the response for the client to send back
    return NextResponse.json({
      ...options,
      _challenge: options.challenge, // Include for verification
      _tempChallenge: options.challenge // Backup reference
    });
  } catch (error) {
    console.error('Error generating authentication options:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 