'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function EnhancedResultsPage({ results }) {
  const [activeTab, setActiveTab] = useState('summary');
  const router = useRouter();

  if (!results) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading results...</p>
        </div>
      </div>
    );
  }

  const {
    totalQuestions,
    attemptedQuestions,
    unattemptedQuestions,
    correctAnswers,
    wrongAnswers,
    rawScore,
    negativeMarks,
    finalScore,
    percentage,
    domainScores,
    attempts
  } = results;

  const getPerformanceColor = (percentage) => {
    if (percentage >= 90) return 'text-green-600 bg-green-50';
    if (percentage >= 75) return 'text-blue-600 bg-blue-50';
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-50';
    if (percentage >= 40) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getPerformanceLabel = (percentage) => {
    if (percentage >= 90) return 'Excellent';
    if (percentage >= 75) return 'Good';
    if (percentage >= 60) return 'Average';
    if (percentage >= 40) return 'Below Average';
    return 'Needs Improvement';
  };

  const tabs = [
    { id: 'summary', name: 'Summary', icon: '📊' },
    { id: 'domains', name: 'Domain Analysis', icon: '🎯' },
    { id: 'analytics', name: 'Analytics', icon: '📈' }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="text-center">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-3xl">✓</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Test Completed!</h1>
            <p className="text-slate-600">Here's your detailed performance analysis</p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="text-center p-4 bg-slate-50 rounded-xl">
              <div className="text-2xl font-bold text-slate-900">{percentage.toFixed(1)}%</div>
              <div className="text-sm text-slate-600">Overall Score</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <div className="text-2xl font-bold text-green-600">{correctAnswers}</div>
              <div className="text-sm text-slate-600">Correct</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-xl">
              <div className="text-2xl font-bold text-red-600">{wrongAnswers}</div>
              <div className="text-sm text-slate-600">Wrong</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-xl">
              <div className="text-2xl font-bold text-yellow-600">{unattemptedQuestions}</div>
              <div className="text-sm text-slate-600">Unattempted</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm mb-6">
          <div className="border-b border-slate-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Summary Tab */}
            {activeTab === 'summary' && (
              <div className="space-y-6">
                {/* Score Breakdown */}
                <div className="bg-slate-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Score Breakdown</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                        <span className="text-slate-600">Raw Score (Correct × 4)</span>
                        <span className="font-semibold text-green-600">+{rawScore}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                        <span className="text-slate-600">Negative Marks (Wrong × 1)</span>
                        <span className="font-semibold text-red-600">-{negativeMarks}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
                        <span className="text-slate-900 font-medium">Final Score</span>
                        <span className="font-bold text-blue-600 text-lg">{finalScore}</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                        <span className="text-slate-600">Total Questions</span>
                        <span className="font-semibold">{totalQuestions}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                        <span className="text-slate-600">Attempted</span>
                        <span className="font-semibold">{attemptedQuestions}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                        <span className="text-slate-600">Accuracy Rate</span>
                        <span className="font-semibold">
                          {attemptedQuestions > 0 ? ((correctAnswers / attemptedQuestions) * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance Category */}
                <div className={`rounded-xl p-6 ${getPerformanceColor(percentage)}`}>
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">Performance Category</h3>
                    <div className="text-2xl font-bold">{getPerformanceLabel(percentage)}</div>
                    <p className="mt-2 text-sm opacity-80">
                      {percentage >= 75 
                        ? 'Great job! Keep up the excellent work.' 
                        : percentage >= 60 
                        ? 'Good performance. Focus on weak areas for improvement.' 
                        : 'Consider more practice in the areas where you struggled.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Domain Analysis Tab */}
            {activeTab === 'domains' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-900">Subject-wise Performance</h3>
                <div className="grid gap-4">
                  {Object.values(domainScores).map((domain, index) => (
                    <div key={index} className="bg-slate-50 rounded-xl p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-semibold text-slate-900">{domain.name}</h4>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPerformanceColor(domain.percentage)}`}>
                          {domain.percentage.toFixed(1)}%
                        </span>
                      </div>
                      
                      <div className="grid md:grid-cols-4 gap-4 mb-4">
                        <div className="text-center p-3 bg-white rounded-lg">
                          <div className="text-lg font-bold text-slate-900">{domain.total}</div>
                          <div className="text-xs text-slate-600">Total</div>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <div className="text-lg font-bold text-green-600">{domain.correct}</div>
                          <div className="text-xs text-slate-600">Correct</div>
                        </div>
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <div className="text-lg font-bold text-blue-600">+{domain.rawScore}</div>
                          <div className="text-xs text-slate-600">Raw Score</div>
                        </div>
                        <div className="text-center p-3 bg-red-50 rounded-lg">
                          <div className="text-lg font-bold text-red-600">-{domain.negativeMarks}</div>
                          <div className="text-xs text-slate-600">Negative</div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${domain.percentage}%` }}
                        ></div>
                      </div>
                      
                      <div className="mt-3 text-center">
                        <span className="text-lg font-bold text-slate-900">
                          Final: {domain.finalScore || (domain.rawScore - domain.negativeMarks)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-900">Detailed Analytics</h3>
                
                {/* Question Type Analysis */}
                <div className="bg-slate-50 rounded-xl p-6">
                  <h4 className="text-base font-semibold text-slate-900 mb-4">Question Analysis</h4>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">{correctAnswers}</div>
                      <div className="text-sm text-slate-600">Correct Answers</div>
                      <div className="text-xs text-slate-500">+{rawScore} marks</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-red-600">{wrongAnswers}</div>
                      <div className="text-sm text-slate-600">Wrong Answers</div>
                      <div className="text-xs text-slate-500">-{negativeMarks} marks</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-yellow-600">{unattemptedQuestions}</div>
                      <div className="text-sm text-slate-600">Unattempted</div>
                      <div className="text-xs text-slate-500">0 marks</div>
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="bg-blue-50 rounded-xl p-6">
                  <h4 className="text-base font-semibold text-blue-900 mb-4">Recommendations</h4>
                  <div className="space-y-3">
                    {percentage < 60 && (
                      <div className="flex items-start space-x-3">
                        <span className="text-blue-600">💡</span>
                        <p className="text-blue-800 text-sm">
                          Focus on improving accuracy. Consider reviewing fundamental concepts before attempting more questions.
                        </p>
                      </div>
                    )}
                    {unattemptedQuestions > totalQuestions * 0.2 && (
                      <div className="flex items-start space-x-3">
                        <span className="text-blue-600">⏰</span>
                        <p className="text-blue-800 text-sm">
                          Work on time management. Try to attempt all questions within the time limit.
                        </p>
                      </div>
                    )}
                    {wrongAnswers > correctAnswers && (
                      <div className="flex items-start space-x-3">
                        <span className="text-blue-600">🎯</span>
                        <p className="text-blue-800 text-sm">
                          Be more selective in answering. Sometimes it's better to skip a question than guess incorrectly due to negative marking.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-500 text-white py-3 px-8 rounded-xl font-medium hover:bg-blue-600 transition-colors"
          >
            Back to Dashboard
          </button>
          <button
            onClick={() => window.print()}
            className="bg-slate-100 text-slate-700 py-3 px-8 rounded-xl font-medium hover:bg-slate-200 transition-colors"
          >
            Print Results
          </button>
        </div>
      </div>
    </div>
  );
}
