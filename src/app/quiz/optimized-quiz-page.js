'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { 
  setAnswer, 
  setCurrentPage, 
  decrementTimer, 
  restoreSession, 
  startTest,
  resetQuiz,
  setTimer
} from '../../store/slices/quizSlice';
import { authenticatedFetch } from '../../lib/supabase';
import { useAuth } from '../../lib/auth-helpers';
import Toast from '../components/Toast';
import QuizHeader from '../components/QuizHeader';
import QuizSidebar from '../components/QuizSidebar';
import QuestionCard from '../components/QuestionCard';
import EndTestModal from '../components/EndTestModal';
import AutoSaveIndicator from '../components/AutoSaveIndicator';

// Optimized configuration for better performance
const OPTIMIZED_CONFIG = {
  AUTO_SAVE_INTERVAL: 30000, // 30 seconds - reduced frequency
  TIMER_SAVE_INTERVAL: 45000, // 45 seconds for timer
  ANSWER_BATCH_DELAY: 1000, // 1 second batching
  DEBOUNCE_DELAY: 500, // 500ms debounce
  QUESTIONS_PER_PAGE: 20,
  USE_BATCHING: true,
  ENABLE_PERFORMANCE_METRICS: true
};

export default function OptimizedQuizPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useAuth();

  // Redux state
  const { 
    answers, 
    timeLeft, 
    currentPage, 
    flaggedQuestions, 
    isSubmitted,
    currentTest 
  } = useSelector(state => state.quiz);

  // Local state
  const [questions, setQuestions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEndModal, setShowEndModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // Add immediate submission loading state
  const [performanceMetrics, setPerformanceMetrics] = useState({
    totalSaves: 0,
    averageResponseTime: 0,
    lastBatchSize: 0
  });

  // Refs for stable values
  const currentSessionRef = useRef(null);
  const answersRef = useRef({});
  const flaggedQuestionsRef = useRef([]);
  const currentPageRef = useRef(1);
  const timeLeftRef = useRef(7200);
  const batchQueueRef = useRef([]);
  const batchTimeoutRef = useRef(null);

  // Update refs when state changes
  useEffect(() => {
    currentSessionRef.current = currentSession;
    answersRef.current = answers;
    flaggedQuestionsRef.current = flaggedQuestions;
    currentPageRef.current = currentPage;
    timeLeftRef.current = timeLeft;
  }, [currentSession, answers, flaggedQuestions, currentPage, timeLeft]);

  // Performance monitoring
  const updatePerformanceMetrics = useCallback((responseTime, batchSize = 1) => {
    setPerformanceMetrics(prev => ({
      totalSaves: prev.totalSaves + 1,
      averageResponseTime: (prev.averageResponseTime * prev.totalSaves + responseTime) / (prev.totalSaves + 1),
      lastBatchSize: batchSize
    }));
  }, []);

  // Show toast notification
  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    setToast({ message, type, duration });
  }, []);

  // Optimized batch save function
  const saveCurrentState = useCallback(async (showStatus = false, forceBatch = false) => {
    if (!currentSessionRef.current || isSubmitted) {
      return;
    }

    try {
      if (showStatus) setIsSaving(true);
      setSaveError(null);

      const startTime = Date.now();
      const payload = {
        sessionId: currentSessionRef.current.sessionId,
        answers: answersRef.current,
        flaggedQuestions: flaggedQuestionsRef.current,
        currentPage: currentPageRef.current,
        timeLeft: timeLeftRef.current,
        batchUpdate: true // Use optimized batch update
      };

      console.log('💾 Optimized save triggered:', {
        manual: showStatus,
        answersCount: Object.keys(payload.answers).length,
        flaggedCount: payload.flaggedQuestions.length,
        timeLeft: payload.timeLeft,
        useBatch: true
      });

      const response = await authenticatedFetch('/api/sessions/optimized-answers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      if (!response.ok) {
        throw new Error('Failed to save progress');
      }

      const result = await response.json();
      
      // Update performance metrics
      updatePerformanceMetrics(responseTime, result.data?.answersCount || 1);
      
      setLastSaved(new Date());
      setSaveError(null);
      
      if (showStatus) {
        showToast(`Progress saved (${responseTime}ms)`, 'success', 2000);
      }
    } catch (error) {
      console.error('❌ Optimized save failed:', error);
      const errorMessage = 'Failed to save progress. Your answers may be lost if you refresh.';
      setSaveError(errorMessage);
      
      if (showStatus) {
        showToast('Failed to save progress. Check your connection.', 'error');
      }
    } finally {
      if (showStatus) setIsSaving(false);
    }
  }, [isSubmitted, updatePerformanceMetrics, showToast]);

  // Optimized answer batching
  const addToBatch = useCallback((questionId, selectedAnswer) => {
    batchQueueRef.current.push({
      questionId,
      selectedAnswer,
      timestamp: Date.now()
    });

    // Clear existing timeout
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
    }

    // Set new timeout for batch processing
    batchTimeoutRef.current = setTimeout(() => {
      processBatch();
    }, OPTIMIZED_CONFIG.ANSWER_BATCH_DELAY);
  }, []);

  // Process batched answers
  const processBatch = useCallback(async () => {
    if (!currentSessionRef.current || batchQueueRef.current.length === 0) {
      return;
    }

    const batch = [...batchQueueRef.current];
    batchQueueRef.current = [];

    try {
      const startTime = Date.now();
      
      // Convert batch to answers object
      const batchAnswers = {};
      batch.forEach(item => {
        batchAnswers[item.questionId] = item.selectedAnswer;
      });

      const response = await authenticatedFetch('/api/sessions/optimized-answers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentSessionRef.current.sessionId,
          answers: batchAnswers,
          flaggedQuestions: flaggedQuestionsRef.current,
          currentPage: currentPageRef.current,
          timeLeft: timeLeftRef.current
        })
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      if (response.ok) {
        updatePerformanceMetrics(responseTime, batch.length);
        console.log(`✅ Batch processed: ${batch.length} answers in ${responseTime}ms`);
      } else {
        console.error('❌ Batch processing failed');
      }
    } catch (error) {
      console.error('💥 Batch processing error:', error);
    }
  }, [updatePerformanceMetrics]);

  // Optimized auto-save with reduced frequency
  useEffect(() => {
    if (!currentSession || isSubmitted) return;

    const interval = setInterval(() => {
      saveCurrentState();
    }, OPTIMIZED_CONFIG.AUTO_SAVE_INTERVAL);

    return () => clearInterval(interval);
  }, [currentSession, isSubmitted, saveCurrentState]);

  // Optimized timer updates
  useEffect(() => {
    if (!currentSession || isSubmitted) return;

    const timerInterval = setInterval(() => {
      if (currentSessionRef.current && timeLeftRef.current > 0) {
        authenticatedFetch('/api/sessions/optimized', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            testId: currentSessionRef.current.testId,
            action: 'updateTimer',
            sessionId: currentSessionRef.current.sessionId,
            timeLeft: timeLeftRef.current
          })
        }).catch(error => console.warn('Timer update failed:', error));
      }
    }, OPTIMIZED_CONFIG.TIMER_SAVE_INTERVAL);

    return () => clearInterval(timerInterval);
  }, [currentSession, isSubmitted]);

  // Optimized answer change handler
  const handleAnswerChange = useCallback(async (questionId, selectedOption) => {
    if (isSubmitted) return;

    console.log('📝 Optimized answer change:', { 
      questionId, 
      selectedOption,
      currentAnswers: Object.keys(answers).length,
      useBatching: OPTIMIZED_CONFIG.USE_BATCHING
    });

    // Update Redux state immediately
    dispatch(setAnswer({ questionId, answer: selectedOption }));

    if (!currentSession) {
      console.warn('⚠️ No current session found');
      return;
    }

    if (OPTIMIZED_CONFIG.USE_BATCHING) {
      // Add to batch queue for processing
      addToBatch(questionId, selectedOption);
    } else {
      // Direct submission (legacy mode)
      try {
        const response = await authenticatedFetch('/api/sessions/optimized-answers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: currentSession.sessionId,
            questionId,
            selectedAnswer: selectedOption,
            useBatching: false
          })
        });

        if (!response.ok) {
          console.error('❌ Direct answer submission failed');
        }
      } catch (error) {
        console.error('💥 Direct answer submission error:', error);
      }
    }
  }, [isSubmitted, answers, currentSession, dispatch, addToBatch]);

  // Rest of the component logic remains similar but with optimized session management
  // ... (including initialization, pagination, submission logic)

  // Pagination calculations
  const totalPages = Math.ceil(questions.length / OPTIMIZED_CONFIG.QUESTIONS_PER_PAGE);
  const startIndex = (currentPage - 1) * OPTIMIZED_CONFIG.QUESTIONS_PER_PAGE;
  const endIndex = Math.min(startIndex + OPTIMIZED_CONFIG.QUESTIONS_PER_PAGE, questions.length);
  const currentQuestions = questions.slice(startIndex, endIndex);

  // Initialize quiz (optimized)
  useEffect(() => {
    const initializeOptimizedQuiz = async () => {
      if (!user) return;

      const testId = searchParams.get('testId');
      if (!testId) {
        router.push('/');
        return;
      }

      try {
        setIsLoading(true);

        // Try to get existing session using optimized API
        const sessionResponse = await authenticatedFetch(`/api/sessions/optimized?testId=${testId}`);
        
        let sessionData = null;
        if (sessionResponse.ok) {
          const data = await sessionResponse.json();
          if (data.success && data.session) {
            sessionData = data.session;
            console.log('📋 Found existing optimized session:', sessionData.sessionId);
          }
        }

        // Create new session if needed
        if (!sessionData) {
          const createResponse = await authenticatedFetch('/api/sessions/optimized', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              testId,
              action: 'start',
              duration: 7200
            })
          });

          if (createResponse.ok) {
            const data = await createResponse.json();
            sessionData = data.session;
            console.log('✅ Created new optimized session:', sessionData.sessionId);
          }
        }

        if (sessionData) {
          setCurrentSession(sessionData);
          
          // Start test in Redux
          dispatch(startTest({ 
            testId: testId, 
            duration: sessionData.timeLeft,
            userId: user.id 
          }));

          // Restore session data if available
          if (sessionData.answers && Object.keys(sessionData.answers).length > 0) {
            dispatch(restoreSession({
              answers: sessionData.answers,
              flaggedQuestions: sessionData.flaggedQuestions,
              currentPage: sessionData.currentPage,
              timeLeft: sessionData.timeLeft
            }));
          }
        }

        // Load questions (this part remains the same)
        await loadQuestions(testId);

      } catch (error) {
        console.error('💥 Optimized quiz initialization failed:', error);
        showToast('Failed to initialize quiz', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    initializeOptimizedQuiz();
  }, [user, searchParams, router, dispatch, showToast]);

  // Load questions function (can be optimized further)
  const loadQuestions = async (testId) => {
    try {
      const response = await authenticatedFetch(`/api/questions?testId=${testId}`);
      const data = await response.json();
      
      if (data.success) {
        setQuestions(data.questions);
      } else {
        throw new Error(data.error || 'Failed to load questions');
      }
    } catch (error) {
      console.error('❌ Failed to load questions:', error);
      showToast('Failed to load questions', 'error');
    }
  };

  // Performance metrics display
  const renderPerformanceMetrics = () => {
    if (!OPTIMIZED_CONFIG.ENABLE_PERFORMANCE_METRICS) return null;

    return (
      <div className="fixed bottom-4 right-4 bg-white p-3 rounded-lg shadow-lg border text-xs">
        <div className="font-semibold text-green-600 mb-1">Performance Metrics</div>
        <div>Total Saves: {performanceMetrics.totalSaves}</div>
        <div>Avg Response: {performanceMetrics.averageResponseTime.toFixed(0)}ms</div>
        <div>Last Batch: {performanceMetrics.lastBatchSize} items</div>
        <div>Queue Size: {batchQueueRef.current.length}</div>
      </div>
    );
  };

  if (isLoading || isSubmitting) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className={`animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4 ${
            isSubmitting ? 'border-green-600' : 'border-blue-600'
          }`}></div>
          <p className="text-gray-600">
            {isSubmitting ? 'Submitting test...' : 'Loading optimized quiz...'}
          </p>
          {isSubmitting && (
            <p className="text-sm text-green-600 mt-2">
              Please wait while we process your answers
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <QuizHeader 
        timeLeft={timeLeft}
        currentPage={currentPage}
        totalPages={totalPages}
        isSubmitted={isSubmitted}
        isSubmitting={isSubmitting}
        answeredCount={Object.keys(answers).length}
        totalQuestions={questions.length}
        markedCount={flaggedQuestions.length}
        onSubmit={() => setShowEndModal(true)}
      />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Questions */}
          <div className="flex-1">
            <div className="space-y-6">
              {currentQuestions.map((question, index) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  questionIndex={startIndex + index}
                  selectedAnswer={answers[question.id]}
                  onAnswerChange={handleAnswerChange}
                  isSubmitted={isSubmitted}
                />
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-80">
            <QuizSidebar
              questions={questions}
              answers={answers}
              flaggedQuestions={flaggedQuestions}
              currentPage={currentPage}
              questionsPerPage={OPTIMIZED_CONFIG.QUESTIONS_PER_PAGE}
              onPageChange={(page) => dispatch(setCurrentPage(page))}
              onToggleFlag={(questionId) => {
                // Optimized flag toggle
                const isFlagged = flaggedQuestions.includes(questionId);
                if (currentSession) {
                  authenticatedFetch('/api/sessions/optimized-answers', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      sessionId: currentSession.sessionId,
                      questionId,
                      isFlagged: !isFlagged
                    })
                  }).catch(error => console.error('Flag toggle failed:', error));
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Auto-save indicator */}
      <AutoSaveIndicator 
        isSaving={isSaving}
        lastSaved={lastSaved}
        saveError={saveError}
        onManualSave={() => saveCurrentState(true)}
      />

      {/* Performance metrics (development only) */}
      {renderPerformanceMetrics()}

      {/* End test modal */}
      {showEndModal && (
        <EndTestModal
          isOpen={showEndModal}
          onConfirm={async () => {
            setShowEndModal(false);
            setIsSubmitting(true);
            
            try {
              // Handle optimized test submission
              const response = await authenticatedFetch('/api/tests/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  testId: currentSession?.testId
                })
              });

              if (response.ok) {
                const results = await response.json();
                showToast('Test submitted successfully!', 'success');
                // Redirect to results
                setTimeout(() => {
                  router.push(`/results?testId=${results.testId}`);
                }, 1000);
              } else {
                throw new Error('Submission failed');
              }
            } catch (error) {
              console.error('Submission error:', error);
              showToast('Failed to submit test', 'error');
              setIsSubmitting(false);
            }
          }}
          onCancel={() => setShowEndModal(false)}
          timeLeft={timeLeft}
          answeredCount={Object.keys(answers).length}
          totalQuestions={questions.length}
          markedCount={flaggedQuestions.length}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Toast notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
} 