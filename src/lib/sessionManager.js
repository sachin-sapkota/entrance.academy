import { createClient } from '@supabase/supabase-js';

// Production-grade session manager using existing test_sessions table
class SessionManager {
  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    console.log('🏗️ SessionManager initialized with database persistence');
  }

  // Generate proper session token
  generateSessionToken(userId, testId) {
    return `${userId}-${testId}-${Date.now()}`;
  }

  async createSession(sessionKey, sessionData) {
    try {
      // Extract userId and testId from sessionKey format: userId-testId
      const parts = sessionKey.split('-');
      if (parts.length < 2) {
        console.error('❌ Invalid session key format:', sessionKey);
        return null;
      }
      
      const userId = parts[0];
      const testId = parts.slice(1).join('-'); // Handle testIds with hyphens
      
      // Check if session already exists for this user-test combination
      const { data: existingSession } = await this.supabase
        .from('test_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('test_id', testId)
        .eq('is_active', true)
        .single();

      if (existingSession) {
        console.log('🔄 Updating existing session:', existingSession.session_token);
        return await this.updateSession(existingSession.session_token, sessionData);
      }

      // Create new session
      const sessionToken = this.generateSessionToken(userId, testId);
      const session = {
        test_id: testId,
        user_id: userId,
        session_token: sessionToken,
        is_active: true,
        current_question_index: 0,
        current_page: sessionData.currentPage || 1,
        answers: sessionData.answers || {},
        flagged_questions: sessionData.flaggedQuestions || [],
        last_activity_at: new Date().toISOString(),
        last_sync_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        browser_state: {
          timeLeft: sessionData.timeLeft || 7200,
          totalDuration: sessionData.totalDuration || 7200,
          startedAt: sessionData.startedAt || new Date().toISOString(),
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      };

      const { data, error } = await this.supabase
        .from('test_sessions')
        .insert(session)
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to create session:', error);
        return null;
      }

      console.log(`✅ Session created in database:`, { 
        sessionToken,
        userId,
        testId,
        answers: Object.keys(sessionData.answers || {}).length
      });
      
      // Return data in the format expected by the application
      return this.formatSessionData(data);
    } catch (error) {
      console.error('💥 Error creating session:', error);
      return null;
    }
  }

  async getSession(sessionKey) {
    try {
      // Extract userId and testId from sessionKey
      const parts = sessionKey.split('-');
      if (parts.length < 2) {
        console.error('❌ Invalid session key format:', sessionKey);
        return null;
      }
      
      const userId = parts[0];
      const testId = parts.slice(1).join('-');

      // Find active session for this user-test combination
      const { data, error } = await this.supabase
        .from('test_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('test_id', testId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        console.log(`❌ Session not found for user ${userId}, test ${testId}`);
        return null;
      }

      // Check if session is expired
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        console.log(`⏰ Session expired:`, data.session_token);
        await this.deleteSession(data.session_token);
        return null;
      }

      console.log(`📋 Session retrieved from database:`, { 
        sessionToken: data.session_token,
        userId,
        testId,
        answers: Object.keys(data.answers || {}).length,
        timeLeft: data.browser_state?.timeLeft,
        flagged: (data.flagged_questions || []).length
      });

      return this.formatSessionData(data);
    } catch (error) {
      console.error('💥 Error getting session:', error);
      return null;
    }
  }

  async updateSession(sessionToken, updates) {
    try {
      // Get the existing session
      const { data: existingData, error: getError } = await this.supabase
        .from('test_sessions')
        .select('*')
        .eq('session_token', sessionToken)
        .single();

      if (getError || !existingData) {
        console.log(`❌ Session update failed: ${sessionToken} not found`);
        return null;
      }

      const updatedBrowserState = {
        ...existingData.browser_state,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      const updateData = {
        last_activity_at: new Date().toISOString(),
        last_sync_at: new Date().toISOString(),
        browser_state: updatedBrowserState
      };

      // Update specific fields if provided
      if (updates.answers) {
        updateData.answers = updates.answers;
      }
      if (updates.currentPage) {
        updateData.current_page = updates.currentPage;
      }
      if (updates.flaggedQuestions) {
        updateData.flagged_questions = updates.flaggedQuestions;
      }
      if (updates.isActive !== undefined) {
        updateData.is_active = updates.isActive;
      }

      const { data, error } = await this.supabase
        .from('test_sessions')
        .update(updateData)
        .eq('session_token', sessionToken)
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to update session:', error);
        return null;
      }

      console.log(`🔄 Session updated in database:`, { 
        sessionToken,
        answers: Object.keys(data.answers || {}).length,
        timeLeft: data.browser_state?.timeLeft,
        flagged: (data.flagged_questions || []).length 
      });

      return this.formatSessionData(data);
    } catch (error) {
      console.error('💥 Error updating session:', error);
      return null;
    }
  }

  async deleteSession(sessionToken) {
    try {
      const { error } = await this.supabase
        .from('test_sessions')
        .update({ is_active: false })
        .eq('session_token', sessionToken);

      if (error) {
        console.error('❌ Failed to delete session:', error);
        return false;
      }

      console.log(`🗑️ Session deactivated in database:`, sessionToken);
      return true;
    } catch (error) {
      console.error('💥 Error deleting session:', error);
      return false;
    }
  }

  async getAllSessions() {
    try {
      const { data, error } = await this.supabase
        .from('test_sessions')
        .select('*')
        .eq('is_active', true);

      if (error) {
        console.error('❌ Failed to get all sessions:', error);
        return {};
      }

      const sessions = {};
      data.forEach(session => {
        const sessionData = this.formatSessionData(session);
        sessions[session.session_token] = {
          ...sessionData,
          answersCount: Object.keys(session.answers || {}).length,
          flaggedCount: (session.flagged_questions || []).length
        };
      });

      return sessions;
    } catch (error) {
      console.error('💥 Error getting all sessions:', error);
      return {};
    }
  }

  async clearExpiredSessions() {
    try {
      const { data, error } = await this.supabase
        .from('test_sessions')
        .update({ is_active: false })
        .lt('expires_at', new Date().toISOString())
        .eq('is_active', true)
        .select('session_token');

      if (error) {
        console.error('❌ Failed to clear expired sessions:', error);
        return 0;
      }

      const expiredCount = data?.length || 0;
      if (expiredCount > 0) {
        console.log(`🕐 Cleared ${expiredCount} expired sessions from database`);
      }

      return expiredCount;
    } catch (error) {
      console.error('💥 Error clearing expired sessions:', error);
      return 0;
    }
  }

  // Format database data to application format
  formatSessionData(data) {
    return {
      id: data.session_token,
      testId: data.test_id,
      userId: data.user_id,
      answers: data.answers || {},
      currentPage: data.current_page,
      flaggedQuestions: data.flagged_questions || [],
      isActive: data.is_active,
      lastActivity: data.last_activity_at,
      timeLeft: data.browser_state?.timeLeft || 7200,
      totalDuration: data.browser_state?.totalDuration || 7200,
      startedAt: data.browser_state?.startedAt || data.created_at,
      ...data.browser_state
    };
  }
}

// Ensure singleton pattern - create only one instance globally
let sessionManagerInstance;

if (global.sessionManager) {
  sessionManagerInstance = global.sessionManager;
} else {
  sessionManagerInstance = new SessionManager();
  global.sessionManager = sessionManagerInstance;
}

// Clean up expired sessions every hour
if (typeof setInterval !== 'undefined' && !global.sessionCleanupInterval) {
  global.sessionCleanupInterval = setInterval(() => {
    sessionManagerInstance.clearExpiredSessions();
  }, 60 * 60 * 1000);
}

export default sessionManagerInstance;