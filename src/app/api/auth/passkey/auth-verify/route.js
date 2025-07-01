import { NextResponse } from 'next/server';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { supabase, supabaseAdmin } from '@/lib/supabase-server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { credential, challenge } = body;

    if (!credential || !challenge) {
      return NextResponse.json({ error: 'Credential and challenge required' }, { status: 400 });
    }

    // Get the credential ID to find the user
    const credentialId = credential.id;

    // Find user with this credential
    const { data: users, error: searchError } = await supabaseAdmin
      .from('users')
      .select('id, email, passkey_credentials')
      .contains('passkey_credentials', [{ credentialId }]);

    if (searchError || !users || users.length === 0) {
      return NextResponse.json({ error: 'Credential not found' }, { status: 404 });
    }

    const user = users[0];
    const storedCredential = user.passkey_credentials.find(c => c.credentialId === credentialId);

    if (!storedCredential) {
      return NextResponse.json({ error: 'Invalid credential' }, { status: 400 });
    }

    // Verify the authentication
    const isDevelopment = process.env.NODE_ENV === 'development';
    const rpID = isDevelopment ? 'localhost' : (process.env.NEXT_PUBLIC_APP_URL ? new URL(process.env.NEXT_PUBLIC_APP_URL).hostname : 'localhost');
    const expectedOrigin = isDevelopment ? 'http://localhost:3001' : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001');

    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge: challenge,
      expectedOrigin,
      expectedRPID: rpID,
      authenticator: {
        credentialID: storedCredential.credentialId,
        credentialPublicKey: Buffer.from(storedCredential.publicKey, 'base64'),
        counter: storedCredential.counter
      },
      requireUserVerification: true
    });

    if (!verification.verified) {
      return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
    }

    // Update counter
    const updatedCredentials = user.passkey_credentials.map(c => 
      c.credentialId === credentialId 
        ? { ...c, counter: verification.authenticationInfo.newCounter }
        : c
    );

    await supabaseAdmin
      .from('users')
      .update({ 
        passkey_credentials: updatedCredentials,
        last_login_at: new Date().toISOString()
      })
      .eq('id', user.id);

    // Return verification success with user info
    // The frontend will handle the actual authentication flow
    return NextResponse.json({ 
      success: true, 
      verified: true,
      user: {
        id: user.id,
        email: user.email
      },
      message: 'Passkey authentication successful' 
    });
  } catch (error) {
    console.error('Error verifying authentication:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 