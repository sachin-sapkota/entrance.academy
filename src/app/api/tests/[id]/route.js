import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedUser } from '../../../../lib/auth-helpers';
import { logger } from '../../../../lib/logger';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request, { params }) {
  try {
    // Get authenticated user from request
    const { user, error: authError } = await getAuthenticatedUser(request);
    
    if (authError || !user) {
      logger.warn('Test results authentication failed', { error: authError });
      return NextResponse.json({ 
        error: 'Authentication required',
        details: authError 
      }, { status: 401 });
    }

    const { id: testId } = await params;
    const userId = user.id;

    if (!testId) {
      logger.warn('Test results missing testId', { userId });
      return NextResponse.json({ error: 'Missing testId' }, { status: 400 });
    }

    logger.debug('Fetching test results', { testId, userId: userId.substring(0, 8) + '...' });

    // Get test record from database
    const { data: testData, error: testError } = await supabaseAdmin
      .from('tests')
      .select('*')
      .eq('id', testId)
      .eq('user_id', userId)
      .single();

    if (testError || !testData) {
      logger.warn('Test not found or not accessible', { 
        testId, 
        userId: userId.substring(0, 8) + '...',
        error: testError?.message 
      });
      return NextResponse.json({ 
        success: false,
        error: 'Test not found or not accessible' 
      }, { status: 404 });
    }

    logger.debug('Test found', { 
      testId,
      status: testData.status,
      percentage: testData.percentage
    });

    // Get attempt records for detailed results
    const { data: attempts, error: attemptsError } = await supabaseAdmin
      .from('attempts')
      .select(`
        *,
        question:questions(*)
      `)
      .eq('test_id', testId);

    if (attemptsError) {
      logger.warn('Could not fetch attempt details', { 
        testId,
        error: attemptsError.message 
      });
    }

    logger.debug('Found attempts', { 
      testId,
      attemptsCount: attempts?.length || 0 
    });

    // Format the response
    const response = {
      success: true,
      test: testData,
      attempts: attempts || []
    };

    return NextResponse.json(response);

  } catch (error) {
    logger.error('Failed to fetch test results', { 
      error: error.message,
      stack: error.stack 
    });
    
    return NextResponse.json({ 
      success: false,
      error: `Failed to fetch test results: ${error.message}`,
      details: error.stack 
    }, { status: 500 });
  }
} 