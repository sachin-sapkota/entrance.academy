'use client';

import { useState, useEffect } from 'react';

export default function QuizSidebar({ 
  questions, 
  answers, 
  onQuestionClick, 
  practiceSetInfo,
  currentPage = 1,
  questionsPerPage = 20,
  onPageChange,
  totalPages = 1,
  isMobile = false
}) {
  const [activeQuestion, setActiveQuestion] = useState(null);
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;
  const unansweredCount = totalQuestions - answeredCount;

  // Track which question is currently visible
  useEffect(() => {
    const handleScroll = () => {
      for (let i = 0; i < totalQuestions; i++) {
        const questionNumber = i + 1;
        const question = questions[i];
        const questionId = question?.id;
        
        if (questionId) {
          const element = document.getElementById(`question-${questionId}`);
          if (element) {
            const rect = element.getBoundingClientRect();
            if (rect.top >= 0 && rect.top <= window.innerHeight / 2) {
              setActiveQuestion(questionNumber);
              break;
            }
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [totalQuestions, questions]);

  const getQuestionButtonStyle = (questionNumber) => {
    const question = questions[questionNumber - 1];
    const questionId = question?.id;
    
    if (answers[questionId]) {
      return 'bg-blue-500 text-white border-blue-500';
    }
    
    return 'bg-white text-gray-600 border-gray-300 hover:border-gray-400';
  };

  const generateQuestionGrid = () => {
    const grid = [];
    for (let i = 1; i <= totalQuestions; i++) {
      grid.push(i);
    }
    return grid;
  };

  const handleQuestionClick = (questionNumber) => {
    const question = questions[questionNumber - 1];
    const questionId = question?.id;
    
    if (!questionId) return;
    
    // Calculate which page this question is on
    const questionPage = Math.ceil(questionNumber / questionsPerPage);
    
    // If question is not on current page, navigate to the correct page first
    if (questionPage !== currentPage && onPageChange) {
      onPageChange(questionPage);
      // Wait a bit for page change to complete before scrolling
      setTimeout(() => {
        setActiveQuestion(questionNumber);
        onQuestionClick(questionId);
      }, 100);
    } else {
      setActiveQuestion(questionNumber);
      onQuestionClick(questionId);
    }
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}.${String(Math.floor(minutes / 6)).padStart(2, '0')} hours`;
    }
    return `${minutes} minutes`;
  };

  return (
    <div className={`${isMobile ? 'w-full h-full' : 'w-80'} bg-white ${isMobile ? '' : 'border border-gray-200 rounded-xl shadow-sm m-4 sticky top-20 self-start'}`}>
      <div className={`${isMobile ? 'p-4' : 'p-6'}`}>
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-1 truncate">
            {practiceSetInfo?.name || 'Practice Test'}
          </h2>
          <div className="text-sm text-gray-600 mb-1">
            {totalQuestions} Questions • {formatDuration(practiceSetInfo?.duration || 7200)}
          </div>
          <div className="text-sm font-medium text-blue-600">
            {practiceSetInfo?.category || 'Practice Set'}
          </div>
        </div>
        
        {/* Status Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-xl font-bold text-gray-600">{unansweredCount}</span>
            </div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              unanswered
            </div>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-xl font-bold text-blue-600">{answeredCount}</span>
            </div>
            <div className="text-xs font-medium text-blue-600 uppercase tracking-wide">
              answered
            </div>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-xl font-bold text-orange-600">0</span>
            </div>
            <div className="text-xs font-medium text-orange-600 uppercase tracking-wide">
              marked
            </div>
          </div>
        </div>

        {/* Question Grid - Scrollable with hidden scrollbar */}
        <div className={`${isMobile ? 'max-h-[calc(100vh-300px)]' : 'max-h-96'} overflow-y-auto scrollbar-hide`}>
          <div className={`grid ${isMobile ? 'grid-cols-6' : 'grid-cols-5'} gap-2 p-2`}>
            {generateQuestionGrid().map((questionNumber) => (
              <button
                key={questionNumber}
                onClick={() => handleQuestionClick(questionNumber)}
                aria-label={`Question ${questionNumber}${answers[questions[questionNumber - 1]?.id] ? ' (answered)' : ''}`}
                title={`Question ${questionNumber}`}
                className={`
                  ${isMobile ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'} rounded-lg font-semibold border-2 transition-all duration-200
                  hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  ${getQuestionButtonStyle(questionNumber)}
                  ${activeQuestion === questionNumber ? 'ring-2 ring-blue-400 ring-offset-1' : ''}
                `}
              >
                {questionNumber}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;  /* Internet Explorer 10+ */
          scrollbar-width: none;  /* Firefox */
        }
        .scrollbar-hide::-webkit-scrollbar { 
          display: none;  /* Safari and Chrome */
        }
      `}</style>
    </div>
  );
} 