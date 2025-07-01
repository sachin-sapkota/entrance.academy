import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedUser } from '../../../../lib/auth-helpers';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function parseRequestBody(request) {
  // Handle different request types including sendBeacon
  const contentType = request.headers.get('content-type') || '';
  
  try {
    // Get the raw text first
    const text = await request.text();
    
    // Try to parse as JSON
    try {
      return JSON.parse(text);
    } catch (e) {
      // If it's not valid JSON, return null
      console.error('Failed to parse request body as JSON:', e);
      return null;
    }
  } catch (error) {
    console.error('Failed to read request body:', error);
    return null;
  }
}

export async function POST(request) {
  try {
    // Get authenticated user from request
    const { user, error: authError } = await getAuthenticatedUser(request);
    
    if (authError || !user) {
      console.log('❌ Authentication failed:', authError);
      return NextResponse.json({ 
        error: 'Authentication required',
        details: authError 
      }, { status: 401 });
    }

    // Parse request body
    const requestData = await parseRequestBody(request);
    
    if (!requestData) {
      return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
    }

    const { testId, questionId, selectedAnswer, timeSpent, currentPage, flaggedQuestions } = requestData;
    const userId = user.id; // Use the actual authenticated user ID

    console.log('📨 Answer submission request:', { testId, userId: user.id, userEmail: user.email, questionId, selectedAnswer, currentPage });

    if (!testId || !questionId) {
      console.error('❌ Missing required fields:', { testId, questionId });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get session from database - try to find by practice set ID first
    let session = null;
    let sessionError = null;
    
    // First try to find by practice set ID in browser state
    const { data: sessionsWithPracticeSet, error: practiceSetError } = await supabaseAdmin
      .from('test_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);
    
    if (!practiceSetError && sessionsWithPracticeSet) {
      // Find session that has this practice set ID in browser state
      session = sessionsWithPracticeSet.find(s => 
        s.browser_state?.practiceSetId === testId || s.test_id === testId
      );
    }
    
    // If not found, try the old way (direct test_id match)
    if (!session) {
      const { data: directSession, error: directError } = await supabaseAdmin
        .from('test_sessions')
        .select('*')
        .eq('test_id', testId)
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();
      
      session = directSession;
      sessionError = directError;
    }

    if (sessionError || !session) {
      console.error('❌ Session not found in database:', sessionError);
      return NextResponse.json({ error: 'Session not found. Please restart the test.' }, { status: 404 });
    }

    console.log('📋 Session found:', { id: session.id, isActive: session.is_active });

    // Calculate remaining time
    const startTime = new Date(session.created_at).getTime();
    const currentTime = new Date().getTime();
    const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);
    const totalDuration = session.browser_state?.timeLeft || 3600; // Get from browser state or default
    const remainingTime = Math.max(0, totalDuration - elapsedSeconds);

    // Update answers
    const newAnswers = { ...session.answers };
    newAnswers[questionId] = selectedAnswer;

    // Update browser state
    const newBrowserState = {
      ...session.browser_state,
      timeLeft: remainingTime,
      currentPage: currentPage || session.current_page || 1
    };

    // Update flagged questions
    const newFlaggedQuestions = flaggedQuestions || session.flagged_questions || [];

    // Update session in database
    const { data: updatedSession, error: updateError } = await supabaseAdmin
      .from('test_sessions')
      .update({
        answers: newAnswers,
        flagged_questions: newFlaggedQuestions,
        browser_state: newBrowserState,
        current_page: currentPage || session.current_page || 1,
        last_activity_at: new Date().toISOString()
      })
      .eq('id', session.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Failed to update session:', updateError);
      return NextResponse.json({ error: 'Failed to save answer' }, { status: 500 });
    }

    console.log('✅ Answer submitted successfully:', { 
      questionId, 
      selectedAnswer, 
      totalAnswers: Object.keys(newAnswers).length,
      timeLeft: remainingTime
    });

    return NextResponse.json({
      success: true,
      message: 'Answer saved successfully',
      session: {
        answers: updatedSession.answers,
        currentPage: updatedSession.current_page,
        flaggedQuestions: updatedSession.flagged_questions,
        timeLeft: remainingTime,
        lastActivity: updatedSession.last_activity_at
      }
    });
  } catch (error) {
    console.error('💥 Answer submission API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    // Get authenticated user from request
    const { user, error: authError } = await getAuthenticatedUser(request);
    
    if (authError || !user) {
      console.log('❌ Authentication failed:', authError);
      return NextResponse.json({ 
        error: 'Authentication required',
        details: authError 
      }, { status: 401 });
    }

    // Parse request body
    const requestData = await parseRequestBody(request);
    
    if (!requestData) {
      return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
    }

    const { testId, answers, flaggedQuestions, currentPage, timeLeft } = requestData;
    const userId = user.id;

    console.log('💾 Bulk state update request:', { 
      testId, 
      userId: user.id, 
      answersCount: Object.keys(answers || {}).length,
      flaggedCount: (flaggedQuestions || []).length,
      currentPage,
      timeLeft
    });

    if (!testId) {
      console.error('❌ Missing testId');
      return NextResponse.json({ error: 'Missing testId' }, { status: 400 });
    }

    // Get session from database - try to find by practice set ID first  
    let session = null;
    let sessionError = null;
    
    // First try to find by practice set ID in browser state
    const { data: sessionsWithPracticeSet, error: practiceSetError } = await supabaseAdmin
      .from('test_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);
    
    if (!practiceSetError && sessionsWithPracticeSet) {
      // Find session that has this practice set ID in browser state
      session = sessionsWithPracticeSet.find(s => 
        s.browser_state?.practiceSetId === testId || s.test_id === testId
      );
    }
    
    // If not found, try the old way (direct test_id match)
    if (!session) {
      const { data: directSession, error: directError } = await supabaseAdmin
        .from('test_sessions')
        .select('*')
        .eq('test_id', testId)
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();
      
      session = directSession;
      sessionError = directError;
    }

    if (sessionError || !session) {
      console.error('❌ Session not found in database:', sessionError);
      return NextResponse.json({ error: 'Session not found. Please restart the test.' }, { status: 404 });
    }

    // Update browser state
    const newBrowserState = {
      ...session.browser_state,
      timeLeft: timeLeft || session.browser_state?.timeLeft || 3600,
      currentPage: currentPage || session.current_page || 1,
      lastSaved: new Date().toISOString()
    };

    // Update session in database
    const { data: updatedSession, error: updateError } = await supabaseAdmin
      .from('test_sessions')
      .update({
        answers: answers || session.answers || {},
        flagged_questions: flaggedQuestions || session.flagged_questions || [],
        browser_state: newBrowserState,
        current_page: currentPage || session.current_page || 1,
        last_activity_at: new Date().toISOString()
      })
      .eq('id', session.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Failed to update session:', updateError);
      return NextResponse.json({ error: 'Failed to save state' }, { status: 500 });
    }

    console.log('✅ State saved successfully:', { 
      totalAnswers: Object.keys(updatedSession.answers || {}).length,
      timeLeft: newBrowserState.timeLeft
    });

    return NextResponse.json({
      success: true,
      message: 'State saved successfully',
      session: {
        answers: updatedSession.answers,
        currentPage: updatedSession.current_page,
        flaggedQuestions: updatedSession.flagged_questions,
        timeLeft: newBrowserState.timeLeft,
        lastActivity: updatedSession.last_activity_at
      }
    });
  } catch (error) {
    console.error('💥 Bulk state update API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 