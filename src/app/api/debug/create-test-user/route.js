import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST - Create a test user directly (for development/testing)
export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password, fullName, testSecret } = body;

    // Simple security check
    if (testSecret !== 'create-test-user-2024') {
      return NextResponse.json(
        { success: false, message: 'Invalid test secret' },
        { status: 403 }
      );
    }

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Create user directly using Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || email,
          role: 'free_user'
        }
      }
    });

    if (error) {
      console.error('Signup error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to create user: ' + error.message },
        { status: 500 }
      );
    }

    // Wait a bit for the trigger to create the profile
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check if profile was created
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (profileError) {
      console.error('Profile check error:', profileError);
    }

    return NextResponse.json({
      success: true,
      message: 'Test user created successfully',
      user: {
        id: data.user?.id,
        email: data.user?.email,
        profile: profile
      }
    });
  } catch (error) {
    console.error('Error creating test user:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create test user: ' + error.message },
      { status: 500 }
    );
  }
} 