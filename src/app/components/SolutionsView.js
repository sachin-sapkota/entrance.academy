'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight,
  BookOpen,
  Target,
  Clock,
  ArrowLeft,
  Menu,
  X
} from 'lucide-react';
import LatexRenderer, { ProcessLatexText } from './LatexRenderer';

export default function SolutionsView({ results, onBack, practiceSetInfo }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showQuestionNav, setShowQuestionNav] = useState(false);
  const questionRefs = useRef({});
  
  const questionsPerPage = 20;

  useEffect(() => {
    const processQuestionsAndResults = async () => {
      try {
        console.log('🔍 SolutionsView received results:', results);
        console.log('🔍 Results type:', typeof results);
        console.log('🔍 Results has attempts:', !!results?.attempts);
        console.log('🔍 Attempts is array:', Array.isArray(results?.attempts));
        console.log('🔍 Attempts length:', results?.attempts?.length || 0);
        
        // Check if we have attempts with questions data
        if (results?.attempts && Array.isArray(results.attempts)) {
          console.log('✅ Processing attempts data...');
          console.log('📝 Sample attempt:', results.attempts[0]);
          
          // Process the attempts data which includes questions
          const questionsWithResults = results.attempts.map((attempt, index) => {
            const question = attempt.question || {};
            console.log(`📋 Processing attempt ${index + 1}:`, {
              questionId: attempt.question_id,
              hasQuestion: !!attempt.question,
              questionText: question.text?.substring(0, 50) + '...',
              selectedAnswer: attempt.selected_answer,
              isCorrect: attempt.is_correct
            });
            
            // Parse the correct answer if it's a JSON string
            let correctAnswer = question.correct_answer;
            if (typeof correctAnswer === 'string' && correctAnswer.startsWith('"')) {
              try {
                correctAnswer = JSON.parse(correctAnswer);
              } catch (e) {
                // Keep as is if parsing fails
              }
            }
            
            // Parse the selected answer if it's a JSON string
            let selectedAnswer = attempt.selected_answer;
            if (typeof selectedAnswer === 'string' && selectedAnswer.startsWith('"')) {
              try {
                selectedAnswer = JSON.parse(selectedAnswer);
              } catch (e) {
                // Keep as is if parsing fails
              }
            }
            
            // Handle missing question data by creating a minimal question
            const processedQuestion = {
              id: question.id || attempt.question_id,
              text: question.text || `Question ${attempt.question_id}`,
              options: question.options || [
                { text: "Option A" },
                { text: "Option B" },
                { text: "Option C" },
                { text: "Option D" }
              ],
              explanation: question.explanation || "No explanation available",
              correct_answer: correctAnswer || "A",
              domain: question.domain || "General",
              difficulty_level: question.difficulty_level || "medium",
              // User response data
              userAnswer: selectedAnswer,
              isAttempted: !!selectedAnswer,
              isCorrect: attempt.is_correct || false,
              timeSpent: attempt.time_spent_seconds || 0,
              marksObtained: attempt.marks_obtained || 0,
              marksDeducted: attempt.marks_deducted || 0
            };
            
            return processedQuestion;
          });
          
          // Sort by question ID to maintain order
          questionsWithResults.sort((a, b) => a.id - b.id);
          
          console.log('✅ Processed questions with results:', questionsWithResults.length);
          console.log('📋 Sample processed question:', questionsWithResults[0]);
          
          setQuestions(questionsWithResults);
        } else {
          console.warn('❌ No attempts data found in results');
          console.log('🔍 Full results object:', results);
          setQuestions([]);
        }
      } catch (error) {
        console.error('💥 Error processing questions:', error);
        setQuestions([]);
      } finally {
        setLoading(false);
      }
    };

    if (results) {
      processQuestionsAndResults();
    } else {
      console.warn('❌ No results provided to SolutionsView');
      setLoading(false);
    }
  }, [results]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading solutions...</p>
        </div>
      </div>
    );
  }

  console.log('🎯 SolutionsView render check:', {
    hasResults: !!results,
    questionsLength: questions.length,
    willShowNotAvailable: !questions.length || !results
  });

  if (!questions.length || !results) {
    console.log('❌ Showing "Solutions Not Available" because:', {
      noQuestions: !questions.length,
      noResults: !results,
      questionsLength: questions.length,
      resultsType: typeof results
    });
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Solutions Not Available</h1>
          <p className="text-gray-600 mb-6 text-sm sm:text-base">Complete a test first to see detailed solutions.</p>
          
          {/* Debug info */}
          <details className="text-left bg-gray-100 rounded p-4 mb-4 text-sm">
            <summary className="font-semibold cursor-pointer">Debug Info</summary>
            <div className="mt-2 space-y-1">
              <div>Has Results: {results ? 'Yes' : 'No'}</div>
              <div>Questions Length: {questions.length}</div>
              <div>Results Type: {typeof results}</div>
              <div>Has Attempts: {results?.attempts ? 'Yes' : 'No'}</div>
              <div>Attempts Length: {results?.attempts?.length || 0}</div>
            </div>
          </details>
          
          <button
            onClick={onBack}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 w-full sm:w-auto"
          >
            Back to Results
          </button>
        </div>
      </div>
    );
  }

  // Pagination logic
  const totalPages = Math.ceil(questions.length / questionsPerPage);
  const startIndex = (currentPage - 1) * questionsPerPage;
  const endIndex = Math.min(startIndex + questionsPerPage, questions.length);
  const currentQuestions = questions.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToQuestion = (questionIndex) => {
    const questionId = `question-${questions[questionIndex].id}`;
    const element = document.getElementById(questionId);
    
    if (element) {
      // Close mobile nav first
      setShowQuestionNav(false);
      
      // Wait a bit for mobile nav to close, then scroll
      setTimeout(() => {
        const headerHeight = window.innerWidth >= 640 ? 120 : 80; // Different header heights for mobile/desktop
        const rect = element.getBoundingClientRect();
        const elementTop = window.pageYOffset + rect.top - headerHeight;
        
        window.scrollTo({
          top: Math.max(0, elementTop),
          behavior: 'smooth'
        });
        
        console.log(`Scrolled to question ${questionIndex + 1}, elementTop: ${elementTop}`);
      }, 200);
    } else {
      console.error(`Element not found for question ${questionIndex + 1} with ID: ${questionId}`);
    }
  };

  const getQuestionStatus = (question) => {
    if (!question.isAttempted) return 'unanswered';
    return question.isCorrect ? 'correct' : 'incorrect';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'correct': return 'bg-green-500 text-white';
      case 'incorrect': return 'bg-red-500 text-white';
      case 'unanswered': return 'bg-gray-400 text-gray-800';
      default: return 'bg-gray-400 text-gray-800';
    }
  };

  const getOptionStyle = (question, optionKey) => {
    const isUserAnswer = question.userAnswer === optionKey;
    const isCorrectAnswer = question.correct_answer === optionKey;
    
    if (isCorrectAnswer) {
      return 'bg-green-50 border-green-300 text-green-900';
    } else if (isUserAnswer && !isCorrectAnswer) {
      return 'bg-red-50 border-red-300 text-red-900';
    }
    return 'bg-gray-50 border-gray-200 text-gray-700';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-First Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          {/* Mobile Header */}
          <div className="flex items-center justify-between sm:hidden">
            <button
              onClick={onBack}
              className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back</span>
            </button>
            
            <div className="text-center flex-1 mx-4">
              <h1 className="text-lg font-bold text-gray-900">Solutions</h1>
              <p className="text-xs text-gray-600 truncate">{practiceSetInfo?.name || 'MCQ Test'}</p>
            </div>
            
            <button
              onClick={() => setShowQuestionNav(!showQuestionNav)}
              className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors"
            >
              {showQuestionNav ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Desktop Header */}
          <div className="hidden sm:flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Results</span>
            </button>
            
            <div className="text-center">
              <h1 className="text-xl font-bold text-gray-900">Solutions</h1>
              <p className="text-sm text-gray-600">{practiceSetInfo?.name || 'MCQ Test'}</p>
            </div>
            
            <div className="flex items-center space-x-2 text-gray-600">
              <BookOpen className="w-5 h-5" />
              <span className="font-medium">
                {startIndex + 1}-{endIndex} of {questions.length}
              </span>
            </div>
          </div>

          {/* Mobile Questions Counter */}
          <div className="sm:hidden mt-2 text-center">
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {startIndex + 1}-{endIndex} of {questions.length} questions
            </span>
          </div>
        </div>

        {/* Mobile Question Navigation */}
        <AnimatePresence>
          {showQuestionNav && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="sm:hidden bg-white border-t border-gray-200 overflow-hidden"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Questions</h3>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {questions.length} total
                  </span>
                </div>
                
                {/* Status Summary for Mobile */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-1">
                      <span className="text-sm font-bold text-gray-600">
                        {questions.filter(q => !q.isAttempted).length}
                      </span>
                    </div>
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      unanswered
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-1">
                      <span className="text-sm font-bold text-green-600">
                        {questions.filter(q => q.isCorrect).length}
                      </span>
                    </div>
                    <div className="text-xs font-medium text-green-600 uppercase tracking-wide">
                      correct
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-1">
                      <span className="text-sm font-bold text-red-600">
                        {questions.filter(q => q.isAttempted && !q.isCorrect).length}
                      </span>
                    </div>
                    <div className="text-xs font-medium text-red-600 uppercase tracking-wide">
                      wrong
                    </div>
                  </div>
                </div>
                
                {/* All Questions Grid */}
                <div className="max-h-48 overflow-y-auto mb-3">
                  <div className="grid grid-cols-6 gap-2 p-2">
                    {questions.map((question, index) => {
                      const questionNumber = index + 1;
                      const status = getQuestionStatus(question);
                      
                      return (
                        <button
                          key={question.id}
                          onClick={() => {
                            console.log(`Mobile: Scrolling to question ${questionNumber}, index ${index}`);
                            scrollToQuestion(index);
                          }}
                          className={`h-8 w-8 rounded-lg text-xs font-semibold border transition-all duration-200 active:scale-95 ${
                            status === 'correct' 
                              ? 'bg-green-500 text-white border-green-500' 
                              : status === 'incorrect'
                              ? 'bg-red-500 text-white border-red-500'
                              : 'bg-white text-gray-600 border-gray-300'
                          }`}
                          title={`Question ${questionNumber} - ${status}`}
                        >
                          {questionNumber}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Instruction */}
                <div className="text-center">
                  <p className="text-xs text-gray-500">Tap any number to jump to that question</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-4 space-y-4 sm:space-y-6">
            <AnimatePresence mode="wait">
              {currentQuestions.map((question, index) => {
                const questionNumber = startIndex + index + 1;
                const status = getQuestionStatus(question);
                
                return (
                  <motion.div
                    key={question.id}
                    id={`question-${question.id}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                  >
                    {/* Question Header */}
                    <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                        <div className="flex items-center space-x-3">
                          <span className="text-base sm:text-lg font-bold text-gray-900">
                            Question {questionNumber}
                          </span>
                          <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${
                            status === 'correct' ? 'bg-green-100 text-green-800' :
                            status === 'incorrect' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {status === 'correct' ? 'Correct' : 
                             status === 'incorrect' ? 'Incorrect' : 'Not Attempted'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          {status === 'correct' && <span className="text-green-600 font-medium">+{question.marksObtained || 4} marks</span>}
                          {status === 'incorrect' && <span className="text-red-600 font-medium">-{question.marksDeducted || 1} mark</span>}
                          {status === 'unanswered' && <span className="text-gray-600 font-medium">0 marks</span>}
                        </div>
                      </div>
                    </div>

                    {/* Question Content */}
                    <div className="p-4 sm:p-6">
                      <div className="mb-4 sm:mb-6">
                        <div className="text-base sm:text-lg text-gray-900 leading-relaxed">
                          <ProcessLatexText text={question.text} />
                        </div>
                      </div>

                      {/* Options */}
                      <div className="grid grid-cols-1 gap-3 mb-4 sm:mb-6">
                        {question.options?.map((option, optIndex) => {
                          const optionKey = ['A', 'B', 'C', 'D'][optIndex];
                          const isUserAnswer = question.userAnswer === optionKey;
                          const isCorrectAnswer = question.correct_answer === optionKey;
                          
                          return (
                            <div
                              key={optionKey}
                              className={`p-3 sm:p-4 rounded-lg border-2 transition-all duration-200 ${getOptionStyle(question, optionKey)}`}
                            >
                              <div className="flex items-start space-x-3">
                                <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0 ${
                                  isCorrectAnswer ? 'bg-green-500 text-white' :
                                  isUserAnswer && !isCorrectAnswer ? 'bg-red-500 text-white' : 
                                  'bg-gray-200 text-gray-600'
                                }`}>
                                  {optionKey}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <ProcessLatexText text={option.text} />
                                </div>
                                <div className="flex items-center space-x-1 flex-shrink-0">
                                  {isCorrectAnswer && (
                                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                                  )}
                                  {isUserAnswer && !isCorrectAnswer && (
                                    <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Answer Summary */}
                      {question.isAttempted && (
                        <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 text-center">
                            <div>
                              <div className="text-xs sm:text-sm text-gray-600 mb-1">Your Answer</div>
                              <div className={`text-sm sm:text-lg font-bold ${
                                question.isCorrect ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {question.userAnswer || 'Not Selected'}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs sm:text-sm text-gray-600 mb-1">Correct Answer</div>
                              <div className="text-sm sm:text-lg font-bold text-green-600">
                                {question.correct_answer}
                              </div>
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                              <div className="text-xs sm:text-sm text-gray-600 mb-1">Result</div>
                              <div className={`text-sm sm:text-lg font-bold ${
                                question.isCorrect ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {question.isCorrect ? `+${question.marksObtained || 4}` : `-${question.marksDeducted || 1}`}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Explanation */}
                      {question.explanation && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                          <h4 className="font-semibold text-blue-900 mb-2 flex items-center text-sm sm:text-base">
                            <Target className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                            Solution
                          </h4>
                          <div className="text-blue-800 text-xs sm:text-sm leading-relaxed">
                            <ProcessLatexText text={question.explanation} />
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 px-4 sm:px-6 py-3 sm:py-4 space-y-3 sm:space-y-0">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="flex items-center space-x-2 px-3 sm:px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>
                
                <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg font-medium text-xs sm:text-sm transition-colors flex-shrink-0 ${
                        page === currentPage
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="flex items-center space-x-2 px-3 sm:px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Desktop Sidebar */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="w-80 bg-white border border-gray-200 rounded-xl shadow-sm sticky top-24 self-start">
              <div className="p-6">
                {/* Header */}
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-1 truncate">
                    {practiceSetInfo?.name || 'MCQ Test'}
                  </h2>
                  <div className="text-sm text-gray-600 mb-1">
                    {questions.length} Questions • Solutions
                  </div>
                  <div className="text-sm font-medium text-blue-600">
                    {practiceSetInfo?.category || 'Practice Set'}
                  </div>
                </div>
                
                {/* Status Summary */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-xl font-bold text-gray-600">
                        {questions.filter(q => !q.isAttempted).length}
                      </span>
                    </div>
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      unanswered
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-xl font-bold text-green-600">
                        {questions.filter(q => q.isCorrect).length}
                      </span>
                    </div>
                    <div className="text-xs font-medium text-green-600 uppercase tracking-wide">
                      correct
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-xl font-bold text-red-600">
                        {questions.filter(q => q.isAttempted && !q.isCorrect).length}
                      </span>
                    </div>
                    <div className="text-xs font-medium text-red-600 uppercase tracking-wide">
                      wrong
                    </div>
                  </div>
                </div>

                {/* Question Grid */}
                <div className="max-h-96 overflow-y-auto">
                  <div className="grid grid-cols-5 gap-2 p-2">
                    {questions.map((question, index) => {
                      const questionNumber = index + 1;
                      const status = getQuestionStatus(question);
                      
                      return (
                        <button
                          key={question.id}
                          onClick={() => scrollToQuestion(index)}
                          className={`w-10 h-10 rounded-lg font-semibold text-sm border-2 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                            status === 'correct' 
                              ? 'bg-green-500 text-white border-green-500' 
                              : status === 'incorrect'
                              ? 'bg-red-500 text-white border-red-500'
                              : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                          }`}
                          title={`Question ${questionNumber} - ${status}`}
                        >
                          {questionNumber}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 