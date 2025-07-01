import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedUser } from '../../../../lib/auth-helpers';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const testId = searchParams.get('testId');

    // Get authenticated user from request
    const { user, error: authError } = await getAuthenticatedUser(request);
    
    if (authError || !user) {
      console.log('❌ Authentication failed:', authError);
      return NextResponse.json({ 
        error: 'Authentication required',
        details: authError 
      }, { status: 401 });
    }

    console.log('🔍 Debug solution data for:', { testId, userId: user.id, userEmail: user.email });

    if (!testId) {
      return NextResponse.json({ error: 'Missing testId parameter' }, { status: 400 });
    }

    // Get test record
    const { data: testData, error: testError } = await supabaseAdmin
      .from('tests')
      .select('*')
      .eq('id', testId)
      .eq('user_id', user.id)
      .single();

    console.log('📋 Test data:', testData ? {
      id: testData.id,
      status: testData.status,
      submitted_at: testData.submitted_at,
      total_questions: testData.total_questions,
      correct_answers: testData.correct_answers
    } : 'Not found');

    // Get attempts with questions
    const { data: attempts, error: attemptsError } = await supabaseAdmin
      .from('attempts')
      .select(`
        *,
        question:questions(*)
      `)
      .eq('test_id', testId);

    console.log('📝 Attempts data:', attempts ? {
      count: attempts.length,
      sample: attempts[0] ? {
        question_id: attempts[0].question_id,
        selected_answer: attempts[0].selected_answer,
        is_correct: attempts[0].is_correct,
        has_question: !!attempts[0].question
      } : null
    } : 'Not found');

    // Get practice set info
    const { data: practiceSet, error: practiceSetError } = await supabaseAdmin
      .from('practice_sets')
      .select('*')
      .eq('id', testId)
      .single();

    console.log('📚 Practice set:', practiceSet ? {
      id: practiceSet.id,
      title: practiceSet.title,
      questions_count: practiceSet.questions?.length || 0
    } : 'Not found');

    // Get active session
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('test_sessions')
      .select('*')
      .eq('test_id', testId)
      .eq('user_id', user.id)
      .single();

    console.log('🔄 Session data:', session ? {
      id: session.id,
      is_active: session.is_active,
      answers_count: Object.keys(session.answers || {}).length
    } : 'Not found');

    return NextResponse.json({
      success: true,
      debug: {
        testId,
        userId: user.id,
        userEmail: user.email,
        test: testData,
        testError: testError?.message,
        attempts: attempts,
        attemptsError: attemptsError?.message,
        practiceSet: practiceSet,
        practiceSetError: practiceSetError?.message,
        session: session,
        sessionError: sessionError?.message,
        summary: {
          hasTest: !!testData,
          hasAttempts: !!(attempts && attempts.length > 0),
          hasPracticeSet: !!practiceSet,
          hasSession: !!session,
          attemptsCount: attempts?.length || 0,
          questionsWithData: attempts?.filter(a => a.question).length || 0
        }
      }
    });

  } catch (error) {
    console.error('💥 Debug error:', error);
    return NextResponse.json({ 
      success: false,
      error: `Debug failed: ${error.message}`,
      details: error.stack 
    }, { status: 500 });
  }
} 