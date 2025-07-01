'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  Users,
  BookOpen,
  AlertCircle,
  CheckCircle,
  DollarSign,
  Target,
  Hash,
  Timer,
  ArrowRight,
  Globe,
  Lock,
  Star,
  Award,
  TrendingUp,
  Edit,
  Eye,
  Settings
} from 'lucide-react';
import ProtectedRoute from '@/app/components/ProtectedRoute';
import Footer from '@/app/components/Footer';

export default function UpcomingTestsPage() {
  const router = useRouter();
  const { user } = useSelector((state) => state.auth);
  const [scheduledTests, setScheduledTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadScheduledTests();
  }, []);

  const loadScheduledTests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/upcoming-tests');
      const data = await response.json();
      
      if (data.upcomingTests) {
        // Filter only scheduled tests (tests with available_from dates)
        const scheduled = data.upcomingTests.filter(test => 
          test.available_from && test.test_type !== 'practice'
        );
        
        setScheduledTests(scheduled);
      }
    } catch (error) {
      console.error('Error loading scheduled tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditTest = (testId) => {
    router.push(`/admin/practice-sets/create?edit=${testId}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not scheduled';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatShortDate = (dateString) => {
    if (!dateString) return 'Not scheduled';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTestStatus = (test) => {
    if (!test.available_from) return { text: 'Draft', color: 'bg-gray-100 text-gray-800' };
    
    const now = new Date();
    const testDate = new Date(test.available_from);
    const registrationDeadline = test.registration_deadline ? new Date(test.registration_deadline) : null;
    const testEndDate = test.available_until ? new Date(test.available_until) : null;

    if (testEndDate && now > testEndDate) {
      return { text: 'Completed', color: 'bg-gray-100 text-gray-800' };
    }
    
    if (now >= testDate) {
      return { text: 'Live', color: 'bg-green-100 text-green-800' };
    }
    
    if (registrationDeadline && now > registrationDeadline) {
      return { text: 'Registration Closed', color: 'bg-red-100 text-red-800' };
    }
    
    return { text: 'Upcoming', color: 'bg-blue-100 text-blue-800' };
  };

  const getTestTypeLabel = (testType) => {
    const typeLabels = {
      'full_syllabus': 'Full Syllabus',
      'domain_specific': 'Domain Specific',
      'weekly_domain': 'Weekly Domain',
      'weekly_full': 'Weekly Full',
      'daily_quiz': 'Daily Quiz',
      'mini_quiz': 'Mini Quiz'
    };
    return typeLabels[testType] || testType;
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading upcoming tests...</p>
                  </div>
      </div>
      <Footer />
    </ProtectedRoute>
  );
}

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-white/20">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="text-center">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl font-bold text-gray-900 mb-4"
              >
                Scheduled Tests
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-xl text-gray-600 max-w-2xl mx-auto"
              >
                View and manage all scheduled tests in the system
              </motion.p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {scheduledTests.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
            >
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">All Scheduled Tests</h2>
                <p className="text-gray-600 mt-1">Manage and monitor scheduled test configurations</p>
              </div>

              <div className="divide-y divide-gray-200">
                {scheduledTests.map((test, index) => {
                  const status = getTestStatus(test);
                  return (
                    <motion.div
                      key={test.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-6 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                              <Calendar className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <div className="flex items-center space-x-3 mb-1">
                                <h3 className="text-lg font-semibold text-gray-900">{test.name}</h3>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                                  {status.text}
                                </span>
                                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                                  {getTestTypeLabel(test.test_type)}
                                </span>
                                {test.is_free ? (
                                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                    Free
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                                    ${test.price}
                                  </span>
                                )}
                                {test.is_public ? (
                                  <Globe className="w-4 h-4 text-green-600" title="Public" />
                                ) : (
                                  <Lock className="w-4 h-4 text-gray-600" title="Private" />
                                )}
                              </div>
                              <p className="text-sm text-gray-600">{test.test_category}</p>
                            </div>
                          </div>

                          {test.description && (
                            <p className="text-gray-600 mb-4 max-w-2xl">{test.description}</p>
                          )}
                          
                          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-2" />
                              <span>{formatDate(test.available_from)}</span>
                            </div>
                            <div className="flex items-center">
                              <Timer className="w-4 h-4 mr-2" />
                              <span>{test.duration_minutes} minutes</span>
                            </div>
                            <div className="flex items-center">
                              <Hash className="w-4 h-4 mr-2" />
                              <span>{test.total_questions} questions</span>
                              {test.questions_order && test.questions_order.length > 0 && (
                                <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                                  {test.questions_order.length} selected
                                </span>
                              )}
                            </div>
                            <div className="flex items-center">
                              <Target className="w-4 h-4 mr-2" />
                              <span>{test.passing_percentage}% to pass</span>
                            </div>
                          </div>

                          {test.registration_deadline && (
                            <div className="flex items-center text-sm text-orange-600 mb-2">
                              <AlertCircle className="w-4 h-4 mr-2" />
                              <span>Registration deadline: {formatShortDate(test.registration_deadline)}</span>
                            </div>
                          )}

                          {test.instructions && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                              <p className="text-sm text-blue-800">
                                <strong>Instructions:</strong> {test.instructions.substring(0, 150)}
                                {test.instructions.length > 150 && '...'}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        {user && user.role === 'admin' && (
                          <div className="flex items-center space-x-2 ml-6">
                            <button
                              onClick={() => {
                                const testInfo = {
                                  name: test.name,
                                  description: test.description,
                                  available_from: test.available_from,
                                  duration_minutes: test.duration_minutes,
                                  total_questions: test.total_questions,
                                  passing_percentage: test.passing_percentage,
                                  questions_count: test.questions_order?.length || 0,
                                  test_type: test.test_type
                                };
                                alert(`Test Preview:\n\nTitle: ${testInfo.name}\nType: ${getTestTypeLabel(testInfo.test_type)}\nQuestions: ${testInfo.questions_count || testInfo.total_questions}\nDuration: ${testInfo.duration_minutes} minutes\nPassing: ${testInfo.passing_percentage}%\n${testInfo.available_from ? 'Scheduled: ' + formatShortDate(testInfo.available_from) : 'Not scheduled'}\n\n${testInfo.description || 'No description'}`);
                              }}
                              className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                              title="Preview Test"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEditTest(test.id)}
                              className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                              title="Edit Test"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">No Scheduled Tests</h3>
              <p className="text-gray-600 text-lg mb-8">No tests have been scheduled yet</p>
              {user && user.role === 'admin' && (
                <button
                  onClick={() => router.push('/admin/upcoming-tests')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Go to Admin Panel
                </button>
              )}
              {(!user || user.role !== 'admin') && (
                <button
                  onClick={() => router.push('/dashboard')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Back to Dashboard
                </button>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
} 