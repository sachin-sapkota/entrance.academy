'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Trophy, 
  Target, 
  AlertCircle,
  RotateCcw,
  FileText,
  Calendar,
  Timer,
  Award,
  TrendingUp,
  ArrowLeft,
  Home,
  User,
  BarChart3
} from 'lucide-react';
import ProtectedRoute from '../components/ProtectedRoute';
import { logger } from '../../lib/logger';

export default function ResultsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const testId = searchParams.get('testId');
  
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [practiceSetInfo, setPracticeSetInfo] = useState(null);
  const [practiceSetId, setPracticeSetId] = useState(null);

  // Get results from Redux if available
  const reduxResults = useSelector(state => state.quiz);
  // Get user from Redux auth state
  const user = useSelector(state => state.auth.user);

  useEffect(() => {
    const loadResults = async () => {
      try {
        // First check if we have actual Redux results
        if (reduxResults && reduxResults.totalCorrect !== undefined) {
          logger.info('Using Redux results for display', { 
            hasResults: true,
            totalQuestions: reduxResults.totalQuestions
          });
          // For Redux results, the testId is likely the practice set ID
          setPracticeSetId(reduxResults.practiceSetId || testId);
          setResults(reduxResults);
        } else if (testId && user?.id) {
          logger.info('Fetching results from API', { testId, userId: user.id });
          
          const { authenticatedFetch } = await import('../../lib/supabase');
          
          // Method 1: Check for completed test in database
          try {
            const testResponse = await authenticatedFetch(`/api/tests/${testId}`);
            if (testResponse.ok) {
              const testData = await testResponse.json();
              if (testData.success && testData.test) {
                logger.info('Found completed test in database', { 
                  testId,
                  status: testData.test.status 
                });
                
                // Extract practice set ID from test metadata
                const testPracticeSetId = testData.test.meta_data?.practice_set_id || testId;
                setPracticeSetId(testPracticeSetId);
                
                // Convert database test format to results format
                const dbResults = {
                  totalQuestions: testData.test.total_questions,
                  attemptedQuestions: testData.test.attempted_questions,
                  unattemptedQuestions: testData.test.unattempted_questions,
                  correctAnswers: testData.test.correct_answers,
                  wrongAnswers: testData.test.wrong_answers,
                  rawScore: testData.test.obtained_marks,
                  negativeMarks: testData.test.negative_marks,
                  finalScore: testData.test.final_score,
                  maxPossibleScore: testData.test.total_marks,
                  percentage: testData.test.percentage,
                  submissionTime: testData.test.submitted_at,
                  totalTimeSpent: testData.test.time_spent_seconds,
                  domainScores: testData.test.domain_scores || {},
                  detailedResults: testData.attempts || []
                };
                
                setResults(dbResults);
                return;
              }
            }
          } catch (dbError) {
            logger.warn('No completed test found in database', { error: dbError.message });
          }
          
          // Method 2: Check session data (fallback)
          try {
            const sessionResponse = await authenticatedFetch(`/api/sessions?testId=${testId}`);
            if (sessionResponse.ok) {
              const sessionData = await sessionResponse.json();
              
              if (sessionData.success && sessionData.session?.results) {
                logger.info('Found session with results', { testId });
                // For session results, try to get practice set ID from session data
                setPracticeSetId(sessionData.session.practiceSetId || testId);
                setResults(sessionData.session.results);
                return;
              }
            }
          } catch (sessionError) {
            logger.warn('No session results found', { error: sessionError.message });
          }
          
          // If we get here, no results were found
          logger.warn('No results found from any source', { testId, userId: user.id });
          setResults(null);
        } else {
          logger.warn('Missing required parameters for results loading', { 
            hasTestId: !!testId, 
            hasUserId: !!user?.id 
          });
          setResults(null);
        }
      } catch (error) {
        logger.error('Error loading results', { error: error.message, testId });
        setResults(null);
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [testId, reduxResults, user]);

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-slate-600 font-medium">Loading your results...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!results) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h1 className="text-xl font-bold text-slate-900 mb-2">Results Not Found</h1>
            <p className="text-slate-600 mb-4">Complete a test to see your results here.</p>
            
            <div className="space-y-3">
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Go to Dashboard
              </button>
              
              {!user?.id && (
                <button
                  onClick={() => router.push('/login')}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Login First
                </button>
              )}
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Debug information
  logger.info('Results page state for debugging', {
    testId,
    practiceSetId,
    hasResults: !!results,
    hasUser: !!user?.id,
    userEmail: user?.email,
    reduxResultsAvailable: !!(reduxResults && reduxResults.totalCorrect !== undefined)
  });

  // Use actual results data - handle both Redux format and session format
  const marksObtained = results.rawScore || (results.correctAnswers * 4) || 0;
  const negativeMarksDeducted = results.negativeMarks || results.negativeMarksDeducted || 0;
  const unattemptedQuestions = results.unattemptedQuestions || (results.totalQuestions - (results.attemptedQuestions || 0));
  const unattemptedMarks = unattemptedQuestions * 4;
  const finalScore = results.finalScore || results.totalMarksObtained || (marksObtained - negativeMarksDeducted);
  const totalMarks = results.maxPossibleScore || (results.totalQuestions * 4);
  const percentage = results.percentage !== undefined ? Math.abs(results.percentage) : ((finalScore / totalMarks) * 100);

  const submissionDate = new Date(results.submissionTime || new Date());
  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getPerformanceColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-blue-600';
    if (percentage >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceGradient = (percentage) => {
    if (percentage >= 80) return 'from-green-500 to-emerald-600';
    if (percentage >= 60) return 'from-blue-500 to-indigo-600';
    if (percentage >= 40) return 'from-yellow-500 to-orange-600';
    return 'from-red-500 to-rose-600';
  };

  return (
    <ProtectedRoute>
      {/* Compact Navigation Header */}
      <motion.header 
        className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="font-medium text-sm sm:text-base">Dashboard</span>
              </button>
              
              <div className="hidden md:flex items-center space-x-1 text-sm">
                <Home className="w-4 h-4 text-gray-400" />
                <span className="text-gray-400">/</span>
                <span className="text-gray-600">Dashboard</span>
                <span className="text-gray-400">/</span>
                <span className="text-blue-600 font-medium">Results</span>
              </div>
            </div>

            <div className="text-sm sm:text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              <span className="hidden sm:inline">MCQ </span>Platform
            </div>

            <div className="flex items-center space-x-3">
              <div className="hidden md:flex items-center space-x-2">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">{user?.email || 'Student'}</div>
                  <div className="text-xs text-gray-500">Test Results</div>
                </div>
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-3 h-3 text-blue-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-4 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Compact Results Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-slate-100"
          >
            <div className="text-center">
              {/* Compact Trophy Icon */}
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 shadow-lg ${
                percentage >= 80 ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                percentage >= 60 ? 'bg-gradient-to-r from-blue-400 to-indigo-500' :
                percentage >= 40 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                'bg-gradient-to-r from-red-400 to-rose-500'
              }`}>
                <Trophy className="w-8 h-8 text-white" />
              </div>
              
              {/* Compact Title */}
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                {percentage >= 80 ? 'Excellent!' :
                 percentage >= 60 ? 'Good Job!' :
                 percentage >= 40 ? 'Keep Improving!' :
                 'Keep Practicing!'}
              </h1>
              
              {/* Test Info */}
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-slate-700 mb-1">
                  {practiceSetInfo?.name || 'MCQ Test'}
                </h2>
                <div className="flex items-center justify-center space-x-3 text-sm text-slate-600">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>{submissionDate.toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{submissionDate.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</span>
                  </div>
                </div>
              </div>

              {/* Compact Score Display */}
              <div className="bg-slate-50 rounded-xl p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className={`text-3xl font-bold mb-1 bg-gradient-to-r ${getPerformanceGradient(percentage)} bg-clip-text text-transparent`}>
                      {percentage.toFixed(1)}%
                    </div>
                    <div className="text-sm text-slate-600">Overall Score</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900 mb-1">
                      {finalScore.toFixed(1)}<span className="text-lg text-slate-500">/{totalMarks}</span>
                    </div>
                    <div className="text-sm text-slate-600">Final Marks</div>
                  </div>
                  
                  <div className="text-center">
                    <div className={`text-2xl font-bold mb-1 ${getPerformanceColor(percentage)}`}>
                      {percentage >= 90 ? 'A+' :
                       percentage >= 80 ? 'A' :
                       percentage >= 70 ? 'B+' :
                       percentage >= 60 ? 'B' :
                       percentage >= 50 ? 'C+' :
                       percentage >= 40 ? 'C' : 'D'}
                    </div>
                    <div className="text-sm text-slate-600">Grade</div>
                  </div>
                </div>
              </div>

              {/* Compact Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                  <CheckCircle className="w-5 h-5 text-green-600 mx-auto mb-1" />
                  <div className="text-lg font-bold text-green-600">{results.correctAnswers}</div>
                  <div className="text-xs text-slate-600">Correct</div>
                </div>
                <div className="bg-red-50 rounded-lg p-3 border border-red-100">
                  <XCircle className="w-5 h-5 text-red-600 mx-auto mb-1" />
                  <div className="text-lg font-bold text-red-600">{results.wrongAnswers || (results.attemptedQuestions - results.correctAnswers)}</div>
                  <div className="text-xs text-slate-600">Incorrect</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                  <Target className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                  <div className="text-lg font-bold text-blue-600">{results.attemptedQuestions}</div>
                  <div className="text-xs text-slate-600">Attempted</div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-100">
                  <Timer className="w-5 h-5 text-yellow-600 mx-auto mb-1" />
                  <div className="text-lg font-bold text-yellow-600">{formatDuration(results.totalTimeSpent || 0)}</div>
                  <div className="text-xs text-slate-600">Time Taken</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Compact Summary Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Performance Overview */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-white rounded-xl shadow-lg p-6 border border-slate-100"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-900">Performance Overview</h2>
                <div className="flex items-center space-x-2">
                  <Timer className="w-4 h-4 text-slate-500" />
                  <span className="text-sm text-slate-600">{formatDuration(results.totalTimeSpent || 0)}</span>
                </div>
              </div>
              
              <div className="text-center mb-4">
                <div className={`text-4xl font-bold mb-1 bg-gradient-to-r ${getPerformanceGradient(percentage)} bg-clip-text text-transparent`}>
                  {percentage.toFixed(1)}%
                </div>
                <p className="text-slate-600">Overall Score</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <div className="text-xl font-bold text-slate-900">{results.correctAnswers}</div>
                  <div className="text-sm text-slate-600">Correct</div>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <div className="text-xl font-bold text-slate-900">{results.wrongAnswers || (results.attemptedQuestions - results.correctAnswers)}</div>
                  <div className="text-sm text-slate-600">Incorrect</div>
                </div>
              </div>
            </motion.div>

            {/* Compact Detailed Statistics */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white rounded-xl shadow-lg p-6 border border-slate-100"
            >
              <h2 className="text-lg font-bold text-slate-900 mb-4">Detailed Breakdown</h2>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-slate-900">Questions Attempted</span>
                  </div>
                  <span className="text-lg font-bold text-green-600">{results.attemptedQuestions}/{results.totalQuestions}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex items-center space-x-2">
                    <Target className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-slate-900">Accuracy Rate</span>
                  </div>
                  <span className="text-lg font-bold text-blue-600">
                    {results.attemptedQuestions > 0 ? ((results.correctAnswers / results.attemptedQuestions) * 100).toFixed(1) : 0}%
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-slate-600" />
                    <span className="font-medium text-slate-900">Avg. Time per Question</span>
                  </div>
                  <span className="text-lg font-bold text-slate-600">
                    {results.attemptedQuestions > 0 ? Math.round((results.totalTimeSpent || 0) / results.attemptedQuestions) : 0}s
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Compact Score Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-slate-100"
          >
            <h2 className="text-lg font-bold text-slate-900 mb-4">Score Breakdown</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Marks Obtained */}
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Award className="w-4 h-4 text-white" />
                </div>
                <div className="text-2xl font-bold text-green-600 mb-1">{marksObtained}</div>
                <div className="text-xs text-slate-600 mb-1">Marks Obtained</div>
                <div className="text-xs text-green-600 font-medium">{results.correctAnswers}/{results.totalQuestions}</div>
              </div>

              {/* Unattempted Marks */}
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <div className="text-2xl font-bold text-blue-600 mb-1">{unattemptedMarks}</div>
                <div className="text-xs text-slate-600 mb-1">Unattempted Marks</div>
                <div className="text-xs text-blue-600 font-medium">{unattemptedQuestions}/{results.totalQuestions}</div>
              </div>

              {/* Negative Marks */}
              <div className="text-center p-4 bg-gradient-to-br from-red-50 to-rose-50 rounded-xl border border-red-100">
                <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-rose-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <XCircle className="w-4 h-4 text-white" />
                </div>
                <div className="text-2xl font-bold text-red-600 mb-1">-{negativeMarksDeducted}</div>
                <div className="text-xs text-slate-600 mb-1">Negative Marks</div>
                <div className="text-xs text-red-600 font-medium">{results.wrongAnswers || (results.attemptedQuestions - results.correctAnswers)}/{results.totalQuestions}</div>
              </div>

              {/* Final Score */}
              <div className={`text-center p-4 bg-gradient-to-br ${
                percentage >= 60 ? 'from-purple-50 to-violet-50 border-purple-100' : 'from-slate-50 to-gray-50 border-slate-200'
              } rounded-xl border`}>
                <div className={`w-8 h-8 bg-gradient-to-r ${
                  percentage >= 60 ? 'from-purple-500 to-violet-600' : 'from-slate-500 to-gray-600'
                } rounded-full flex items-center justify-center mx-auto mb-2`}>
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <div className={`text-2xl font-bold mb-1 ${
                  percentage >= 60 ? 'text-purple-600' : 'text-slate-600'
                }`}>
                  {finalScore.toFixed(1)}
                </div>
                <div className="text-xs text-slate-600 mb-1">Total Score</div>
                <div className={`text-xs font-medium ${
                  percentage >= 60 ? 'text-purple-600' : 'text-slate-600'
                }`}>
                  {finalScore.toFixed(1)}/{totalMarks}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Compact Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <button
              onClick={() => {
                const retakeId = practiceSetId || testId;
                logger.info('Retake button clicked', { 
                  testId, 
                  practiceSetId, 
                  retakeId,
                  hasPracticeSetId: !!practiceSetId,
                  hasTestId: !!testId 
                });
                
                if (!retakeId) {
                  logger.warn('No practice set ID or test ID available for retake', { testId, practiceSetId });
                  alert('Practice set ID not found. Please go to dashboard and select a practice set.');
                  router.push('/dashboard');
                  return;
                }
                
                try {
                  logger.info('Navigating to lobby for retake', { destination: `/lobby/${retakeId}` });
                  router.push(`/lobby/${retakeId}`);
                } catch (error) {
                  logger.error('Error navigating to lobby', { error: error.message, retakeId });
                  alert('Unable to retake exam. Please try again or go to dashboard.');
                }
              }}
              className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retake Exam</span>
            </button>
            
            <button
              onClick={() => {
                logger.info('View solutions button clicked', { testId, hasTestId: !!testId });
                if (testId) {
                  try {
                    logger.info('Navigating to solutions', { destination: `/solution?testId=${testId}` });
                    router.push(`/solution?testId=${testId}`);
                  } catch (error) {
                    logger.error('Error navigating to solutions', { error: error.message, testId });
                    alert('Unable to view solutions. Please try again.');
                  }
                } else {
                  logger.warn('No testId for solutions, going to general solutions page');
                  router.push('/solution');
                }
              }}
              className="flex items-center justify-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <FileText className="w-4 h-4" />
              <span>View Solutions</span>
            </button>
          </motion.div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 