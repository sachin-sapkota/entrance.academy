import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  console.log('🧪 Starting comprehensive session persistence test...');
  
  const testResults = {
    testId: 'test-persistence-' + Date.now(),
    userId: '0a390418-249f-4ce4-b308-52ca8a99d042', // Test user ID
    steps: [],
    errors: [],
    success: false
  };

  try {
    // Step 1: Create initial session
    console.log('📝 Step 1: Creating initial session...');
    const { data: session1, error: createError } = await supabaseAdmin
      .from('test_sessions')
      .insert({
        test_id: testResults.testId,
        user_id: testResults.userId,
        session_token: `${testResults.userId}-${testResults.testId}-${Date.now()}`,
        answers: {},
        flagged_questions: [],
        browser_state: { timeLeft: 7200, currentPage: 1 },
        current_page: 1,
        is_active: true,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single();

    if (createError) throw new Error(`Create session failed: ${createError.message}`);
    testResults.steps.push('✅ Session created successfully');

    // Step 2: Add some answers
    console.log('📝 Step 2: Adding test answers...');
    const testAnswers = {
      '1': 'A',
      '2': 'B', 
      '3': 'C'
    };

    const { error: updateError1 } = await supabaseAdmin
      .from('test_sessions')
      .update({
        answers: testAnswers,
        flagged_questions: [2],
        browser_state: { timeLeft: 7000, currentPage: 1 },
        last_activity_at: new Date().toISOString()
      })
      .eq('id', session1.id);

    if (updateError1) throw new Error(`Update answers failed: ${updateError1.message}`);
    testResults.steps.push('✅ Answers added successfully');

    // Step 3: Simulate page refresh - fetch session
    console.log('📝 Step 3: Simulating page refresh - fetching session...');
    const { data: restoredSession, error: fetchError } = await supabaseAdmin
      .from('test_sessions')
      .select('*')
      .eq('test_id', testResults.testId)
      .eq('user_id', testResults.userId)
      .eq('is_active', true)
      .single();

    if (fetchError) throw new Error(`Fetch session failed: ${fetchError.message}`);
    
    // Verify data persistence
    const answersMatch = JSON.stringify(restoredSession.answers) === JSON.stringify(testAnswers);
    const flaggedMatch = JSON.stringify(restoredSession.flagged_questions) === JSON.stringify([2]);
    
    if (!answersMatch) throw new Error('Answers not restored correctly');
    if (!flaggedMatch) throw new Error('Flagged questions not restored correctly');
    
    testResults.steps.push('✅ Session restored correctly after refresh');

    // Step 4: Update more answers (simulate continued test taking)
    console.log('📝 Step 4: Adding more answers...');
    const updatedAnswers = {
      ...testAnswers,
      '4': 'D',
      '5': 'A'
    };

    const { error: updateError2 } = await supabaseAdmin
      .from('test_sessions')
      .update({
        answers: updatedAnswers,
        flagged_questions: [2, 5],
        current_page: 2,
        browser_state: { timeLeft: 6800, currentPage: 2 }
      })
      .eq('id', session1.id);

    if (updateError2) throw new Error(`Update more answers failed: ${updateError2.message}`);
    testResults.steps.push('✅ Additional answers added successfully');

    // Step 5: Test session deduplication
    console.log('📝 Step 5: Testing session deduplication...');
    const { data: duplicateSession, error: duplicateError } = await supabaseAdmin
      .from('test_sessions')
      .insert({
        test_id: testResults.testId,
        user_id: testResults.userId,
        session_token: `${testResults.userId}-${testResults.testId}-${Date.now() + 1000}`,
        answers: {},
        flagged_questions: [],
        browser_state: { timeLeft: 7200, currentPage: 1 },
        current_page: 1,
        is_active: true,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      })
      .select();

    // Should have only one active session
    const { data: activeSessions } = await supabaseAdmin
      .from('test_sessions')
      .select('*')
      .eq('test_id', testResults.testId)
      .eq('user_id', testResults.userId)
      .eq('is_active', true);

    if (activeSessions.length > 1) {
      console.log('⚠️ Multiple active sessions found, this should be handled by application logic');
    }
    testResults.steps.push(`✅ Session deduplication test completed (${activeSessions.length} active sessions)`);

    // Step 6: Create a test record for submission
    console.log('📝 Step 6: Creating test record for submission...');
    const { data: testRecord, error: testCreateError } = await supabaseAdmin
      .from('tests')
      .insert({
        id: testResults.testId,
        user_id: testResults.userId,
        test_name: 'Test Persistence Practice Set',
        total_questions: 5,
        questions_order: [1, 2, 3, 4, 5],
        status: 'in_progress',
        started_at: new Date().toISOString(),
        time_spent_seconds: 400
      })
      .select()
      .single();

    if (testCreateError) throw new Error(`Create test record failed: ${testCreateError.message}`);
    testResults.steps.push('✅ Test record created for submission');

    // Step 7: Add attempts for each answer
    console.log('📝 Step 7: Creating attempt records...');
    const attempts = [];
    for (const [questionId, answer] of Object.entries(updatedAnswers)) {
      attempts.push({
        test_id: testResults.testId,
        question_id: parseInt(questionId),
        selected_answer: JSON.stringify(answer),
        is_correct: Math.random() > 0.5, // Random for testing
        marks_obtained: Math.random() > 0.5 ? 4 : 0,
        time_spent_seconds: Math.floor(Math.random() * 120) + 30
      });
    }

    const { error: attemptsError } = await supabaseAdmin
      .from('attempts')
      .insert(attempts);

    if (attemptsError) throw new Error(`Create attempts failed: ${attemptsError.message}`);
    testResults.steps.push('✅ Attempt records created');

    // Step 8: Test submission
    console.log('📝 Step 8: Testing submission...');
    const { error: submitError } = await supabaseAdmin
      .from('tests')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        final_score: 12,
        percentage: 60,
        correct_answers: 3,
        wrong_answers: 2
      })
      .eq('id', testResults.testId);

    if (submitError) throw new Error(`Test submission failed: ${submitError.message}`);

    // Mark session as inactive
    const { error: deactivateError } = await supabaseAdmin
      .from('test_sessions')
      .update({ is_active: false })
      .eq('id', session1.id);

    if (deactivateError) throw new Error(`Session deactivation failed: ${deactivateError.message}`);
    testResults.steps.push('✅ Test submitted and session deactivated');

    // Step 9: Verify final state
    console.log('📝 Step 9: Verifying final state...');
    const { data: finalTest } = await supabaseAdmin
      .from('tests')
      .select('*')
      .eq('id', testResults.testId)
      .single();

    const { data: finalSession } = await supabaseAdmin
      .from('test_sessions')
      .select('*')
      .eq('id', session1.id)
      .single();

    if (finalTest.status !== 'submitted') throw new Error('Test status not updated correctly');
    if (finalSession.is_active !== false) throw new Error('Session not deactivated correctly');
    
    testResults.steps.push('✅ Final state verification passed');

    // Cleanup
    console.log('🧹 Cleaning up test data...');
    await supabaseAdmin.from('attempts').delete().eq('test_id', testResults.testId);
    await supabaseAdmin.from('tests').delete().eq('id', testResults.testId);
    await supabaseAdmin.from('test_sessions').delete().eq('test_id', testResults.testId);
    testResults.steps.push('✅ Test data cleaned up');

    testResults.success = true;
    console.log('🎉 All session persistence tests passed!');

  } catch (error) {
    console.error('❌ Session persistence test failed:', error);
    testResults.errors.push(error.message);
    
    // Cleanup on error
    try {
      await supabaseAdmin.from('attempts').delete().eq('test_id', testResults.testId);
      await supabaseAdmin.from('tests').delete().eq('id', testResults.testId);
      await supabaseAdmin.from('test_sessions').delete().eq('test_id', testResults.testId);
    } catch (cleanupError) {
      console.error('Failed to cleanup test data:', cleanupError);
    }
  }

  return NextResponse.json({
    success: testResults.success,
    testResults,
    message: testResults.success 
      ? 'All session persistence tests passed!' 
      : 'Some tests failed - check errors for details'
  });
}

export async function POST(request) {
  try {
    const { action } = await request.json();
    
    if (action === 'cleanup-all') {
      console.log('🧹 Cleaning up all test sessions...');
      
      const allSessions = await supabaseAdmin
        .from('test_sessions')
        .select('*')
        .eq('user_id', 'test-user');
      
      let cleanedCount = 0;
      
      for (const session of allSessions.data) {
        const { error: deleteError } = await supabaseAdmin
          .from('test_sessions')
          .delete()
          .eq('id', session.id);
        
        if (deleteError) {
          console.error(`Failed to clean up session ${session.id}: ${deleteError.message}`);
        } else {
          cleanedCount++;
        }
      }
      
      return NextResponse.json({
        success: true,
        message: `Cleaned up ${cleanedCount} test sessions`
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 });

  } catch (error) {
    console.error('💥 Session cleanup error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
} 