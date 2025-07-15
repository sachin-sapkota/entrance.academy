import { NextResponse } from 'next/server';
import optimizedSessionManager from '../../../../lib/optimizedSessionManager';
import { getAuthenticatedUser } from '../../../../lib/auth-helpers';

/**
 * Optimized session management API
 * Uses new database schema for better performance
 */

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
    const testId = searchParams.get('testId');
    const sessionId = searchParams.get('sessionId');
    const metrics = searchParams.get('metrics') === 'true';

    // Get performance metrics
    if (metrics && sessionId) {
      const metricsData = await optimizedSessionManager.getPerformanceMetrics(sessionId);
      return NextResponse.json({
        success: true,
        metrics: metricsData
      });
    }

    // Get session data
    if (testId) {
      const sessionKey = `${user.id}-${testId}`;
      const session = await optimizedSessionManager.getSession(sessionKey);
      
      if (!session) {
        return NextResponse.json({
          success: false,
          error: 'Session not found'
        }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        session: session,
        isResumed: true
      });
    }

    return NextResponse.json({
      error: 'Missing required parameters'
    }, { status: 400 });

  } catch (error) {
    console.error('💥 Optimized session GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}

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
    const { testId, action, duration, currentPage, timeLeft, isPaused } = body;

    console.log('🚀 Optimized session POST:', { 
      testId, 
      action, 
      userId: user.id,
      userEmail: user.email
    });

    if (!testId || !action) {
      return NextResponse.json({
        error: 'Missing required fields'
      }, { status: 400 });
    }

    const sessionKey = `${user.id}-${testId}`;

    switch (action) {
      case 'start':
        const sessionData = {
          testId,
          userId: user.id,
          currentPage: currentPage || 1,
          timeLeft: duration || 7200,
          totalDuration: duration || 7200,
          startedAt: new Date().toISOString(),
          practiceSetId: testId
        };

        const newSession = await optimizedSessionManager.createSession(sessionKey, sessionData);
        
        if (!newSession) {
          return NextResponse.json({
            error: 'Failed to create session'
          }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          session: newSession,
          message: 'Session created successfully'
        });

      case 'updateTimer':
        const sessionId = body.sessionId;
        if (!sessionId) {
          return NextResponse.json({
            error: 'Session ID required for timer update'
          }, { status: 400 });
        }

        const timerUpdated = await optimizedSessionManager.updateTimer(
          sessionId, 
          timeLeft, 
          isPaused
        );

        if (!timerUpdated) {
          return NextResponse.json({
            error: 'Failed to update timer'
          }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          message: 'Timer updated successfully'
        });

      case 'end':
        const deleted = await optimizedSessionManager.deleteSession(sessionKey);
        
        if (!deleted) {
          return NextResponse.json({
            error: 'Failed to end session'
          }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          message: 'Session ended successfully'
        });

      case 'cleanup':
        // Admin-only operation
        if (user.role !== 'admin') {
          return NextResponse.json({
            error: 'Admin access required'
          }, { status: 403 });
        }

        const cleaned = await optimizedSessionManager.cleanupExpiredSessions();
        
        return NextResponse.json({
          success: cleaned,
          message: cleaned ? 'Cleanup completed' : 'Cleanup failed'
        });

      default:
        return NextResponse.json({
          error: 'Invalid action'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('💥 Optimized session POST error:', error);
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
    const { sessionId, answers, flaggedQuestions, currentPage, timeLeft, batchUpdate } = body;

    console.log('💾 Optimized session PUT:', { 
      sessionId, 
      answersCount: Object.keys(answers || {}).length,
      flaggedCount: (flaggedQuestions || []).length,
      batchUpdate: batchUpdate || false
    });

    if (!sessionId) {
      return NextResponse.json({
        error: 'Session ID required'
      }, { status: 400 });
    }

    // Batch update for better performance
    if (batchUpdate !== false) {
      const success = await optimizedSessionManager.batchUpdateAnswers(
        sessionId,
        answers || {},
        flaggedQuestions || [],
        currentPage,
        timeLeft
      );

      if (!success) {
        return NextResponse.json({
          error: 'Failed to update session'
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Session updated successfully'
      });
    }

    // Individual updates (for backward compatibility)
    const results = {
      answered: 0,
      flagged: 0,
      errors: []
    };

    // Update answers
    if (answers && Object.keys(answers).length > 0) {
      for (const [questionId, selectedAnswer] of Object.entries(answers)) {
        const success = await optimizedSessionManager.updateAnswer(
          sessionId,
          questionId,
          selectedAnswer,
          true // Use deferred/batched mode
        );
        
        if (success) {
          results.answered++;
        } else {
          results.errors.push(`Failed to update answer for question ${questionId}`);
        }
      }
    }

    // Update flags
    if (flaggedQuestions && flaggedQuestions.length > 0) {
      for (const questionId of flaggedQuestions) {
        const success = await optimizedSessionManager.toggleFlag(
          sessionId,
          questionId,
          true
        );
        
        if (success) {
          results.flagged++;
        } else {
          results.errors.push(`Failed to flag question ${questionId}`);
        }
      }
    }

    // Update timer if provided
    if (timeLeft !== undefined) {
      await optimizedSessionManager.updateTimer(sessionId, timeLeft);
    }

    return NextResponse.json({
      success: true,
      results: results,
      message: 'Session updated successfully'
    });

  } catch (error) {
    console.error('💥 Optimized session PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request);
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Authentication required',
        details: authError 
      }, { status: 401 });
    }

    const body = await request.json();
    const { testId, sessionToken } = body;

    if (!testId && !sessionToken) {
      return NextResponse.json({
        error: 'Either testId or sessionToken required'
      }, { status: 400 });
    }

    let tokenToDelete = sessionToken;
    if (!tokenToDelete && testId) {
      tokenToDelete = `${user.id}-${testId}`;
    }

    const deleted = await optimizedSessionManager.deleteSession(tokenToDelete);
    
    if (!deleted) {
      return NextResponse.json({
        error: 'Failed to delete session'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Session deleted successfully'
    });

  } catch (error) {
    console.error('💥 Optimized session DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
} 