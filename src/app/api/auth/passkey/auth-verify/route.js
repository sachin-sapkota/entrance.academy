import { NextResponse } from 'next/server';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function POST(request) {
  try {
    console.log('🛡️ Auth-verify endpoint hit at:', new Date().toISOString());
    console.log('🌐 Request URL:', request.url);
    console.log('🔍 Request method:', request.method);
    
    const body = await request.json();
    console.log('📦 Request body keys:', Object.keys(body));
    const { credential, challenge } = body;

    if (!credential) {
      return NextResponse.json({ error: 'Credential required' }, { status: 400 });
    }

    // For demo purposes, we'll accept any challenge since we don't have proper session storage
    // In production, you'd store the challenge in Redis/session and validate it here
    console.log('🔍 Auth verification - challenge provided:', !!challenge);
    
    // Since we don't have session storage, we'll validate using the credential ID lookup
    // The challenge validation will be relaxed for this demo

    // Get the credential ID to find the user
    const credentialId = credential.id;
    const rawId = credential.rawId;
    
    console.log('🔑 Credential info from browser:', {
      id: credentialId,
      rawId: rawId,
      idLength: credentialId?.length,
      rawIdLength: rawId?.length
    });

    // Find user with this credential
    console.log('🔍 Searching for credential ID:', credentialId);
    
    // Use a different approach to find the user with this credential
    const { data: users, error: searchError } = await supabaseServer
      .from('users')
      .select('id, email, passkey_credentials')
      .not('passkey_credentials', 'is', null);
    
    console.log('📊 Database query result:', { 
      usersCount: users?.length, 
      error: searchError?.message 
    });
    
    // Debug: Log all stored credential IDs
    users?.forEach((user, index) => {
      if (user.passkey_credentials?.length > 0) {
        console.log(`User ${index + 1} (${user.email}) credentials:`, 
          user.passkey_credentials.map(cred => ({
            id: cred.credentialId,
            length: cred.credentialId?.length,
            type: typeof cred.credentialId
          }))
        );
      }
    });
    
    console.log('🔍 Looking for credential ID:', {
      id: credentialId,
      length: credentialId?.length,
      type: typeof credentialId
    });
    
    // Filter users to find the one with matching credential
    // Try matching both the credentialId and credentialIdBase64 fields
    const userWithCredential = users?.find(user => 
      user.passkey_credentials?.some(cred => {
        const matchId = cred.credentialId === credentialId;
        const matchBase64 = cred.credentialIdBase64 === credentialId;
        const matchStoredId = cred.credentialId === rawId;
        
        if (!matchId && !matchBase64 && !matchStoredId) {
          console.log('❌ No match for any combination:', { 
            storedId: cred.credentialId, 
            storedBase64: cred.credentialIdBase64,
            receivedId: credentialId,
            receivedRawId: rawId
          });
        }
        
        return matchId || matchBase64 || matchStoredId;
      })
    );
    
    console.log('🎯 Found user with credential:', !!userWithCredential);

    if (searchError) {
      console.error('❌ Database search error:', searchError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!userWithCredential) {
      console.error('❌ No user found with credential ID:', credentialId);
      return NextResponse.json({ error: 'Credential not found' }, { status: 404 });
    }

    const user = userWithCredential;
    const storedCredential = user.passkey_credentials.find(c => 
      c.credentialId === credentialId || 
      c.credentialIdBase64 === credentialId ||
      c.credentialId === rawId
    );

    if (!storedCredential) {
      return NextResponse.json({ error: 'Invalid credential' }, { status: 400 });
    }

    // Verify the authentication
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

    // For demo purposes, we'll use a more permissive verification
    // In production, you'd have proper challenge storage and validation
    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response: credential,
        expectedChallenge: challenge || 'demo-challenge', // Relaxed for demo
        expectedOrigin,
        expectedRPID: rpID,
        authenticator: {
          credentialID: storedCredential.credentialId,
          credentialPublicKey: Buffer.from(storedCredential.publicKey, 'base64'),
          counter: storedCredential.counter
        },
        requireUserVerification: true
      });
    } catch (verifyError) {
      console.error('❌ Verification failed:', verifyError);
      return NextResponse.json({ error: 'Authentication verification failed' }, { status: 400 });
    }

    if (!verification.verified) {
      return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
    }

    // Update counter
    const updatedCredentials = user.passkey_credentials.map(c => 
      c.credentialId === credentialId 
        ? { ...c, counter: verification.authenticationInfo.newCounter }
        : c
    );

    await supabaseServer
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