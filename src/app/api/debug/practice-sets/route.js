import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create admin client for bypassing RLS
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

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Get practice sets with session codes
    let query = supabaseAdmin
      .from('practice_sets')
      .select('id, title, code, status, is_live, created_by, created_at, updated_at, questions_count')
      .order('updated_at', { ascending: false })
      .limit(20);

    if (userId) {
      query = query.eq('created_by', userId);
    }

    const { data: practiceSets, error } = await query;

    if (error) {
      console.error('Debug fetch error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch practice sets: ' + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      practiceSets: practiceSets || [],
      count: practiceSets?.length || 0
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json(
      { success: false, message: 'Debug failed: ' + error.message },
      { status: 500 }
    );
  }
} 