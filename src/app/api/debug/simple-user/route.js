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

// POST - Create user with raw SQL
export async function POST(request) {
  try {
    const body = await request.json();
    const { email, fullName, role, testSecret } = body;

    // Simple security check
    if (testSecret !== 'simple-user-2024') {
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

    // Create user with raw SQL using a generated UUID
    const sql = `
      INSERT INTO users (id, email, full_name, role, is_active) 
      VALUES (gen_random_uuid(), $1, $2, $3, true) 
      RETURNING *;
    `;

    const { data, error } = await supabaseAdmin.rpc('exec_sql_with_params', {
      sql: sql,
      params: [email, fullName || 'Test User', role || 'free_user']
    });

    if (error) {
      console.error('SQL insert error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to create user: ' + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'User created successfully with SQL',
      data: data
    });
  } catch (error) {
    console.error('Error creating user with SQL:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create user: ' + error.message },
      { status: 500 }
    );
  }
} 