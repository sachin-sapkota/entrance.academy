import { NextResponse } from 'next/server';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { supabase } from '@/lib/supabase-server';

export async function GET(request) {
  try {
    const timeout = 60000; // 60 seconds
    const rpID = process.env.NEXT_PUBLIC_APP_URL ? new URL(process.env.NEXT_PUBLIC_APP_URL).hostname : 'localhost';

    const options = await generateAuthenticationOptions({
      rpID,
      timeout,
      userVerification: 'preferred',
      allowCredentials: [] // Empty for now - in production, you might want to include user's credentials
    });

    // Store challenge in a temporary location (in production, use session or Redis)
    // For now, we'll return it and the client will send it back
    return NextResponse.json({
      ...options,
      _challenge: options.challenge // Include for verification
    });
  } catch (error) {
    console.error('Error generating authentication options:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 