import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const testId = searchParams.get('testId');
    const userId = searchParams.get('userId');

    if (!testId) {
      return NextResponse.json({ error: 'Missing testId parameter' }, { status: 400 });
    }

    console.log('🔍 Debug test lookup:', { testId, userId });

    // Check if test exists at all
    const { data: anyTest, error: anyTestError } = await supabaseAdmin
      .from('tests')
      .select('*')
      .eq('id', testId)
      .maybeSingle();

    console.log('📋 Any test found:', !!anyTest, anyTestError?.message);

    // Check if test exists for specific user
    let userTest = null;
    let userTestError = null;
    if (userId) {
      const { data, error } = await supabaseAdmin
        .from('tests')
        .select('*')
        .eq('id', testId)
        .eq('user_id', userId)
        .maybeSingle();
      
      userTest = data;
      userTestError = error;
      console.log('👤 User test found:', !!userTest, userTestError?.message);
    }

    // Check attempts
    const { data: attempts, error: attemptsError } = await supabaseAdmin
      .from('attempts')
      .select('*')
      .eq('test_id', testId);

    console.log('📝 Attempts found:', attempts?.length || 0, attemptsError?.message);

    // Check recent tests
    const { data: recentTests, error: recentError } = await supabaseAdmin
      .from('tests')
      .select('id, user_id, status, test_name, submitted_at, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    console.log('🕒 Recent tests:', recentTests?.length || 0);

    return NextResponse.json({
      success: true,
      debug: {
        searchParams: { testId, userId },
        anyTest: {
          found: !!anyTest,
          data: anyTest ? {
            id: anyTest.id,
            user_id: anyTest.user_id,
            status: anyTest.status,
            test_name: anyTest.test_name,
            submitted_at: anyTest.submitted_at,
            created_at: anyTest.created_at
          } : null,
          error: anyTestError?.message
        },
        userTest: {
          found: !!userTest,
          data: userTest ? {
            id: userTest.id,
            user_id: userTest.user_id,
            status: userTest.status,
            test_name: userTest.test_name,
            submitted_at: userTest.submitted_at,
            created_at: userTest.created_at
          } : null,
          error: userTestError?.message
        },
        attempts: {
          count: attempts?.length || 0,
          error: attemptsError?.message
        },
        recentTests: recentTests?.map(t => ({
          id: t.id,
          user_id: t.user_id.substring(0, 8) + '...',
          status: t.status,
          test_name: t.test_name,
          submitted_at: t.submitted_at,
          created_at: t.created_at
        })) || []
      }
    });

  } catch (error) {
    console.error('❌ Debug test lookup error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
} 