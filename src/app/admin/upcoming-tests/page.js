'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Plus,
  Calendar,
  Clock,
  Users,
  BookOpen,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  AlertCircle,
  Globe,
  Lock,
  Save,
  X,
  Timer,
  Hash,
  Target,
  Award,
  Search,
  Filter,
  ChevronRight,
  ChevronLeft,
  PlayCircle,
  FileText,
  Settings,
  Shuffle,
  List,
  Grid
} from 'lucide-react';
import ProtectedRoute from '@/app/components/ProtectedRoute';

export default function UpcomingTestsAdmin() {
  const router = useRouter();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await loadUpcomingTests();
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUpcomingTests = async () => {
    try {
      // For loading data, we don't need auth since GET endpoint is public
      const response = await fetch('/api/admin/upcoming-tests');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setTests(data.upcomingTests || []);
    } catch (error) {
      console.error('Error loading upcoming tests:', error);
      setTests([]);
    }
  };





  const handleDelete = async (testId) => {
    if (!confirm('Are you sure you want to delete this scheduled test?')) return;

    try {
      // Get auth token
      const { data: { session } } = await import('@/lib/supabase').then(m => m.supabase.auth.getSession());
      if (!session) {
        throw new Error('No active session. Please log in again.');
      }

      const response = await fetch(`/api/admin/upcoming-tests?id=${testId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      setMessage({ type: 'success', text: 'Test deleted successfully!' });
      loadUpcomingTests();
    } catch (error) {
      console.error('Error deleting test:', error);
      setMessage({ type: 'error', text: 'Failed to delete test: ' + error.message });
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (test) => {
    const now = new Date();
    const registrationDeadline = new Date(test.registration_deadline);
    const testDate = new Date(test.available_from);

    if (now > testDate) return 'bg-gray-100 text-gray-800'; // Past
    if (now > registrationDeadline) return 'bg-red-100 text-red-800'; // Registration closed
    return 'bg-green-100 text-green-800'; // Open for registration
  };

  const getStatusText = (test) => {
    const now = new Date();
    const registrationDeadline = new Date(test.registration_deadline);
    const testDate = new Date(test.available_from);

    if (now > testDate) return 'Completed';
    if (now > registrationDeadline) return 'Registration Closed';
    return 'Open for Registration';
  };

  if (loading) {
    return (
      <ProtectedRoute adminOnly={true}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading upcoming tests...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute adminOnly={true}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/admin')}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>Back to Admin</span>
                </button>
                <div className="text-gray-400">/</div>
                <h1 className="text-2xl font-bold text-gray-900">Upcoming Tests</h1>
              </div>
              
              <button
                onClick={() => router.push('/admin/practice-sets/create')}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create Practice Set</span>
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Message */}
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 p-4 rounded-xl flex items-center space-x-3 ${
                message.type === 'success' 
                  ? 'bg-green-50 text-green-600 border border-green-200' 
                  : 'bg-red-50 text-red-600 border border-red-200'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <span>{message.text}</span>
            </motion.div>
          )}

          {/* Tests List */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Scheduled Tests</h2>
              <p className="text-gray-600 mt-1">Manage upcoming tests that students can register for</p>
            </div>

            <div className="p-6">
              {tests.length > 0 ? (
                <div className="space-y-4">
                  {tests.map((test) => (
                    <motion.div
                      key={test.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <h3 className="text-lg font-semibold text-gray-900">{test.name}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(test)}`}>
                              {getStatusText(test)}
                            </span>
                            {test.is_public ? (
                              <Globe className="w-4 h-4 text-green-600" title="Public" />
                            ) : (
                              <Lock className="w-4 h-4 text-gray-600" title="Private" />
                            )}
                          </div>
                          
                          {test.description && (
                            <p className="text-gray-600 mb-4">{test.description}</p>
                          )}
                          
                          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4" />
                              <span>{formatDate(test.available_from)}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Timer className="w-4 h-4" />
                              <span>{test.duration_minutes} minutes</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Hash className="w-4 h-4" />
                              <span>{test.total_questions} questions</span>
                              {test.questions_order && test.questions_order.length > 0 && (
                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                  {test.questions_order.length} selected
                                </span>
                              )}
                              {(!test.questions_order || test.questions_order.length === 0) && (
                                <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                                  Auto-select
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <Target className="w-4 h-4" />
                              <span>{test.passing_percentage}% to pass</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4 mt-3 text-sm">
                            <span className="text-gray-600">
                              Registration closes: {formatDate(test.registration_deadline)}
                            </span>
                            {!test.is_free && (
                              <span className="text-green-600 font-medium">
                                ${test.price}
                              </span>
                            )}
                          </div>
                        </div>
                        
                                                  <div className="flex items-center space-x-2 ml-4">
                            <button
                              onClick={() => {
                                // Create a preview of the test configuration
                                const testInfo = {
                                  name: test.name,
                                  description: test.description,
                                  available_from: test.available_from,
                                  duration_minutes: test.duration_minutes,
                                  total_questions: test.total_questions,
                                  passing_percentage: test.passing_percentage,
                                  questions_count: test.questions_order?.length || 0,
                                  domains: Object.keys(test.domain_distribution || {}),
                                  instructions: test.instructions
                                };
                                alert(`Test Preview:\n\nTitle: ${testInfo.name}\nQuestions: ${testInfo.questions_count} selected\nDuration: ${testInfo.duration_minutes} minutes\nPassing: ${testInfo.passing_percentage}%\nScheduled: ${new Date(testInfo.available_from).toLocaleDateString()}\n\n${testInfo.description ? 'Description: ' + testInfo.description : ''}`);
                              }}
                              className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                              title="Preview Test"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => router.push(`/admin/practice-sets/create?edit=${test.id}`)}
                              className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                              title="Edit Test"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(test.id)}
                              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No scheduled tests</h3>
                  <p className="text-gray-600 mb-4">Create your first upcoming test to notify students</p>
                  <button
                    onClick={() => router.push('/admin/practice-sets/create')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Create Practice Set
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>


      </div>
    </ProtectedRoute>
  );
} 