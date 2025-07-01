import { NextResponse } from 'next/server';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Get user info
    const { data: userProfile, error: userError } = await supabaseServer
      .from('users')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    if (userError || !userProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
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
      return NextResponse.json({ error: 'Failed to generate options' }, { status: 500 });
    }

    return NextResponse.json(options);
  } catch (error) {
    console.error('Error generating registration options:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 