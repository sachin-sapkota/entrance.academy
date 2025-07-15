import { NextResponse } from 'next/server';
import optimizedSessionManager from '../../../../lib/optimizedSessionManager';
import { getAuthenticatedUser } from '../../../../lib/auth-helpers';

/**
 * Optimized answer submission API
 * Handles individual answer updates with batching and performance optimization
 */

export async function POST(request) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request);
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Authentication required',
        details: authError 
      }, { status: 401 });
    }

    const body = await request.json();
    const { 
      sessionId, 
      questionId, 
      selectedAnswer, 
      timeSpent, 
      isFlagged = false,
      useBatching = true 
    } = body;

    console.log('📝 Optimized answer submission:', { 
      sessionId, 
      questionId, 
      selectedAnswer, 
      timeSpent,
      isFlagged,
      useBatching
    });

    if (!sessionId || !questionId || selectedAnswer === undefined) {
      return NextResponse.json({
        error: 'Missing required fields: sessionId, questionId, selectedAnswer'
      }, { status: 400 });
    }

    // Update answer using optimized upsert
    const success = await optimizedSessionManager.updateAnswer(
      sessionId,
      questionId,
      selectedAnswer,
      useBatching // Use batching for better performance
    );

    if (!success) {
      return NextResponse.json({
        error: 'Failed to save answer'
      }, { status: 500 });
    }

    // Update flag status if needed
    if (isFlagged !== undefined) {
      await optimizedSessionManager.toggleFlag(sessionId, questionId, isFlagged);
    }

    return NextResponse.json({
      success: true,
      message: 'Answer saved successfully',
      data: {
        sessionId,
        questionId,
        selectedAnswer,
        isFlagged,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('💥 Optimized answer submission error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request);
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Authentication required',
        details: authError 
      }, { status: 401 });
    }

    const body = await request.json();
    const { 
      sessionId, 
      answers, 
      flaggedQuestions = [],
      currentPage,
      timeLeft,
      forceBatch = true 
    } = body;

    console.log('💾 Optimized batch answer update:', { 
      sessionId, 
      answersCount: Object.keys(answers || {}).length,
      flaggedCount: flaggedQuestions.length,
      currentPage,
      timeLeft,
      forceBatch
    });

    if (!sessionId) {
      return NextResponse.json({
        error: 'Session ID required'
      }, { status: 400 });
    }

    if (!answers || Object.keys(answers).length === 0) {
      return NextResponse.json({
        error: 'No answers provided'
      }, { status: 400 });
    }

    // Use batch update for better performance
    const success = await optimizedSessionManager.batchUpdateAnswers(
      sessionId,
      answers,
      flaggedQuestions,
      currentPage,
      timeLeft
    );

    if (!success) {
      return NextResponse.json({
        error: 'Failed to update answers'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Answers updated successfully',
      data: {
        sessionId,
        answersCount: Object.keys(answers).length,
        flaggedCount: flaggedQuestions.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('💥 Optimized batch answer update error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request);
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Authentication required',
        details: authError 
      }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId, questionId, isFlagged } = body;

    console.log('🚩 Optimized flag toggle:', { 
      sessionId, 
      questionId, 
      isFlagged
    });

    if (!sessionId || !questionId || isFlagged === undefined) {
      return NextResponse.json({
        error: 'Missing required fields: sessionId, questionId, isFlagged'
      }, { status: 400 });
    }

    const success = await optimizedSessionManager.toggleFlag(
      sessionId,
      questionId,
      isFlagged
    );

    if (!success) {
      return NextResponse.json({
        error: 'Failed to update flag status'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Flag status updated successfully',
      data: {
        sessionId,
        questionId,
        isFlagged,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('💥 Optimized flag toggle error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request);
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Authentication required',
        details: authError 
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const questionId = searchParams.get('questionId');

    if (!sessionId) {
      return NextResponse.json({
        error: 'Session ID required'
      }, { status: 400 });
    }

    // Get session data with answers
    const sessionKey = `${user.id}-${sessionId}`;
    const session = await optimizedSessionManager.getSession(sessionKey);
    
    if (!session) {
      return NextResponse.json({
        error: 'Session not found'
      }, { status: 404 });
    }

    // If specific question requested, return just that answer
    if (questionId) {
      const answer = session.answers[questionId];
      const isFlagged = session.flaggedQuestions.includes(questionId);
      
      return NextResponse.json({
        success: true,
        data: {
          questionId,
          selectedAnswer: answer || null,
          isFlagged,
          timestamp: session.lastActivity
        }
      });
    }

    // Return all answers
    return NextResponse.json({
      success: true,
      data: {
        sessionId: session.sessionId,
        answers: session.answers,
        flaggedQuestions: session.flaggedQuestions,
        answerCount: session.answerCount,
        flaggedCount: session.flaggedCount,
        lastActivity: session.lastActivity
      }
    });

  } catch (error) {
    console.error('💥 Optimized answer GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
} 