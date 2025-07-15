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
      .select('id, code, title, questions_count, updated_at')
      .eq('status', 'draft')
      .eq('questions_count', 0)
      .lt('updated_at', oneHourAgo)
      .like('code', 'session_%');

    // Also find duplicate session codes and keep only the most recent one
    const { data: allSessionDrafts, error: sessionError } = await supabaseAdmin
      .from('practice_sets')
      .select('id, code, title, questions_count, updated_at')
      .like('code', 'session_%')
      .order('code', { ascending: true })
      .order('updated_at', { ascending: false });

    if (sessionError) {
      console.error('Error finding session drafts:', sessionError);
      return NextResponse.json(
        { success: false, message: 'Failed to find session drafts' },
        { status: 500 }
      );
    }

    // Group by session code and find duplicates
    const sessionGroups = {};
    const duplicatesToDelete = [];

    if (allSessionDrafts) {
      allSessionDrafts.forEach(draft => {
        const sessionCode = draft.code;
        if (!sessionGroups[sessionCode]) {
          sessionGroups[sessionCode] = [];
        }
        sessionGroups[sessionCode].push(draft);
      });

      // For each session code with multiple drafts, keep the most recent one
      Object.entries(sessionGroups).forEach(([sessionCode, drafts]) => {
        if (drafts.length > 1) {
          // Sort by updated_at desc and keep the first one, delete the rest
          const sortedDrafts = drafts.sort((a, b) => 
            new Date(b.updated_at) - new Date(a.updated_at)
          );
          duplicatesToDelete.push(...sortedDrafts.slice(1));
        }
      });
    }

    if (findError) {
      console.error('Error finding old drafts:', findError);
      return NextResponse.json(
        { success: false, message: 'Failed to find old drafts' },
        { status: 500 }
      );
    }

    // Combine old drafts and duplicates to delete
    const allToDelete = [...(oldDrafts || []), ...duplicatesToDelete];
    const deleteIds = allToDelete.map(d => d.id);

    if (deleteIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No old drafts or duplicates to clean up',
        deletedCount: 0
      });
    }

    // Delete old empty drafts and duplicates
    const { error: deleteError } = await supabaseAdmin
      .from('practice_sets')
      .delete()
      .in('id', deleteIds);

    if (deleteError) {
      console.error('Error deleting old drafts:', deleteError);
      return NextResponse.json(
        { success: false, message: 'Failed to delete old drafts' },
        { status: 500 }
      );
    }

    console.log('Cleaned up old drafts and duplicates:', {
      oldDrafts: oldDrafts?.map(d => d.id) || [],
      duplicates: duplicatesToDelete.map(d => d.id)
    });

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${oldDrafts?.length || 0} old draft sessions and ${duplicatesToDelete.length} duplicate sessions`,
      deletedCount: deleteIds.length,
      deletedIds: deleteIds,
      oldDraftsCount: oldDrafts?.length || 0,
      duplicatesCount: duplicatesToDelete.length
    });
  } catch (error) {
    console.error('Error in cleanup:', error);
    return NextResponse.json(
      { success: false, message: 'Cleanup failed' },
      { status: 500 }
    );
  }
} 