'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { 
  Clock, 
  FileText, 
  Target, 
  Award,
  Calendar,
  Timer,
  TrendingUp,
  CheckCircle,
  XCircle,
  RotateCcw,
  Play,
  Eye,
  AlertCircle
} from 'lucide-react';
import ProtectedRoute from '../../components/ProtectedRoute';
import { authenticatedFetch } from '../../../lib/supabase';

export default function TestLobby() {
  const params = useParams();
  const router = useRouter();
  const testId = params.testId;
  
  const [practiceSetInfo, setPracticeSetInfo] = useState(null);
  const [previousAttempts, setPreviousAttempts] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startingTest, setStartingTest] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [enforceTime, setEnforceTime] = useState(true);

  // Get user from Redux auth state
  const user = useSelector(state => state.auth.user);

  useEffect(() => {
    const loadLobbyData = async () => {
      try {
        // Check for existing active session first
        if (user?.id) {
          try {
            const sessionResponse = await authenticatedFetch(`/api/sessions?testId=${testId}&userId=${user.id}`);
            if (sessionResponse.ok) {
              const sessionData = await sessionResponse.json();
              if (sessionData.success && sessionData.session && sessionData.session.isActive && sessionData.session.timeLeft > 0) {
                setActiveSession(sessionData.session);
                console.log('📋 Found active session with time remaining:', {
                  timeLeft: sessionData.session.timeLeft,
                  timeLeftMinutes: Math.floor(sessionData.session.timeLeft / 60)
                });
              } else if (sessionData.session && !sessionData.session.isActive) {
                console.log('✅ Found inactive session - test was already completed');
                setActiveSession(null);
              }
            }
          } catch (error) {
            console.log('⚠️ No active session found or error checking:', error);
            setActiveSession(null);
          }
        }

        // First try to load specific practice set by ID
        const practiceSetUrl = user?.id 
          ? `/api/practice-sets/${testId}?userId=${user.id}`
          : `/api/practice-sets/${testId}`;
          
        const practiceSetResponse = await fetch(practiceSetUrl);
        if (practiceSetResponse.ok) {
          const practiceSetData = await practiceSetResponse.json();
          if (practiceSetData.success) {
            // Transform the practice set data to match expected format with actual configuration
            const transformedData = {
              name: practiceSetData.practiceSet.title,
              category: practiceSetData.practiceSet.testType || 'Practice Set',
              totalQuestions: practiceSetData.practiceSet.questionsCount,
              duration: practiceSetData.practiceSet.estimatedTime * 60, // Convert minutes to seconds
              domains: practiceSetData.practiceSet.domains,
              questions: practiceSetData.practiceSet.questions || [],
              // Admin configuration
              marksPerQuestion: practiceSetData.practiceSet.marksPerQuestion || 1,
              totalMarks: practiceSetData.practiceSet.totalMarks,
              passMarks: practiceSetData.practiceSet.passMarks,
              passingPercentage: practiceSetData.practiceSet.passingPercentage || 40,
              enableNegativeMarking: practiceSetData.practiceSet.enableNegativeMarking !== undefined ? practiceSetData.practiceSet.enableNegativeMarking : true,
              negativeMarkingRatio: practiceSetData.practiceSet.negativeMarkingRatio || 0.25,
              instructions: practiceSetData.practiceSet.instructions
            };
            setPracticeSetInfo(transformedData);
            
            // Set previous attempts from API response
            if (practiceSetData.previousAttempts && practiceSetData.previousAttempts.length > 0) {
              setPreviousAttempts(practiceSetData.previousAttempts);
              console.log('📊 Previous attempts loaded:', practiceSetData.previousAttempts.length);
            }
          }
        } else {
          console.error('Failed to load practice set:', practiceSetResponse.status);
          // No fallback to sample data in production
        }
      } catch (error) {
        console.error('Error loading lobby data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLobbyData();
  }, [testId, user]);

  // Debug log to see final state
  useEffect(() => {
    if (!loading) {
      console.log('🎮 Lobby state for button decision:', {
        hasActiveSession: !!activeSession,
        activeSessionTimeLeft: activeSession?.timeLeft,
        activeSessionIsActive: activeSession?.isActive,
        previousAttemptsCount: previousAttempts.length,
        shouldShowResume: activeSession && activeSession.timeLeft > 0,
        shouldShowRetake: !activeSession && previousAttempts.length > 0,
        shouldShowTake: !activeSession && previousAttempts.length === 0
      });
    }
  }, [activeSession, previousAttempts, loading]);

  const loadPreviousAttempts = async () => {
    // This function is now handled in the main useEffect
    // keeping it for compatibility but it's not used anymore
  };

  const handleStartTest = async () => {
    if (!agreedToTerms || !user?.id) {
      if (!user?.id) {
        alert('Please log in to start the test.');
        router.push('/login');
      }
      return;
    }

    setStartingTest(true);
    try {
      console.log('🎯 Starting test for user:', user.email);
      
      // If there's an active session with time remaining, resume it
      if (activeSession && activeSession.timeLeft > 0 && activeSession.isActive) {
        console.log('🔄 Resuming existing active session:', activeSession.id);
        router.push(`/quiz?testId=${testId}`);
        return;
      }
      
      // For new tests or retakes, always clear any existing sessions first
      try {
        await authenticatedFetch('/api/sessions', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            testId
          })
        });
        console.log('✅ Cleared any existing sessions for fresh start');
      } catch (clearError) {
        console.log('⚠️ No existing session to clear or error clearing:', clearError.message);
        // This is not critical, continue with test creation
      }

      // Start a new session
      console.log('🆕 Creating new session...');
      const newSessionResponse = await authenticatedFetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testId,
          action: 'start',
          duration: practiceSetInfo?.duration || 7200 // 2 hours default
        })
      });

      if (!newSessionResponse.ok) {
        const errorText = await newSessionResponse.text();
        console.error('❌ Session creation failed with status:', newSessionResponse.status);
        console.error('❌ Error response:', errorText);
        throw new Error(`Failed to create session: ${errorText}`);
      }

      const newSessionData = await newSessionResponse.json();
      console.log('📝 Session creation response:', newSessionData);
      
      if (newSessionData.success) {
        console.log('✅ New session created successfully');
        // Navigate to quiz with enforceTime and newSession to ensure fresh start
        router.push(`/quiz?testId=${testId}&enforceTime=${enforceTime}&newSession=true`);
      } else {
        throw new Error(newSessionData.error || 'Failed to create session');
      }
    } catch (error) {
      console.error('💥 Error starting test:', error);
      
      // Provide specific error messages based on the error type
      if (error.message.includes('No active session') || error.message.includes('Please log in')) {
        alert('Your session has expired. Please log in again to start the test.');
        router.push('/login');
      } else if (error.message.includes('Authentication required')) {
        alert('Authentication required. Please log in to start the test.');
        router.push('/login');
      } else {
        alert(`Failed to start test: ${error.message}. Please try again or contact support if the problem persists.`);
      }
    } finally {
      setStartingTest(false);
    }
  };

  const handleViewResults = (attemptId) => {
    router.push(`/results?testId=${testId}&attemptId=${attemptId}`);
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    }
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatTimeRemaining = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
  };

  const getPerformanceColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-blue-600';
    if (percentage >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceBadge = (percentage) => {
    if (percentage >= 80) return { color: 'bg-green-100 text-green-800', label: 'Excellent' };
    if (percentage >= 60) return { color: 'bg-blue-100 text-blue-800', label: 'Good' };
    if (percentage >= 40) return { color: 'bg-yellow-100 text-yellow-800', label: 'Average' };
    return { color: 'bg-red-100 text-red-800', label: 'Needs Improvement' };
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600 font-medium">Loading test information...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!practiceSetInfo) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="text-center">
            <p className="text-slate-600 font-medium">Practice set not found</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* Header */}
        <motion.header 
          className="bg-white/80 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-50"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              <motion.button
                onClick={() => router.push('/dashboard')}
                className="flex items-center space-x-1 sm:space-x-2 text-slate-600 hover:text-slate-900 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="font-medium text-xs sm:text-base">Go Back</span>
              </motion.button>
              
              <div className="text-base sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Entrance Academy
              </div>
              
              <div className="w-12 sm:w-20"></div> {/* Spacer for centering */}
            </div>
          </div>
        </motion.header>

        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-3 sm:py-8">
          {/* Mobile Layout */}
          <div className="block lg:hidden">
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {/* Mobile Practice Set Header */}
              <div className="bg-white rounded-lg p-4 shadow-lg border border-slate-200/50">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center shadow-lg mx-auto mb-3">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <div className="text-xs text-blue-600 font-medium mb-1">
                    {practiceSetInfo.category || 'BE/ BArch Entrance Preparation'}
                  </div>
                  <h1 className="text-lg font-bold text-slate-900 mb-3 leading-tight">
                    {practiceSetInfo.name}
                  </h1>
                </div>
                
                {/* Mobile Quick Stats */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="bg-slate-50 rounded-lg p-3 text-center">
                    <div className="text-xs text-slate-600 mb-1">Duration</div>
                    <div className="font-bold text-slate-900">{Math.floor((practiceSetInfo.duration || 7200) / 60)} min</div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 text-center">
                    <div className="text-xs text-slate-600 mb-1">Total Marks</div>
                    <div className="font-bold text-slate-900">{practiceSetInfo.totalMarks || (practiceSetInfo.totalQuestions * (practiceSetInfo.marksPerQuestion || 1))}</div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 text-center">
                    <div className="text-xs text-slate-600 mb-1">Pass Marks</div>
                    <div className="font-bold text-emerald-600">{practiceSetInfo.passMarks || Math.floor((practiceSetInfo.totalMarks || (practiceSetInfo.totalQuestions * (practiceSetInfo.marksPerQuestion || 1))) * ((practiceSetInfo.passingPercentage || 40) / 100))}</div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 text-center">
                    <div className="text-xs text-slate-600 mb-1">Questions</div>
                    <div className="font-bold text-slate-900">{practiceSetInfo.totalQuestions}</div>
                  </div>
                </div>

                {/* Mobile Negative Marking */}
                <div className="mt-4 flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm text-slate-600">Negative Marking</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-medium text-slate-700">
                      {practiceSetInfo.enableNegativeMarking ? `${practiceSetInfo.negativeMarkingRatio || 0.25}x` : 'Disabled'}
                    </span>
                    <div className={`w-8 h-4 rounded-full ${practiceSetInfo.enableNegativeMarking ? 'bg-blue-500' : 'bg-gray-300'}`}>
                      <div className={`w-3 h-3 bg-white rounded-full shadow-md transform ${practiceSetInfo.enableNegativeMarking ? 'translate-x-4' : 'translate-x-0.5'}`} style={{ marginTop: '2px' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Active Session Alert */}
              {activeSession && activeSession.timeLeft > 0 && (
                <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg p-4 text-white shadow-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-white flex-shrink-0" />
                    <h3 className="font-bold">Test in Progress</h3>
                  </div>
                  <p className="text-orange-100 text-xs">
                    {formatTimeRemaining(activeSession.timeLeft)} remaining. Your answers are saved.
                  </p>
                </div>
              )}

              {/* Mobile Previous Attempts */}
              {previousAttempts.length > 0 && (
                <div className="bg-white rounded-lg p-4 shadow-lg border border-slate-200/50">
                  <h3 className="font-bold text-slate-900 mb-3 flex items-center space-x-2">
                    <RotateCcw className="w-4 h-4 text-blue-600" />
                    <span className="text-sm">Previous Attempts ({previousAttempts.length})</span>
                  </h3>
                  <div className="space-y-2">
                    {previousAttempts.slice(0, 2).map((attempt, index) => {
                      const percentage = Math.abs(attempt.percentage || 0);
                      const badge = getPerformanceBadge(percentage);
                      
                      return (
                        <div key={attempt.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                              #{index + 1}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="font-bold text-sm text-slate-900">
                                  {attempt.score?.toFixed(0) || 0}/{practiceSetInfo.totalMarks || (practiceSetInfo.totalQuestions * (practiceSetInfo.marksPerQuestion || 1))}
                                </span>
                                <span className={`font-bold text-xs ${getPerformanceColor(percentage)}`}>
                                  {percentage.toFixed(0)}%
                                </span>
                              </div>
                              <div className="text-xs text-slate-500">
                                {new Date(attempt.completedAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleViewResults(attempt.id)}
                            className="px-3 py-1 bg-blue-500 text-white rounded text-xs"
                          >
                            View
                          </button>
                        </div>
                      );
                    })}
                    {previousAttempts.length > 2 && (
                      <div className="text-center text-xs text-slate-500 mt-2">
                        +{previousAttempts.length - 2} more attempts
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Mobile Start Section */}
              <div className="bg-white rounded-lg p-4 shadow-lg border border-slate-200/50">
                {/* Mobile Test Settings */}
                <div className="mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Enforce time limit</span>
                    <div 
                      className={`w-10 h-5 rounded-full cursor-pointer transition-colors ${
                        enforceTime ? 'bg-blue-500' : 'bg-slate-300'
                      }`}
                      onClick={() => setEnforceTime(!enforceTime)}
                    >
                      <div 
                        className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${
                          enforceTime ? 'translate-x-5' : 'translate-x-0.5'
                        }`}
                        style={{ marginTop: '2px' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Mobile Terms */}
                <label className="flex items-start space-x-3 cursor-pointer mb-4">
                  <motion.div
                    className={`w-5 h-5 min-w-[1.25rem] rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                      agreedToTerms ? 'bg-blue-500 border-blue-500' : 'border-slate-300'
                    }`}
                    onClick={() => setAgreedToTerms(!agreedToTerms)}
                    whileTap={{ scale: 0.95 }}
                  >
                    {agreedToTerms && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </motion.div>
                  <span className="text-sm text-slate-600 leading-relaxed flex-1">
                    I agree to the terms and conditions and understand that this is a timed examination.
                  </span>
                </label>

                {/* Mobile Start Button */}
                <motion.button
                  onClick={handleStartTest}
                  disabled={!agreedToTerms || startingTest}
                  className={`w-full py-4 rounded-lg font-bold text-lg transition-all duration-200 flex items-center justify-center space-x-2 ${
                    agreedToTerms && !startingTest
                      ? activeSession && activeSession.timeLeft > 0
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg'
                        : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                  whileHover={agreedToTerms ? { scale: 1.02 } : {}}
                  whileTap={agreedToTerms ? { scale: 0.98 } : {}}
                >
                  {startingTest ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Starting...</span>
                    </>
                  ) : activeSession && activeSession.timeLeft > 0 ? (
                    <>
                      <Play className="w-5 h-5" />
                      <span>Resume Exam</span>
                    </>
                  ) : previousAttempts.length > 0 ? (
                    <>
                      <RotateCcw className="w-5 h-5" />
                      <span>Retake Exam</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      <span>Start Exam</span>
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden lg:grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Practice Set Info */}
            <motion.div 
              className="lg:col-span-2 space-y-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              {/* Practice Set Header */}
              <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl border border-slate-200/50">
                <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-6">
                  <motion.div 
                    className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg mx-auto sm:mx-0"
                    whileHover={{ scale: 1.05, rotate: 5 }}
                  >
                    <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </motion.div>
                  
                  <div className="flex-1 text-center sm:text-left">
                    <div className="text-sm text-blue-600 font-medium mb-2">
                      {practiceSetInfo.category || 'BE/ BArch Entrance Preparation'}
                    </div>
                    <h1 className="text-xl sm:text-3xl font-bold text-slate-900 mb-3">
                      {practiceSetInfo.name}
                    </h1>
                    <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start space-y-2 sm:space-y-0 sm:space-x-6 text-sm text-slate-600">
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-xs sm:text-sm">Full Marks: {practiceSetInfo.totalMarks || (practiceSetInfo.totalQuestions * practiceSetInfo.marksPerQuestion) || (practiceSetInfo.totalQuestions * 1)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs sm:text-sm">Time: {Math.floor((practiceSetInfo.duration || 7200) / 60)} mins</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs sm:text-sm">Pass Marks: {practiceSetInfo.passMarks || Math.floor((practiceSetInfo.totalMarks || (practiceSetInfo.totalQuestions * (practiceSetInfo.marksPerQuestion || 1))) * ((practiceSetInfo.passingPercentage || 40) / 100))}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Overview Section */}
              <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl border border-slate-200/50">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-6">Overview</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b border-slate-100">
                      <span className="text-slate-600">Exam type</span>
                      <div className="flex items-center space-x-2">
                        <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                        <span className="font-medium text-slate-900">Practice Exam</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center py-3 border-b border-slate-100">
                      <span className="text-slate-600">Time</span>
                      <span className="font-medium text-slate-900">{Math.floor((practiceSetInfo.duration || 7200) / 3600)} hours</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-3">
                      <span className="text-slate-600">Negative marking</span>
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-slate-700">
                          {practiceSetInfo.enableNegativeMarking ? 'Enabled' : 'Disabled'}
                        </span>
                        <motion.div className={`w-12 h-6 rounded-full ${practiceSetInfo.enableNegativeMarking ? 'bg-blue-500' : 'bg-gray-300'}`}>
                          <motion.div 
                            className={`w-5 h-5 bg-white rounded-full shadow-md transform ${practiceSetInfo.enableNegativeMarking ? 'translate-x-6' : 'translate-x-0.5'}`}
                            style={{ marginTop: '2px' }}
                          />
                        </motion.div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b border-slate-100">
                      <span className="text-slate-600">Full Marks</span>
                      <span className="font-bold text-2xl text-slate-900">{practiceSetInfo.totalMarks || (practiceSetInfo.totalQuestions * (practiceSetInfo.marksPerQuestion || 1))}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-3 border-b border-slate-100">
                      <span className="text-slate-600">Pass Marks</span>
                      <span className="font-bold text-2xl text-emerald-600">{practiceSetInfo.passMarks || Math.floor((practiceSetInfo.totalMarks || (practiceSetInfo.totalQuestions * (practiceSetInfo.marksPerQuestion || 1))) * ((practiceSetInfo.passingPercentage || 40) / 100))}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-3">
                      <span className="text-slate-600">Negative marking Factor</span>
                      <span className="font-bold text-2xl text-red-600">{practiceSetInfo.enableNegativeMarking ? (practiceSetInfo.negativeMarkingRatio || 0.25) : 0}</span>
                    </div>
                  </div>
                </div>

                {/* Previous Attempts Section */}
                {previousAttempts.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-slate-200">
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center space-x-2">
                      <RotateCcw className="w-5 h-5 text-blue-600" />
                      <span>Previous Attempts ({previousAttempts.length})</span>
                    </h3>
                    <div className="space-y-3">
                      {previousAttempts.map((attempt, index) => {
                        const percentage = Math.abs(attempt.percentage || 0);
                        const badge = getPerformanceBadge(percentage);
                        
                        return (
                          <div key={attempt.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-blue-200 transition-colors">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
                                #{index + 1}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-1">
                                  <p className="font-bold text-slate-900">
                                    {attempt.score?.toFixed(1) || 0} / {practiceSetInfo.totalMarks || (practiceSetInfo.totalQuestions * (practiceSetInfo.marksPerQuestion || 1))}
                                  </p>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
                                    {badge.label}
                                  </span>
                                  <span className={`font-bold ${getPerformanceColor(percentage)}`}>
                                    {percentage.toFixed(1)}%
                                  </span>
                                </div>
                                <div className="flex items-center space-x-4 text-sm text-slate-600">
                                  <span className="flex items-center space-x-1">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    <span>{attempt.correctAnswers || 0} correct</span>
                                  </span>
                                  <span className="flex items-center space-x-1">
                                    <XCircle className="w-4 h-4 text-red-500" />
                                    <span>{attempt.wrongAnswers || 0} wrong</span>
                                  </span>
                                  <span className="flex items-center space-x-1">
                                    <Clock className="w-4 h-4 text-blue-500" />
                                    <span>{formatDuration(attempt.timeSpent || 0)}</span>
                                  </span>
                                  <span>{new Date(attempt.completedAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => handleViewResults(attempt.id)}
                              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm flex items-center space-x-2"
                            >
                              <Eye className="w-4 h-4" />
                              <span>View Details</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Right Column - Test Settings & Start */}
            <motion.div 
              className="space-y-4 sm:space-y-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              {/* Test Illustration */}
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl sm:rounded-3xl p-4 sm:p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
                
                <div className="relative z-10">
                  <motion.div 
                    className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4"
                    whileHover={{ scale: 1.1 }}
                  >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </motion.div>
                  <h3 className="text-xl font-bold mb-2">Ready to Start?</h3>
                  <p className="text-blue-100 text-sm leading-relaxed">
                    Make sure you have a stable internet connection and you're in a quiet environment.
                  </p>
                </div>
              </div>

              {/* Test Settings */}
              <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl border border-slate-200/50">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Test Settings</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Enforce time</span>
                    <motion.div 
                      className={`w-12 h-6 rounded-full cursor-pointer transition-colors ${
                        enforceTime ? 'bg-blue-500' : 'bg-slate-300'
                      }`}
                      onClick={() => setEnforceTime(!enforceTime)}
                    >
                      <motion.div 
                        className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                          enforceTime ? 'translate-x-6' : 'translate-x-0.5'
                        }`}
                        style={{ marginTop: '2px' }}
                      />
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* Active Session Alert */}
              {activeSession && activeSession.timeLeft > 0 && (
                <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-white shadow-xl border border-orange-200">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-6 h-6 text-white flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-lg font-bold mb-2">Test in Progress</h3>
                      <p className="text-orange-100 text-sm mb-3">
                        You have an ongoing test session with {formatTimeRemaining(activeSession.timeLeft)}.
                      </p>
                      <p className="text-orange-100 text-sm">
                        Your previous answers have been saved and will be restored when you continue.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Terms & Start Button */}
              <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl border border-slate-200/50">
                <div className="space-y-4">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <motion.div
                      className={`w-5 h-5 min-w-[1.25rem] rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                        agreedToTerms ? 'bg-blue-500 border-blue-500' : 'border-slate-300'
                      }`}
                      onClick={() => setAgreedToTerms(!agreedToTerms)}
                      whileTap={{ scale: 0.95 }}
                    >
                      {agreedToTerms && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </motion.div>
                    <span className="text-sm text-slate-600 leading-relaxed flex-1">
                      I agree to the terms and conditions and understand that this is a timed examination.
                    </span>
                  </label>

                  <motion.button
                    onClick={handleStartTest}
                    disabled={!agreedToTerms || startingTest}
                    className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-200 flex items-center justify-center space-x-2 ${
                      agreedToTerms && !startingTest
                        ? activeSession && activeSession.timeLeft > 0
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl'
                          : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                    whileHover={agreedToTerms ? { scale: 1.02, y: -2 } : {}}
                    whileTap={agreedToTerms ? { scale: 0.98 } : {}}
                  >
                    {startingTest ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Starting Test...</span>
                      </>
                    ) : activeSession && activeSession.timeLeft > 0 ? (
                      <>
                        <Play className="w-5 h-5" />
                        <span>Resume exam</span>
                      </>
                    ) : previousAttempts.length > 0 ? (
                      <>
                        <RotateCcw className="w-5 h-5" />
                        <span>Retake exam</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5" />
                        <span>Take exam</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
