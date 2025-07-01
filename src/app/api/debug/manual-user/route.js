import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

// Create admin client that bypasses RLS
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

// POST - Manually create user in database (for testing only)
export async function POST(request) {
  try {
    const body = await request.json();
    const { email, fullName, role, testSecret } = body;

    // Simple security check
    if (testSecret !== 'manual-user-2024') {
      return NextResponse.json(
        { success: false, message: 'Invalid test secret' },
        { status: 403 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }

    // Generate a UUID for the user
    const userId = randomUUID();

    // Insert user directly into the users table (bypassing RLS)
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .insert([{
        id: userId,
        email: email,
        full_name: fullName || 'Test User',
        role: role || 'free_user',
        is_active: true
      }])
      .select()
      .single();

    if (error) {
      console.error('Insert error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to create user: ' + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Manual user created successfully',
      user: user
    });
  } catch (error) {
    console.error('Error creating manual user:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create manual user: ' + error.message },
      { status: 500 }
    );
  }
} 