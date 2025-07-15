'use client';
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function EndTestModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  timeLeft, 
  answeredCount, 
  totalQuestions,
  markedCount = 0,
  isSubmitting = false // Add loading state prop
}) {
  // Handle ESC key press
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; 
      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = 'unset';
      };
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen, onClose]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const unansweredCount = totalQuestions - answeredCount;

  // Animation variants
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  const modalVariants = {
    hidden: { 
      scale: 0.9, 
      y: 50, 
      opacity: 0 
    },
    visible: { 
      scale: 1, 
      y: 0, 
      opacity: 1,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 400,
        duration: 0.4
      }
    },
    exit: { 
      scale: 0.9, 
      y: 50, 
      opacity: 0,
      transition: {
        duration: 0.3
      }
    }
  };

  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        delay: 0.2,
        duration: 0.4
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={onClose}
        >
          <motion.div 
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with clean background */}
            <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-8 pt-8 pb-6 border-b border-gray-100">
              {/* Header content */}
              <div className="text-center">
                <motion.div 
                  className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mb-4 mx-auto shadow-lg"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.3, type: "spring", damping: 15 }}
                >
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </motion.div>
                
                <motion.h2 
                  className="text-2xl font-bold text-gray-900 mb-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  Submit Test
                </motion.h2>
                
                <motion.p 
                  className="text-gray-600 text-sm leading-relaxed max-w-sm mx-auto"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  Are you sure you want to submit your test? This action cannot be undone.
                </motion.p>
              </div>
            </div>

            {/* Content */}
            <motion.div 
              className="p-8"
              variants={contentVariants}
              initial="hidden"
              animate="visible"
            >
              {/* Time remaining card */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 mb-6 border border-blue-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Time Remaining</p>
                      <p className="text-xl font-bold text-gray-900">{formatTime(timeLeft)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary stats */}
              <div className="space-y-4 mb-8">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Test Summary</h3>
                
                <div className="grid grid-cols-3 gap-4">
                  {/* Answered */}
                  <motion.div 
                    className="text-center p-4 bg-green-50 rounded-2xl border border-green-100"
                    whileHover={{ scale: 1.02 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <div className="w-8 h-8 bg-green-500 rounded-xl mx-auto mb-2 flex items-center justify-center">
                      <span className="text-white text-sm font-bold">{answeredCount}</span>
                    </div>
                    <span className="text-xs font-medium text-green-700">Answered</span>
                  </motion.div>
                  
                  {/* Marked */}
                  <motion.div 
                    className="text-center p-4 bg-orange-50 rounded-2xl border border-orange-100"
                    whileHover={{ scale: 1.02 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                  >
                    <div className="w-8 h-8 bg-orange-500 rounded-xl mx-auto mb-2 flex items-center justify-center">
                      <span className="text-white text-sm font-bold">{markedCount}</span>
                    </div>
                    <span className="text-xs font-medium text-orange-700">Marked</span>
                  </motion.div>
                  
                  {/* Unanswered */}
                  <motion.div 
                    className="text-center p-4 bg-gray-50 rounded-2xl border border-gray-200"
                    whileHover={{ scale: 1.02 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                  >
                    <div className="w-8 h-8 bg-gray-500 rounded-xl mx-auto mb-2 flex items-center justify-center">
                      <span className="text-white text-sm font-bold">{unansweredCount}</span>
                    </div>
                    <span className="text-xs font-medium text-gray-700">Unanswered</span>
                  </motion.div>
                </div>
              </div>

              {/* Warning message */}
              {unansweredCount > 0 && (
                <motion.div 
                  className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.9 }}
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 text-amber-600 mt-0.5">
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-amber-800">
                        You have {unansweredCount} unanswered question{unansweredCount > 1 ? 's' : ''}
                      </p>
                      <p className="text-xs text-amber-700 mt-1">
                        These will be marked as incorrect. You can go back to answer them.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <motion.button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-2xl font-medium text-sm transition-colors duration-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.0 }}
                >
                  Cancel
                </motion.button>
                
                <motion.button
                  onClick={onConfirm}
                  disabled={isSubmitting}
                  className={`flex-1 px-6 py-3 rounded-2xl font-semibold text-sm shadow-lg transition-all duration-200 flex items-center justify-center space-x-2 ${
                    isSubmitting 
                      ? 'bg-gradient-to-r from-green-500 to-green-600 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                  } text-white`}
                  whileHover={!isSubmitting ? { 
                    scale: 1.02, 
                    y: -1,
                    boxShadow: "0 10px 25px -5px rgba(239, 68, 68, 0.4)"
                  } : {}}
                  whileTap={!isSubmitting ? { scale: 0.98 } : {}}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.1 }}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    'Submit Test'
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 