'use client';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import ResultsHeader from './ResultsHeader';

export default function ExamResultsSummary({ 
  results, 
  totalQuestions, 
  examDuration, 
  submissionTime,
  onRetakeExam,
  onViewSolutions,
  onBackToDashboard,
  testId
}) {
  const router = useRouter();
  
  if (!results) return null;

  // Calculate stats
  const correctAnswers = results.totalCorrect || 0;
  const totalMarks = totalQuestions * 4; // Assuming 4 marks per question
  const marksObtained = correctAnswers * 4;
  const attemptedQuestions = results.attempts ? Object.keys(results.attempts).length : Object.keys(results.scoreByDomain || {}).length;
  const unattemptedQuestions = totalQuestions - attemptedQuestions;
  const unattemptedMarks = unattemptedQuestions * 4;
  const incorrectAnswers = attemptedQuestions - correctAnswers;
  const negativeMarks = incorrectAnswers * 0.1; // 1 mark negative per wrong answer
  const finalScore = marksObtained - negativeMarks;
  const percentage = ((finalScore / totalMarks) * 100).toFixed(1);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: "easeOut"
      }
    })
  };

  const statsCards = [
    {
      title: "Marks Obtained",
      value: marksObtained.toFixed(1),
      subtitle: `${correctAnswers}/${totalQuestions}`,
      icon: (
        <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      iconBg: "bg-emerald-100"
    },
    {
      title: "Unattempted Marks",
      value: unattemptedMarks,
      subtitle: `${unattemptedQuestions}/${totalQuestions}`,
      icon: (
        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      iconBg: "bg-blue-100"
    },
    {
             title: "Negative Marks",
       value: `-${negativeMarks.toFixed(1)}`,
       subtitle: `${incorrectAnswers}/${totalQuestions}`,
      icon: (
        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      iconBg: "bg-red-100"
    },
    {
      title: "Total Marks Obtained",
      value: `${finalScore.toFixed(1)}/${totalMarks}`,
      subtitle: `${percentage}%`,
      icon: (
        <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      iconBg: "bg-purple-100"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <ResultsHeader 
        finalScore={finalScore}
        totalMarks={totalMarks}
        percentage={parseFloat(percentage)}
        onBackToDashboard={onBackToDashboard}
      />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <motion.div 
          className="bg-white rounded-3xl shadow-xl p-8 border border-slate-200/50"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <motion.h1 
                className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                Exam Summary
              </motion.h1>
              <motion.p 
                className="text-slate-600"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                Summary of the test submitted on {submissionTime ? formatDate(submissionTime) : 'Recently'}
              </motion.p>
            </div>
            <motion.div 
              className="text-right"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <p className="text-sm font-medium text-slate-500 mb-1">Exam Duration</p>
              <p className="text-2xl font-bold text-slate-900">
                {examDuration ? formatDuration(examDuration) : '120 minutes'}
              </p>
            </motion.div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statsCards.map((card, index) => (
              <motion.div
                key={card.title}
                className={`${card.bgColor} ${card.borderColor} border-2 rounded-2xl p-6 hover:shadow-lg transition-all duration-300`}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                custom={index}
                whileHover={{ scale: 1.02, y: -2 }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`${card.iconBg} p-3 rounded-xl`}>
                    {card.icon}
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="text-3xl font-bold text-slate-900">{card.value}</h3>
                  <p className="text-sm font-medium text-slate-600">{card.subtitle}</p>
                  <p className="text-xs text-slate-500 mt-2">{card.title}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Action Buttons */}
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <motion.button
              onClick={onRetakeExam}
              className="px-8 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-sm transition-all duration-200 border-2 border-slate-200 hover:border-slate-300"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Retake Exam</span>
              </div>
            </motion.button>
            
            <motion.button
              onClick={() => {
                if (testId) {
                  router.push(`/solution?testId=${testId}`);
                } else {
                  router.push('/solution');
                }
              }}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-200"
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span>View Solutions</span>
              </div>
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
} 