'use client';
import { motion } from 'framer-motion';

export default function ResultsHeader({ finalScore, totalMarks, percentage, onBackToDashboard }) {
  const getScoreColor = () => {
    if (percentage >= 80) return 'text-emerald-600';
    if (percentage >= 60) return 'text-blue-600';
    if (percentage >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBg = () => {
    if (percentage >= 80) return 'bg-emerald-50 border-emerald-200';
    if (percentage >= 60) return 'bg-blue-50 border-blue-200';
    if (percentage >= 40) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <motion.header 
      className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Left Side - Back Button */}
          <motion.button
            onClick={onBackToDashboard}
            className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-medium">Back to Dashboard</span>
          </motion.button>

          {/* Center - Brand */}
          <div className="flex items-center">
                          <div className="text-xl font-semibold text-slate-800">Entrance Academy</div>
          </div>

          {/* Right Side - Score Display */}
          <motion.div 
            className={`px-4 py-2 rounded-xl border-2 ${getScoreBg()}`}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreColor()}`}>
                {percentage}%
              </div>
              <div className="text-xs text-slate-600">
                {finalScore}/{totalMarks} marks
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.header>
  );
} 