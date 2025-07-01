'use client';
import { motion } from 'framer-motion';
import { useState } from 'react';

export default function TestLobby({ 
  practiceSet, 
  onStartTest, 
  onGoBack,
  isLoading = false 
}) {
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [enforceTime, setEnforceTime] = useState(true);

  if (!practiceSet) return null;

  const handleStartTest = () => {
    if (agreedToTerms) {
      onStartTest({ enforceTime });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <motion.header 
        className="bg-white/80 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-50"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <motion.button
              onClick={onGoBack}
              className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="font-medium">Go Back</span>
            </motion.button>
            
         
            
            <div className="w-20"></div> {/* Spacer for centering */}
          </div>
        </div>
      </motion.header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Practice Set Info */}
          <motion.div 
            className="lg:col-span-2 space-y-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            {/* Practice Set Header */}
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-200/50">
              <div className="flex items-start space-x-6">
                <motion.div 
                  className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg"
                  whileHover={{ scale: 1.05, rotate: 5 }}
                >
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </motion.div>
                
                <div className="flex-1">
                  <div className="text-sm text-blue-600 font-medium mb-2">
                    {practiceSet.category || 'BE/ BArch Entrance Preparation'}
                  </div>
                  <h1 className="text-3xl font-bold text-slate-900 mb-3">
                    {practiceSet.name}
                  </h1>
                  <div className="flex items-center space-x-6 text-sm text-slate-600">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Full Marks: {practiceSet.fullMarks}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Time: {practiceSet.durationMinutes} mins</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Pass Marks: {practiceSet.passMarks}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Overview Section */}
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-200/50">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Overview</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
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
                    <span className="font-medium text-slate-900">{Math.floor(practiceSet.durationMinutes / 60)} hours</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-3">
                    <span className="text-slate-600">Negative marking</span>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-slate-700">
                        {practiceSet.negativeMarkingEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                      <motion.div 
                        className={`w-12 h-6 rounded-full transition-colors ${
                          practiceSet.negativeMarkingEnabled ? 'bg-blue-500' : 'bg-slate-300'
                        }`}
                        onClick={() => {}} // Read-only display
                      >
                        <motion.div 
                          className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                            practiceSet.negativeMarkingEnabled ? 'translate-x-6' : 'translate-x-0.5'
                          }`}
                          style={{ marginTop: '2px' }}
                        />
                      </motion.div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-slate-100">
                    <span className="text-slate-600">Full Marks</span>
                    <span className="font-bold text-2xl text-slate-900">{practiceSet.fullMarks}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-3 border-b border-slate-100">
                    <span className="text-slate-600">Pass Marks</span>
                    <span className="font-bold text-2xl text-emerald-600">{practiceSet.passMarks}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-3">
                    <span className="text-slate-600">Negative marking Factor</span>
                    <span className="font-bold text-2xl text-red-600">{practiceSet.negativeMarkingFactor || 0.1}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column - Test Settings & Start */}
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            {/* Test Illustration */}
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl p-8 text-white relative overflow-hidden">
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
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200/50">
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

            {/* Terms & Start Button */}
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200/50">
              <div className="space-y-4">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <motion.div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
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
                  <span className="text-sm text-slate-600 leading-relaxed">
                    I agree to the terms and conditions and understand that this is a timed examination.
                  </span>
                </label>

                <motion.button
                  onClick={handleStartTest}
                  disabled={!agreedToTerms || isLoading}
                  className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-200 ${
                    agreedToTerms && !isLoading
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                  whileHover={agreedToTerms ? { scale: 1.02, y: -2 } : {}}
                  whileTap={agreedToTerms ? { scale: 0.98 } : {}}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Starting Test...</span>
                    </div>
                  ) : (
                    'Take exam'
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
} 