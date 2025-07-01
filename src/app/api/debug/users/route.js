import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Debug: List all users (for development only)
export async function GET() {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*');

    if (error) {
      console.error('Users fetch error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch users: ' + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      users: users || [],
      count: users?.length || 0
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch users' },
      { status: 500 }
    );
  }
} 