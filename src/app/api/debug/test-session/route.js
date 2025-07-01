import { NextResponse } from 'next/server';
import sessionManager from '../../../../lib/sessionManager';

export async function GET(request) {
  try {
    console.log('🧪 Testing session manager...');
    
    // Test session creation
    const testSessionKey = 'test-user-123-test-exam-456';
    const testSessionData = {
      testId: 'test-exam-456',
      userId: 'test-user-123',
      startedAt: new Date().toISOString(),
      totalDuration: 7200,
      timeLeft: 7200,
      answers: { 1: 'A', 2: 'B' },
      timeSpent: { 1: 30, 2: 45 },
      flaggedQuestions: [3, 5],
      currentPage: 1,
      lastActivity: new Date().toISOString(),
      isActive: true
    };

    console.log('📝 Creating test session...');
    const createdSession = await sessionManager.createSession(testSessionKey, testSessionData);
    
    if (!createdSession) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to create session',
        step: 'create'
      });
    }

    console.log('📋 Retrieving test session...');
    const retrievedSession = await sessionManager.getSession(testSessionKey);
    
    if (!retrievedSession) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to retrieve session',
        step: 'retrieve'
      });
    }

    console.log('🔄 Updating test session...');
    const updatedSession = await sessionManager.updateSession(testSessionKey, {
      answers: { 1: 'A', 2: 'B', 3: 'C' },
      timeLeft: 7100,
      currentPage: 2
    });

    if (!updatedSession) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to update session',
        step: 'update'
      });
    }

    console.log('📊 Getting all sessions...');
    const allSessions = await sessionManager.getAllSessions();

    console.log('🗑️ Cleaning up test session...');
    await sessionManager.deleteSession(testSessionKey);

    return NextResponse.json({
      success: true,
      message: 'Session manager test completed successfully',
      results: {
        created: !!createdSession,
        retrieved: !!retrievedSession,
        updated: !!updatedSession,
        totalSessions: Object.keys(allSessions).length,
        testData: {
          originalAnswers: Object.keys(testSessionData.answers).length,
          updatedAnswers: Object.keys(updatedSession.answers || {}).length,
          timeLeftUpdated: updatedSession.timeLeft === 7100,
          pageUpdated: updatedSession.currentPage === 2
        }
      }
    });

  } catch (error) {
    console.error('💥 Session manager test error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { action } = await request.json();
    
    if (action === 'cleanup') {
      console.log('🧹 Cleaning up expired sessions...');
      const expiredCount = await sessionManager.clearExpiredSessions();
      
      return NextResponse.json({
        success: true,
        message: `Cleaned up ${expiredCount} expired sessions`
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