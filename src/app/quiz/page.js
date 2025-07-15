'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter, useSearchParams } from 'next/navigation';
import QuizHeader from '../components/QuizHeader';
import QuestionCard from '../components/QuestionCard';
import QuizSidebar from '../components/QuizSidebar';
import ProtectedRoute from '../components/ProtectedRoute';
import AutoSaveIndicator from '../components/AutoSaveIndicator';
import { ToastContainer, showToast } from '../components/Toast';
// Results are now shown on separate /results page
import { 
  setAnswer, 
  decrementTimer, 
  resetQuiz,
  startTest,
  submitTest,
  calculateScore,
  toggleFlaggedQuestion,
  restoreSession,
  setTimer,
  setCurrentPage
} from '../../store/slices/quizSlice';
import { fetchQuestions } from '../../store/slices/questionsSlice';

// Auto-save interval in milliseconds
const AUTO_SAVE_INTERVAL = 20000; // 10 seconds

export default function QuizPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const { user } = useSelector((state) => state.auth);
  const { 
    currentTest, 
    answers, 
    timeLeft, 
    isSubmitted, 
    isLoading: quizLoading,
    results,
    flaggedQuestions,
    currentPage,
    questionsPerPage
  } = useSelector((state) => state.quiz);
  
  // Local state
  const [questions, setQuestions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRestoringSession, setIsRestoringSession] = useState(false);
  const [practiceSetInfo, setPracticeSetInfo] = useState(null);
  const [toast, setToast] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // Add immediate submission loading state

  // Refs for stable values in useCallbacks
  const currentSessionRef = useRef(null);
  const answersRef = useRef({});
  const flaggedQuestionsRef = useRef([]);
  const currentPageRef = useRef(1);
  const timeLeftRef = useRef(7200);

  // Update refs when state changes
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    flaggedQuestionsRef.current = flaggedQuestions;
  }, [flaggedQuestions]);

  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  useEffect(() => {
    currentSessionRef.current = currentSession;
  }, [currentSession]);

  // Pagination calculations
  const totalPages = Math.ceil(questions.length / questionsPerPage);
  const startIndex = (currentPage - 1) * questionsPerPage;
  const endIndex = Math.min(startIndex + questionsPerPage, questions.length);
  const currentQuestions = questions.slice(startIndex, endIndex);

  // Auto-save function with stable dependencies
  const saveCurrentState = useCallback(async (showStatus = false) => {
    if (!currentSessionRef.current || isSubmitted) {
      return;
    }

    try {
      if (showStatus) setIsSaving(true);
      setSaveError(null);

      const payload = {
        testId: currentSessionRef.current.testId,
        answers: answersRef.current,
        flaggedQuestions: flaggedQuestionsRef.current,
        currentPage: currentPageRef.current,
        timeLeft: timeLeftRef.current // Ensure we're saving the current timer value
      };

      // Log save details
      console.log('💾 Save triggered:', {
        manual: showStatus,
        answersCount: Object.keys(payload.answers).length,
        sampleAnswers: Object.entries(payload.answers).slice(0, 3),
        flaggedCount: payload.flaggedQuestions.length,
        timeLeft: payload.timeLeft
      });

      const { authenticatedFetch } = await import('../../lib/supabase');
      const response = await authenticatedFetch('/api/sessions/answers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to save progress');
      }

      setLastSaved(new Date());
      setSaveError(null);
      
      if (showStatus) {
        showToast('Progress saved', 'success', 2000);
      }
    } catch (error) {
      console.error('❌ Auto-save failed:', error);
      const errorMessage = 'Failed to save progress. Your answers may be lost if you refresh.';
      setSaveError(errorMessage);
      
      if (showStatus) {
        showToast('Failed to save progress. Check your connection.', 'error');
      }
    } finally {
      if (showStatus) setIsSaving(false);
    }
  }, [isSubmitted, saveError]); // Added saveError to dependencies

  // Set up auto-save interval with more frequent timer saves
  useEffect(() => {
    if (!currentSession || isSubmitted) return;

    const interval = setInterval(() => {
      saveCurrentState();
    }, AUTO_SAVE_INTERVAL);

    return () => {
      clearInterval(interval);
    };
  }, [currentSession, isSubmitted, saveCurrentState]);

  // Save timer more frequently (every 10 seconds) and on state changes
  useEffect(() => {
    if (!currentSession || isSubmitted) return;

    const timerSaveInterval = setInterval(() => {
      if (currentSessionRef.current && timeLeftRef.current > 0) {
        // Save just the timer state more frequently
        import('../../lib/supabase').then(({ authenticatedFetch }) => {
          authenticatedFetch('/api/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              testId: currentSessionRef.current.testId,
              action: 'updateTimer',
              timeLeft: timeLeftRef.current
            })
          }).catch(error => console.warn('Failed to update timer:', error));
        });
      }
    }, 20000); // Save timer every 10 seconds

    return () => clearInterval(timerSaveInterval);
  }, [currentSession, isSubmitted]);

  // Save on important state changes with debouncing
  useEffect(() => {
    if (!currentSession || isSubmitted) return;

    const timeoutId = setTimeout(() => {
        if (Object.keys(answers).length > 0 || flaggedQuestions.length > 0) {
        saveCurrentState();
      }
    }, 2000); // 2 second debounce

    return () => clearTimeout(timeoutId);
  }, [answers, flaggedQuestions, currentPage, currentSession, isSubmitted, saveCurrentState]);

  // Enhanced beforeunload handler
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (currentSessionRef.current && !isSubmitted) {
        // Save using sendBeacon for reliability
          const payload = JSON.stringify({
          testId: currentSessionRef.current.testId,
          answers: answersRef.current,
          flaggedQuestions: flaggedQuestionsRef.current,
          currentPage: currentPageRef.current,
          timeLeft: timeLeftRef.current
        });
        
        // Try sendBeacon first
          if (navigator.sendBeacon) {
          const blob = new Blob([payload], { type: 'application/json' });
          navigator.sendBeacon('/api/sessions/answers', blob);
          } else {
          // Fallback to sync XHR (deprecated but works)
          const xhr = new XMLHttpRequest();
          xhr.open('PUT', '/api/sessions/answers', false); // false = synchronous
          xhr.setRequestHeader('Content-Type', 'application/json');
          xhr.send(payload);
        }
        
        e.preventDefault();
        e.returnValue = 'Your test progress will be saved. Are you sure you want to leave?';
        return 'Your test progress will be saved. Are you sure you want to leave?';
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && currentSessionRef.current && !isSubmitted) {
        // Save when tab becomes hidden
        saveCurrentState();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isSubmitted, saveCurrentState]);

  // Back button protection and keyboard shortcuts
  useEffect(() => {
    const handlePopState = (e) => {
      if (currentSession && !isSubmitted) {
        const userChoice = window.confirm(
          `🚨 Test in Progress!\n\n` +
          `You're currently taking a test. Your progress is auto-saved.\n` +
          `Do you really want to go back?`
        );
        
        if (!userChoice) {
          window.history.pushState(null, null, window.location.href);
          return;
        }
      }
    };
    
    // Keyboard shortcut for manual save (Ctrl+S or Cmd+S)
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (currentSessionRef.current && !isSubmitted) {
          saveCurrentState(true); // Show status
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeyDown);

    if (currentSession && !isSubmitted) {
      window.history.pushState(null, null, window.location.href);
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentSession, isSubmitted, saveCurrentState]);

  // Initialize quiz effect - Simplified and improved
  useEffect(() => {
      if (!user || isInitialized) return;

    const initializeQuiz = async () => {
      setIsRestoringSession(true);

      const testId = searchParams.get('testId');
      const isNewSession = searchParams.get('newSession') === 'true';
      
      if (!testId) {
        console.error('❌ No testId provided in URL');
        showToast('No test ID provided. Please start a test from the dashboard.', 'error');
        router.push('/dashboard');
        return;
      }
      
      try {
        console.log('🔍 Initializing quiz:', { testId, userId: user.id, isNewSession });
        
        let sessionData = null;
        let isExistingSession = false;  // Track if this is an existing session
        
        // Import authenticatedFetch at the beginning
            const { authenticatedFetch } = await import('../../lib/supabase');
        
        // Skip restoration for new sessions
        if (!isNewSession) {
          // Try to get existing session
          try {
            const sessionResponse = await authenticatedFetch(`/api/sessions?testId=${testId}&userId=${user.id}`);
            
            if (sessionResponse.ok) {
              const data = await sessionResponse.json();
              if (data.success && data.session && data.session.isActive && data.session.timeLeft > 0) {
                sessionData = data.session;
                isExistingSession = data.isResumed || true;  // Mark as existing session
                console.log('📋 Found existing active session with timeLeft:', sessionData.timeLeft, 
                  'Answers:', Object.keys(sessionData.answers || {}).length);
              } else if (data.session && !data.session.isActive) {
                console.log('⚠️ Found inactive session - test was already submitted, starting fresh');
                sessionData = null; // Force creation of new session
                      }
                    }
                  } catch (error) {
            console.warn('⚠️ Failed to check existing session:', error);
          }
        }

        // If no session found or it's a new session, create one
        if (!sessionData) {
          const createResponse = await authenticatedFetch('/api/sessions', {
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
            if (data.success) {
              sessionData = data.session;
              console.log('✅ New session created');
            } else {
              console.error('❌ Failed to create session:', data.error);
            }
          } else {
            const errorText = await createResponse.text();
            console.error('❌ Session creation failed:', createResponse.status, errorText);
          }
        }

        if (sessionData) {
          setCurrentSession(sessionData);
          console.log('✅ Session set in state');
          
          // Always start the test in Redux with proper timeLeft restoration
          const timeToUse = sessionData.timeLeft && sessionData.timeLeft > 0 ? sessionData.timeLeft : 7200;
          console.log('⏰ Using timeLeft:', timeToUse);
          
                      dispatch(startTest({ 
                        testId: testId, 
            duration: timeToUse,
                        userId: user.id 
                      }));
                      
          // Check if this should be a fresh session (retake/new session)
          const isNewSessionParam = searchParams.get('newSession') === 'true';
          
          // Only restore data if:
          // 1. This is NOT marked as a new session in URL
          // 2. We found an existing session (isExistingSession flag)
          // 3. OR it has saved answers/data
          const hasAnyData = (sessionData.answers && Object.keys(sessionData.answers).length > 0) || 
                           (sessionData.flaggedQuestions && sessionData.flaggedQuestions.length > 0) ||
                           (sessionData.currentPage && sessionData.currentPage > 1);
          
          const shouldRestore = !isNewSessionParam && (isExistingSession || hasAnyData);
          
          if (shouldRestore) {
            dispatch(restoreSession({
              answers: sessionData.answers || {},
              flaggedQuestions: sessionData.flaggedQuestions || [],
              timeLeft: timeToUse,
              currentPage: sessionData.currentPage || 1,
              testId: testId
            }));
            
                  setDataRestored(true);
                  setTimeout(() => setDataRestored(false), 5000);
            console.log('✅ Session restored with existing data and timeLeft:', timeToUse, 
              'Answers:', Object.keys(sessionData.answers || {}).length);
            showToast('Previous session restored successfully!', 'success');
              } else {
            // Start fresh - clear any previous Redux state
            dispatch({
              type: 'quiz/resetQuiz'
            });
            console.log('✅ Fresh session started with timeLeft:', timeToUse, 
              `(newSession: ${isNewSessionParam}, existing: ${isExistingSession})`);
            
            if (isNewSessionParam) {
              showToast('Starting fresh test session!', 'info');
            }
          }
        } else {
          console.error('❌ No session could be created or found');
          showToast('Failed to initialize test session. Please check your internet connection.', 'error', 5000);
          router.push('/dashboard');
          return;
        }
        
        // Load questions
        await loadQuestions(testId);
        
        setIsInitialized(true);
        
      } catch (error) {
        console.error('💥 Error initializing quiz:', error);
        setQuestionsLoading(false);
        setIsInitialized(true);
      } finally {
        setIsRestoringSession(false);
      }
    };

    const loadQuestions = async (testId) => {
        setQuestionsLoading(true);
        
      try {
        // Try to fetch practice set
        const practiceSetResponse = await fetch(`/api/practice-sets/${testId}`);
        if (practiceSetResponse.ok) {
          const practiceSetData = await practiceSetResponse.json();
          if (practiceSetData.success && practiceSetData.practiceSet.questions?.length > 0) {
            const questionsWithIds = practiceSetData.practiceSet.questions.map((q, idx) => ({
              ...q,
              id: q.id || (idx + 1)
            }));
            setQuestions(questionsWithIds);
            setPracticeSetInfo({
              name: practiceSetData.practiceSet.title,
              category: 'Practice Set',
              totalQuestions: practiceSetData.practiceSet.questionsCount,
              duration: practiceSetData.practiceSet.estimatedTime * 60,
              domains: practiceSetData.practiceSet.domains
            });
            console.log('📚 Loaded questions from practice set');
            return;
          }
        }
        
        // No fallback to sample data in production
        console.error('No questions found for test:', testId);
      } catch (error) {
        console.error('❌ Failed to load questions:', error);
      } finally {
        setQuestionsLoading(false);
      }
    };

    initializeQuiz();
  }, [user, dispatch, searchParams, router, isInitialized]);

  // Timer effect - also save timer to backend periodically and handle redirects
  useEffect(() => {
    // Handle redirect to results page when test is submitted
    if (isSubmitted && currentSession) {
      console.log('🎯 Test submitted, redirecting to results...');
      // Use practice set ID for backwards compatibility with results page
      router.push(`/results?testId=${currentSession.testId}`);
      return;
    }

    if (timeLeft > 0 && !isSubmitted && isInitialized && currentSession) {
      const timer = setTimeout(() => {
        dispatch(decrementTimer());
        
        // Update the ref immediately
        timeLeftRef.current = timeLeft - 1;
      }, 1000);
      
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isSubmitted && currentTest) {
      handleSubmit();
    }
  }, [timeLeft, isSubmitted, isInitialized, currentTest, currentSession, dispatch, router]);

  const handleAnswerChange = async (questionId, selectedOption) => {
    if (isSubmitted) {
      return;
    }

    console.log('📝 Answer changed:', { 
      questionId, 
      selectedOption, 
      currentAnswers: Object.keys(answers).length,
      hasSession: !!currentSession
    });

    // Update local state immediately for better UX
      dispatch(setAnswer({ questionId, answer: selectedOption }));

    // If no session, try to create one
    if (!currentSession) {
      console.warn('⚠️ No current session found, attempting to create one...');
      
      const testId = searchParams.get('testId');
      if (!testId) {
        console.error('❌ No testId available to create session');
      return;
    }

      const { authenticatedFetch } = await import('../../lib/supabase');
      
      try {
        const createResponse = await authenticatedFetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            testId,
            action: 'start',
            duration: timeLeft || 7200
          })
        });

        if (createResponse.ok) {
          const data = await createResponse.json();
          if (data.success && data.session) {
            setCurrentSession(data.session);
            console.log('✅ Session created on demand:', data.session.id);
            showToast('Test session created', 'success', 2000);
            
            // Now submit the answer
            await submitAnswerToBackend(data.session, questionId, selectedOption);
            return;
          }
        }
      } catch (error) {
        console.error('❌ Failed to create session on demand:', error);
      }
      
      return;
    }
    
    // Submit the answer using the current session
    await submitAnswerToBackend(currentSession, questionId, selectedOption);
  };
  
  // Helper function to submit answer to backend
  const submitAnswerToBackend = async (session, questionId, selectedOption) => {
    try {
      const requestData = {
        testId: session.testId,
        questionId,
        selectedAnswer: selectedOption,
        flaggedQuestions: flaggedQuestions || []
      };
      
      const { authenticatedFetch } = await import('../../lib/supabase');
      const response = await authenticatedFetch('/api/sessions/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update session state if response includes updated session data
        if (data.session) {
          setCurrentSession(prev => ({ ...prev, ...data.session }));
        }
      } else {
        console.error('❌ Failed to submit answer:', data.error);
        
        // Check if test was already completed
        if (data.error && data.error.includes('already been completed')) {
          showToast('This test has already been completed. Redirecting to results...', 'info');
          router.push(`/results?testId=${data.testId || session.testId}`);
          return;
        }
        
        // If session not found, try to recreate it
        if (data.error && data.error.includes('Session not found')) {
          console.log('🔄 Session not found, will recreate on next answer...');
        }
      }
    } catch (error) {
      console.error('💥 Error submitting answer:', error);
      // Don't revert local state - answer is still saved locally
    }
  };

  const recreateSession = async () => {
    try {
      const testId = searchParams.get('testId');
      if (!testId) {
        console.error('❌ No testId available to recreate session');
        return;
      }
      console.log('🆕 Recreating session for:', { testId, userId: user.id });
      
      const { authenticatedFetch } = await import('../../lib/supabase');
      const newSessionResponse = await authenticatedFetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testId,
          action: 'start',
          duration: timeLeft || 7200
        })
      });
      
      const newSessionData = await newSessionResponse.json();
      console.log('📝 Session recreation response:', newSessionData);
      
      if (newSessionData.success) {
        setCurrentSession(newSessionData.session);
        
        // Restore current answers to the new session
        if (Object.keys(answers).length > 0) {
          console.log('🔄 Restoring answers to new session:', Object.keys(answers).length);
          const { authenticatedFetch } = await import('../../lib/supabase');
          for (const [qId, answer] of Object.entries(answers)) {
            await authenticatedFetch('/api/sessions/answers', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                testId,
                questionId: parseInt(qId),
                selectedAnswer: answer,
                flaggedQuestions: flaggedQuestions || []
              })
            }).catch(err => console.warn('Failed to restore answer:', qId, err));
          }
        }
        
        console.log('✅ Session recreated successfully');
      } else {
        console.error('❌ Failed to recreate session:', newSessionData.error);
      }
    } catch (error) {
      console.error('💥 Error recreating session:', error);
    }
  };

  const handleSubmit = async () => {
    if (!currentSession || !user) {
      console.error('Cannot submit: missing session or user');
      return;
    }

    // Set submitting state immediately for loading UI
    setIsSubmitting(true);

    try {
      console.log('🎯 Submitting test...', { testId: currentSession.testId, userId: user.id });

      // Submit the test and get real results (don't end session first)
      const { authenticatedFetch } = await import('../../lib/supabase');
      const submitResponse = await authenticatedFetch('/api/tests/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testId: currentSession.testId
        })
      });

      console.log('📡 Submit response status:', submitResponse.status);

      if (!submitResponse.ok) {
        const errorText = await submitResponse.text();
        console.error('❌ Submit response error:', errorText);
        throw new Error(`Failed to submit test: ${errorText}`);
      }

      const results = await submitResponse.json();
      console.log('✅ Test submitted successfully:', results);

      if (results.success) {
        console.log('📊 Storing actual results in Redux:', results);
        
        // Deactivate the current session to prevent restoration
        try {
          await authenticatedFetch('/api/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              testId: currentSession.testId,
              action: 'end'
            })
          });
          console.log('✅ Session deactivated after submission');
          
          // Clear current session from local state
          setCurrentSession(null);
        } catch (error) {
          console.warn('⚠️ Failed to deactivate session:', error);
        }
        
        // Store the complete actual results in Redux state
        dispatch({
          type: 'quiz/calculateScore/fulfilled',
          payload: {
            // Core results
            totalCorrect: results.correctAnswers,
            correctAnswers: results.correctAnswers,
            totalQuestions: results.totalQuestions,
            attemptedQuestions: results.attemptedQuestions,
            unattemptedQuestions: results.unattemptedQuestions,
            wrongAnswers: results.wrongAnswers,
            
            // Scoring
            rawScore: results.rawScore,
            negativeMarks: results.negativeMarks,
            finalScore: results.finalScore,
            maxPossibleScore: results.maxPossibleScore,
            percentage: results.percentage,
            
            // Details
            scoreByDomain: results.domainScores,
            attempts: results.detailedResults,
            submissionTime: results.submissionTime,
            totalTimeSpent: results.totalTimeSpent,
            
            // Additional data for solutions view
            detailedResults: results.detailedResults
          }
        });

        // Mark test as submitted
        dispatch(submitTest({
          testId: currentSession.testId,
          answers: answers,
          timeSpent: {}
        }));

        // Show success message and redirect
        showToast('Test submitted successfully! Redirecting to results...', 'success');
        setTimeout(() => {
          router.push(`/results?testId=${results.testId}`);
        }, 1000);

      } else {
        throw new Error(results.error || 'Submission failed');
      }
    } catch (error) {
      console.error('💥 Error submitting test:', error);
      showToast(`Failed to submit test: ${error.message}`, 'error', 5000);
    } finally {
      // Reset submitting state if there was an error
      setIsSubmitting(false);
    }
  };

  const scrollToQuestion = (questionId) => {
    const element = document.getElementById(`question-${questionId}`);
    if (element) {
      // Get the navbar height to offset the scroll position
      const navbarHeight = 80; // Approximate height of the QuizHeader
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - navbarHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      dispatch(setCurrentPage(newPage));
      // Scroll to top of questions section
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleExitTest = async () => {
    const confirmExit = window.confirm(
      `🚨 Exit Test?\n\n` +
      `Are you sure you want to exit the test?\n\n` +
      `✅ Your progress will be saved\n` +
      `✅ You can resume later from where you left off\n` +
      `⚠️  Your timer will continue running\n\n` +
      `Click OK to exit or Cancel to continue the test.`
    );
    
    if (confirmExit) {
      try {
        // Save current state before exiting
        if (currentSession) {
          console.log('💾 Saving test state before exit...');
          const { authenticatedFetch } = await import('../../lib/supabase');
          await authenticatedFetch('/api/sessions/answers', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              testId: currentSession.testId,
              answers,
              flaggedQuestions,
              currentPage,
              timeLeft
            })
          });
          console.log('✅ Test state saved successfully');
          showToast('Progress saved. You can resume later.', 'success');
        }
        
        // Navigate back to dashboard or test selection
        setTimeout(() => {
        router.push('/dashboard');
        }, 500);
      } catch (error) {
        console.error('❌ Error saving test state:', error);
        // Still allow exit even if save fails
        router.push('/dashboard');
      }
    }
  };

  // Loading state - also wait for session
  if (questionsLoading || quizLoading || !isInitialized || isRestoringSession || !currentSession || isSubmitting) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
          <div className="text-center">
            <div className={`w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4 ${
              isSubmitting ? 'border-green-500' : 'border-blue-500'
            }`}></div>
            <p className="text-slate-600 font-medium">
              {isSubmitting ? 'Submitting test...' :
               isRestoringSession ? 'Restoring your session...' : 
               !currentSession ? 'Initializing test session...' :
               questionsLoading ? 'Loading questions...' : 'Initializing test...'}
            </p>
            {isRestoringSession && (
              <p className="text-sm text-blue-600 mt-2">
                Your previous answers will be restored
              </p>
            )}
            {isSubmitting && (
              <p className="text-sm text-green-600 mt-2">
                Please wait while we process your answers
              </p>
            )}
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Error state
  if (!questions.length && isInitialized && !questionsLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-slate-900 mb-2">No Questions Available</h1>
            <p className="text-slate-600 mb-4">
              There are no questions available for the selected domains.
            </p>
            <div className="space-x-4">
              <button
                onClick={() => window.location.reload()}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2 px-6 rounded-xl font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                Retry
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2 px-6 rounded-xl font-medium hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Show loading state if test is submitted
  if (isSubmitted && currentSession) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600 font-medium">Redirecting to results...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Quiz view - Show all questions at once
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50">
        <QuizHeader 
          timeLeft={timeLeft}
          onSubmit={handleSubmit}
          isSubmitted={isSubmitted}
          isSubmitting={isSubmitting}
          answeredCount={Object.keys(answers).length}
          totalQuestions={questions.length}
          markedCount={flaggedQuestions.length}
          onExitTest={handleExitTest}
          questions={questions}
          answers={answers}
          onQuestionClick={scrollToQuestion}
          practiceSetInfo={practiceSetInfo}
          currentPage={currentPage}
          questionsPerPage={questionsPerPage}
          onPageChange={handlePageChange}
          totalPages={totalPages}
          flaggedQuestions={flaggedQuestions}
        />
        
        {/* Auto-save indicator */}
        <AutoSaveIndicator 
          isSaving={isSaving}
          lastSaved={lastSaved}
          saveError={saveError}
        />
        
        {/* Toast container */}
        <ToastContainer />
        
        <div className="flex max-w-7xl mx-auto relative">
          {/* Main Content */}
          <div className="flex-1 p-4 sm:p-6">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6">
              {/* <div className="mb-6">
                <h2 className="text-xl font-semibold text-slate-900 mb-1">
                  {practiceSetInfo?.name || 'MCQ Test'}
                </h2>
                <h3 className="text-base text-slate-600">
                  {questions.length} Questions
                </h3>
                {practiceSetInfo?.category && (
                  <p className="text-sm text-blue-600 mt-1">{practiceSetInfo.category}</p>
                )}
              </div> */}

              {/* Pagination Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 pb-4 border-b border-gray-200 space-y-3 sm:space-y-0">
                <div className="text-xs sm:text-sm text-gray-600">
                  Showing questions {(currentPage - 1) * questionsPerPage + 1} - {Math.min(currentPage * questionsPerPage, questions.length)} of {questions.length}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-2 py-1 text-xs sm:text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-xs sm:text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-2 py-1 text-xs sm:text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                {currentQuestions.map((question, index) => {
                  const questionAnswer = answers[question.id];
                  const isQuestionFlagged = flaggedQuestions.includes(question.id);
                  
                  return (
                    <QuestionCard
                      key={question.id}
                      question={{
                        ...question,
                        correctAnswer: question.correctAnswer,
                        options: question.options.map((opt, i) => ({
                          key: ['A', 'B', 'C', 'D'][i],
                          text: opt.text
                        }))
                      }}
                      questionNumber={startIndex + index + 1}
                      selectedAnswer={questionAnswer}
                      onAnswerChange={handleAnswerChange}
                      isSubmitted={isSubmitted}
                      isFlagged={isQuestionFlagged}
                      onToggleFlag={(questionId) => {
                        dispatch(toggleFlaggedQuestion(questionId));
                        // Save flagged state to backend
                        if (currentSession) {
                          const newFlaggedQuestions = flaggedQuestions.includes(questionId) 
                            ? flaggedQuestions.filter(id => id !== questionId)
                            : [...flaggedQuestions, questionId];
                          
                          import('../../lib/supabase').then(({ authenticatedFetch }) => {
                            authenticatedFetch('/api/sessions/answers', {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                testId: currentSession.testId,
                                flaggedQuestions: newFlaggedQuestions
                              })
                            }).catch(error => console.warn('Failed to save flagged questions:', error));
                          });
                        }
                      }}
                    />
                  );
                })}
              </div>

              {/* Pagination Footer */}
              <div className="flex items-center justify-center mt-6 sm:mt-8 space-x-1 sm:space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-2 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm bg-white border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="hidden sm:inline">← Previous</span>
                  <span className="sm:hidden">←</span>
                </button>
                
                {/* Page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = Math.max(1, currentPage - 2) + i;
                  if (page > totalPages) return null;
                  
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm rounded-lg ${
                        page === currentPage
                          ? 'bg-blue-500 text-white'
                          : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm bg-white border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="hidden sm:inline">Next →</span>
                  <span className="sm:hidden">→</span>
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar - Hidden on mobile, shown on desktop */}
          <div className="hidden lg:block">
            <QuizSidebar
              questions={questions}
              answers={answers}
              onQuestionClick={scrollToQuestion}
              practiceSetInfo={practiceSetInfo}
              currentPage={currentPage}
              questionsPerPage={questionsPerPage}
              onPageChange={handlePageChange}
              totalPages={totalPages}
            />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 