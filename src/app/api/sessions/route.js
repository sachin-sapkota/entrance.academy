import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedUser } from '../../../lib/auth-helpers';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    // Get authenticated user from request
    const { user, error: authError } = await getAuthenticatedUser(request);
    
    if (authError || !user) {
      console.log('❌ Authentication failed:', authError);
      
      // Enhanced error response with debugging info
      return NextResponse.json({ 
        error: 'Authentication required - Please log in first',
        details: authError || 'No valid session found',
        action: 'redirect_to_login',
        debugging: {
          message: 'This error occurs when you are not logged in. Please visit /login to sign in.',
          hasAuthHeader: !!request.headers.get('Authorization'),
          hasCustomHeader: !!request.headers.get('X-Supabase-Auth'),
          hasCookies: !!request.headers.get('cookie'),
          timestamp: new Date().toISOString()
        }
      }, { status: 401 });
    }

    const { testId, action, duration, timeLeft } = await request.json();
    const userId = user.id; // Use the actual authenticated user ID

    if (!testId) {
      return NextResponse.json({ error: 'Missing testId' }, { status: 400 });
    }

    console.log('🎯 Session API request:', { testId, userId: user.id, userEmail: user.email, action });

    if (action === 'start') {
      // Check for existing active session
      const { data: existingSession, error: existingError } = await supabaseAdmin
        .from('test_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (existingSession && existingSession.length > 0 && !existingError) {
        const session = existingSession[0];
        
        // Check if this session is for the same test
        const sessionPracticeSetId = session.browser_state?.practiceSetId || session.test_id;
        
        if (sessionPracticeSetId === testId) {
          // Calculate remaining time based on elapsed time
          const startTime = new Date(session.created_at).getTime();
          const currentTime = new Date().getTime();
          const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);
          const totalDuration = session.browser_state?.totalDuration || 3600;
          const remainingTime = Math.max(0, totalDuration - elapsedSeconds);
          
          // Update browser state with current time
          const updatedBrowserState = {
            ...session.browser_state,
            timeLeft: remainingTime,
            lastActivity: new Date().toISOString()
          };

          const { data: updatedSession, error: updateError } = await supabaseAdmin
            .from('test_sessions')
            .update({
              browser_state: updatedBrowserState,
              last_activity_at: new Date().toISOString()
            })
            .eq('id', session.id)
            .select()
            .single();

          if (updateError) {
            console.error('❌ Failed to update existing session:', updateError);
          }

          const sessionData = formatSessionData(updatedSession || session);
          
          console.log('🔄 Session resumed:', { 
            sessionId: sessionData.id,
            timeLeft: remainingTime,
            answers: Object.keys(sessionData.answers || {}).length
          });
          
          return NextResponse.json({
            success: true,
            session: sessionData,
            isResumed: true,
            message: `Session restored with ${Math.floor(remainingTime / 60)} minutes remaining`
          });
        } else {
          // Deactivate the old session for a different test
          console.log('🔄 Deactivating old session for different test');
          await supabaseAdmin
            .from('test_sessions')
            .update({ is_active: false })
            .eq('id', session.id);
        }
      }

      // Create new session
      const testDuration = duration || 3600;
      const sessionToken = `${userId}-${testId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // The user already exists (authenticated), so we don't need to create a fake user
      // Just ensure the user profile exists in our users table
      const { data: existingUserProfile, error: userCheckError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();

      if (userCheckError || !existingUserProfile) {
        console.log('👤 User profile not found, creating from authenticated user:', user.email);
        
        // Create user profile from authenticated user data
        const { error: userCreateError } = await supabaseAdmin
          .from('users')
          .upsert({
            id: userId,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            role: user.email === 'admin@entrance.academy' ? 'admin' : (user.user_metadata?.role || 'free_user')
          }, { onConflict: 'id' });

        if (userCreateError) {
          console.error('❌ Failed to create user profile:', userCreateError);
          return NextResponse.json({ 
            error: 'Failed to create user profile',
            details: userCreateError.message 
          }, { status: 500 });
        }

        console.log('✅ User profile created successfully');
      }
      
      // Create a temporary test record that will be replaced during submission
      // This satisfies the foreign key constraint while allowing proper test creation later
      const tempTestRecord = {
        user_id: userId,
        test_name: 'Temporary Session Record',
        total_questions: 1,
        questions_order: [1],
        status: 'in_progress',
        started_at: new Date().toISOString(),
        meta_data: { 
          is_temporary: true, 
          practice_set_id: testId,
          temp_session: true 
        }
      };

      console.log('📝 Creating temporary test record for session...');

      const { data: tempTest, error: tempTestError } = await supabaseAdmin
        .from('tests')
        .insert(tempTestRecord)
        .select()
        .single();

      if (tempTestError) {
        console.error('❌ Failed to create temporary test record:', tempTestError);
        return NextResponse.json({ 
          error: 'Failed to create session',
          details: tempTestError.message 
        }, { status: 500 });
      }

      console.log('✅ Temporary test record created with ID:', tempTest.id);
      
      const newSession = {
        test_id: tempTest.id, // Use temporary test ID
        user_id: userId,
        session_token: sessionToken,
        is_active: true,
        current_question_index: 0,
        current_page: 1,
        answers: {},
        flagged_questions: [],
        last_activity_at: new Date().toISOString(),
        last_sync_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        browser_state: {
          timeLeft: testDuration,
          totalDuration: testDuration,
          startedAt: new Date().toISOString(),
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          practiceSetId: testId // Store original practice set ID
        }
      };

      console.log('📝 Creating session with data:', { 
        testId, 
        userId, 
        userEmail: user.email,
        sessionToken,
        duration: testDuration 
      });

      const { data: createdSession, error: createError } = await supabaseAdmin
        .from('test_sessions')
        .insert(newSession)
        .select()
        .single();

      if (createError) {
        console.error('❌ Failed to create session:', createError);
        
        // Handle duplicate session token by generating a new one
        if (createError.code === '23505' && createError.message.includes('test_sessions_session_token_key')) {
          console.log('🔄 Duplicate session token, generating new one...');
          const newSessionToken = `${userId}-${testId}-${Date.now()}-${Math.random().toString(36).substr(2, 12)}`;
          
          const retrySession = {
            ...newSession,
            session_token: newSessionToken
          };
          
          const { data: retryCreatedSession, error: retryCreateError } = await supabaseAdmin
            .from('test_sessions')
            .insert(retrySession)
            .select()
            .single();
          
          if (retryCreateError) {
            console.error('❌ Failed to create session on retry:', retryCreateError);
            return NextResponse.json({ 
              error: 'Failed to create session',
              details: retryCreateError.message 
            }, { status: 500 });
          }
          
          const sessionData = formatSessionData(retryCreatedSession);
          
          console.log('✅ Session created on retry:', { 
            sessionId: sessionData.id,
            duration: testDuration,
            answers: 0
          });
          
          return NextResponse.json({
            success: true,
            session: sessionData,
            isResumed: false,
            message: 'New session created'
          });
        }
        
        console.error('📋 Session data that failed:', newSession);
        return NextResponse.json({ 
          error: 'Failed to create session',
          details: createError.message 
        }, { status: 500 });
      }

      const sessionData = formatSessionData(createdSession);
      
      console.log('✅ New session created:', { 
        sessionId: sessionData.id,
        duration: testDuration,
        answers: 0
      });
      
      return NextResponse.json({
        success: true,
        session: sessionData,
        isResumed: false,
        message: 'New session created'
      });

    } else if (action === 'end') {
      // End session - find by practice set ID first
      const { data: allSessions, error: allSessionsError } = await supabaseAdmin
        .from('test_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);
      
      let sessionToEnd = null;
      if (!allSessionsError && allSessions) {
        sessionToEnd = allSessions.find(s => 
          s.browser_state?.practiceSetId === testId || s.test_id === testId
        );
      }
      
      let error = null;
      if (sessionToEnd) {
        const { error: endError } = await supabaseAdmin
          .from('test_sessions')
          .update({ 
            is_active: false,
            last_activity_at: new Date().toISOString()
          })
          .eq('id', sessionToEnd.id);
        error = endError;
      } else {
        // Fallback to old method
        const { error: endError } = await supabaseAdmin
          .from('test_sessions')
          .update({ 
            is_active: false,
            last_activity_at: new Date().toISOString()
          })
          .eq('test_id', testId)
          .eq('user_id', userId);
        error = endError;
      }

      if (error) {
        console.error('❌ Failed to end session:', error);
      }
      
      return NextResponse.json({ success: true, message: 'Session ended' });

    } else if (action === 'updateTimer') {
      // Update timer state
      if (timeLeft === undefined) {
        return NextResponse.json({ error: 'timeLeft is required for updateTimer action' }, { status: 400 });
      }
      
      // Find session by practice set ID first
      const { data: allSessions, error: allSessionsError } = await supabaseAdmin
        .from('test_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);
      
      let session = null;
      let sessionError = null;
      
      if (!allSessionsError && allSessions) {
        session = allSessions.find(s => 
          s.browser_state?.practiceSetId === testId || s.test_id === testId
        );
      }
      
      // If not found by practice set ID, try the old way
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
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }

      const updatedBrowserState = {
        ...session.browser_state,
        timeLeft,
        lastActivity: new Date().toISOString()
      };

      const { error: updateError } = await supabaseAdmin
        .from('test_sessions')
        .update({
          browser_state: updatedBrowserState,
          last_activity_at: new Date().toISOString()
        })
        .eq('id', session.id);

      if (updateError) {
        console.error('❌ Failed to update timer:', updateError);
        return NextResponse.json({ error: 'Failed to update timer' }, { status: 500 });
      }
      
      return NextResponse.json({ success: true, message: 'Timer updated' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('💥 Session API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message,
      debugging: {
        message: 'An unexpected error occurred. Check server logs for details.',
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    // Get authenticated user from request
    const { user, error: authError } = await getAuthenticatedUser(request);
    
    if (authError || !user) {
      console.log('❌ Authentication failed:', authError);
      return NextResponse.json({ 
        error: 'Authentication required - Please log in first',
        details: authError || 'No valid session found',
        action: 'redirect_to_login',
        debugging: {
          message: 'This error occurs when you are not logged in. Please visit /login to sign in.',
          hasAuthHeader: !!request.headers.get('Authorization'),
          hasCustomHeader: !!request.headers.get('X-Supabase-Auth'),
          hasCookies: !!request.headers.get('cookie'),
          timestamp: new Date().toISOString()
        }
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const testId = searchParams.get('testId');
    const userId = user.id; // Use the actual authenticated user ID

    if (!testId) {
      return NextResponse.json({ error: 'Missing testId' }, { status: 400 });
    }

    console.log('🔍 Getting session:', { testId, userId: user.id, userEmail: user.email });

    // First try to find session by practice set ID in browser state  
    const { data: allSessions, error: allSessionsError } = await supabaseAdmin
      .from('test_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    let session = null;
    let error = null;
    
    if (!allSessionsError && allSessions) {
      // Find session that has this practice set ID in browser state
      session = allSessions.find(s => 
        s.browser_state?.practiceSetId === testId || s.test_id === testId
      );
    }
    
    // If not found by practice set ID, try the old way (direct test_id match)
    if (!session) {
      const { data: directSession, error: directError } = await supabaseAdmin
        .from('test_sessions')
        .select('*')
        .eq('test_id', testId)
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
        
      session = directSession;
      error = directError;
    }

    if (error || !session) {
      console.log('❌ Session not found in database');
      return NextResponse.json({
        success: true,
        session: null
      });
    }

    // Check if session is expired
    if (session.expires_at && new Date(session.expires_at) < new Date()) {
      console.log('⏰ Session expired, deactivating');
      await supabaseAdmin
        .from('test_sessions')
        .update({ is_active: false })
        .eq('id', session.id);
      
      return NextResponse.json({
        success: true,
        session: null
      });
    }

    // Calculate current remaining time
    const startTime = new Date(session.created_at).getTime();
    const currentTime = new Date().getTime();
    const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);
    const totalDuration = session.browser_state?.totalDuration || 3600;
    const remainingTime = Math.max(0, totalDuration - elapsedSeconds);
    
    // Update session with current time
    const updatedBrowserState = {
      ...session.browser_state,
      timeLeft: remainingTime,
      lastActivity: new Date().toISOString()
    };

    await supabaseAdmin
      .from('test_sessions')
      .update({
        browser_state: updatedBrowserState,
        last_activity_at: new Date().toISOString()
      })
      .eq('id', session.id);

    const sessionData = formatSessionData({
      ...session,
      browser_state: updatedBrowserState
    });

    console.log('📋 Session retrieved:', { 
      sessionId: sessionData.id,
      answers: Object.keys(sessionData.answers || {}).length,
      timeLeft: remainingTime,
      flagged: (sessionData.flaggedQuestions || []).length,
      totalSessions: 1
    });

    return NextResponse.json({
      success: true,
      session: sessionData,
      isResumed: true  // Mark this as a resumed session
    });
  } catch (error) {
    console.error('💥 Session GET API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message,
      debugging: {
        message: 'An unexpected error occurred. Check server logs for details.',
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    // Get authenticated user from request
    const { user, error: authError } = await getAuthenticatedUser(request);
    
    if (authError || !user) {
      console.log('❌ Authentication failed:', authError);
      return NextResponse.json({ 
        error: 'Authentication required - Please log in first',
        details: authError || 'No valid session found',
        action: 'redirect_to_login'
      }, { status: 401 });
    }

    const { testId } = await request.json();
    const userId = user.id; // Use the actual authenticated user ID

    if (!testId) {
      return NextResponse.json({ error: 'Missing testId' }, { status: 400 });
    }

    console.log('🗑️ Deleting session:', { testId, userId: user.id, userEmail: user.email });

    // Find session by practice set ID first
    const { data: allSessions, error: allSessionsError } = await supabaseAdmin
      .from('test_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);
    
    let sessionToDelete = null;
    if (!allSessionsError && allSessions) {
      sessionToDelete = allSessions.find(s => 
        s.browser_state?.practiceSetId === testId || s.test_id === testId
      );
    }
    
    let error = null;
    if (sessionToDelete) {
      const { error: deleteError } = await supabaseAdmin
        .from('test_sessions')
        .update({ is_active: false })
        .eq('id', sessionToDelete.id);
      error = deleteError;
    } else {
      // Fallback to old method  
      const { error: deleteError } = await supabaseAdmin
        .from('test_sessions')
        .update({ is_active: false })
        .eq('test_id', testId)
        .eq('user_id', userId);
      error = deleteError;
    }
    
    if (error) {
      console.error('❌ Failed to delete session:', error);
    } else {
      console.log('✅ Session deleted successfully');
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Session deleted successfully' 
    });
  } catch (error) {
    console.error('💥 Session DELETE API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}

// Format database data to application format
function formatSessionData(data) {
  return {
    id: data.session_token,
    testId: data.browser_state?.practiceSetId || data.test_id, // Use practice set ID if available
    userId: data.user_id,
    answers: data.answers || {},
    currentPage: data.current_page || 1,
    flaggedQuestions: data.flagged_questions || [],
    isActive: data.is_active,
    lastActivity: data.last_activity_at,
    timeLeft: data.browser_state?.timeLeft || 3600,
    totalDuration: data.browser_state?.totalDuration || 3600,
    startedAt: data.browser_state?.startedAt || data.created_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at || data.last_activity_at,
    timeSpent: {}, // Legacy field for compatibility
    internalTestId: data.test_id // Keep track of the actual database test ID
  };
} 