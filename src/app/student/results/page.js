'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import {
  Trophy,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Award,
  Eye,
  Home,
  RotateCcw,
  Download,
  Share,
  Lightbulb,
  Flag
} from 'lucide-react';

export default function StudentResultsPage() {
  const [testResults, setTestResults] = useState(null);
  const [domainAnalysis, setDomainAnalysis] = useState([]);
  const [questionReview, setQuestionReview] = useState([]);
  const [showQuestionReview, setShowQuestionReview] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useSelector((state) => state.auth);

  const testId = searchParams.get('testId');
  const autoSubmit = searchParams.get('autoSubmit') === 'true';

  useEffect(() => {
    if (testId && user) {
      fetchTestResults();
    }
  }, [testId, user]);

  const fetchTestResults = async () => {
    try {
      setLoading(true);

      // Fetch test details
      const { data: testData, error: testError } = await supabase
        .from('tests')
        .select('*')
        .eq('id', testId)
        .eq('user_id', user.id)
        .single();

      if (testError || !testData) {
        throw new Error('Test not found');
      }

      setTestResults(testData);

      // Fetch attempts with question details
      const { data: attemptsData, error: attemptsError } = await supabase
        .from('attempts')
        .select(`
          *,
          questions(
            *,
            question_categories(name, code),
            domains(name, code)
          )
        `)
        .eq('test_id', testId)
        .order('created_at');

      if (attemptsError) {
        throw new Error('Failed to fetch question attempts');
      }

      setQuestionReview(attemptsData || []);

      // Calculate domain-wise analysis
      const domainStats = {};
      
      attemptsData?.forEach(attempt => {
        const domain = attempt.questions?.domains?.name;
        const subdomain = attempt.questions?.question_categories?.name;
        
        if (!domain) return;
        
        if (!domainStats[domain]) {
          domainStats[domain] = {
            name: domain,
            totalQuestions: 0,
            correctAnswers: 0,
            wrongAnswers: 0,
            unattempted: 0,
            marksObtained: 0,
            marksDeducted: 0,
            subdomains: {}
          };
        }
        
        domainStats[domain].totalQuestions++;
        
        if (attempt.selected_answer) {
          if (attempt.is_correct) {
            domainStats[domain].correctAnswers++;
            domainStats[domain].marksObtained += attempt.marks_obtained || 0;
          } else {
            domainStats[domain].wrongAnswers++;
            domainStats[domain].marksDeducted += attempt.marks_deducted || 0;
          }
        } else {
          domainStats[domain].unattempted++;
        }

        // Subdomain stats
        if (subdomain) {
          if (!domainStats[domain].subdomains[subdomain]) {
            domainStats[domain].subdomains[subdomain] = {
              name: subdomain,
              totalQuestions: 0,
              correctAnswers: 0,
              accuracy: 0
            };
          }
          
          domainStats[domain].subdomains[subdomain].totalQuestions++;
          if (attempt.is_correct) {
            domainStats[domain].subdomains[subdomain].correctAnswers++;
          }
          
          const subdomainStat = domainStats[domain].subdomains[subdomain];
          subdomainStat.accuracy = (subdomainStat.correctAnswers / subdomainStat.totalQuestions * 100).toFixed(1);
        }
      });

      // Calculate accuracy for each domain
      Object.values(domainStats).forEach(domain => {
        const attempted = domain.correctAnswers + domain.wrongAnswers;
        domain.accuracy = attempted > 0 ? (domain.correctAnswers / attempted * 100).toFixed(1) : 0;
        domain.netScore = domain.marksObtained - domain.marksDeducted;
      });

      setDomainAnalysis(Object.values(domainStats));

    } catch (err) {
      console.error('Error fetching test results:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceLevel = (percentage) => {
    if (percentage >= 90) return { label: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (percentage >= 75) return { label: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-100' };
    if (percentage >= 60) return { label: 'Average', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    if (percentage >= 40) return { label: 'Below Average', color: 'text-orange-600', bgColor: 'bg-orange-100' };
    return { label: 'Poor', color: 'text-red-600', bgColor: 'bg-red-100' };
  };

  const getGradeInfo = (percentage) => {
    if (percentage >= 90) return { grade: 'A+', color: 'text-green-600' };
    if (percentage >= 80) return { grade: 'A', color: 'text-green-600' };
    if (percentage >= 70) return { grade: 'B+', color: 'text-blue-600' };
    if (percentage >= 60) return { grade: 'B', color: 'text-blue-600' };
    if (percentage >= 50) return { grade: 'C', color: 'text-yellow-600' };
    if (percentage >= 40) return { grade: 'D', color: 'text-orange-600' };
    return { grade: 'F', color: 'text-red-600' };
  };

  const formatTime = (startTime, endTime) => {
    if (!startTime || !endTime) return 'N/A';
    const diffMs = new Date(endTime) - new Date(startTime);
    const diffMins = Math.floor(diffMs / 60000);
    const diffSecs = Math.floor((diffMs % 60000) / 1000);
    return `${diffMins}m ${diffSecs}s`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Results</h2>
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

  if (!testResults) return null;

  const performance = getPerformanceLevel(testResults.percentage || 0);
  const grade = getGradeInfo(testResults.percentage || 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Test Results</h1>
              <p className="text-gray-600">{testResults.test_name}</p>
              {autoSubmit && (
                <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                  <Clock className="w-4 h-4" />
                  Auto-submitted due to time limit
                </div>
              )}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/student/question-sets')}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Home className="w-4 h-4" />
                Back to Tests
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download Report
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Score Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center"
          >
            <div className={`text-4xl font-bold mb-2 ${grade.color}`}>
              {testResults.percentage?.toFixed(1) || 0}%
            </div>
            <div className="text-gray-600 mb-2">Overall Score</div>
            <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${performance.bgColor} ${performance.color}`}>
              <Trophy className="w-4 h-4" />
              {performance.label}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center"
          >
            <div className="text-4xl font-bold text-green-600 mb-2">
              {testResults.correct_answers || 0}
            </div>
            <div className="text-gray-600 mb-2">Correct</div>
            <div className="text-sm text-gray-500">
              out of {testResults.total_questions} questions
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center"
          >
            <div className={`text-4xl font-bold mb-2 ${grade.color}`}>
              {grade.grade}
            </div>
            <div className="text-gray-600 mb-2">Grade</div>
            <div className="text-sm text-gray-500">
              {testResults.final_score?.toFixed(1) || 0} marks
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center"
          >
            <div className="text-4xl font-bold text-blue-600 mb-2">
              {formatTime(testResults.started_at, testResults.submitted_at)}
            </div>
            <div className="text-gray-600 mb-2">Time Taken</div>
            <div className="text-sm text-gray-500">
              Submitted: {new Date(testResults.submitted_at).toLocaleTimeString()}
            </div>
          </motion.div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setSelectedTab('overview')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  selectedTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setSelectedTab('domains')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  selectedTab === 'domains'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Domain Analysis
              </button>
              <button
                onClick={() => setSelectedTab('review')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  selectedTab === 'review'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Question Review
              </button>
            </nav>
          </div>
        </div>

        {/* Overview Tab */}
        {selectedTab === 'overview' && (
          <div className="space-y-6">
            {/* Performance Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Summary</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-600">{testResults.correct_answers}</div>
                  <div className="text-green-600 font-medium">Correct</div>
                </div>
                
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-red-600">{testResults.wrong_answers}</div>
                  <div className="text-red-600 font-medium">Wrong</div>
                </div>
                
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <AlertCircle className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-600">{testResults.unattempted_questions}</div>
                  <div className="text-gray-600 font-medium">Unattempted</div>
                </div>
              </div>

              {/* Marks Breakdown */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Marks Breakdown</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total Marks:</span>
                    <span className="font-medium ml-2">{testResults.total_marks}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Marks Obtained:</span>
                    <span className="font-medium ml-2 text-green-600">+{testResults.obtained_marks}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Negative Marks:</span>
                    <span className="font-medium ml-2 text-red-600">-{testResults.negative_marks}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Final Score:</span>
                    <span className="font-medium ml-2 text-blue-600">{testResults.final_score?.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Domain Overview */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Domain Performance</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {domainAnalysis.map((domain, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">{domain.name}</h4>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Accuracy</span>
                      <span className={`font-medium ${
                        domain.accuracy >= 80 ? 'text-green-600' : 
                        domain.accuracy >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {domain.accuracy}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          domain.accuracy >= 80 ? 'bg-green-500' : 
                          domain.accuracy >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${domain.accuracy}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {domain.correctAnswers}/{domain.totalQuestions} correct
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Domain Analysis Tab */}
        {selectedTab === 'domains' && (
          <div className="space-y-6">
            {domainAnalysis.map((domain, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{domain.name}</h3>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    domain.accuracy >= 80 ? 'bg-green-100 text-green-800' : 
                    domain.accuracy >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {domain.accuracy}% Accuracy
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-xl font-bold text-blue-600">{domain.totalQuestions}</div>
                    <div className="text-blue-600 text-sm">Total</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-xl font-bold text-green-600">{domain.correctAnswers}</div>
                    <div className="text-green-600 text-sm">Correct</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-xl font-bold text-red-600">{domain.wrongAnswers}</div>
                    <div className="text-red-600 text-sm">Wrong</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-xl font-bold text-gray-600">{domain.unattempted}</div>
                    <div className="text-gray-600 text-sm">Skipped</div>
                  </div>
                </div>

                {/* Subdomain Breakdown */}
                {Object.keys(domain.subdomains).length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Subdomain Performance</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.values(domain.subdomains).map((subdomain, subIndex) => (
                        <div key={subIndex} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div>
                            <div className="font-medium text-gray-900 text-sm">{subdomain.name}</div>
                            <div className="text-xs text-gray-600">
                              {subdomain.correctAnswers}/{subdomain.totalQuestions} correct
                            </div>
                          </div>
                          <div className={`text-sm font-medium ${
                            subdomain.accuracy >= 80 ? 'text-green-600' : 
                            subdomain.accuracy >= 60 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {subdomain.accuracy}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Question Review Tab */}
        {selectedTab === 'review' && (
          <div className="space-y-4">
            {questionReview.map((attempt, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      Q{index + 1}
                    </span>
                    <div className="text-sm text-gray-500">
                      {attempt.questions?.domains?.name} - {attempt.questions?.question_categories?.name}
                    </div>
                    {attempt.marked_for_review && (
                      <Flag className="w-4 h-4 text-yellow-500" />
                    )}
                  </div>
                  
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                    attempt.is_correct 
                      ? 'bg-green-100 text-green-800' 
                      : attempt.selected_answer 
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {attempt.is_correct ? (
                      <><CheckCircle className="w-4 h-4" /> Correct</>
                    ) : attempt.selected_answer ? (
                      <><XCircle className="w-4 h-4" /> Wrong</>
                    ) : (
                      <><AlertCircle className="w-4 h-4" /> Skipped</>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-gray-900 mb-4">{attempt.questions?.text}</p>
                  
                  <div className="space-y-2">
                    {attempt.questions?.options?.map((option, optIndex) => {
                      const optionKey = ['A', 'B', 'C', 'D'][optIndex];
                      const isSelected = attempt.selected_answer === optionKey;
                      const isCorrect = attempt.questions?.correct_answer === optionKey;
                      
                      return (
                        <div
                          key={optIndex}
                          className={`p-3 rounded-lg border-2 ${
                            isCorrect 
                              ? 'border-green-500 bg-green-50' 
                              : isSelected && !isCorrect
                              ? 'border-red-500 bg-red-50'
                              : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`font-medium ${
                              isCorrect ? 'text-green-800' : 
                              isSelected && !isCorrect ? 'text-red-800' : 'text-gray-700'
                            }`}>
                              {optionKey}.
                            </span>
                            <span className={
                              isCorrect ? 'text-green-800' : 
                              isSelected && !isCorrect ? 'text-red-800' : 'text-gray-700'
                            }>
                              {option.text}
                            </span>
                            {isSelected && (
                              <span className="ml-auto text-sm font-medium">Your Answer</span>
                            )}
                            {isCorrect && (
                              <CheckCircle className="w-4 h-4 text-green-600 ml-auto" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {attempt.questions?.explanation && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <h5 className="font-medium text-blue-900 mb-1">Explanation</h5>
                        <p className="text-blue-800 text-sm">{attempt.questions.explanation}</p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 