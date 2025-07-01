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

// POST - Temporarily disable RLS (for testing only)
export async function POST(request) {
  try {
    const body = await request.json();
    const { action, testSecret } = body;

    // Simple security check
    if (testSecret !== 'disable-rls-2024') {
      return NextResponse.json(
        { success: false, message: 'Invalid test secret' },
        { status: 403 }
      );
    }

    let query;
    if (action === 'disable') {
      query = 'ALTER TABLE users DISABLE ROW LEVEL SECURITY;';
    } else if (action === 'enable') {
      query = 'ALTER TABLE users ENABLE ROW LEVEL SECURITY;';
    } else {
      return NextResponse.json(
        { success: false, message: 'Action must be "disable" or "enable"' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin.rpc('exec_sql', { sql: query });

    if (error) {
      console.error('RLS toggle error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to toggle RLS: ' + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `RLS ${action}d successfully`
    });
  } catch (error) {
    console.error('Error toggling RLS:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to toggle RLS: ' + error.message },
      { status: 500 }
    );
  }
} 