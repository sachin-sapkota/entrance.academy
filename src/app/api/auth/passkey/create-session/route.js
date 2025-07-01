import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    const { userEmail } = await request.json();

    if (!userEmail) {
      return NextResponse.json({ error: 'User email required' }, { status: 400 });
    }

    console.log('🔄 Creating session for passkey user:', userEmail);

    // Get user data from database
    const { data: userData, error: userError } = await supabaseServer
      .from('users')
      .select('*')
      .eq('email', userEmail)
      .single();

    if (userError || !userData) {
      console.error('❌ User not found:', userError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create a client with admin privileges to create session
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Check if there's an existing auth user for this email
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error listing users:', listError);
    }

    const existingAuthUser = existingUsers?.users?.find(u => u.email === userEmail);
    
    let authData;
    let authError;

    if (existingAuthUser) {
      console.log('👤 Found existing auth user:', existingAuthUser.id);
      
      // Update the users table to use the auth user ID if different
      if (userData.id !== existingAuthUser.id) {
        console.log('🔄 Updating user record to match auth user ID...');
        
        try {
          // First, check if there's already a user record with the auth user ID
          const { data: existingRecord } = await supabaseServer
            .from('users')
            .select('id')
            .eq('id', existingAuthUser.id)
            .single();

          if (!existingRecord) {
            // Update the existing user record to use the auth user ID
            const { error: updateError } = await supabaseServer
              .from('users')
              .update({ id: existingAuthUser.id })
              .eq('id', userData.id);

            if (updateError) {
              console.error('❌ Failed to update user ID:', updateError);
              // Continue anyway - we'll handle this in the profile page
            } else {
              console.log('✅ Updated user record with auth user ID');
            }
          }
        } catch (updateErr) {
          console.error('❌ Error during user ID update:', updateErr);
        }
      }

      // Generate a sign-in link for the existing user
      const { data: signInData, error: signInError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: userEmail,
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`
        }
      });

      authData = signInData;
      authError = signInError;
    } else {
      console.log('🆕 No existing auth user found, generating magic link...');
      
      // Generate an access token for the user
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: userEmail,
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`
        }
      });

      authData = linkData;
      authError = linkError;
    }

    if (authError) {
      console.error('❌ Failed to generate auth link:', authError);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    console.log('✅ Session created successfully for:', userEmail);

    // Return the auth URL for the client to use
    return NextResponse.json({
      success: true,
      authUrl: authData.properties?.action_link,
      user: userData,
      message: 'Session created successfully'
    });

  } catch (error) {
    console.error('💥 Error creating passkey session:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
} 