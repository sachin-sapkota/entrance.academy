'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { authenticatedFetch } from '@/lib/supabase';

import { showToast, ToastContainer } from '../../components/Toast';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Copy,
  Clock,
  Users,
  DollarSign,
  Settings,
  MoreVertical,
  CheckCircle,
  XCircle,
  Calendar,
  Target,
  BookOpen,
  Award,
  TrendingUp
} from 'lucide-react';

export default function TestConfigurationsPage() {
  const router = useRouter();
  const [configurations, setConfigurations] = useState([]);
  const [filteredConfigurations, setFilteredConfigurations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [configToDelete, setConfigToDelete] = useState(null);

  useEffect(() => {
    fetchConfigurations();
  }, []);

  useEffect(() => {
    filterAndSortConfigurations();
  }, [configurations, searchTerm, filterType, filterCategory, sortBy, sortOrder]);

  // Memoize the filterAndSortConfigurations function to prevent unnecessary re-renders
  const filterAndSortConfigurations = useCallback(() => {
    let filtered = [...configurations];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(config =>
        config.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        config.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        config.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(config => config.test_type === filterType);
    }

    // Apply category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(config => config.test_category === filterCategory);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === 'created_at' || sortBy === 'updated_at') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredConfigurations(filtered);
  }, [configurations, searchTerm, filterType, filterCategory, sortBy, sortOrder]);

  const fetchConfigurations = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch('/api/admin/test-configurations');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setConfigurations(data.data || []);
    } catch (error) {
      console.error('Error fetching test configurations:', error);
      showToast('Failed to fetch test configurations. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };



  const handleEdit = (configId) => {
    router.push(`/admin/test-configurations/edit/${configId}`);
  };

  const handleDuplicate = async (config) => {
    try {
      // Convert snake_case to camelCase and prepare for duplication
      const duplicatedConfig = {
        name: `${config.name} (Copy)`,
        code: `${config.code}_COPY_${Date.now().toString().slice(-4)}`,
        description: config.description,
        testType: config.test_type,
        testCategory: config.test_category,
        durationMinutes: config.duration_minutes,
        totalQuestions: config.total_questions,
        questionsPerPage: config.questions_per_page,
        passingPercentage: config.passing_percentage,
        domainDistribution: config.domain_distribution || {},
        subdomainDistribution: config.category_distribution || {},
        cognitiveDistribution: config.cognitive_distribution || {
          recall: 30,
          understanding: 50,
          application: 20
        },
        difficultyDistribution: config.difficulty_distribution || {
          very_easy: 5,
          easy: 25,
          medium: 40,
          hard: 25,
          very_hard: 5
        },
        enableNegativeMarking: config.enable_negative_marking || false,
        negativeMarkingRatio: config.negative_marking_ratio || 0.25,
        partialMarkingEnabled: config.partial_marking_enabled || false,
        shuffleQuestions: config.shuffle_questions !== false,
        shuffleOptions: config.shuffle_options !== false,
        allowQuestionNavigation: config.allow_question_navigation !== false,
        allowQuestionReview: config.allow_question_review !== false,
        allowAnswerChange: config.allow_answer_change !== false,
        showCalculator: config.show_calculator || false,
        showTimer: config.show_timer !== false,
        autoSubmit: config.auto_submit !== false,
        pauseAllowed: config.pause_allowed || false,
        showResultImmediately: config.show_result_immediately !== false,
        showScoreImmediately: config.show_score_immediately !== false,
        showCorrectAnswers: config.show_correct_answers !== false,
        showExplanations: config.show_explanations !== false,
        showDetailedAnalytics: config.show_detailed_analytics !== false,
        resultValidityDays: config.result_validity_days || 365,
        browserLockEnabled: config.browser_lock_enabled || false,
        preventCopyPaste: config.prevent_copy_paste !== false,
        preventRightClick: config.prevent_right_click !== false,
        fullscreenRequired: config.fullscreen_required || false,
        webcamMonitoring: config.webcam_monitoring || false,
        screenRecording: config.screen_recording || false,
        isPublic: config.is_public || false,
        requiresApproval: config.requires_approval || false,
        accessCode: config.access_code || '',
        maxAttemptsPerUser: config.max_attempts_per_user || 1,
        retryAfterDays: config.retry_after_days || 0,
        availableFrom: config.available_from || '',
        availableUntil: config.available_until || '',
        registrationDeadline: config.registration_deadline || '',
        isFree: config.is_free !== false,
        price: config.price || 0,
        currency: config.currency || 'NPR',
        instructions: config.instructions || '',
        rulesAndRegulations: config.rules_and_regulations || '',
        isActive: config.is_active !== false
      };

      const response = await authenticatedFetch('/api/admin/test-configurations', {
        method: 'POST',
        body: JSON.stringify(duplicatedConfig),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to duplicate configuration');
      }

      fetchConfigurations();
      showToast('Test configuration duplicated successfully!', 'success');
    } catch (error) {
      console.error('Error duplicating configuration:', error);
      showToast('Failed to duplicate configuration. Please try again.', 'error');
    }
  };

  const handleDelete = async () => {
    if (!configToDelete) return;

    try {
      const response = await authenticatedFetch(`/api/admin/test-configurations?id=${configToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      fetchConfigurations();
      setShowDeleteModal(false);
      setConfigToDelete(null);
      showToast('Test configuration deleted successfully!', 'success');
    } catch (error) {
      console.error('Error deleting configuration:', error);
      showToast('Failed to delete configuration. Please try again.', 'error');
    }
  };

  const handleCreateQuestionSet = async (config) => {
    try {
      const response = await authenticatedFetch('/api/admin/practice-sets', {
        method: 'POST',
        body: JSON.stringify({ templateId: config.id }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to create question set');
      }
      showToast('Question set created as draft! You can edit or make it live from Practice Sets.', 'success');
      // Optionally, link to the practice sets page
    } catch (error) {
      showToast(error.message || 'Failed to create question set.', 'error');
    }
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getDomainDistributionSummary = (distribution) => {
    if (!distribution || typeof distribution !== 'object') return 'Not configured';
    
    const entries = Object.entries(distribution);
    if (entries.length === 0) return 'Not configured';
    
    return entries
      .map(([domain, count]) => `${domain}:${count}`)
      .join(', ');
  };

  const getStatusBadge = (config) => {
    if (!config.is_active) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="h-3 w-3 mr-1" />
          Inactive
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircle className="h-3 w-3 mr-1" />
        Active
      </span>
    );
  };

  const getTypeBadge = (type) => {
    const colors = {
      full_length_mock: 'bg-red-100 text-red-800',
      subject_wise_mock: 'bg-blue-100 text-blue-800',
      difficulty_tiered: 'bg-purple-100 text-purple-800',
      time_speed_drill: 'bg-orange-100 text-orange-800',
      weekly_progress: 'bg-green-100 text-green-800',
      adaptive_mcq: 'bg-indigo-100 text-indigo-800'
    };

    const labels = {
      full_length_mock: 'Full-Length Mock',
      subject_wise_mock: 'Subject-wise Mock',
      difficulty_tiered: 'Difficulty-tiered',
      time_speed_drill: 'Speed Drill',
      weekly_progress: 'Weekly Progress',
      adaptive_mcq: 'Adaptive MCQ'
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[type] || 'bg-gray-100 text-gray-800'}`}>
        {labels[type] || type?.charAt(0).toUpperCase() + type?.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading test configurations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Test Configurations</h1>
              <p className="text-sm text-gray-600">Manage examination templates and settings</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => router.push('/admin/test-configurations/create')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center text-sm font-medium"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Configuration
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="full_length_mock">Full-Length Mock</option>
              <option value="subject_wise_mock">Subject-wise Mock</option>
              <option value="difficulty_tiered">Difficulty-tiered</option>
              <option value="time_speed_drill">Speed Drill</option>
              <option value="weekly_progress">Weekly Progress</option>
              <option value="adaptive_mcq">Adaptive MCQ</option>
            </select>

            {/* Category Filter */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              <option value="general">General</option>
              <option value="entrance">Entrance</option>
              <option value="competitive">Competitive</option>
              <option value="academic">Academic</option>
              <option value="certification">Certification</option>
              <option value="skills">Skills</option>
            </select>

            {/* Sort */}
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="created_at-desc">Newest First</option>
              <option value="created_at-asc">Oldest First</option>
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="total_questions-desc">Most Questions</option>
              <option value="total_questions-asc">Least Questions</option>
            </select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Templates</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{configurations.length}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Settings className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Templates</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {configurations.filter(c => c.is_active).length}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Test Types</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {new Set(configurations.map(c => c.test_type)).size}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <BookOpen className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Duration</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {configurations.length > 0 
                    ? Math.round(configurations.reduce((sum, c) => sum + (c.duration_minutes || 0), 0) / configurations.length)
                    : 0}m
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Configurations Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900">
              Test Templates ({filteredConfigurations.length})
            </h3>
          </div>

          {filteredConfigurations.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center"
            >
              <div className="bg-gray-100 rounded-full p-6 w-24 h-24 mx-auto mb-6">
                <Settings className="h-12 w-12 text-gray-400 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {searchTerm || filterType !== 'all' || filterCategory !== 'all'
                  ? 'Try adjusting your search or filters to find templates.'
                  : 'Get started by creating your first test template.'}
              </p>
              {(!searchTerm && filterType === 'all' && filterCategory === 'all') && (
                <button
                  onClick={() => router.push('/admin/test-configurations/create')}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create Template
                </button>
              )}
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredConfigurations.map((config, index) => (
                <motion.div
                  key={config.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all duration-200"
                >
                  {/* Card Header */}
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900 mb-1">
                          {config.name}
                        </h4>
                        <p className="text-sm text-gray-600 font-mono">
                          {config.code}
                        </p>
                      </div>
                      {getStatusBadge(config)}
                    </div>
                    
                    <div className="flex items-center gap-2 mb-3">
                      {getTypeBadge(config.test_type)}
                      {config.test_category && (
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-md">
                          {config.test_category.charAt(0).toUpperCase() + config.test_category.slice(1)}
                        </span>
                      )}
                    </div>

                    {config.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {config.description}
                      </p>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-6 space-y-4">
                    {/* Test Details */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center text-gray-700">
                        <Target className="h-4 w-4 mr-2 text-blue-500" />
                        <span className="text-sm font-medium">{config.total_questions} Questions</span>
                      </div>
                      <div className="flex items-center text-gray-700">
                        <Clock className="h-4 w-4 mr-2 text-green-500" />
                        <span className="text-sm font-medium">{formatDuration(config.duration_minutes)}</span>
                      </div>
                    </div>

                    {/* Marking & Pricing */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-sm">
                        <span className="text-gray-600">Marking: </span>
                        {config.enable_negative_marking ? (
                          <span className="font-medium text-red-600">-{config.negative_marking_ratio}</span>
                        ) : (
                          <span className="font-medium text-green-600">No negative</span>
                        )}
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-600">Access: </span>
                        {config.is_free ? (
                          <span className="font-medium text-green-600">Free</span>
                        ) : (
                          <span className="font-medium text-blue-600">Pro</span>
                        )}
                      </div>
                    </div>

                    {/* Domain Distribution */}
                    {config.domain_distribution && Object.keys(config.domain_distribution).length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 mb-2">Subject Distribution:</p>
                        <p className="text-sm text-gray-700">
                          {getDomainDistributionSummary(config.domain_distribution)}
                        </p>
                      </div>
                    )}

                    {/* Created Info */}
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-500">
                        Created {new Date(config.created_at).toLocaleDateString()} by{' '}
                        {config.creator?.full_name || config.creator?.email || 'Unknown'}
                      </p>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="px-6 py-4 bg-gray-50 rounded-b-xl border-t border-gray-100">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleEdit(config.id)}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Edit Template"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDuplicate(config)}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                        title="Duplicate Template"
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Duplicate
                      </button>
                      <button
                        onClick={() => {
                          setConfigToDelete(config);
                          setShowDeleteModal(true);
                        }}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                        title="Delete Template"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </button>
                      <button
                        className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 text-xs ml-2"
                        onClick={() => handleCreateQuestionSet(config)}
                      >
                        Create Question Set
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">Delete Test Configuration</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete "{configToDelete?.name}"? This action cannot be undone.
                </p>
              </div>
              <div className="flex justify-center space-x-4 mt-4">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setConfigToDelete(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <ToastContainer />
    </div>
  );
} 