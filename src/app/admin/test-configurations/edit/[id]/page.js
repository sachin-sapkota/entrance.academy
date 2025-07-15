'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase, authenticatedFetch } from '@/lib/supabase';
import { showToast, ToastContainer } from '@/app/components/Toast';
import {
  ArrowLeft,
  Save,
  Settings,
  Clock,
  DollarSign,
  Target,
  BarChart3,
  CheckCircle,
  AlertCircle,
  Info,
  Plus,
  Minus,
  Eye,
  FileText
} from 'lucide-react';

export default function EditTestConfigurationPage() {
  const router = useRouter();
  const params = useParams();
  const configId = params.id;
  
  console.log('EditTestConfigurationPage rendered with configId:', configId);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [domains, setDomains] = useState([]);
  const [subdomains, setSubdomains] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    // Basic Information
    name: '',
    code: '',
    description: '',
    testType: 'full_length_mock', // full_length_mock, subject_wise_mock, difficulty_tiered, time_speed_drill, weekly_progress, adaptive_mcq
    testCategory: 'general', // general, entrance, competitive, academic
    
    // Duration and Questions
    durationMinutes: 120, // Default 2 hours
    totalQuestions: 100,
    questionsPerPage: 20,
    passingPercentage: 40.00,
    
    // Marking Scheme
    enableNegativeMarking: true,
    negativeMarkingRatio: 0.25,
    partialMarkingEnabled: false,
    
    // Cognitive Distribution (Recall: Understanding: Application - 30:50:20)
    cognitiveDistribution: {
      recall: 30,
      understanding: 50,
      application: 20
    },
    
    // Domain Distribution (customizable per test type)
    domainDistribution: {
      'MATH': 25,  // Mathematics
      'PHYS': 25,  // Physics
      'CHEM': 25,  // Chemistry
      'CS': 25     // Computer Science
    },
    
    // Subdomain Distribution (will be populated based on curriculum)
    subdomainDistribution: {},
    
    // Smart Algorithm Settings
    importanceWeightFactor: 1.5, // Multiplier for high importance questions
    minHighImportanceQuestions: 1, // Minimum high importance questions (1-3)
    maxHighImportanceQuestions: 3, // Maximum high importance questions (1-3)
    recencyWeightFactor: 0.8, // Factor to reduce selection of recently used questions
    avoidRecentDays: 7, // Don't select questions used in last N days
    difficultyDistribution: {
      "very_easy": 10,
      "easy": 20,
      "medium": 40,
      "hard": 25,
      "very_hard": 5
    },
    
    // Adaptive Test Settings (for adaptive_mcq type)
    isAdaptive: false,
    adaptiveStartLevel: 2, // Start at easy-medium (1-5 scale)
    adaptiveDifficultyStep: 1, // How much to increase/decrease difficulty
    adaptiveMinLevel: 1, // Minimum difficulty level
    adaptiveMaxLevel: 5, // Maximum difficulty level
    adaptiveCorrectThreshold: 1, // Number of correct answers to increase difficulty
    adaptiveWrongThreshold: 2, // Number of wrong answers to decrease difficulty
    
    // Time Speed Drill Settings (for time_speed_drill type)
    timePerQuestion: 30, // Seconds per question for speed drills
    showQuestionTimer: true,
    instantFeedback: false,
    
    // Test Behavior
    shuffleQuestions: false, // Always false
    shuffleOptions: true,
    allowQuestionNavigation: true,
    allowQuestionReview: true,
    allowAnswerChange: true,
    showCalculator: false,
    showTimer: true,
    autoSubmit: true,
    pauseAllowed: false,
    
    // Result Display
    showResultImmediately: true,
    showScoreImmediately: true,
    showCorrectAnswers: true,
    showExplanations: true,
    showDetailedAnalytics: true,
    resultValidityDays: 365,
    
    // Security Settings
    browserLockEnabled: false,
    preventCopyPaste: true,
    preventRightClick: true,
    fullscreenRequired: false,
    webcamMonitoring: false,
    screenRecording: false,
    
    // Access Control
    isPublic: false,
    requiresApproval: false,
    accessCode: '',
    maxAttemptsPerUser: 1,
    retryAfterDays: 0,
    
    // Scheduling
    availableFrom: '',
    availableUntil: '',
    registrationDeadline: '',
    
    // Access Control
    isFree: true,
    
    // Instructions
    instructions: `General Test Instructions:

1. Duration: 2 hours (120 minutes)
2. Total Questions: 100 (Multiple choice questions)
3. Marking Scheme: +1 for correct answer, -0.25 for wrong answer
4. Subject Distribution:
   - Mathematics: 25 questions
   - Physics: 25 questions
   - Chemistry: 25 questions
   - Computer Science: 25 questions

5. Cognitive Level Distribution:
   - Recall: 30% (30 questions)
   - Understanding: 50% (50 questions)
   - Application: 20% (20 questions)

6. General Instructions:
   - Read each question carefully
   - Select the most appropriate answer
   - Use the review feature to mark questions for later
   - Submit your test before time expires
   - Negative marking can be enabled/disabled by admin`,
    rulesAndRegulations: `Rules and Regulations:

1. Test Environment:
   - Ensure stable internet connection
   - Use updated web browser
   - Close all other applications

2. Test Conduct:
   - No external help allowed
   - No use of calculators (unless specified)
   - No communication during test

3. Technical Issues:
   - Report immediately to support
   - Screenshots will be monitored
   - Session will be recorded

4. Submission:
   - Auto-submit when time expires
   - Manual submission allowed
   - Cannot restart once submitted`
  });

  const fetchConfigById = useCallback(async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch(`/api/admin/test-configurations?id=${configId}`);
      
      console.log('API Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('API Response data:', data);
      if (data.success && data.data) {
        const config = data.data;
        
        console.log('Fetched configuration data:', config);
        
        // Convert snake_case to camelCase for form data
        setFormData({
          name: config.name || '',
          code: config.code || '',
          description: config.description || '',
          testType: config.test_type || 'full_length_mock',
          testCategory: config.test_category || 'general',
          durationMinutes: config.duration_minutes || 120,
          totalQuestions: config.total_questions || 100,
          questionsPerPage: config.questions_per_page || 20,
          passingPercentage: config.passing_percentage || 40.00,
          enableNegativeMarking: config.enable_negative_marking !== false,
          negativeMarkingRatio: config.negative_marking_ratio || 0.25,
          partialMarkingEnabled: config.partial_marking_enabled || false,
          cognitiveDistribution: config.cognitive_distribution || {
            recall: 30,
            understanding: 50,
            application: 20
          },
          domainDistribution: config.domain_distribution || {},
          subdomainDistribution: config.category_distribution || {},
          importanceWeightFactor: config.importance_weight_factor || 1.5,
          minHighImportanceQuestions: config.min_high_importance_questions || 1,
          maxHighImportanceQuestions: config.max_high_importance_questions || 3,
          recencyWeightFactor: config.recency_weight_factor || 0.8,
          avoidRecentDays: config.avoid_recent_days || 7,
          difficultyDistribution: config.difficulty_distribution || {
            very_easy: 10,
            easy: 20,
            medium: 40,
            hard: 25,
            very_hard: 5
          },
          // Additional fields from meta_data if available
          importanceWeightFactor: config.meta_data?.importance_weight_factor || config.importance_weight_factor || 1.5,
          minHighImportanceQuestions: config.meta_data?.min_high_importance_questions || config.min_high_importance_questions || 1,
          maxHighImportanceQuestions: config.meta_data?.max_high_importance_questions || config.max_high_importance_questions || 3,
          recencyWeightFactor: config.meta_data?.recency_weight_factor || config.recency_weight_factor || 0.8,
          avoidRecentDays: config.meta_data?.avoid_recent_days || config.avoid_recent_days || 7,
          isAdaptive: config.test_type === 'adaptive_mcq',
          adaptiveStartLevel: config.meta_data?.adaptive_start_level || config.adaptive_start_level || 2,
          adaptiveDifficultyStep: config.meta_data?.adaptive_difficulty_step || config.adaptive_difficulty_step || 1,
          adaptiveMinLevel: config.meta_data?.adaptive_min_level || config.adaptive_min_level || 1,
          adaptiveMaxLevel: config.meta_data?.adaptive_max_level || config.adaptive_max_level || 5,
          adaptiveCorrectThreshold: config.meta_data?.adaptive_correct_threshold || config.adaptive_correct_threshold || 1,
          adaptiveWrongThreshold: config.meta_data?.adaptive_wrong_threshold || config.adaptive_wrong_threshold || 2,
          timePerQuestion: config.meta_data?.time_per_question || config.time_per_question || 30,
          showQuestionTimer: config.meta_data?.show_question_timer !== false && config.show_question_timer !== false,
          instantFeedback: config.meta_data?.instant_feedback || config.instant_feedback || false,
          shuffleQuestions: false,
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
          availableFrom: config.available_from ? new Date(config.available_from).toISOString().split('T')[0] : '',
          availableUntil: config.available_until ? new Date(config.available_until).toISOString().split('T')[0] : '',
          registrationDeadline: config.registration_deadline ? new Date(config.registration_deadline).toISOString().split('T')[0] : '',
          isFree: config.is_free !== false,
          instructions: config.instructions || '',
          rulesAndRegulations: config.rules_and_regulations || ''
        });
      }
    } catch (error) {
      console.error('Error fetching configuration:', error);
      if (error.message.includes('404')) {
        showToast('Test configuration not found. Please check the URL.', 'error');
      } else if (error.message.includes('401')) {
        showToast('Authentication required. Please log in again.', 'error');
      } else if (error.message.includes('403')) {
        showToast('Access denied. Admin privileges required.', 'error');
      } else {
        showToast('Failed to load test configuration. Please try again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [configId]);

  useEffect(() => {
    console.log('useEffect triggered with configId:', configId);
    fetchDomainsAndSubdomains();
    if (configId) {
      fetchConfigById();
    }
  }, [configId, fetchConfigById]);

  useEffect(() => {
    if (formData.name && !configId) {
      generateCode();
    }
  }, [formData.name, configId]);

  useEffect(() => {
    // Auto-calculate subdomain distribution based on curriculum
    calculateSubdomainDistribution();
  }, [subdomains, formData.domainDistribution]);

  // Update isAdaptive when test type changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      isAdaptive: prev.testType === 'adaptive_mcq'
    }));
  }, [formData.testType]);

  const fetchDomainsAndSubdomains = async () => {
    try {
      setLoading(true);
      
      // Fetch domains
      const { data: domainsData, error: domainsError } = await supabase
        .from('domains')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (domainsError) throw domainsError;
      setDomains(domainsData || []);
      setAvailableSubjects(domainsData || []);

      // Fetch subdomains with domain information
      const { data: subdomainsData, error: subdomainsError } = await supabase
        .from('question_categories')
        .select(`
          id,
          name,
          code,
          weight,
          domain_id,
          display_order,
          domain:domains(id, name, code)
        `)
        .eq('is_active', true)
        .order('domain_id, display_order');

      if (subdomainsError) throw subdomainsError;
      setSubdomains(subdomainsData || []);

    } catch (error) {
      console.error('Error fetching domains and subdomains:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateCode = () => {
    if (formData.name) {
      const code = formData.name
        .toUpperCase()
        .replace(/[^A-Z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 20);
      
      setFormData(prev => ({
        ...prev,
        code: code + '_' + Date.now().toString().slice(-4)
      }));
    }
  };

  const calculateSubdomainDistribution = () => {
    const distribution = {};
    
    subdomains.forEach(subdomain => {
      const domainCode = subdomain.domain?.code;
      if (domainCode && formData.domainDistribution[domainCode]) {
        distribution[subdomain.code] = Math.floor(subdomain.weight);
      }
    });
    
    setFormData(prev => ({
      ...prev,
      subdomainDistribution: distribution
    }));
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedInputChange = (parent, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }));
  };

  const handleDomainDistributionChange = (domainCode, value) => {
    const numValue = parseInt(value) || 0;
    setFormData(prev => ({
      ...prev,
      domainDistribution: {
        ...prev.domainDistribution,
        [domainCode]: numValue
      }
    }));
  };

  const handleSubdomainDistributionChange = (subdomainCode, value) => {
    const numValue = parseInt(value) || 0;
    setFormData(prev => ({
      ...prev,
      subdomainDistribution: {
        ...prev.subdomainDistribution,
        [subdomainCode]: numValue
      }
    }));
  };

  const validateCognitiveDistribution = () => {
    const total = Object.values(formData.cognitiveDistribution).reduce((sum, val) => sum + val, 0);
    return total === 100;
  };

  const validateDomainDistribution = () => {
    const total = Object.values(formData.domainDistribution).reduce((sum, val) => sum + val, 0);
    return total === formData.totalQuestions;
  };

  // Add a new subject to the distribution
  const addSubject = (domainCode) => {
    if (!formData.domainDistribution[domainCode]) {
      setFormData(prev => ({
        ...prev,
        domainDistribution: {
          ...prev.domainDistribution,
          [domainCode]: 0
        }
      }));
    }
  };

  // Remove a subject from the distribution
  const removeSubject = (domainCode) => {
    const newDistribution = { ...formData.domainDistribution };
    delete newDistribution[domainCode];
    
    setFormData(prev => ({
      ...prev,
      domainDistribution: newDistribution
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateCognitiveDistribution()) {
      showToast('Cognitive distribution must total 100%', 'error');
      return;
    }
    
    if (!validateDomainDistribution()) {
      showToast(`Domain distribution must total ${formData.totalQuestions} questions`, 'error');
      return;
    }

    try {
      setSaving(true);

      // Prepare data for API endpoint
      const configData = {
        id: configId, // Include the ID in the request body for PUT requests
        name: formData.name,
        code: formData.code,
        description: formData.description,
        testType: formData.testType,
        testCategory: formData.testCategory,
        durationMinutes: formData.durationMinutes,
        totalQuestions: formData.totalQuestions,
        questionsPerPage: formData.questionsPerPage,
        passingPercentage: formData.passingPercentage,
        domainDistribution: formData.domainDistribution,
        subdomainDistribution: formData.subdomainDistribution,
        cognitiveDistribution: formData.cognitiveDistribution,
        difficultyDistribution: formData.difficultyDistribution,
        enableNegativeMarking: formData.enableNegativeMarking,
        negativeMarkingRatio: formData.negativeMarkingRatio,
        partialMarkingEnabled: formData.partialMarkingEnabled,
        shuffleQuestions: false,
        shuffleOptions: formData.shuffleOptions,
        allowQuestionNavigation: formData.allowQuestionNavigation,
        allowQuestionReview: formData.allowQuestionReview,
        allowAnswerChange: formData.allowAnswerChange,
        showCalculator: formData.showCalculator,
        showTimer: formData.showTimer,
        autoSubmit: formData.autoSubmit,
        pauseAllowed: formData.pauseAllowed,
        showResultImmediately: formData.showResultImmediately,
        showScoreImmediately: formData.showScoreImmediately,
        showCorrectAnswers: formData.showCorrectAnswers,
        showExplanations: formData.showExplanations,
        showDetailedAnalytics: formData.showDetailedAnalytics,
        resultValidityDays: formData.resultValidityDays,
        browserLockEnabled: formData.browserLockEnabled,
        preventCopyPaste: formData.preventCopyPaste,
        preventRightClick: formData.preventRightClick,
        fullscreenRequired: formData.fullscreenRequired,
        webcamMonitoring: formData.webcamMonitoring,
        screenRecording: formData.screenRecording,
        isPublic: formData.isPublic,
        requiresApproval: formData.requiresApproval,
        accessCode: formData.accessCode,
        maxAttemptsPerUser: formData.maxAttemptsPerUser,
        retryAfterDays: formData.retryAfterDays,
        availableFrom: formData.availableFrom || null,
        availableUntil: formData.availableUntil || null,
        registrationDeadline: formData.registrationDeadline || null,
        isFree: formData.isFree,
        price: formData.isFree ? 0 : 9.99,
        currency: 'NPR',
        instructions: formData.instructions,
        rulesAndRegulations: formData.rulesAndRegulations,
        // Additional settings for specific test types
        importanceWeightFactor: formData.importanceWeightFactor,
        minHighImportanceQuestions: formData.minHighImportanceQuestions,
        maxHighImportanceQuestions: formData.maxHighImportanceQuestions,
        recencyWeightFactor: formData.recencyWeightFactor,
        avoidRecentDays: formData.avoidRecentDays,
        adaptiveStartLevel: formData.adaptiveStartLevel,
        adaptiveDifficultyStep: formData.adaptiveDifficultyStep,
        adaptiveMinLevel: formData.adaptiveMinLevel,
        adaptiveMaxLevel: formData.adaptiveMaxLevel,
        adaptiveCorrectThreshold: formData.adaptiveCorrectThreshold,
        adaptiveWrongThreshold: formData.adaptiveWrongThreshold,
        timePerQuestion: formData.timePerQuestion,
        showQuestionTimer: formData.showQuestionTimer,
        instantFeedback: formData.instantFeedback
      };

      console.log('Sending config data:', configData);
      
      const response = await authenticatedFetch('/api/admin/test-configurations', {
        method: 'PUT',
        body: JSON.stringify(configData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update test configuration');
      }

      console.log('Test configuration updated:', result.data);
      showToast(`Test configuration ${configId ? 'updated' : 'created'} successfully!`, 'success');
      router.push('/admin/test-configurations');
      
    } catch (error) {
      console.error('Error updating test configuration:', error);
      showToast(error.message || 'Failed to update test configuration. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const totalQuestions = Object.values(formData.domainDistribution).reduce((sum, val) => sum + val, 0);
  const cognitiveTotal = Object.values(formData.cognitiveDistribution).reduce((sum, val) => sum + val, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading domains and subdomains...</p>
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
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="mr-4 p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {configId ? 'Edit Test Configuration' : 'Create Test Configuration'}
                </h1>
                <p className="text-sm text-gray-600">
                  {configId ? 'Modify existing examination template' : 'Set up a new examination template'}
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => router.push('/admin/test-configurations')}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {configId ? 'Updating...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {configId ? 'Update Configuration' : 'Create Configuration'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-blue-600" />
                Basic Information
              </h3>
            </div>
            <div className="px-6 py-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Test Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Mathematics Mock Test 2025"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Test Code
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => handleInputChange('code', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                    placeholder="Auto-generated"
                    readOnly
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe the purpose and scope of this test configuration..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Test Type
                  </label>
                  <select
                    value={formData.testType}
                    onChange={(e) => handleInputChange('testType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="full_length_mock">Full-Length Mock Exam</option>
                    <option value="subject_wise_mock">Subject-wise Mock Test</option>
                    <option value="difficulty_tiered">Difficulty-tiered Challenge</option>
                    <option value="time_speed_drill">Time Speed Drill</option>
                    <option value="weekly_progress">Weekly Progress Mock</option>
                    <option value="adaptive_mcq">Adaptive MCQ Test</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Test Category
                  </label>
                  <select
                    value={formData.testCategory}
                    onChange={(e) => handleInputChange('testCategory', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="general">General Assessment</option>
                    <option value="entrance">Entrance Examination</option>
                    <option value="competitive">Competitive Examination</option>
                    <option value="academic">Academic Assessment</option>
                    <option value="certification">Certification Test</option>
                    <option value="skills">Skills Assessment</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Test Parameters */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Settings className="h-5 w-5 mr-2 text-blue-600" />
                Test Parameters
              </h3>
            </div>
            <div className="px-6 py-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="h-4 w-4 inline mr-1" />
                    Duration (minutes) *
                  </label>
                  <input
                    type="number"
                    value={formData.durationMinutes}
                    onChange={(e) => handleInputChange('durationMinutes', e.target.value === '' ? '' : parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">120 min = 2 hours (standard)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Target className="h-4 w-4 inline mr-1" />
                    Total Questions *
                  </label>
                  <input
                    type="number"
                    value={formData.totalQuestions}
                    onChange={(e) => handleInputChange('totalQuestions', e.target.value === '' ? '' : parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Questions Per Page
                  </label>
                  <input
                    type="number"
                    value={formData.questionsPerPage}
                    onChange={(e) => handleInputChange('questionsPerPage', e.target.value === '' ? '' : parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Passing Percentage (%)
                </label>
                <input
                  type="number"
                  value={formData.passingPercentage}
                  onChange={(e) => handleInputChange('passingPercentage', e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full md:w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  max="100"
                  step="0.01"
                />
              </div>
            </div>
          </div>

          {/* Marking Scheme */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                Marking Scheme
              </h3>
            </div>
            <div className="px-6 py-6 space-y-6">
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.enableNegativeMarking}
                    onChange={(e) => handleInputChange('enableNegativeMarking', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">Enable Negative Marking</span>
                </label>
                {formData.enableNegativeMarking && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Ratio:</span>
                    <input
                      type="number"
                      value={formData.negativeMarkingRatio}
                      onChange={(e) => handleInputChange('negativeMarkingRatio', e.target.value === '' ? '' : parseFloat(e.target.value))}
                      className="w-20 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      max="1"
                      step="0.01"
                    />
                    <span className="text-sm text-gray-500">(0.25 = -0.25 marks per wrong answer)</span>
                  </div>
                )}
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.partialMarkingEnabled}
                    onChange={(e) => handleInputChange('partialMarkingEnabled', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">Enable Partial Marking</span>
                </label>
              </div>
            </div>
          </div>

          {/* Cognitive Distribution */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Target className="h-5 w-5 mr-2 text-blue-600" />
                Cognitive Level Distribution
                <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                  cognitiveTotal === 100 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  Total: {cognitiveTotal}%
                </span>
              </h3>
              <p className="text-sm text-gray-600">Standard: Recall 30%, Understanding 50%, Application 20%</p>
            </div>
            <div className="px-6 py-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recall (%)
                  </label>
                  <input
                    type="number"
                    value={formData.cognitiveDistribution.recall}
                    onChange={(e) => handleNestedInputChange('cognitiveDistribution', 'recall', e.target.value === '' ? '' : parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    max="100"
                  />
                  <p className="text-xs text-gray-500 mt-1">Memory and factual recall</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Understanding (%)
                  </label>
                  <input
                    type="number"
                    value={formData.cognitiveDistribution.understanding}
                    onChange={(e) => handleNestedInputChange('cognitiveDistribution', 'understanding', e.target.value === '' ? '' : parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    max="100"
                  />
                  <p className="text-xs text-gray-500 mt-1">Comprehension and explanation</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Application (%)
                  </label>
                  <input
                    type="number"
                    value={formData.cognitiveDistribution.application}
                    onChange={(e) => handleNestedInputChange('cognitiveDistribution', 'application', e.target.value === '' ? '' : parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    max="100"
                  />
                  <p className="text-xs text-gray-500 mt-1">Problem solving and analysis</p>
                </div>
              </div>
            </div>
          </div>

          {/* Domain Distribution */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                Subject Distribution
                <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                  totalQuestions === formData.totalQuestions ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  Total: {totalQuestions}/{formData.totalQuestions}
                </span>
              </h3>
              <p className="text-sm text-gray-600">Add subjects as per requirement and set question count for each</p>
            </div>
            <div className="px-6 py-6 space-y-6">
              {/* Add Subject Button */}
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-700">Selected Subjects</h4>
                <div className="flex items-center space-x-2">
                  <select
                    className="px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value=""
                    onChange={(e) => {
                      if (e.target.value) {
                        addSubject(e.target.value);
                        e.target.value = '';
                      }
                    }}
                  >
                    <option value="">Select Subject to Add</option>
                    {availableSubjects
                      .filter(domain => !formData.domainDistribution[domain.code])
                      .map(domain => (
                        <option key={domain.id} value={domain.code}>
                          {domain.name}
                        </option>
                      ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      const select = document.querySelector('select[value=""]');
                      if (select && select.value) {
                        addSubject(select.value);
                        select.value = '';
                      }
                    }}
                    className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center text-sm"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Subject
                  </button>
                </div>
              </div>

              {/* Selected Subjects Grid */}
              {Object.keys(formData.domainDistribution).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(formData.domainDistribution).map(([domainCode, count]) => {
                    const domain = domains.find(d => d.code === domainCode);
                    return (
                      <div key={domainCode} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-gray-700">
                            {domain?.name || domainCode}
                          </label>
                          <button
                            type="button"
                            onClick={() => removeSubject(domainCode)}
                            className="text-red-600 hover:text-red-800 p-1"
                            title="Remove Subject"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                        </div>
                        <input
                          type="number"
                          value={count}
                          onChange={(e) => handleDomainDistributionChange(domainCode, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          min="0"
                          placeholder="Number of questions"
                        />
                        <p className="text-xs text-gray-500 mt-1">Questions from {domain?.name || domainCode}</p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No subjects added</h3>
                  <p className="mt-1 text-sm text-gray-500">Add subjects to start configuring the test distribution</p>
                </div>
              )}
            </div>
          </div>

          {/* Subdomain Distribution */}
          {Object.keys(formData.domainDistribution).length > 0 && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Target className="h-5 w-5 mr-2 text-blue-600" />
                  Detailed Subdomain Distribution
                </h3>
                <p className="text-sm text-gray-600">Fine-tune question count for each subtopic within selected subjects</p>
              </div>
              <div className="px-6 py-6">
                {Object.keys(formData.domainDistribution).map(domainCode => {
                  const domain = domains.find(d => d.code === domainCode);
                  if (!domain) return null;

                  const domainSubdomains = subdomains.filter(s => s.domain_id === domain.id);
                  if (domainSubdomains.length === 0) {
                    return (
                      <div key={domain.id} className="mb-8">
                        <h4 className="text-md font-medium text-gray-800 mb-4 flex items-center">
                          <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: domain.color_code }}></span>
                          {domain.name} ({formData.domainDistribution[domain.code] || 0} questions)
                        </h4>
                        <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-lg">
                          <p className="text-sm text-gray-500">No subdomains available for {domain.name}</p>
                        </div>
                      </div>
                    );
                  }
                  
                  return (
                    <div key={domain.id} className="mb-8">
                      <h4 className="text-md font-medium text-gray-800 mb-4 flex items-center">
                        <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: domain.color_code }}></span>
                        {domain.name} ({formData.domainDistribution[domain.code] || 0} questions)
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ml-4">
                        {domainSubdomains.map(subdomain => (
                          <div key={subdomain.id} className="border border-gray-200 rounded-lg p-3 bg-white">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {subdomain.name}
                            </label>
                            <input
                              type="number"
                              value={formData.subdomainDistribution[subdomain.code] || 0}
                              onChange={(e) => handleSubdomainDistributionChange(subdomain.code, e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                              min="0"
                              placeholder="Questions"
                            />
                            <p className="text-xs text-gray-500 mt-1">Weight: {subdomain.weight || 1}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Smart Algorithm Settings */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Settings className="h-5 w-5 mr-2 text-blue-600" />
                Smart Algorithm Settings
              </h3>
            </div>
            <div className="px-6 py-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Importance Weight Factor
                  </label>
                  <input
                    type="number"
                    value={formData.importanceWeightFactor}
                    onChange={(e) => handleInputChange('importanceWeightFactor', e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0.1"
                    step="0.1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Multiplier for questions marked as "High Importance"</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum High Importance Questions
                  </label>
                  <input
                    type="number"
                    value={formData.minHighImportanceQuestions}
                    onChange={(e) => handleInputChange('minHighImportanceQuestions', e.target.value === '' ? '' : parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1"
                    max="3"
                  />
                  <p className="text-xs text-gray-500 mt-1">Minimum number of high importance questions</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum High Importance Questions
                  </label>
                  <input
                    type="number"
                    value={formData.maxHighImportanceQuestions}
                    onChange={(e) => handleInputChange('maxHighImportanceQuestions', e.target.value === '' ? '' : parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1"
                    max="3"
                  />
                  <p className="text-xs text-gray-500 mt-1">Maximum number of high importance questions</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recency Weight Factor
                  </label>
                  <input
                    type="number"
                    value={formData.recencyWeightFactor}
                    onChange={(e) => handleInputChange('recencyWeightFactor', e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0.1"
                    step="0.1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Factor to reduce selection of recently used questions</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Avoid Recent Questions (Days)
                  </label>
                  <input
                    type="number"
                    value={formData.avoidRecentDays}
                    onChange={(e) => handleInputChange('avoidRecentDays', e.target.value === '' ? '' : parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Don't select questions used in last N days</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty Distribution
                </label>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {Object.entries(formData.difficultyDistribution).map(([level, count]) => (
                    <div key={level} className="flex items-center">
                      <input
                        type="number"
                        value={count}
                        onChange={(e) => handleNestedInputChange('difficultyDistribution', level, e.target.value === '' ? '' : parseInt(e.target.value))}
                        className="w-16 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        min="0"
                      />
                      <span className="ml-2 text-sm text-gray-700">{level.replace('_', ' ')}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">Total questions: {Object.values(formData.difficultyDistribution).reduce((sum, val) => sum + val, 0)}</p>
              </div>
            </div>
          </div>

          {/* Adaptive & Special Settings */}
          {(formData.testType === 'adaptive_mcq' || formData.testType === 'time_speed_drill') && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Settings className="h-5 w-5 mr-2 text-purple-600" />
                  {formData.testType === 'adaptive_mcq' ? 'Adaptive Test Settings' : 'Time Speed Drill Settings'}
                </h3>
              </div>
              <div className="px-6 py-6 space-y-6">
                {formData.testType === 'adaptive_mcq' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Starting Difficulty Level (1-5)
                        </label>
                        <input
                          type="number"
                          value={formData.adaptiveStartLevel}
                          onChange={(e) => handleInputChange('adaptiveStartLevel', e.target.value === '' ? '' : parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          min="1"
                          max="5"
                        />
                        <p className="text-xs text-gray-500 mt-1">Start at easy-medium (level 2 recommended)</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Difficulty Step Size
                        </label>
                        <input
                          type="number"
                          value={formData.adaptiveDifficultyStep}
                          onChange={(e) => handleInputChange('adaptiveDifficultyStep', e.target.value === '' ? '' : parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          min="1"
                          max="2"
                        />
                        <p className="text-xs text-gray-500 mt-1">How much to increase/decrease difficulty</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Correct Answers to Increase Difficulty
                        </label>
                        <input
                          type="number"
                          value={formData.adaptiveCorrectThreshold}
                          onChange={(e) => handleInputChange('adaptiveCorrectThreshold', e.target.value === '' ? '' : parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          min="1"
                          max="5"
                        />
                        <p className="text-xs text-gray-500 mt-1">Number of correct answers to level up</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Wrong Answers to Decrease Difficulty
                        </label>
                        <input
                          type="number"
                          value={formData.adaptiveWrongThreshold}
                          onChange={(e) => handleInputChange('adaptiveWrongThreshold', e.target.value === '' ? '' : parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          min="1"
                          max="5"
                        />
                        <p className="text-xs text-gray-500 mt-1">Number of wrong answers to level down</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Minimum Difficulty Level
                        </label>
                        <input
                          type="number"
                          value={formData.adaptiveMinLevel}
                          onChange={(e) => handleInputChange('adaptiveMinLevel', e.target.value === '' ? '' : parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          min="1"
                          max="5"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Maximum Difficulty Level
                        </label>
                        <input
                          type="number"
                          value={formData.adaptiveMaxLevel}
                          onChange={(e) => handleInputChange('adaptiveMaxLevel', e.target.value === '' ? '' : parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          min="1"
                          max="5"
                        />
                      </div>
                    </div>
                  </>
                )}

                {formData.testType === 'time_speed_drill' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Time Per Question (seconds)
                        </label>
                        <input
                          type="number"
                          value={formData.timePerQuestion}
                          onChange={(e) => handleInputChange('timePerQuestion', e.target.value === '' ? '' : parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          min="10"
                          max="300"
                        />
                        <p className="text-xs text-gray-500 mt-1">Speed drill - shorter time for quick thinking</p>
                      </div>
                      <div>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.showQuestionTimer}
                            onChange={(e) => handleInputChange('showQuestionTimer', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">Show Individual Question Timer</span>
                        </label>
                        <p className="text-xs text-gray-500 ml-6">Display countdown for each question</p>
                      </div>
                    </div>
                    
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.instantFeedback}
                          onChange={(e) => handleInputChange('instantFeedback', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Instant Feedback</span>
                      </label>
                      <p className="text-xs text-gray-500 ml-6">Show correct answer immediately after each question</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Pricing & Access */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-blue-600" />
                Pricing & Access
              </h3>
            </div>
            <div className="px-6 py-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Is Free Test?
                  </label>
                  <select
                    value={formData.isFree ? 'true' : 'false'}
                    onChange={(e) => handleInputChange('isFree', e.target.value === 'true')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
                {/* Access Type Display - No longer showing price/currency inputs */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Access Type
                  </label>
                  <div className="mt-2">
                    {formData.isFree ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        Free Access
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        Pro Access Required
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.isFree 
                      ? 'This test will be available to all users' 
                      : 'This test requires a pro subscription'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Access Code (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.accessCode}
                    onChange={(e) => handleInputChange('accessCode', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., MBBS2025"
                  />
                  <p className="text-xs text-gray-500 mt-1">Students need this to access the test</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Attempts Per User
                  </label>
                  <input
                    type="number"
                    value={formData.maxAttemptsPerUser}
                    onChange={(e) => handleInputChange('maxAttemptsPerUser', e.target.value === '' ? '' : parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">0 = No retries allowed, 1 = One attempt only, 2+ = Multiple attempts</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Retry After Days
                  </label>
                  <input
                    type="number"
                    value={formData.retryAfterDays}
                    onChange={(e) => handleInputChange('retryAfterDays', e.target.value === '' ? '' : parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">How many days after failure to retry</p>
                </div>
              </div>
            </div>
          </div>

          {/* Test Behavior */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Settings className="h-5 w-5 mr-2 text-blue-600" />
                Test Behavior Settings
              </h3>
            </div>
            <div className="px-6 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-800">Navigation</h4>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.allowQuestionNavigation}
                      onChange={(e) => handleInputChange('allowQuestionNavigation', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Allow question navigation</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.allowQuestionReview}
                      onChange={(e) => handleInputChange('allowQuestionReview', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Allow question review</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.allowAnswerChange}
                      onChange={(e) => handleInputChange('allowAnswerChange', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Allow answer changes</span>
                  </label>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-800">Randomization</h4>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={false}
                      disabled
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">Shuffle questions (always off)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.shuffleOptions}
                      onChange={(e) => handleInputChange('shuffleOptions', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">Shuffle options</span>
                  </label>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-800">Tools & Display</h4>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.showTimer}
                      onChange={(e) => handleInputChange('showTimer', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Show timer</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.showCalculator}
                      onChange={(e) => handleInputChange('showCalculator', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Show calculator</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.autoSubmit}
                      onChange={(e) => handleInputChange('autoSubmit', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Auto-submit when time ends</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Info className="h-5 w-5 mr-2 text-blue-600" />
                Instructions & Rules
              </h3>
            </div>
            <div className="px-6 py-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Instructions
                </label>
                <textarea
                  value={formData.instructions}
                  onChange={(e) => handleInputChange('instructions', e.target.value)}
                  rows="8"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter detailed instructions for students..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rules and Regulations
                </label>
                <textarea
                  value={formData.rulesAndRegulations}
                  onChange={(e) => handleInputChange('rulesAndRegulations', e.target.value)}
                  rows="6"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter rules and regulations..."
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.push('/admin/test-configurations')}
              className="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !validateCognitiveDistribution() || !validateDomainDistribution()}
              className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {configId ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {configId ? 'Update Test Configuration' : 'Create Test Configuration'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      <ToastContainer />
    </div>
  );
} 