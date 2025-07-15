import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request) {
  try {
    console.log('🔧 Creating admin account...');
    
    // Check if admin already exists
    const { data: existingAdmin, error: checkError } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', 'admin@examgo.org')
      .single();
    
    if (existingAdmin) {
      return NextResponse.json({
        success: false,
        message: 'Admin account already exists',
        email: existingAdmin.email
      }, { status: 409 });
    }
    
    // Create admin user in Supabase Auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: 'admin@examgo.org',
      password: 'Admin123!@#',
      email_confirm: true,
      user_metadata: {
        full_name: 'System Administrator',
        role: 'admin'
      }
    });
    
    if (authError) {
      console.error('❌ Auth creation error:', authError);
      return NextResponse.json({
        success: false,
        message: `Failed to create auth user: ${authError.message}`
      }, { status: 500 });
    }
    
    // Create admin profile in users table
    const { data: profileUser, error: profileError } = await supabaseAdmin
      .from('users')
      .insert([{
        id: authUser.user.id,
        email: 'admin@examgo.org',
        full_name: 'System Administrator',
        role: 'admin',
        is_active: true,
        is_verified: true,
        email_verified_at: new Date().toISOString(),
        subscription_plan: 'enterprise',
        credits_remaining: 999999
      }])
      .select()
      .single();
    
    if (profileError) {
      console.error('❌ Profile creation error:', profileError);
      // Try to clean up the auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      
      return NextResponse.json({
        success: false,
        message: `Failed to create user profile: ${profileError.message}`
      }, { status: 500 });
    }
    
    console.log('✅ Admin account created successfully!');
    
    return NextResponse.json({
      success: true,
      message: 'Admin account created successfully',
      user: {
        id: profileUser.id,
        email: profileUser.email,
        full_name: profileUser.full_name,
        role: profileUser.role
      },
      credentials: {
        email: 'admin@examgo.org',
        password: 'Admin123!@#'
      }
    });
    
  } catch (error) {
    console.error('❌ Admin creation error:', error);
    return NextResponse.json({
      success: false,
      message: `Internal server error: ${error.message}`
    }, { status: 500 });
  }
} 