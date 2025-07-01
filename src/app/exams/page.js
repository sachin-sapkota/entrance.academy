'use client';

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Trophy,
  BookOpen,
  FileText,
  TrendingUp,
  BarChart3,
  Play,
  Eye,
  Download,
  Filter,
  Search,
  ChevronDown,
  Target,
  Award,
  Brain,
  Zap,
  Star,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  PlusCircle,
  ArrowRight,
  Timer,
  Percent,
  Hash,
  Globe
} from 'lucide-react';
import ProtectedRoute from '@/app/components/ProtectedRoute';
import Footer from '@/app/components/Footer';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export default function ExamsPage() {
  const router = useRouter();
  const { user } = useSelector((state) => state.auth);
  const [session, setSession] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDomain, setFilterDomain] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [tests, setTests] = useState([]);
  const [stats, setStats] = useState({
    totalTests: 0,
    completedTests: 0,
    averageScore: 0,
    bestScore: 0,
    totalTimeSpent: 0,
    currentStreak: 0
  });
  const [domains, setDomains] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [upcomingTests, setUpcomingTests] = useState([]);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      logger.info('Session loaded in exams page', { 
        hasSession: !!session, 
        hasAccessToken: !!session?.access_token,
        userEmail: session?.user?.email 
      });
      setSession(session);
    };
    getSession();
  }, []);

  useEffect(() => {
    if (user && session) {
      logger.info('Starting to load exam data', { 
        hasUser: !!user, 
        hasSession: !!session,
        hasAccessToken: !!session?.access_token
      });
    loadExamData();
    }
  }, [user, session]);

  // Reset filters when switching tabs
  useEffect(() => {
    if (activeTab !== 'all') {
      setFilterStatus('all');
    }
  }, [activeTab]);

  const loadExamData = async () => {
    if (!user || !session) return;

    setLoading(true);
    try {
      await Promise.all([
        loadUserTests(),
        loadUserStats(),
        loadDomains(),
        loadRecentActivity(),
        loadAvailableTests()
      ]);
    } catch (error) {
      console.error('Error loading exam data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserTests = async () => {
    try {
      logger.info('Making API call to /api/tests', { 
        hasSession: !!session,
        hasAccessToken: !!session?.access_token,
        tokenLength: session?.access_token?.length || 0
      });

      const response = await fetch('/api/tests', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('API call failed', { 
          status: response.status, 
          statusText: response.statusText,
          errorText 
        });
        throw new Error(`Failed to fetch tests: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (data.success && data.tests) {
        // Format the tests data to match expected structure
        const formattedTests = data.tests.map(test => ({
          ...test,
          // Ensure test_name is available for filtering
          test_name: test.test_name || test.test_configurations?.name || 'Unnamed Test',
          // Ensure created_at is available for sorting
          created_at: test.created_at || test.updated_at || new Date().toISOString()
        }));
        
        setTests(formattedTests);
        
        logger.info('Tests loaded successfully', { 
          testCount: formattedTests.length,
          statuses: [...new Set(formattedTests.map(t => t.status))]
        });
      } else {
        setTests([]);
        logger.warn('No tests data in API response', { response: data });
      }
    } catch (error) {
      logger.error('Error loading tests', { error: error.message, stack: error.stack });
      setTests([]);
    }
  };

  const loadUserStats = async () => {
    try {
      logger.info('Making API call to /api/users/stats', { 
        hasSession: !!session,
        hasAccessToken: !!session?.access_token
      });

      const response = await fetch('/api/users/stats', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Stats API call failed', { 
          status: response.status, 
          statusText: response.statusText,
          errorText 
        });
        throw new Error(`Failed to fetch stats: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (data.success && data.stats) {
        setStats({
          totalTests: data.stats.totalTests || 0,
          completedTests: data.stats.completedTests || 0,
          averageScore: Math.round(data.stats.averageScore || 0),
          bestScore: Math.round(data.stats.bestScore || 0),
          totalTimeSpent: Math.round((data.stats.totalTimeSpent || 0) / 60), // Convert seconds to minutes
          currentStreak: data.stats.studyStreak || 0
        });
            } else {
        // Set default stats if no data
      setStats({
          totalTests: 0,
          completedTests: 0,
          averageScore: 0,
          bestScore: 0,
          totalTimeSpent: 0,
          currentStreak: 0
        });
      }
    } catch (error) {
      logger.error('Error loading stats', { error: error.message, stack: error.stack });
      // Set default stats on error
      setStats({
        totalTests: 0,
        completedTests: 0,
        averageScore: 0,
        bestScore: 0,
        totalTimeSpent: 0,
        currentStreak: 0
      });
    }
  };

  const loadDomains = async () => {
    try {
      const response = await fetch('/api/domains');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch domains: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.domains) {
        setDomains(data.domains);
      } else {
        setDomains([]);
      }
    } catch (error) {
      logger.error('Error loading domains', { error: error.message, stack: error.stack });
      setDomains([]);
    }
  };

  const loadRecentActivity = async () => {
    try {
      logger.info('Making API call to /api/tests for recent activity', { 
        hasSession: !!session,
        hasAccessToken: !!session?.access_token
      });

      const response = await fetch('/api/tests', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Recent activity API call failed', { 
          status: response.status, 
          statusText: response.statusText,
          errorText 
        });
        throw new Error(`Failed to fetch tests for activity: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.success || !data.tests) {
        setRecentActivity([]);
        return;
      }

      const recentTests = data.tests.slice(0, 10); // Get recent 10 tests
      const activities = [];
      
      if (recentTests && recentTests.length > 0) {
        recentTests.forEach((test, index) => {
          if (test.status === 'submitted' || test.status === 'evaluated' || test.status === 'completed') {
            activities.push({
              id: `test_completed_${test.id}`,
              type: 'test_completed',
              title: `${test.test_name || test.test_configurations?.name || 'Test'} completed`,
              description: `Scored ${Math.round(test.percentage || 0)}% in ${test.test_configurations?.test_category || 'practice test'}`,
              timestamp: new Date(test.submitted_at || test.created_at),
              icon: Trophy,
              color: test.percentage >= 80 ? 'text-green-600 bg-green-100' : 
                     test.percentage >= 60 ? 'text-yellow-600 bg-yellow-100' : 'text-orange-600 bg-orange-100'
            });
          } else if (test.status === 'in_progress') {
            activities.push({
              id: `test_started_${test.id}`,
              type: 'test_started',
              title: `${test.test_name || test.test_configurations?.name || 'Test'} started`,
              description: `Began ${test.test_configurations?.test_category || 'practice test'}`,
              timestamp: new Date(test.created_at),
              icon: Play,
              color: 'text-blue-600 bg-blue-100'
            });
          }
        });

        // Add achievements based on performance patterns
        const completedTests = recentTests.filter(t => ['submitted', 'evaluated', 'completed'].includes(t.status));
        const recentCompletedTests = completedTests.filter(t => {
          const testDate = new Date(t.submitted_at || t.created_at);
          const daysDiff = (new Date() - testDate) / (1000 * 60 * 60 * 24);
          return daysDiff <= 7; // Last 7 days
        });

        if (recentCompletedTests.length >= 3) {
          activities.unshift({
            id: 'achievement_streak',
            type: 'achievement',
            title: 'Study streak achievement!',
            description: `Completed ${recentCompletedTests.length} tests this week`,
            timestamp: new Date(recentCompletedTests[0].submitted_at || recentCompletedTests[0].created_at),
            icon: Award,
            color: 'text-yellow-600 bg-yellow-100'
          });
        }

        const excellentScores = recentCompletedTests.filter(t => (t.percentage || 0) >= 90);
        if (excellentScores.length >= 2) {
          activities.unshift({
            id: 'achievement_excellence',
            type: 'achievement',
            title: 'Excellence streak!',
            description: `Scored 90%+ in ${excellentScores.length} recent tests`,
            timestamp: new Date(excellentScores[0].submitted_at || excellentScores[0].created_at),
            icon: Star,
            color: 'text-purple-600 bg-purple-100'
          });
        }
      }

      // Sort by timestamp and limit to 6 most recent
      activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setRecentActivity(activities.slice(0, 6));

    } catch (error) {
      logger.error('Error loading recent activity', { error: error.message, stack: error.stack });
      setRecentActivity([]);
    }
  };

  const loadAvailableTests = async () => {
    try {
      const response = await fetch('/api/live-tests');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch available tests: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.tests) {
        // Get user's completed test IDs to filter out already taken tests
        const completedTestIds = new Set(
          tests
            .filter(test => ['submitted', 'evaluated', 'completed'].includes(test.status))
            .map(test => test.meta_data?.practice_set_id || test.test_config_id)
            .filter(Boolean)
        );

        // Transform live tests to available tests format, excluding already completed ones
        const available = data.tests
          .filter(test => !completedTestIds.has(test.id)) // Only show tests not yet taken
          .map((test) => ({
            id: test.id,
            title: test.name || 'Untitled Test',
            description: test.description || `${test.domain} test with ${test.questions} questions`,
            duration: test.duration || 60,
            questions: test.questions || 20,
            domain: test.domain || 'Mixed',
            difficulty: test.difficulty || 'Medium',
            participants: test.participants || 0,
            isAvailable: true,
            type: test.testType || 'practice',
            practiceSetId: test.id,
            isFree: true,
            estimatedTime: test.estimatedTime || `${test.duration}m`
          }));

        setUpcomingTests(available.slice(0, 6)); // Show top 6 available tests
      } else {
        setUpcomingTests([]);
      }
      
    } catch (error) {
      logger.error('Error loading available tests', { error: error.message, stack: error.stack });
      setUpcomingTests([]);
    }
  };

  const filteredTests = tests.filter(test => {
    const matchesSearch = test.test_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         test.test_configurations?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Tab-based status filtering - activeTab takes priority over filterStatus dropdown
    let matchesStatus = true;
    if (activeTab === 'completed') {
      matchesStatus = test.status && ['completed', 'submitted', 'evaluated'].includes(test.status);
    } else if (activeTab === 'in_progress') {
      matchesStatus = test.status === 'in_progress';
    } else if (activeTab === 'all') {
      // For "All Tests" tab, also consider the status filter dropdown
      matchesStatus = filterStatus === 'all' || test.status === filterStatus;
    }
    // Note: 'upcoming' tab is handled separately and doesn't use this filter
    
    // Improved domain filtering to match against domain names and test categories
    const matchesDomain = filterDomain === 'all' || 
                         test.test_configurations?.test_category?.toLowerCase().includes(filterDomain.toLowerCase()) ||
                         test.test_configurations?.name?.toLowerCase().includes(filterDomain.toLowerCase());
    
    return matchesSearch && matchesStatus && matchesDomain;
  });

  const sortedTests = [...filteredTests].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return new Date(b.created_at) - new Date(a.created_at);
      case 'score':
        return (b.percentage || 0) - (a.percentage || 0);
      case 'duration':
        return (b.time_spent_seconds || 0) - (a.time_spent_seconds || 0);
      case 'name':
        return a.test_name?.localeCompare(b.test_name) || 0;
      default:
        return 0;
    }
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
      case 'submitted':
      case 'evaluated':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
      case 'submitted':
      case 'evaluated':
        return CheckCircle2;
      case 'in_progress':
        return RefreshCw;
      case 'paused':
        return AlertCircle;
      case 'expired':
        return XCircle;
      default:
        return Clock;
    }
  };

  const getDomainIcon = (domain) => {
    const domainMap = {
      mathematics: Target,
      physics: Zap,
      chemistry: Brain,
      biology: BookOpen,
      english: FileText,
      'computer science': Trophy
    };
    return domainMap[domain?.toLowerCase()] || BookOpen;
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0 min';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
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

  const formatRelativeTime = (date) => {
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const handleRetakeTest = (testId) => {
    // Check if this is a practice set ID (for upcoming tests)
    const upcomingTest = upcomingTests.find(test => test.id === testId);
    if (upcomingTest && upcomingTest.practiceSetId) {
      // This is a practice set, route to practice set lobby
      router.push(`/lobby/${upcomingTest.practiceSetId}`);
    } else {
      // Regular test
      router.push(`/lobby/${testId}`);
    }
  };

  const handleViewResults = (testId) => {
    router.push(`/results?testId=${testId}`);
  };

  const handleViewSolutions = (testId) => {
    router.push(`/solution?testId=${testId}`);
  };

  // Calculate tab counts based on actual data
  const completedCount = tests.filter(t => ['completed', 'submitted', 'evaluated'].includes(t.status)).length;
  const inProgressCount = tests.filter(t => t.status === 'in_progress').length;
  const pausedCount = tests.filter(t => t.status === 'paused').length;
  const expiredCount = tests.filter(t => t.status === 'expired').length;
  
  const tabs = [
    { id: 'all', label: 'All Tests', count: tests.length },
    { id: 'completed', label: 'Completed', count: completedCount },
    { id: 'in_progress', label: 'In Progress', count: inProgressCount },
    { id: 'upcoming', label: 'Available', count: upcomingTests.length }
  ];

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your exams...</p>
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
        <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 sm:space-x-4">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="flex items-center space-x-1 sm:space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm sm:text-base">Back</span>
                </button>
                <div className="text-gray-400 hidden sm:block">/</div>
                <h1 className="text-base sm:text-xl font-bold text-gray-900">My Exams</h1>
              </div>
              
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center space-x-1 sm:space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg font-medium transition-colors text-sm sm:text-base"
              >
                <PlusCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Take New Test</span>
                <span className="sm:hidden">New</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="block lg:hidden">
          <div className="px-3 py-4">
            {/* Mobile Performance Overview */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <h2 className="text-lg font-bold text-gray-900 mb-4">Performance Overview</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Tests', value: stats.totalTests, icon: FileText, color: 'from-blue-500 to-blue-600' },
                  { label: 'Completed', value: stats.completedTests, icon: CheckCircle2, color: 'from-green-500 to-green-600' },
                  { label: 'Avg Score', value: `${stats.averageScore}%`, icon: BarChart3, color: 'from-purple-500 to-purple-600' },
                  { label: 'Best Score', value: `${stats.bestScore}%`, icon: Trophy, color: 'from-yellow-500 to-yellow-600' }
                ].map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -1, scale: 1.02 }}
                    className="bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-white/20 hover:shadow-md transition-all duration-200"
                  >
                    <div className={`w-8 h-8 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center mb-2`}>
                      <stat.icon className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-base font-bold text-gray-900">{stat.value}</h3>
                    <p className="text-xs text-gray-600">{stat.label}</p>
                  </motion.div>
                ))}
              </div>
            </motion.section>

            {/* Mobile Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <h3 className="text-base font-semibold text-gray-900 mb-3">Recent Activity</h3>
              <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                {recentActivity.length > 0 ? (
                  <div className="space-y-3 max-h-40 overflow-y-auto">
                    {recentActivity.slice(0, 3).map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-2">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${activity.color}`}>
                          <activity.icon className="w-3 h-3" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-xs">{activity.title}</p>
                          <p className="text-xs text-gray-600 line-clamp-1">{activity.description}</p>
                          <p className="text-xs text-gray-400">{formatRelativeTime(activity.timestamp)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-gray-500 text-sm">No recent activity</p>
                    <p className="text-xs text-gray-400">Start taking tests to see activity here</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Mobile Available Tests */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <div className="flex items-center space-x-2 mb-3">
                <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded flex items-center justify-center">
                  <BookOpen className="w-3 h-3 text-white" />
                </div>
                <h3 className="text-base font-semibold text-gray-900">Available Tests</h3>
              </div>
              <div className="bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm rounded-lg p-3 border border-white/30 shadow-lg">
                {upcomingTests.length > 0 ? (
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {upcomingTests.slice(0, 3).map((test, index) => (
                      <motion.div 
                        key={test.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ y: -1, scale: 1.02 }}
                        className="group relative bg-gradient-to-br from-white to-gray-50/80 rounded-lg p-3 border border-gray-200/50 shadow-sm hover:shadow-md hover:border-blue-200/60 transition-all duration-300"
                      >
                        <div className="relative">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-gray-900 text-sm leading-tight pr-2 line-clamp-2">{test.title}</h4>
                            <div className="flex space-x-1">
                              <span className="px-1.5 py-0.5 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 rounded-full text-xs font-medium">
                                Practice
                              </span>
                            </div>
                          </div>
                          
                          <div className="space-y-1.5 mb-3">
                            <div className="flex items-center space-x-2 text-xs text-gray-600">
                              <div className="w-4 h-4 bg-gradient-to-br from-orange-100 to-orange-200 rounded-md flex items-center justify-center">
                                <Clock className="w-2.5 h-2.5 text-orange-600" />
                              </div>
                              <span className="font-medium">{test.estimatedTime || test.duration + 'm'}</span>
                              <span className="text-gray-400">•</span>
                              <span>{test.questions} questions</span>
                            </div>
                            <div className="flex items-center space-x-2 text-xs text-gray-600">
                              <div className="w-4 h-4 bg-gradient-to-br from-purple-100 to-purple-200 rounded-md flex items-center justify-center">
                                <Target className="w-2.5 h-2.5 text-purple-600" />
                              </div>
                              <span className="font-medium">{test.domain}</span>
                              <span className="text-gray-400">•</span>
                              <span className={`px-1.5 py-0.5 rounded-md text-xs font-medium ${
                                test.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                                test.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {test.difficulty}
                              </span>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => handleRetakeTest(test.id)}
                            className="w-full px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-xs font-semibold transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-md"
                          >
                            <div className="flex items-center justify-center space-x-1.5">
                              <Play className="w-3 h-3" />
                              <span>Start Practice</span>
                            </div>
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-gray-500 text-sm">All caught up!</p>
                    <p className="text-xs text-gray-400">You've completed all available practice sets</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Mobile Tab Navigation */}
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-1 text-sm ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white/60 text-gray-700 hover:bg-white/80'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                      activeTab === tab.id ? 'bg-blue-700' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Filters and Search */}
            {activeTab !== 'upcoming' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-white/20 mb-4"
              >
                <div className="space-y-3">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search tests..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Status Filter - only show on "All Tests" tab */}
                    {activeTab === 'all' && (
                      <div className="relative">
                        <select
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value)}
                          className="appearance-none w-full bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                          <option value="all">All Status</option>
                          <option value="completed">Completed</option>
                          <option value="submitted">Submitted</option>
                          <option value="evaluated">Evaluated</option>
                          <option value="in_progress">In Progress</option>
                          <option value="paused">Paused</option>
                          <option value="expired">Expired</option>
                          <option value="not_started">Not Started</option>
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      </div>
                    )}

                    {/* Domain Filter */}
                    <div className="relative">
                      <select
                        value={filterDomain}
                        onChange={(e) => setFilterDomain(e.target.value)}
                        className="appearance-none w-full bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      >
                        <option value="all">All Subjects</option>
                        {domains.map((domain) => (
                          <option key={domain.id} value={domain.name.toLowerCase()}>
                            {domain.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>

                    {/* Sort - span both columns if activeTab is not 'all' */}
                    <div className={`relative ${activeTab !== 'all' ? 'col-span-2' : ''}`}>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="appearance-none w-full bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      >
                        <option value="recent">Most Recent</option>
                        <option value="score">Highest Score</option>
                        <option value="duration">Longest Duration</option>
                        <option value="name">Name A-Z</option>
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Mobile Test List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              {activeTab === 'upcoming' ? (
                // Mobile Available tests detailed view
                upcomingTests.length > 0 ? (
                  upcomingTests.map((test) => (
                    <div key={test.id} className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-white/20 hover:shadow-md transition-all duration-200">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <h3 className="text-base font-semibold text-gray-900 flex-1 pr-2">{test.title}</h3>
                          <div className="flex flex-col space-y-1">
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Practice Set
                            </span>
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Free
                            </span>
                          </div>
                        </div>
                        
                        <p className="text-gray-600 text-sm">{test.description}</p>
                        
                        <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Timer className="w-3 h-3" />
                            <span>{test.duration} minutes</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Hash className="w-3 h-3" />
                            <span>{test.questions} questions</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <BookOpen className="w-3 h-3" />
                            <span>{test.domain}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Target className="w-3 h-3" />
                            <span>{test.difficulty}</span>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handleRetakeTest(test.id)}
                          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm"
                        >
                          Start Practice
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 bg-white/40 backdrop-blur-sm rounded-lg border border-white/20">
                    <Calendar className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500">No upcoming tests scheduled</p>
                  </div>
                )
              ) : (
                // Mobile Regular test list
                sortedTests.length > 0 ? (
                  sortedTests.map((test) => {
                    const StatusIcon = getStatusIcon(test.status);
                    const DomainIcon = getDomainIcon(test.test_configurations?.test_category);
                    
                    return (
                      <motion.div
                        key={test.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ y: -1, scale: 1.01 }}
                        className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-white/20 hover:shadow-md transition-all duration-200"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                              <DomainIcon className="w-5 h-5 text-white" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <h3 className="text-sm font-semibold text-gray-900 truncate flex-1">
                                  {test.test_name || test.test_configurations?.name || 'Unnamed Test'}
                                </h3>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(test.status)}`}>
                                  {test.status?.replace('_', ' ').toUpperCase()}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                                <div className="flex items-center space-x-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>{formatDate(test.created_at)}</span>
                                </div>
                                
                                {test.time_spent_seconds && (
                                  <div className="flex items-center space-x-1">
                                    <Clock className="w-3 h-3" />
                                    <span>{formatDuration(test.time_spent_seconds)}</span>
                                  </div>
                                )}
                                
                                {test.total_questions && (
                                  <div className="flex items-center space-x-1">
                                    <Hash className="w-3 h-3" />
                                    <span>{test.total_questions} questions</span>
                                  </div>
                                )}
                                
                                {test.percentage !== null && (
                                  <div className="flex items-center space-x-1">
                                    <Percent className="w-3 h-3" />
                                    <span className={`font-medium ${
                                      test.percentage >= 80 ? 'text-green-600' :
                                      test.percentage >= 60 ? 'text-yellow-600' : 'text-red-600'
                                    }`}>
                                      {Math.round(test.percentage)}%
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            {(['completed', 'submitted', 'evaluated'].includes(test.status)) && (
                              <>
                                <button
                                  onClick={() => handleViewResults(test.id)}
                                  className="flex items-center justify-center space-x-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>Results</span>
                                </button>
                                
                                <button
                                  onClick={() => handleRetakeTest(test.id)}
                                  className="flex items-center justify-center space-x-1 px-3 py-2 border border-blue-600 text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-medium transition-colors"
                                >
                                  <RefreshCw className="w-3 h-3" />
                                  <span>Retake</span>
                                </button>
                              </>
                            )}
                            
                            {test.status === 'in_progress' && (
                              <button
                                onClick={() => handleRetakeTest(test.id)}
                                className="col-span-2 flex items-center justify-center space-x-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition-colors"
                              >
                                <Play className="w-3 h-3" />
                                <span>Continue</span>
                              </button>
                            )}
                            
                            {test.status === 'paused' && (
                              <button
                                onClick={() => handleRetakeTest(test.id)}
                                className="col-span-2 flex items-center justify-center space-x-1 px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-xs font-medium transition-colors"
                              >
                                <Play className="w-3 h-3" />
                                <span>Resume</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 bg-white/40 backdrop-blur-sm rounded-lg border border-white/20">
                    <FileText className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500 mb-2">No tests found</p>
                    <p className="text-xs text-gray-400">
                      {searchTerm || filterStatus !== 'all' || filterDomain !== 'all' 
                        ? 'Try adjusting your filters or search terms'
                        : 'Start taking tests to see them here'
                      }
                    </p>
                  </div>
                )
              )}
            </motion.div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:block">
          <div className="max-w-7xl mx-auto px-6 py-8">
            {/* Performance Overview */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Performance Overview</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { label: 'Total Tests', value: stats.totalTests, icon: FileText, color: 'from-blue-500 to-blue-600' },
                  { label: 'Completed', value: stats.completedTests, icon: CheckCircle2, color: 'from-green-500 to-green-600' },
                  { label: 'Avg Score', value: `${stats.averageScore}%`, icon: BarChart3, color: 'from-purple-500 to-purple-600' },
                  { label: 'Best Score', value: `${stats.bestScore}%`, icon: Trophy, color: 'from-yellow-500 to-yellow-600' },
                  { label: 'Time Spent', value: `${stats.totalTimeSpent}m`, icon: Clock, color: 'from-indigo-500 to-indigo-600' },
                  { label: 'Study Streak', value: `${stats.currentStreak} days`, icon: Zap, color: 'from-orange-500 to-orange-600' }
                ].map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -2, scale: 1.02 }}
                    className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:shadow-md transition-all duration-200"
                  >
                    <div className={`w-10 h-10 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center mb-3`}>
                      <stat.icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">{stat.value}</h3>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                  </motion.div>
                ))}
              </div>
            </motion.section>

            {/* Quick Actions & Recent Activity */}
            <div className="grid lg:grid-cols-3 gap-6 mb-8">
              {/* Recent Activity */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="lg:col-span-2"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/20 h-80">
                  {recentActivity.length > 0 ? (
                    <div className="space-y-3 overflow-y-auto h-full">
                      {recentActivity.slice(0, 4).map((activity) => (
                        <div key={activity.id} className="flex items-start space-x-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activity.color}`}>
                            <activity.icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm">{activity.title}</p>
                            <p className="text-xs text-gray-600">{activity.description}</p>
                            <p className="text-xs text-gray-400 mt-1">{formatRelativeTime(activity.timestamp)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 h-full flex flex-col justify-center">
                      <TrendingUp className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                      <p className="text-gray-500 mb-1 text-sm">No recent activity</p>
                      <p className="text-xs text-gray-400">Start taking tests to see your activity here</p>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Available Tests */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-3 h-3 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Available Tests</h3>
                </div>
                <div className="bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/30 shadow-lg h-80">
                  {upcomingTests.length > 0 ? (
                    <div className="space-y-3 overflow-y-auto h-full pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                      {upcomingTests.slice(0, 3).map((test, index) => (
                        <motion.div 
                          key={test.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          whileHover={{ y: -2, scale: 1.02 }}
                          className="group relative bg-gradient-to-br from-white to-gray-50/80 rounded-xl p-3 border border-gray-200/50 shadow-sm hover:shadow-md hover:border-blue-200/60 transition-all duration-300"
                        >
                          {/* Gradient overlay on hover */}
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-indigo-50/0 group-hover:from-blue-50/30 group-hover:to-indigo-50/20 rounded-xl transition-all duration-300" />
                          
                          <div className="relative">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-semibold text-gray-900 text-sm leading-tight pr-2">{test.title}</h4>
                              <div className="flex space-x-1">
                                <span className="px-2 py-0.5 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 rounded-full text-xs font-medium">
                                  Practice
                                </span>
                                <span className="px-2 py-0.5 bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-700 rounded-full text-xs font-medium">
                                  Free
                                </span>
                              </div>
                            </div>
                            
                            <div className="space-y-1.5 mb-3">
                              <div className="flex items-center space-x-2 text-xs text-gray-600">
                                <div className="w-4 h-4 bg-gradient-to-br from-orange-100 to-orange-200 rounded-md flex items-center justify-center">
                                  <Clock className="w-2.5 h-2.5 text-orange-600" />
                                </div>
                                <span className="font-medium">{test.estimatedTime || test.duration + 'm'}</span>
                                <span className="text-gray-400">•</span>
                                <span>{test.questions} questions</span>
                              </div>
                              <div className="flex items-center space-x-2 text-xs text-gray-600">
                                <div className="w-4 h-4 bg-gradient-to-br from-purple-100 to-purple-200 rounded-md flex items-center justify-center">
                                  <Target className="w-2.5 h-2.5 text-purple-600" />
                                </div>
                                <span className="font-medium">{test.domain}</span>
                                <span className="text-gray-400">•</span>
                                <span className={`px-1.5 py-0.5 rounded-md text-xs font-medium ${
                                  test.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                                  test.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {test.difficulty}
                                </span>
                              </div>
                            </div>
                            
                            <button
                              onClick={() => handleRetakeTest(test.id)}
                              className="w-full px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-xs font-semibold transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-md"
                            >
                              <div className="flex items-center justify-center space-x-1.5">
                                <Play className="w-3 h-3" />
                                <span>Start Practice</span>
                              </div>
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 h-full flex flex-col justify-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Calendar className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-600 mb-1 text-sm font-medium">All caught up!</p>
                      <p className="text-xs text-gray-500">You've completed all available practice sets</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Tab Navigation */}
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white/60 text-gray-700 hover:bg-white/80'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      activeTab === tab.id ? 'bg-blue-700' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
              
              {/* Debug info - remove this after testing */}
              {/*<div className="text-xs text-gray-500 mt-2">
                Debug: Showing {sortedTests.length} of {tests.length} total tests 
                (Active tab: {activeTab}, Status filter: {filterStatus}, Domain filter: {filterDomain})
              </div>*/}
            </div>

            {/* Filters and Search */}
            {activeTab !== 'upcoming' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/20 mb-6"
              >
                <div className="flex flex-wrap gap-4 items-center">
                  {/* Search */}
                  <div className="flex-1 min-w-64">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search tests..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Status Filter - only show on "All Tests" tab */}
                  {activeTab === 'all' && (
                    <div className="relative">
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">All Status</option>
                        <option value="completed">Completed</option>
                        <option value="submitted">Submitted</option>
                        <option value="evaluated">Evaluated</option>
                        <option value="in_progress">In Progress</option>
                        <option value="paused">Paused</option>
                        <option value="expired">Expired</option>
                        <option value="not_started">Not Started</option>
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                  )}

                  {/* Domain Filter */}
                  <div className="relative">
                    <select
                      value={filterDomain}
                      onChange={(e) => setFilterDomain(e.target.value)}
                      className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Subjects</option>
                      {domains.map((domain) => (
                        <option key={domain.id} value={domain.name.toLowerCase()}>
                          {domain.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>

                  {/* Sort */}
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="recent">Most Recent</option>
                      <option value="score">Highest Score</option>
                      <option value="duration">Longest Duration</option>
                      <option value="name">Name A-Z</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Test List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {activeTab === 'upcoming' ? (
                // Available tests detailed view
                upcomingTests.length > 0 ? (
                  upcomingTests.map((test) => (
                    <div key={test.id} className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:shadow-md transition-all duration-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{test.title}</h3>
                            
                            {/* Type indicator */}
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Practice Set
                            </span>
                            
                            {/* Free indicator */}
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Free
                              </span>
                          </div>
                          
                          <p className="text-gray-600 mb-4">{test.description}</p>
                          
                          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Calendar className="w-4 h-4" />
                              <span>{formatDate(test.scheduledDate)}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Timer className="w-4 h-4" />
                              <span>{test.duration} minutes</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Hash className="w-4 h-4" />
                              <span>{test.questions} questions</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <BookOpen className="w-4 h-4" />
                              <span>{test.domain} • {test.difficulty}</span>
                            </div>
                          </div>
                          
                          {/* Additional info for scheduled tests */}
                          {test.type === 'scheduled' && test.registrationDeadline && (
                            <div className="flex items-center space-x-2 text-sm text-orange-600 mb-2">
                              <AlertCircle className="w-4 h-4" />
                              <span>Registration closes: {formatDate(test.registrationDeadline)}</span>
                            </div>
                          )}
                          
                          {test.type === 'scheduled' && test.passingPercentage && (
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Target className="w-4 h-4" />
                              <span>Passing Score: {test.passingPercentage}%</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col items-end space-y-2">
                          <button
                            onClick={() => handleRetakeTest(test.id)}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                              test.isRegistered || test.type === 'practice'
                                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                                : 'border border-orange-600 text-orange-600 hover:bg-orange-50'
                            }`}
                          >
                            {test.type === 'scheduled' 
                              ? (test.isRegistered ? 'View Details' : 'Register Now')
                              : 'Start Practice'
                            }
                          </button>
                          
                          {test.type === 'scheduled' && !test.isRegistered && (
                            <p className="text-xs text-gray-500 text-right">
                              Click to register for this test
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 bg-white/40 backdrop-blur-sm rounded-xl border border-white/20">
                    <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500">No upcoming tests scheduled</p>
                  </div>
                )
              ) : (
                // Regular test list
                sortedTests.length > 0 ? (
                  sortedTests.map((test) => {
                    const StatusIcon = getStatusIcon(test.status);
                    const DomainIcon = getDomainIcon(test.test_configurations?.test_category);
                    
                    return (
                      <motion.div
                        key={test.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ y: -2, scale: 1.01 }}
                        className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4 flex-1">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                              <DomainIcon className="w-6 h-6 text-white" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className="text-lg font-semibold text-gray-900 truncate">
                                  {test.test_name || test.test_configurations?.name || 'Unnamed Test'}
                                </h3>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(test.status)}`}>
                                  {test.status?.replace('_', ' ').toUpperCase()}
                                </span>
                              </div>
                              
                              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                                <div className="flex items-center space-x-2">
                                  <Calendar className="w-4 h-4" />
                                  <span>{formatDate(test.created_at)}</span>
                                </div>
                                
                                {test.time_spent_seconds && (
                                  <div className="flex items-center space-x-2">
                                    <Clock className="w-4 h-4" />
                                    <span>{formatDuration(test.time_spent_seconds)}</span>
                                  </div>
                                )}
                                
                                {test.total_questions && (
                                  <div className="flex items-center space-x-2">
                                    <Hash className="w-4 h-4" />
                                    <span>{test.total_questions} questions</span>
                                  </div>
                                )}
                                
                                {test.percentage !== null && (
                                  <div className="flex items-center space-x-2">
                                    <Percent className="w-4 h-4" />
                                    <span className={`font-medium ${
                                      test.percentage >= 80 ? 'text-green-600' :
                                      test.percentage >= 60 ? 'text-yellow-600' : 'text-red-600'
                                    }`}>
                                      {Math.round(test.percentage)}%
                                    </span>
                                  </div>
                                )}
                              </div>
                              
                              {test.test_configurations?.description && (
                                <p className="text-gray-600 mt-2 text-sm line-clamp-2">
                                  {test.test_configurations.description}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2 ml-4">
                            {(['completed', 'submitted', 'evaluated'].includes(test.status)) && (
                              <>
                                <button
                                  onClick={() => handleViewResults(test.id)}
                                  className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                  <Eye className="w-4 h-4" />
                                  <span>View Results</span>
                                </button>
                                
                                <button
                                  onClick={() => handleViewSolutions(test.id)}
                                  className="flex items-center space-x-2 px-3 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors"
                                >
                                  <BookOpen className="w-4 h-4" />
                                  <span>Solutions</span>
                                </button>
                                
                                <button
                                  onClick={() => handleRetakeTest(test.id)}
                                  className="flex items-center space-x-2 px-3 py-2 border border-blue-600 text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-medium transition-colors"
                                >
                                  <RefreshCw className="w-4 h-4" />
                                  <span>Retake</span>
                                </button>
                              </>
                            )}
                            
                            {test.status === 'in_progress' && (
                              <button
                                onClick={() => handleRetakeTest(test.id)}
                                className="flex items-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                              >
                                <Play className="w-4 h-4" />
                                <span>Continue</span>
                              </button>
                            )}
                            
                            {test.status === 'paused' && (
                              <button
                                onClick={() => handleRetakeTest(test.id)}
                                className="flex items-center space-x-2 px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition-colors"
                              >
                                <Play className="w-4 h-4" />
                                <span>Resume</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 bg-white/40 backdrop-blur-sm rounded-xl border border-white/20">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500 mb-2">No tests found</p>
                    <p className="text-xs text-gray-400">
                      {searchTerm || filterStatus !== 'all' || filterDomain !== 'all' 
                        ? 'Try adjusting your filters or search terms'
                        : 'Start taking tests to see them here'
                      }
                    </p>
                  </div>
                )
              )}
            </motion.div>
          </div>
        </div>
      </div>
      <Footer />
    </ProtectedRoute>
  );
} 