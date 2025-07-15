'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Flag,
  CheckCircle,
  AlertCircle,
  BarChart3,
  BookOpen,
  Target,
  X,
  Pause,
  Play,
  Home,
  RotateCcw
} from 'lucide-react';

export default function StudentTestPage() {
  const [questionSet, setQuestionSet] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flaggedQuestions, setFlaggedQuestions] = useState(new Set());
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [testStartTime, setTestStartTime] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [testId, setTestId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useSelector((state) => state.auth);

  const setId = searchParams.get('setId');
  const setName = searchParams.get('setName');

  useEffect(() => {
    if (setId && user) {
      initializeTest();
    }
  }, [setId, user]);

  // Timer effect
  useEffect(() => {
    let interval;
    if (testStartTime && !isPaused && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [testStartTime, isPaused, timeRemaining]);

  const initializeTest = async () => {
    try {
      setLoading(true);
      
      // Fetch question set details
      const { data: setData, error: setError } = await supabase
        .from('generated_question_sets')
        .select(`
          *,
          template:question_set_templates(*)
        `)
        .eq('id', setId)
        .eq('is_published', true)
        .single();

      if (setError || !setData) {
        throw new Error('Question set not found or not published');
      }

      setQuestionSet(setData);

      // Extract question IDs from the generated set
      const questionIds = setData.questions.map(q => q.question_id);
      
      // Fetch actual questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select(`
          *,
          question_categories(name, code),
          domains(name, code)
        `)
        .in('id', questionIds)
        .eq('is_active', true);

      if (questionsError) {
        throw new Error('Failed to fetch questions');
      }

      // Shuffle questions if needed (based on template settings)
      let orderedQuestions = questionsData;
      if (setData.template?.shuffle_questions) {
        orderedQuestions = [...questionsData].sort(() => Math.random() - 0.5);
      }

      setQuestions(orderedQuestions);
      
      // Create test session
      const { data: testData, error: testError } = await supabase
        .from('tests')
        .insert([{
          user_id: user.id,
          test_name: setData.name,
          test_code: setData.code,
          total_questions: orderedQuestions.length,
          questions_order: orderedQuestions.map(q => q.id),
          status: 'in_progress',
          started_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + (setData.template?.total_questions || 200) * 90 * 1000).toISOString() // 1.5 min per question
        }])
        .select()
        .single();

      if (testError) {
        throw new Error('Failed to create test session');
      }

      setTestId(testData.id);
      setTestStartTime(Date.now());
      
      // Set timer (1.5 minutes per question)
      const totalTimeMinutes = (orderedQuestions.length * 1.5);
      setTimeRemaining(totalTimeMinutes * 60);

      // Update question set usage count
      await supabase
        .from('generated_question_sets')
        .update({ 
          times_used: setData.times_used + 1,
          last_used_at: new Date().toISOString()
        })
        .eq('id', setId);

    } catch (err) {
      console.error('Error initializing test:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const toggleFlag = (questionId) => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const navigateToQuestion = (index) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestionIndex(index);
    }
  };

  const handleAutoSubmit = useCallback(async () => {
    if (submitting) return;
    await submitTest(true);
  }, [submitting]);

  const submitTest = async (isAutoSubmit = false) => {
    try {
      setSubmitting(true);

      // Calculate scores
      let correctCount = 0;
      let totalMarks = 0;
      let obtainedMarks = 0;
      let negativeMarks = 0;

      const attempts = [];

      questions.forEach(question => {
        const userAnswer = answers[question.id];
        const isCorrect = userAnswer === question.correct_answer;
        
        totalMarks += 1; // Each question is 1 mark
        
        let marksObtained = 0;
        let marksDeducted = 0;

        if (userAnswer) {
          if (isCorrect) {
            correctCount++;
            marksObtained = 1;
            obtainedMarks += 1;
          } else {
            marksDeducted = 0.25; // Negative marking
            negativeMarks += 0.25;
          }
        }

        attempts.push({
          test_id: testId,
          question_id: question.id,
          selected_answer: userAnswer || null,
          is_correct: isCorrect,
          marks_obtained: marksObtained,
          marks_deducted: marksDeducted,
          time_spent_seconds: 90, // Simplified - in real app, track actual time
          marked_for_review: flaggedQuestions.has(question.id)
        });
      });

      const finalScore = obtainedMarks - negativeMarks;
      const percentage = totalMarks > 0 ? (finalScore / totalMarks * 100) : 0;

      // Update test record
      await supabase
        .from('tests')
        .update({
          status: 'submitted',
          submitted_at: new Date().toISOString(),
          attempted_questions: Object.keys(answers).length,
          unattempted_questions: questions.length - Object.keys(answers).length,
          correct_answers: correctCount,
          wrong_answers: Object.keys(answers).length - correctCount,
          total_marks: totalMarks,
          obtained_marks: obtainedMarks,
          negative_marks: negativeMarks,
          final_score: finalScore,
          percentage: percentage,
          marked_for_review: flaggedQuestions.size
        })
        .eq('id', testId);

      // Insert attempts
      if (attempts.length > 0) {
        await supabase
          .from('attempts')
          .insert(attempts);
      }

      // Navigate to results
      router.push(`/student/results?testId=${testId}&autoSubmit=${isAutoSubmit}`);

    } catch (error) {
      console.error('Error submitting test:', error);
      alert('Failed to submit test. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getQuestionStatus = (index) => {
    const question = questions[index];
    if (!question) return 'unanswered';
    
    const hasAnswer = answers[question.id];
    const isFlagged = flaggedQuestions.has(question.id);
    
    if (hasAnswer && isFlagged) return 'answered-flagged';
    if (hasAnswer) return 'answered';
    if (isFlagged) return 'flagged';
    return 'unanswered';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'answered': return 'bg-green-500 text-white';
      case 'flagged': return 'bg-yellow-500 text-white';
      case 'answered-flagged': return 'bg-blue-500 text-white';
      default: return 'bg-gray-200 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading test...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Test</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/student/question-sets')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Question Sets
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-gray-900 truncate max-w-md">
                {questionSet?.name || 'Test'}
              </h1>
              <span className="text-sm text-gray-500">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                timeRemaining < 300 ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
              }`}>
                <Clock className="w-4 h-4" />
                <span className="font-mono font-medium">{formatTime(timeRemaining)}</span>
              </div>
              
              <button
                onClick={() => setIsPaused(!isPaused)}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
              </button>
              
              <button
                onClick={() => setShowEndModal(true)}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                End Test
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Question Panel */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              {currentQuestion && (
                <div>
                  {/* Question Header */}
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        Q{currentQuestionIndex + 1}
                      </span>
                      <span className="text-sm text-gray-500">
                        {currentQuestion.domains?.name} - {currentQuestion.question_categories?.name}
                      </span>
                    </div>
                    
                    <button
                      onClick={() => toggleFlag(currentQuestion.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        flaggedQuestions.has(currentQuestion.id)
                          ? 'bg-yellow-100 text-yellow-600'
                          : 'bg-gray-100 text-gray-600 hover:bg-yellow-100 hover:text-yellow-600'
                      }`}
                    >
                      <Flag className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Question Text */}
                  <div className="mb-8">
                    <p className="text-lg text-gray-900 leading-relaxed">
                      {currentQuestion.text}
                    </p>
                    {currentQuestion.question_image_url && (
                      <img
                        src={currentQuestion.question_image_url}
                        alt="Question"
                        className="mt-4 max-w-full h-auto rounded-lg"
                      />
                    )}
                  </div>

                  {/* Options */}
                  <div className="space-y-4 mb-8">
                    {currentQuestion.options?.map((option, index) => {
                      const optionKey = ['A', 'B', 'C', 'D'][index];
                      const isSelected = answers[currentQuestion.id] === optionKey;
                      
                      return (
                        <label
                          key={index}
                          className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="radio"
                              name={`question-${currentQuestion.id}`}
                              value={optionKey}
                              checked={isSelected}
                              onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                              className="w-5 h-5 text-blue-600 mt-1"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-gray-900">{optionKey}.</span>
                              </div>
                              <p className="text-gray-800">{option.text}</p>
                              {option.image && (
                                <img
                                  src={option.image}
                                  alt={`Option ${optionKey}`}
                                  className="mt-2 max-w-xs h-auto rounded"
                                />
                              )}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  {/* Navigation */}
                  <div className="flex justify-between items-center">
                    <button
                      onClick={() => navigateToQuestion(currentQuestionIndex - 1)}
                      disabled={currentQuestionIndex === 0}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </button>
                    
                    <div className="text-sm text-gray-500">
                      {currentQuestionIndex + 1} of {questions.length}
                    </div>
                    
                    <button
                      onClick={() => navigateToQuestion(currentQuestionIndex + 1)}
                      disabled={currentQuestionIndex === questions.length - 1}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Question Navigator Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
              <h3 className="font-semibold text-gray-900 mb-4">Question Navigator</h3>
              
              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                <div className="text-center p-2 bg-green-50 rounded">
                  <div className="font-semibold text-green-600">{Object.keys(answers).length}</div>
                  <div className="text-green-600">Answered</div>
                </div>
                <div className="text-center p-2 bg-yellow-50 rounded">
                  <div className="font-semibold text-yellow-600">{flaggedQuestions.size}</div>
                  <div className="text-yellow-600">Flagged</div>
                </div>
              </div>

              {/* Question Grid */}
              <div className="grid grid-cols-5 gap-2">
                {questions.map((_, index) => {
                  const status = getQuestionStatus(index);
                  return (
                    <button
                      key={index}
                      onClick={() => navigateToQuestion(index)}
                      className={`w-8 h-8 text-xs font-medium rounded transition-colors ${
                        index === currentQuestionIndex
                          ? 'ring-2 ring-blue-500 ring-offset-1'
                          : ''
                      } ${getStatusColor(status)}`}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-4 space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                  <span>Flagged</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span>Answered & Flagged</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-200 rounded"></div>
                  <span>Unanswered</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* End Test Modal */}
      <AnimatePresence>
        {showEndModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl max-w-md w-full p-6"
            >
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">End Test?</h2>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to end the test? You have answered {Object.keys(answers).length} out of {questions.length} questions.
                </p>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowEndModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Continue Test
                  </button>
                  <button
                    onClick={() => submitTest()}
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'End Test'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 