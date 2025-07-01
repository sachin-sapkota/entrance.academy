'use client';
import { useState, useEffect } from 'react';
import { Maximize, Minimize, Menu, X } from 'lucide-react';
import EndTestModal from './EndTestModal';
import QuizSidebar from './QuizSidebar';

export default function QuizHeader({ 
  timeLeft, 
  onSubmit, 
  isSubmitted, 
  answeredCount, 
  totalQuestions, 
  markedCount, 
  onExitTest,
  // Mobile sidebar props
  questions = [],
  answers = {},
  onQuestionClick,
  practiceSetInfo,
  currentPage = 1,
  questionsPerPage = 20,
  onPageChange,
  totalPages = 1,
  flaggedQuestions = []
}) {
  const [showEndTestModal, setShowEndTestModal] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (timeLeft < 300) return 'text-red-500'; // Less than 5 minutes
    if (timeLeft < 900) return 'text-orange-500'; // Less than 15 minutes
    return 'text-slate-700';
  };

  const handleEndTest = () => {
    setShowEndTestModal(true);
  };

  const handleConfirmSubmit = () => {
    setShowEndTestModal(false);
    onSubmit();
  };

  const handleCancelSubmit = () => {
    setShowEndTestModal(false);
  };

  const handleExitTest = () => {
    if (onExitTest) {
      onExitTest();
    }
  };

  // Fullscreen functionality
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.warn('Fullscreen not supported or failed:', error);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Mobile sidebar handlers
  const handleMobileSidebarToggle = () => {
    setShowMobileSidebar(!showMobileSidebar);
  };

  const handleMobileQuestionClick = (questionId) => {
    if (onQuestionClick) {
      onQuestionClick(questionId);
    }
    setShowMobileSidebar(false); // Close sidebar after selecting question
  };

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left side - Timer and Mobile Menu */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className={`font-mono text-lg sm:text-xl font-medium ${getTimeColor()}`}>
                {formatTime(timeLeft)}
              </div>
              
              {/* Mobile Menu Button - Only visible on mobile */}
              <button
                onClick={handleMobileSidebarToggle}
                className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                title="View questions"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>

            {/* Brand */}
            <div className="flex items-center">
              <div className="text-lg sm:text-xl font-semibold text-slate-800">
                              <span className="hidden sm:inline">Entrance.academy</span>
              <span className="sm:hidden">Entrance.academy</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {!isSubmitted ? (
                <>
                  {/* Fullscreen Toggle */}
                  <button
                    onClick={toggleFullscreen}
                    className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                    title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                  >
                    {isFullscreen ? (
                      <Minimize className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                      <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </button>
                  
                  {/* Exit Test Button */}
                  <button
                    onClick={handleExitTest}
                    className="px-2 py-1.5 sm:px-4 sm:py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-xs sm:text-sm font-medium"
                    title="Exit test and save progress"
                  >
                    <span className="hidden sm:inline">Exit Test</span>
                    <span className="sm:hidden">Exit</span>
                  </button>
                  
                  {/* End Test Button */}
                  <button
                    onClick={handleEndTest}
                    className="px-2 py-1.5 sm:px-4 sm:py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-xs sm:text-sm font-medium"
                    title="Submit test and see results"
                  >
                    <span className="hidden sm:inline">End Test</span>
                    <span className="sm:hidden">End</span>
                  </button>
                </>
              ) : (
                <div className="px-2 py-1.5 sm:px-4 sm:py-2 bg-slate-100 text-slate-600 rounded-lg text-xs sm:text-sm font-medium">
                  Submitted
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {showMobileSidebar && (
        <div className="lg:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowMobileSidebar(false)}
          />
          
          {/* Sidebar */}
          <div className="absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-xl transform transition-transform duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Questions</h3>
              <button
                onClick={() => setShowMobileSidebar(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Sidebar Content */}
            <div className="h-full overflow-hidden">
              <QuizSidebar
                questions={questions}
                answers={answers}
                onQuestionClick={handleMobileQuestionClick}
                practiceSetInfo={practiceSetInfo}
                currentPage={currentPage}
                questionsPerPage={questionsPerPage}
                onPageChange={onPageChange}
                totalPages={totalPages}
                isMobile={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* End Test Confirmation Modal */}
      <EndTestModal
        isOpen={showEndTestModal}
        onClose={handleCancelSubmit}
        onConfirm={handleConfirmSubmit}
        timeLeft={timeLeft}
        answeredCount={answeredCount || 0}
        totalQuestions={totalQuestions || 0}
        markedCount={markedCount || 0}
      />
    </>
  );
} 