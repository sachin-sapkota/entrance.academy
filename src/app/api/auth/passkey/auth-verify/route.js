import { NextResponse } from 'next/server';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { supabase } from '@/lib/supabase-server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    const body = await request.json();
    const { credential } = body;

    if (!credential) {
      return NextResponse.json({ error: 'Credential required' }, { status: 400 });
    }

    // Get the credential ID to find the user
    const credentialId = credential.id;

    // Find user with this credential
    const { data: users, error: searchError } = await supabase
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
    const rpID = process.env.NEXT_PUBLIC_APP_URL ? new URL(process.env.NEXT_PUBLIC_APP_URL).hostname : 'localhost';
    const expectedOrigin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const expectedChallenge = credential._challenge; // This should come from the client

    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge,
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

    await supabase
      .from('users')
      .update({ 
        passkey_credentials: updatedCredentials,
        last_login_at: new Date().toISOString()
      })
      .eq('id', user.id);

    // Create a session for the user
    const supabaseClient = createRouteHandlerClient({ cookies });
    
    // Sign in the user programmatically
    // Note: This is a simplified approach. In production, you might want to use a more secure method
    const { data: signInData, error: signInError } = await supabaseClient.auth.admin.getUserById(user.id);
    
    if (signInError) {
      console.error('Error creating session:', signInError);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      user: {
        id: user.id,
        email: user.email
      },
      message: 'Authentication successful' 
    });
  } catch (error) {
    console.error('Error verifying authentication:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 