import { NextResponse } from 'next/server';
import { getAuthenticatedUser, isAdmin } from '@/lib/auth-helpers';
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

// POST - Clean up old empty draft sessions
export async function POST(request) {
  try {
    // Get authenticated user
    const { user, error: authError } = await getAuthenticatedUser(request);
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!isAdmin(user)) {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      );
    }

    // Find old empty draft sessions (older than 1 hour with no questions)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { data: oldDrafts, error: findError } = await supabaseAdmin
      .from('practice_sets')
      .select('id, code, title, questions_count')
      .eq('status', 'draft')
      .eq('questions_count', 0)
      .lt('updated_at', oneHourAgo)
      .like('code', 'session_%');

    if (findError) {
      console.error('Error finding old drafts:', findError);
      return NextResponse.json(
        { success: false, message: 'Failed to find old drafts' },
        { status: 500 }
      );
    }

    if (!oldDrafts || oldDrafts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No old drafts to clean up',
        deletedCount: 0
      });
    }

    // Delete old empty drafts
    const { error: deleteError } = await supabaseAdmin
      .from('practice_sets')
      .delete()
      .in('id', oldDrafts.map(d => d.id));

    if (deleteError) {
      console.error('Error deleting old drafts:', deleteError);
      return NextResponse.json(
        { success: false, message: 'Failed to delete old drafts' },
        { status: 500 }
      );
    }

    console.log('Cleaned up old drafts:', oldDrafts.map(d => d.id));

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${oldDrafts.length} old draft sessions`,
      deletedCount: oldDrafts.length,
      deletedIds: oldDrafts.map(d => d.id)
    });
  } catch (error) {
    console.error('Error in cleanup:', error);
    return NextResponse.json(
      { success: false, message: 'Cleanup failed' },
      { status: 500 }
    );
  }
} 