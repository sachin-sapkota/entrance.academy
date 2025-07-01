import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET() {
  try {
    console.log('🔍 Debugging passkey credentials...');
    
    // Get all users with passkey credentials
    const { data: users, error } = await supabaseServer
      .from('users')
      .select('id, email, passkey_credentials, passkey_enabled')
      .not('passkey_credentials', 'is', null)
      .neq('passkey_credentials', '[]');

    if (error) {
      console.error('❌ Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('📊 Found users with passkeys:', users?.length || 0);

    const debugInfo = users?.map(user => ({
      userId: user.id,
      email: user.email,
      passkeyEnabled: user.passkey_enabled,
      credentialsCount: user.passkey_credentials?.length || 0,
      credentials: user.passkey_credentials?.map((cred, index) => ({
        index,
        credentialId: cred.credentialId,
        credentialIdBase64: cred.credentialIdBase64,
        id: cred.id,
        deviceName: cred.deviceName,
        createdAt: cred.createdAt,
        hasPublicKey: !!cred.publicKey,
        counter: cred.counter,
        allKeys: Object.keys(cred)
      }))
    }));

    return NextResponse.json({
      success: true,
      usersWithPasskeys: users?.length || 0,
      debugInfo
    });
  } catch (error) {
    console.error('💥 Error in passkey debug:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
} 