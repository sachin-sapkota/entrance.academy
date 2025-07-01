import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

// Helper function to compare Uint8Arrays or objects that might be serialized Uint8Arrays
const arraysEqual = (a, b) => {
  if (a === b) return true;
  if (!a || !b) return false;
  
  // Handle objects that look like serialized Uint8Arrays
  if (typeof a === 'object' && typeof b === 'object') {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    
    // Check if both objects have numeric keys (serialized Uint8Array)
    const aIsArray = aKeys.every(key => !isNaN(parseInt(key)));
    const bIsArray = bKeys.every(key => !isNaN(parseInt(key)));
    
    if (aIsArray && bIsArray) {
      if (aKeys.length !== bKeys.length) return false;
      for (let i = 0; i < aKeys.length; i++) {
        if (a[i] !== b[i]) return false;
      }
      return true;
    }
  }
  
  // Handle actual arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }
  
  return false;
};

// Helper function to convert Uint8Array-like object to Base64
const uint8ArrayToBase64 = (uint8Array) => {
  try {
    if (typeof uint8Array === 'object' && uint8Array !== null) {
      // Convert object with numeric keys to actual array
      const array = Object.keys(uint8Array)
        .filter(key => !isNaN(parseInt(key)))
        .sort((a, b) => parseInt(a) - parseInt(b))
        .map(key => uint8Array[key]);
      
      return btoa(String.fromCharCode.apply(null, array));
    }
    return null;
  } catch (error) {
    console.error('Error converting to Base64:', error);
    return null;
  }
};

export async function POST(request) {
  try {
    console.log('🗑️ Passkey deletion API called');
    
    const body = await request.json();
    const { credentialId, userId } = body;

    console.log('📝 Request data:', { credentialId, userId, hasCredentialId: !!credentialId, hasUserId: !!userId });

    if (!credentialId) {
      console.error('❌ No credential ID provided');
      return NextResponse.json({ 
        success: false, 
        error: 'Credential ID is required' 
      }, { status: 400 });
    }

    // If userId is not provided, we'll need to get it from auth header or session
    let targetUserId = userId;
    
    if (!targetUserId) {
      // Get user from auth header if available
      const authHeader = request.headers.get('authorization');
      console.log('🔐 Auth header present:', !!authHeader);
      
      // For now, we'll get the current user from the database
      // This is a simplified approach - in production you'd validate the session
      const { data: users, error: getUserError } = await supabaseServer
        .from('users')
        .select('id, email, passkey_credentials')
        .not('passkey_credentials', 'is', null)
        .neq('passkey_credentials', '[]')
        .limit(1);

      if (getUserError || !users || users.length === 0) {
        console.error('❌ No user found with passkeys:', getUserError);
        return NextResponse.json({ 
          success: false, 
          error: 'No authenticated user found' 
        }, { status: 401 });
      }

      targetUserId = users[0].id;
      console.log('👤 Using user ID:', targetUserId);
    }

    console.log('🔍 Getting current user passkey credentials...');

    // Get current credentials
    const { data: userData, error: fetchError } = await supabaseServer
      .from('users')
      .select('passkey_credentials, email')
      .eq('id', targetUserId)
      .single();

    if (fetchError) {
      console.error('❌ Database error fetching user:', fetchError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch user data: ' + fetchError.message 
      }, { status: 500 });
    }

    if (!userData) {
      console.error('❌ User not found:', targetUserId);
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 });
    }

    console.log('📊 Current user:', userData.email);
    console.log('📊 Current credentials count:', userData.passkey_credentials?.length || 0);
    console.log('📊 Current credentials:', JSON.stringify(userData.passkey_credentials, null, 2));

    const currentCredentials = userData.passkey_credentials || [];
    
    if (currentCredentials.length === 0) {
      console.log('ℹ️ No credentials to delete');
      return NextResponse.json({ 
        success: true, 
        message: 'No credentials found to delete' 
      });
    }

    console.log('🔍 Looking for credential to delete:', credentialId);

    // Find and remove the credential - improved matching logic
    const updatedCredentials = currentCredentials.filter((cred, index) => {
      // Try different matching strategies
      let matches = false;
      
      // Strategy 1: Direct comparison for strings/base64
      if (typeof credentialId === 'string') {
        matches = cred.credentialIdBase64 === credentialId || 
                 cred.id === credentialId ||
                 (typeof cred.credentialId === 'string' && cred.credentialId === credentialId);
      }
      
      // Strategy 2: Uint8Array comparison for objects
      if (!matches && typeof credentialId === 'object') {
        matches = arraysEqual(cred.credentialId, credentialId);
        
        // Strategy 3: Compare Base64 representations
        if (!matches && cred.credentialIdBase64) {
          const credentialIdBase64 = uint8ArrayToBase64(credentialId);
          if (credentialIdBase64) {
            matches = cred.credentialIdBase64 === credentialIdBase64;
          }
        }
      }
      
      console.log(`🔍 Checking credential ${index}:`, {
        credentialId: cred.credentialId,
        credentialIdBase64: cred.credentialIdBase64,
        id: cred.id,
        targetId: credentialId,
        targetType: typeof credentialId,
        matches: matches,
        willKeep: !matches
      });
      
      return !matches; // Keep credentials that don't match
    });

    const removedCount = currentCredentials.length - updatedCredentials.length;
    console.log('📊 Credentials removed:', removedCount);
    console.log('📊 Remaining credentials:', updatedCredentials.length);

    if (removedCount === 0) {
      console.error('❌ No matching credential found to delete');
      return NextResponse.json({ 
        success: false, 
        error: 'No matching credential found' 
      }, { status: 404 });
    }

    console.log('💾 Updating user in database...');

    // Update user with filtered credentials
    const { error: updateError } = await supabaseServer
      .from('users')
      .update({
        passkey_credentials: updatedCredentials,
        passkey_enabled: updatedCredentials.length > 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', targetUserId);

    if (updateError) {
      console.error('❌ Database error updating user:', updateError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to update credentials: ' + updateError.message 
      }, { status: 500 });
    }

    console.log('✅ Passkey deleted successfully');

    return NextResponse.json({ 
      success: true, 
      message: 'Passkey deleted successfully',
      removedCount,
      remainingCount: updatedCredentials.length
    });

  } catch (error) {
    console.error('💥 Unexpected error in passkey deletion:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 });
  }
} 