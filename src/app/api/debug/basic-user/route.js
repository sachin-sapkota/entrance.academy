import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// POST - Create basic user for testing
export async function POST(request) {
  try {
    const body = await request.json();
    const { testSecret } = body;

    // Simple security check
    if (testSecret !== 'basic-user-2024') {
      return NextResponse.json(
        { success: false, message: 'Invalid test secret' },
        { status: 403 }
      );
    }

    // First, let's check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', 'admin@mcqtest.com')
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json({
        success: true,
        message: 'User already exists',
        user: existingUser
      });
    }

    // Try to insert with a fixed UUID that we can work with
    const fixedUserId = '12345678-1234-4567-8901-123456789012';
    
    const { data: newUser, error } = await supabaseAdmin
      .from('users')
      .insert([{
        id: fixedUserId,
        email: 'admin@mcqtest.com',
        full_name: 'Admin User',
        role: 'admin',
        is_active: true
      }])
      .select()
      .maybeSingle();

    if (error) {
      console.error('Insert error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to create user: ' + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Basic user created successfully',
      user: newUser
    });
  } catch (error) {
    console.error('Error creating basic user:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create basic user: ' + error.message },
      { status: 500 }
    );
  }
} 