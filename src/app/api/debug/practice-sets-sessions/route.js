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

// GET - Check practice sets with session codes
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    let query = supabaseAdmin
      .from('practice_sets')
      .select('id, code, title, created_by, updated_at, questions_count, status')
      .like('code', 'session_%')
      .order('code', { ascending: true })
      .order('updated_at', { ascending: false });

    if (sessionId) {
      query = query.eq('code', `session_${sessionId}`);
    }

    const { data: practiceSets, error } = await query;

    if (error) {
      console.error('Error fetching practice sets:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch practice sets' },
        { status: 500 }
      );
    }

    // Group by session code to find duplicates
    const sessionGroups = {};
    const duplicates = [];

    if (practiceSets) {
      practiceSets.forEach(ps => {
        const sessionCode = ps.code;
        if (!sessionGroups[sessionCode]) {
          sessionGroups[sessionCode] = [];
        }
        sessionGroups[sessionCode].push(ps);
      });

      // Find duplicates
      Object.entries(sessionGroups).forEach(([sessionCode, sets]) => {
        if (sets.length > 1) {
          duplicates.push({
            sessionCode,
            count: sets.length,
            sets: sets
          });
        }
      });
    }

    return NextResponse.json({
      success: true,
      totalPracticeSets: practiceSets?.length || 0,
      uniqueSessionCodes: Object.keys(sessionGroups).length,
      duplicates: duplicates,
      practiceSets: practiceSets || [],
      sessionGroups: sessionGroups
    });
  } catch (error) {
    console.error('Error in debug API:', error);
    return NextResponse.json(
      { success: false, message: 'Debug API failed' },
      { status: 500 }
    );
  }
}

// POST - Clean up duplicate sessions
export async function POST(request) {
  try {
    const { data: practiceSets, error } = await supabaseAdmin
      .from('practice_sets')
      .select('id, code, title, created_by, updated_at, questions_count, status')
      .like('code', 'session_%')
      .order('code', { ascending: true })
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching practice sets:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch practice sets' },
        { status: 500 }
      );
    }

    // Group by session code and find duplicates
    const sessionGroups = {};
    const duplicatesToDelete = [];

    if (practiceSets) {
      practiceSets.forEach(ps => {
        const sessionCode = ps.code;
        if (!sessionGroups[sessionCode]) {
          sessionGroups[sessionCode] = [];
        }
        sessionGroups[sessionCode].push(ps);
      });

      // For each session code with multiple drafts, keep the most recent one
      Object.entries(sessionGroups).forEach(([sessionCode, sets]) => {
        if (sets.length > 1) {
          // Sort by updated_at desc and keep the first one, delete the rest
          const sortedSets = sets.sort((a, b) => 
            new Date(b.updated_at) - new Date(a.updated_at)
          );
          duplicatesToDelete.push(...sortedSets.slice(1));
        }
      });
    }

    if (duplicatesToDelete.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No duplicates found to clean up',
        deletedCount: 0
      });
    }

    // Delete duplicates
    const { error: deleteError } = await supabaseAdmin
      .from('practice_sets')
      .delete()
      .in('id', duplicatesToDelete.map(d => d.id));

    if (deleteError) {
      console.error('Error deleting duplicates:', deleteError);
      return NextResponse.json(
        { success: false, message: 'Failed to delete duplicates' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${duplicatesToDelete.length} duplicate sessions`,
      deletedCount: duplicatesToDelete.length,
      deletedIds: duplicatesToDelete.map(d => d.id)
    });
  } catch (error) {
    console.error('Error in cleanup:', error);
    return NextResponse.json(
      { success: false, message: 'Cleanup failed' },
      { status: 500 }
    );
  }
} 