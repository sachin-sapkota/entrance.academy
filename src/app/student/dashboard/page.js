'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import {
  BookOpen,
  TrendingUp,
  Target,
  Clock,
  Award,
  BarChart3,
  CheckCircle,
  Play,
  Calendar,
  Trophy,
  Users,
  Star
} from 'lucide-react';

export default function StudentDashboard() {
  const [stats, setStats] = useState(null);
  const [recentTests, setRecentTests] = useState([]);
  const [availableSets, setAvailableSets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const router = useRouter();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      await Promise.all([
        fetchUserStats(),
        fetchRecentTests(),
        fetchAvailableSets()
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    if (!user?.id) return;

    // Fetch user performance analytics
    const { data: analyticsData, error: analyticsError } = await supabase
      .from('user_performance_analytics')
      .select('*')
      .eq('user_id', user.id);

    if (analyticsError) {
      console.error('Error fetching analytics:', analyticsError);
      return;
    }

    // Fetch recent test count
    const { data: testsData, error: testsError } = await supabase
      .from('tests')
      .select('id, percentage, completed_at')
      .eq('user_id', user.id)
      .eq('status', 'submitted')
      .order('completed_at', { ascending: false });

    if (testsError) {
      console.error('Error fetching tests:', testsError);
      return;
    }

    // Calculate overall stats
    const totalTests = testsData?.length || 0;
    const averageScore = totalTests > 0 
      ? (testsData.reduce((sum, test) => sum + (test.percentage || 0), 0) / totalTests).toFixed(1)
      : 0;
    
    const bestScore = totalTests > 0
      ? Math.max(...testsData.map(test => test.percentage || 0)).toFixed(1)
      : 0;

    // Calculate total questions from analytics
    const totalQuestions = analyticsData?.reduce((sum, domain) => 
      sum + (domain.total_questions_attempted || 0), 0) || 0;
    
    const correctAnswers = analyticsData?.reduce((sum, domain) => 
      sum + (domain.total_questions_correct || 0), 0) || 0;

    setStats({
      totalTests,
      averageScore,
      bestScore,
      totalQuestions,
      correctAnswers,
      domains: analyticsData || []
    });
  };

  const fetchRecentTests = async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from('tests')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'submitted')
      .order('completed_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error fetching recent tests:', error);
      return;
    }

    setRecentTests(data || []);
  };

  const fetchAvailableSets = async () => {
    const { data, error } = await supabase
      .from('generated_question_sets')
      .select(`
        *,
        template:question_set_templates(name, type, description)
      `)
      .eq('is_published', true)
      .order('generated_at', { ascending: false })
      .limit(6);

    if (error) {
      console.error('Error fetching question sets:', error);
      return;
    }

    setAvailableSets(data || []);
  };

  const getSetTypeInfo = (type) => {
    const typeMap = {
      'full_mock_practice': {
        icon: <Award className="w-5 h-5" />,
        color: 'bg-red-500',
        label: 'Full Mock Test'
      },
      'weekly_full_practice': {
        icon: <Calendar className="w-5 h-5" />,
        color: 'bg-blue-500',
        label: 'Weekly Practice'
      },
      'daily_mixed_practice': {
        icon: <Clock className="w-5 h-5" />,
        color: 'bg-yellow-500',
        label: 'Daily Practice'
      }
    };
    return typeMap[type] || { icon: <BookOpen className="w-5 h-5" />, color: 'bg-gray-500', label: 'Practice Set' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Dashboard</h1>
          <p className="text-gray-600">Track your progress and continue your preparation</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Tests Taken</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.totalTests}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Average Score</p>
                  <p className="text-3xl font-bold text-green-600">{stats.averageScore}%</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Best Score</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.bestScore}%</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Trophy className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Questions Solved</p>
                  <p className="text-3xl font-bold text-orange-600">{stats.correctAnswers}</p>
                  <p className="text-xs text-gray-500">out of {stats.totalQuestions}</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Target className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </motion.div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Available Question Sets */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Available Question Sets</h2>
              <button
                onClick={() => router.push('/student/question-sets')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                View All →
              </button>
            </div>

            {availableSets.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Question Sets Available</h3>
                <p className="text-gray-600">Question sets will appear here when published by administrators</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {availableSets.map((set, index) => {
                  const typeInfo = getSetTypeInfo(set.template?.type);
                  
                  return (
                    <motion.div
                      key={set.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 rounded-lg ${typeInfo.color} text-white`}>
                          {typeInfo.icon}
                        </div>
                        <span className="text-xs text-gray-500">
                          {set.total_questions} questions
                        </span>
                      </div>
                      
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                        {set.name}
                      </h3>
                      
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {set.template?.description || 'Practice set'}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                          {typeInfo.label}
                        </div>
                        <button
                          onClick={() => router.push(`/student/test?setId=${set.id}&setName=${encodeURIComponent(set.name)}`)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
                        >
                          <Play className="w-4 h-4" />
                          Start
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Tests */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Recent Tests</h3>
              
              {recentTests.length === 0 ? (
                <div className="text-center py-4">
                  <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No tests taken yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentTests.map((test, index) => (
                    <div key={test.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900 text-sm truncate">
                          {test.test_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(test.completed_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className={`text-sm font-medium ${
                        test.percentage >= 80 ? 'text-green-600' : 
                        test.percentage >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {test.percentage?.toFixed(1) || 0}%
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {recentTests.length > 0 && (
                <button
                  onClick={() => router.push('/student/results')}
                  className="w-full mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View All Results →
                </button>
              )}
            </div>

            {/* Domain Performance */}
            {stats && stats.domains.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Domain Performance</h3>
                
                <div className="space-y-4">
                  {stats.domains.slice(0, 5).map((domain, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-gray-900 text-sm">
                          {domain.domain_name || 'Unknown Domain'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {domain.completed_tests || 0} tests
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-medium ${
                          domain.average_score >= 80 ? 'text-green-600' : 
                          domain.average_score >= 60 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {domain.average_score?.toFixed(1) || 0}%
                        </div>
                        <div className="text-xs text-gray-500">avg</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
              
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/student/question-sets')}
                  className="w-full flex items-center gap-3 p-3 text-left bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-900">Browse Question Sets</span>
                </button>
                
                <button
                  onClick={() => router.push('/student/question-sets?filter=full_mock_practice')}
                  className="w-full flex items-center gap-3 p-3 text-left bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <Award className="w-5 h-5 text-red-600" />
                  <span className="font-medium text-red-900">Take Mock Test</span>
                </button>
                
                <button
                  onClick={() => router.push('/student/question-sets?filter=daily_mixed_practice')}
                  className="w-full flex items-center gap-3 p-3 text-left bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors"
                >
                  <Clock className="w-5 h-5 text-yellow-600" />
                  <span className="font-medium text-yellow-900">Daily Practice</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 