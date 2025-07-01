import { NextResponse } from 'next/server';
import sessionManager from '../../../../lib/sessionManager';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const sessionKey = searchParams.get('sessionKey');
    const userId = searchParams.get('userId');
    const testId = searchParams.get('testId');

    if (action === 'check' && userId && testId) {
      // Check specific session by userId and testId
      const sessionKeyToCheck = `${userId}-${testId}`;
      const session = sessionManager.getSession(sessionKeyToCheck);
      const allSessions = sessionManager.getAllSessions();
      
      return NextResponse.json({
        success: true,
        sessionKey: sessionKeyToCheck,
        sessionExists: !!session,
        session: session,
        allSessionKeys: Object.keys(allSessions),
        sessionCount: Object.keys(allSessions).length,
        requestedUserId: userId,
        requestedTestId: testId
      });
    }

    if (action === 'get' && sessionKey) {
      // Get specific session
      const session = sessionManager.getSession(sessionKey);
      return NextResponse.json({
        success: true,
        session,
        found: !!session
      });
    }

    if (action === 'clear') {
      // Clear all sessions
      const allSessions = sessionManager.getAllSessions();
      const sessionKeys = Object.keys(allSessions);
      sessionKeys.forEach(key => sessionManager.deleteSession(key));
      
      return NextResponse.json({
        success: true,
        message: `Cleared ${sessionKeys.length} sessions`,
        clearedSessions: sessionKeys
      });
    }

    if (action === 'cleanup') {
      // Clean expired sessions
      const removedCount = sessionManager.clearExpiredSessions();
      return NextResponse.json({
        success: true,
        message: `Removed ${removedCount} expired sessions`
      });
    }

    // Default: return all sessions
    const allSessions = sessionManager.getAllSessions();
    const sessionCount = Object.keys(allSessions).length;
    
    return NextResponse.json({
      success: true,
      sessionCount,
      sessions: allSessions,
      sessionKeys: Object.keys(allSessions),
      timestamp: new Date().toISOString(),
      memoryUsage: process.memoryUsage ? process.memoryUsage() : null
    });
  } catch (error) {
    console.error('Debug sessions API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
} 