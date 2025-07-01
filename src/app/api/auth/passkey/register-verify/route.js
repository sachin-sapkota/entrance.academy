import { NextResponse } from 'next/server';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function POST(request) {
  try {
    console.log('🔐 Passkey registration verification started');
    
    const body = await request.json();
    console.log('📝 Request body keys:', Object.keys(body));
    
    const { userId, credential, deviceName } = body;

    if (!userId || !credential) {
      console.error('❌ Missing required fields:', { userId: !!userId, credential: !!credential });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log('👤 Looking up user:', userId);

    // Get user and stored challenge
    const { data: userProfile, error: userError } = await supabaseServer
      .from('users')
      .select('meta_data')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('❌ Database error getting user:', userError);
      return NextResponse.json({ 
        error: 'Database error', 
        details: userError.message 
      }, { status: 500 });
    }

    if (!userProfile) {
      console.error('❌ User not found:', userId);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('✅ User found, checking challenge...');

    const storedChallenge = userProfile.meta_data?.webauthn_challenge;
    const challengeExpires = userProfile.meta_data?.webauthn_challenge_expires;

    if (!storedChallenge || !challengeExpires) {
      console.error('❌ No challenge found in user metadata');
      return NextResponse.json({ error: 'No challenge found' }, { status: 400 });
    }

    // Check if challenge expired
    if (new Date(challengeExpires) < new Date()) {
      console.error('❌ Challenge expired');
      return NextResponse.json({ error: 'Challenge expired' }, { status: 400 });
    }

    console.log('✅ Challenge valid, verifying registration...');

    // Verify the registration
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // Get the current request URL to determine the domain and origin
    const requestUrl = new URL(request.url);
    const currentDomain = requestUrl.hostname;
    const currentOrigin = requestUrl.origin;
    
    // For development, use localhost. For production, use the actual domain/origin
    const rpID = isDevelopment ? 'localhost' : currentDomain;
    
    // Determine the correct localhost port
    let devOrigin = 'http://localhost:3000'; // Default Next.js port
    if (isDevelopment && currentOrigin.includes('localhost')) {
      devOrigin = currentOrigin; // Use the actual localhost origin
    }
    
    const expectedOrigin = isDevelopment ? devOrigin : currentOrigin;

    console.log('🔍 Verification config:', { rpID, expectedOrigin, isDevelopment });

    let verification;
    try {
      verification = await verifyRegistrationResponse({
        response: credential,
        expectedChallenge: storedChallenge,
        expectedOrigin,
        expectedRPID: rpID,
        requireUserVerification: true
      });
    } catch (verifyError) {
      console.error('❌ WebAuthn verification failed:', verifyError);
      return NextResponse.json({ 
        error: 'WebAuthn verification failed', 
        details: verifyError.message 
      }, { status: 400 });
    }

    if (!verification.verified || !verification.registrationInfo) {
      console.error('❌ Verification failed or missing registration info');
      return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
    }

    console.log('✅ WebAuthn verification successful');

    // Store the credential
    console.log('🔑 Credential IDs for storage:', {
      fromRegistrationInfo: verification.registrationInfo.credentialID,
      fromCredentialResponse: credential.id,
      rawId: credential.rawId,
      match: verification.registrationInfo.credentialID === credential.id
    });
    
    const credentialData = {
      credentialId: verification.registrationInfo.credentialID,
      credentialIdBase64: credential.id, // Store both for comparison
      publicKey: Buffer.from(verification.registrationInfo.credentialPublicKey).toString('base64'),
      counter: verification.registrationInfo.counter,
      deviceName: deviceName || 'Unknown Device',
      createdAt: new Date().toISOString(),
      transports: credential.response.transports || []
    };

    console.log('💾 Storing credential data...');

    // Get current credentials and add the new one
    const { data: currentUser, error: getUserError } = await supabaseServer
      .from('users')
      .select('passkey_credentials')
      .eq('id', userId)
      .single();

    if (getUserError) {
      console.error('❌ Error getting user for passkey update:', getUserError);
      return NextResponse.json({ 
        error: 'Failed to get user data',
        details: getUserError.message 
      }, { status: 500 });
    }

    const existingCredentials = currentUser.passkey_credentials || [];
    const updatedCredentials = [...existingCredentials, credentialData];

    console.log('📊 Updating user credentials...');

    // Update user with new credentials
    const { error: updateError } = await supabaseServer
      .from('users')
      .update({
        passkey_credentials: updatedCredentials,
        passkey_enabled: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      console.error('❌ Error updating passkey credentials:', updateError);
      return NextResponse.json({ 
        error: 'Failed to save credential',
        details: updateError.message 
      }, { status: 500 });
    }

    console.log('🧹 Clearing challenge...');

    // Clear the challenge
    await supabaseServer
      .from('users')
      .update({
        meta_data: {
          ...userProfile.meta_data,
          webauthn_challenge: null,
          webauthn_challenge_expires: null
        }
      })
      .eq('id', userId);

    console.log('✅ Passkey registration completed successfully');

    return NextResponse.json({ 
      success: true, 
      credential: credentialData,
      message: 'Passkey registered successfully' 
    });
  } catch (error) {
    console.error('💥 Unexpected error in passkey registration:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
} 