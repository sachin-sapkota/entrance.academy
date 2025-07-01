import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request, { params }) {
  try {
    console.log('🔍 Sessions API: Starting authentication check...');
    console.log('📋 Request headers:', Object.fromEntries(request.headers.entries()));

    // Await params before accessing properties
    const resolvedParams = await params;
    
    // Get auth header
    const authHeader = request.headers.get('Authorization');
    console.log('🔑 Auth header:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No valid auth header found');
      return NextResponse.json({ 
        error: 'Authorization header missing or invalid' 
      }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('🔍 Extracted token length:', token.length);

    // Verify the token with Supabase
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      console.log('❌ Token verification failed:', authError?.message || 'No user');
      return NextResponse.json({ 
        error: 'Invalid token',
        details: authError?.message 
      }, { status: 401 });
    }

    console.log('✅ User authenticated:', user.email);

    const userId = resolvedParams.id;
    
    // Check if requesting user is viewing their own sessions or is admin
    if (user.id !== userId) {
      console.log('❌ User ID mismatch:', user.id, 'vs', userId);
      return NextResponse.json({ 
        error: 'Unauthorized access - user ID mismatch' 
      }, { status: 403 });
    }

    console.log('✅ User authorized to view sessions');

    // Fetch active test sessions
    const { data: sessions, error: sessionsError } = await supabaseAdmin
      .from('test_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (sessionsError) {
      console.error('❌ Error fetching sessions:', sessionsError);
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }

    console.log('📊 Found sessions:', sessions?.length || 0);

    // Format sessions and calculate remaining time
    const activeSessions = sessions.map(session => {
      const startTime = new Date(session.created_at).getTime();
      const currentTime = new Date().getTime();
      const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);
      const totalDuration = session.browser_state?.totalDuration || 3600;
      const timeLeft = Math.max(0, totalDuration - elapsedSeconds);
      
      // Get the practice set ID or test ID
      const testId = session.browser_state?.practiceSetId || session.test_id;
      
      return {
        id: session.id,
        testId: testId,
        userId: session.user_id,
        isActive: session.is_active && timeLeft > 0,
        timeLeft: timeLeft,
        startedAt: session.created_at,
        lastActivity: session.last_activity_at,
        currentPage: session.current_page || 1,
        answeredQuestions: Object.keys(session.answers || {}).length,
        flaggedQuestions: (session.flagged_questions || []).length
      };
    }).filter(session => session.isActive); // Only return truly active sessions

    console.log('✅ Sessions processing complete');

    return NextResponse.json({
      success: true,
      sessions: activeSessions,
      count: activeSessions.length
    });

  } catch (error) {
    console.error('💥 Sessions API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
} 