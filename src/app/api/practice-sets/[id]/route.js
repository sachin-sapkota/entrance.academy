import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role for database operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request, { params }) {
  try {
    // Await params to fix Next.js 15 warning
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Practice set ID is required' },
        { status: 400 }
      );
    }

    console.log('📋 Fetching practice set:', id);

    // Get practice set data with all configuration fields
    const { data: practiceSet, error: practiceSetError } = await supabaseAdmin
      .from('practice_sets')
      .select('*')
      .eq('id', id)
      .eq('is_live', true)
      .single();

    if (practiceSetError || !practiceSet) {
      console.error('❌ Practice set not found:', practiceSetError);
      return NextResponse.json(
        { success: false, error: 'Practice set not found' },
        { status: 404 }
      );
    }

    // Get user ID from request headers or query params
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    let previousAttempts = [];

    // If user ID is provided, fetch their previous attempts
    if (userId) {
      console.log('👤 Fetching attempts for user:', userId);
      
      // Query for tests by test_config_id (new format) or legacy matching
      const { data: attempts, error: attemptsError } = await supabaseAdmin
        .from('tests')
        .select(`
          id,
          status,
          started_at,
          submitted_at,
          final_score,
          percentage,
          correct_answers,
          wrong_answers,
          total_questions,
          time_spent_seconds,
          test_name,
          test_config_id
        `)
        .eq('user_id', userId)
        .or(`test_config_id.eq.${id},id.eq.${id},test_name.eq.${practiceSet.title},meta_data->>practice_set_id.eq.${id}`)
        .eq('status', 'submitted')
        .order('submitted_at', { ascending: false });

      if (!attemptsError && attempts) {
        previousAttempts = attempts.map(attempt => ({
          id: attempt.id,
          completedAt: attempt.submitted_at,
          score: attempt.final_score || 0,
          percentage: Math.abs(attempt.percentage || 0), // Ensure positive percentage
          correctAnswers: attempt.correct_answers || 0,
          wrongAnswers: attempt.wrong_answers || 0,
          totalQuestions: attempt.total_questions || 0,
          timeSpent: attempt.time_spent_seconds || 0,
          status: attempt.status,
          testName: attempt.test_name,
          testConfigId: attempt.test_config_id
        }));
        
        console.log('📊 Found previous attempts:', {
          count: previousAttempts.length,
          practiceSetId: id,
          practiceSetTitle: practiceSet.title,
          attempts: previousAttempts.map(a => ({ 
            id: a.id, 
            score: a.score, 
            percentage: a.percentage,
            testName: a.testName,
            testConfigId: a.testConfigId
          }))
        });
      } else if (attemptsError) {
        console.error('❌ Error fetching attempts:', attemptsError);
      }
    }

    // Extract configuration from meta_data and existing columns
    const metaData = practiceSet.meta_data || {};
    
    const response = {
      success: true,
      practiceSet: {
        id: practiceSet.id,
        title: practiceSet.title,
        description: practiceSet.description,
        questionsCount: practiceSet.questions_count || 0,
        estimatedTime: practiceSet.estimated_time_minutes || 120,
        domains: practiceSet.domains || [],
        questions: practiceSet.questions || [],
        status: practiceSet.status,
        isLive: practiceSet.is_live,
        createdAt: practiceSet.created_at,
        // Enhanced configuration fields
        testType: metaData.testType || 'practice',
        difficulty: practiceSet.difficulty_level || 'medium',
        passingPercentage: practiceSet.passing_percentage || 40,
        instructions: metaData.instructions || '',
        isFree: practiceSet.is_free !== undefined ? practiceSet.is_free : true,
        price: practiceSet.price || 0,
        // Negative marking configuration
        enableNegativeMarking: metaData.enableNegativeMarking !== undefined ? metaData.enableNegativeMarking : true,
        negativeMarkingRatio: metaData.negativeMarkingRatio || 0.25,
        // Marks configuration - default to 1 mark per question as mentioned in the issue
        marksPerQuestion: metaData.marksPerQuestion || 1,
        totalMarks: (practiceSet.questions_count || 0) * (metaData.marksPerQuestion || 1),
        passMarks: Math.floor(((practiceSet.questions_count || 0) * (metaData.marksPerQuestion || 1)) * ((practiceSet.passing_percentage || 40) / 100))
      },
      previousAttempts
    };

    console.log('✅ Practice set data retrieved successfully with configuration');
    return NextResponse.json(response);

  } catch (error) {
    console.error('💥 Error fetching practice set:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 