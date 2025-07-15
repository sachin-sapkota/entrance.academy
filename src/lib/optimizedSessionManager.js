/**
 * Optimized Session Manager
 * Uses separate tables for answers and session state for better performance
 */

import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class OptimizedSessionManager {
  constructor() {
    this.supabase = supabaseAdmin;
    this.batchQueue = new Map(); // For batching updates
    this.batchTimeout = null;
    this.BATCH_DELAY = 500; // 500ms batching delay
    this.TIMER_UPDATE_INTERVAL = 10000; // 10 seconds for timer updates
  }

  /**
   * Create a new session with optimized schema
   */
  async createSession(sessionKey, sessionData) {
    try {
      const parts = sessionKey.split('-');
      if (parts.length < 2) {
        console.error('❌ Invalid session key format:', sessionKey);
        return null;
      }

      const userId = parts[0];
      const testId = parts.slice(1).join('-');

      // Check if session already exists
      const { data: existingSession } = await this.supabase
        .from('test_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('test_id', testId)
        .eq('is_active', true)
        .single();

      if (existingSession) {
        console.log('🔄 Updating existing session:', existingSession.id);
        return await this.getSession(sessionKey);
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
        answers: {}, // Keep empty for compatibility
        flagged_questions: [],
        last_activity_at: new Date().toISOString(),
        last_sync_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        browser_state: {
          timeLeft: sessionData.timeLeft || 7200,
          totalDuration: sessionData.totalDuration || 7200,
          startedAt: sessionData.startedAt || new Date().toISOString(),
          isActive: true,
          practiceSetId: sessionData.practiceSetId || testId
        }
      };

      // Insert session
      const { data: createdSession, error } = await this.supabase
        .from('test_sessions')
        .insert(session)
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to create session:', error);
        return null;
      }

      // Create session state
      const { error: stateError } = await this.supabase
        .from('session_state')
        .insert({
          session_id: createdSession.id,
          current_page: sessionData.currentPage || 1,
          time_left_seconds: sessionData.timeLeft || 7200,
          total_duration_seconds: sessionData.totalDuration || 7200,
          is_paused: false
        });

      if (stateError) {
        console.error('❌ Failed to create session state:', stateError);
        // Cleanup created session
        await this.supabase
          .from('test_sessions')
          .update({ is_active: false })
          .eq('id', createdSession.id);
        return null;
      }

      console.log('✅ Session created successfully:', createdSession.id);
      return await this.getSession(sessionKey);
    } catch (error) {
      console.error('💥 Error creating session:', error);
      return null;
    }
  }

  /**
   * Get session with optimized data retrieval
   */
  async getSession(sessionKey) {
    try {
      const parts = sessionKey.split('-');
      if (parts.length < 2) {
        console.error('❌ Invalid session key format:', sessionKey);
        return null;
      }

      const userId = parts[0];
      const testId = parts.slice(1).join('-');

      // Get session from database
      const { data: session, error } = await this.supabase
        .from('test_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('test_id', testId)
        .eq('is_active', true)
        .single();

      if (error || !session) {
        console.log(`❌ Session not found for user ${userId}, test ${testId}`);
        return null;
      }

      // Check if session is expired
      if (session.expires_at && new Date(session.expires_at) < new Date()) {
        console.log(`⏰ Session expired:`, session.session_token);
        await this.deleteSession(session.session_token);
        return null;
      }

      // Get session data using the optimized function
      const { data: sessionData, error: dataError } = await this.supabase
        .rpc('get_session_with_answers', { p_session_id: session.id });

      if (dataError) {
        console.error('❌ Failed to get session data:', dataError);
        return null;
      }

      console.log(`📋 Session retrieved:`, {
        sessionId: session.id,
        userId,
        testId,
        answers: sessionData?.answer_count || 0,
        timeLeft: sessionData?.time_left,
        flagged: sessionData?.flagged_count || 0
      });

      return this.formatSessionData(session, sessionData);
    } catch (error) {
      console.error('💥 Error getting session:', error);
      return null;
    }
  }

  /**
   * Update single answer with optimized upsert
   */
  async updateAnswer(sessionId, questionId, selectedAnswer, isDeferred = false) {
    try {
      if (isDeferred) {
        // Add to batch queue
        const batchKey = `${sessionId}-${questionId}`;
        this.batchQueue.set(batchKey, {
          sessionId,
          questionId,
          selectedAnswer,
          timestamp: Date.now()
        });

        // Process batch after delay
        this.scheduleBatchProcess();
        return true;
      }

      // Direct update using optimized function
      const { data, error } = await this.supabase
        .rpc('upsert_session_answer', {
          p_session_id: sessionId,
          p_question_id: questionId,
          p_selected_answer: selectedAnswer,
          p_is_flagged: false,
          p_time_spent: 0
        });

      if (error) {
        console.error('❌ Failed to update answer:', error);
        return false;
      }

      console.log(`✅ Answer updated:`, { sessionId, questionId, selectedAnswer });
      return true;
    } catch (error) {
      console.error('💥 Error updating answer:', error);
      return false;
    }
  }

  /**
   * Batch update multiple answers efficiently
   */
  async batchUpdateAnswers(sessionId, answers, flaggedQuestions = [], currentPage = null, timeLeft = null) {
    try {
      const { data, error } = await this.supabase
        .rpc('batch_update_session_answers', {
          p_session_id: sessionId,
          p_answers: answers,
          p_flagged_questions: flaggedQuestions,
          p_current_page: currentPage,
          p_time_left: timeLeft
        });

      if (error) {
        console.error('❌ Failed to batch update answers:', error);
        return false;
      }

      console.log(`✅ Batch update completed:`, {
        sessionId,
        updatedCount: data.updated_count,
        timestamp: new Date(data.timestamp * 1000)
      });

      return true;
    } catch (error) {
      console.error('💥 Error in batch update:', error);
      return false;
    }
  }

  /**
   * Update only timer state (lightweight)
   */
  async updateTimer(sessionId, timeLeft, isPaused = false) {
    try {
      const { data, error } = await this.supabase
        .rpc('update_session_timer', {
          p_session_id: sessionId,
          p_time_left: timeLeft,
          p_is_paused: isPaused
        });

      if (error) {
        console.error('❌ Failed to update timer:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('💥 Error updating timer:', error);
      return false;
    }
  }

  /**
   * Schedule batch processing with debouncing
   */
  scheduleBatchProcess() {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    this.batchTimeout = setTimeout(() => {
      this.processBatch();
    }, this.BATCH_DELAY);
  }

  /**
   * Process queued batch updates
   */
  async processBatch() {
    if (this.batchQueue.size === 0) return;

    const batchItems = Array.from(this.batchQueue.values());
    this.batchQueue.clear();

    // Group by session
    const sessionGroups = batchItems.reduce((acc, item) => {
      if (!acc[item.sessionId]) {
        acc[item.sessionId] = {};
      }
      acc[item.sessionId][item.questionId] = item.selectedAnswer;
      return acc;
    }, {});

    // Process each session batch
    for (const [sessionId, answers] of Object.entries(sessionGroups)) {
      await this.batchUpdateAnswers(sessionId, answers);
    }

    console.log(`📦 Processed batch for ${Object.keys(sessionGroups).length} sessions`);
  }

  /**
   * Toggle question flag status
   */
  async toggleFlag(sessionId, questionId, isFlagged) {
    try {
      const { data, error } = await this.supabase
        .rpc('upsert_session_answer', {
          p_session_id: sessionId,
          p_question_id: questionId,
          p_selected_answer: '', // Keep existing answer
          p_is_flagged: isFlagged,
          p_time_spent: 0
        });

      if (error) {
        console.error('❌ Failed to toggle flag:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('💥 Error toggling flag:', error);
      return false;
    }
  }

  /**
   * Delete/deactivate session
   */
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

      console.log(`🗑️ Session deactivated:`, sessionToken);
      return true;
    } catch (error) {
      console.error('💥 Error deleting session:', error);
      return false;
    }
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(sessionId) {
    try {
      const { data, error } = await this.supabase
        .from('session_performance_view')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (error) {
        console.error('❌ Failed to get performance metrics:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('💥 Error getting performance metrics:', error);
      return null;
    }
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions() {
    try {
      const { error } = await this.supabase
        .from('test_sessions')
        .update({ is_active: false })
        .lt('expires_at', new Date().toISOString());

      if (error) {
        console.error('❌ Failed to cleanup expired sessions:', error);
        return false;
      }

      console.log('🧹 Expired sessions cleaned up');
      return true;
    } catch (error) {
      console.error('💥 Error cleaning up expired sessions:', error);
      return false;
    }
  }

  /**
   * Generate session token
   */
  generateSessionToken(userId, testId) {
    return `${userId}-${testId}-${Date.now()}`;
  }

  /**
   * Format session data for client
   */
  formatSessionData(session, sessionData) {
    return {
      id: session.id,
      sessionId: session.id,
      testId: session.test_id,
      userId: session.user_id,
      sessionToken: session.session_token,
      isActive: session.is_active,
      answers: sessionData?.answers || {},
      flaggedQuestions: sessionData?.flagged_questions || [],
      currentPage: sessionData?.current_page || 1,
      timeLeft: sessionData?.time_left || 7200,
      totalDuration: sessionData?.total_duration || 7200,
      isPaused: sessionData?.is_paused || false,
      lastActivity: sessionData?.last_activity_at || session.last_activity_at,
      answerCount: sessionData?.answer_count || 0,
      flaggedCount: sessionData?.flagged_count || 0,
      saveCount: sessionData?.save_count || 0,
      createdAt: session.created_at,
      updatedAt: session.updated_at
    };
  }
}

// Export singleton instance
const optimizedSessionManager = new OptimizedSessionManager();
export default optimizedSessionManager; 