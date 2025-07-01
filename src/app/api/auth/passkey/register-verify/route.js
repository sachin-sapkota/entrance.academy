import { NextResponse } from 'next/server';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { supabase } from '@/lib/supabase-server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, credential, deviceName } = body;

    if (!userId || !credential) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get user and stored challenge
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('meta_data')
      .eq('id', userId)
      .single();

    if (userError || !userProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const storedChallenge = userProfile.meta_data?.webauthn_challenge;
    const challengeExpires = userProfile.meta_data?.webauthn_challenge_expires;

    if (!storedChallenge || !challengeExpires) {
      return NextResponse.json({ error: 'No challenge found' }, { status: 400 });
    }

    // Check if challenge expired
    if (new Date(challengeExpires) < new Date()) {
      return NextResponse.json({ error: 'Challenge expired' }, { status: 400 });
    }

    // Verify the registration
    const isDevelopment = process.env.NODE_ENV === 'development';
    const rpID = isDevelopment ? 'localhost' : (process.env.NEXT_PUBLIC_APP_URL ? new URL(process.env.NEXT_PUBLIC_APP_URL).hostname : 'localhost');
    const expectedOrigin = isDevelopment ? 'http://localhost:3001' : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001');

    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge: storedChallenge,
      expectedOrigin,
      expectedRPID: rpID,
      requireUserVerification: true
    });

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
    }

    // Store the credential
    const credentialData = {
      credentialId: verification.registrationInfo.credentialID,
      publicKey: Buffer.from(verification.registrationInfo.credentialPublicKey).toString('base64'),
      counter: verification.registrationInfo.counter,
      deviceName: deviceName || 'Unknown Device',
      createdAt: new Date().toISOString(),
      transports: credential.response.transports || []
    };

    // Add credential using the database function
    const { data: result, error: rpcError } = await supabase.rpc('add_passkey_credential', {
      p_user_id: userId,
      p_credential: credentialData
    });

    if (rpcError) {
      console.error('Error adding passkey:', rpcError);
      return NextResponse.json({ error: 'Failed to save credential' }, { status: 500 });
    }

    // Clear the challenge
    await supabase
      .from('users')
      .update({
        meta_data: {
          ...userProfile.meta_data,
          webauthn_challenge: null,
          webauthn_challenge_expires: null
        }
      })
      .eq('id', userId);

    return NextResponse.json({ 
      success: true, 
      credential: credentialData,
      message: 'Passkey registered successfully' 
    });
  } catch (error) {
    console.error('Error verifying registration:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 