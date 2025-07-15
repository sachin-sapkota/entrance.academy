import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedUser, requireAdmin } from '@/lib/auth-helpers';

// Create service role client for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// GET - Fetch all test configurations or a single one by ID
export async function GET(request) {
  try {
    // Get authenticated user
    const { user, error: authError } = await getAuthenticatedUser(request);
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    try {
      requireAdmin(user);
    } catch (adminError) {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      );
    }

    // Check if we're fetching a single configuration by ID
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      // Fetch single configuration by ID
      const { data, error } = await supabaseAdmin
        .from('test_configurations')
        .select(`
          *,
          creator:created_by(full_name, email)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching test configuration by ID:', error);
        return NextResponse.json(
          { success: false, message: 'Test configuration not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: data
      });
    } else {
      // Fetch all configurations
      const { data, error } = await supabaseAdmin
        .from('test_configurations')
        .select(`
          *,
          creator:created_by(full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching test configurations:', error);
        return NextResponse.json(
          { success: false, message: 'Failed to fetch test configurations' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: data || []
      });
    }

  } catch (error) {
    console.error('Test configurations GET error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new test configuration
export async function POST(request) {
  try {
    const body = await request.json();

    // Get authenticated user
    const { user, error: authError } = await getAuthenticatedUser(request);
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    try {
      requireAdmin(user);
    } catch (adminError) {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      );
    }

    // Validate required fields
    if (!body.name || !body.durationMinutes || !body.totalQuestions) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: name, durationMinutes, totalQuestions' },
        { status: 400 }
      );
    }

    // Validate cognitive distribution totals 100%
    const cognitiveTotal = Object.values(body.cognitiveDistribution || {}).reduce((sum, val) => sum + val, 0);
    if (cognitiveTotal !== 100) {
      return NextResponse.json(
        { success: false, message: 'Cognitive distribution must total 100%' },
        { status: 400 }
      );
    }

    // Validate domain distribution totals match totalQuestions
    const domainTotal = Object.values(body.domainDistribution || {}).reduce((sum, val) => sum + val, 0);
    if (domainTotal !== body.totalQuestions) {
      return NextResponse.json(
        { success: false, message: `Domain distribution must total ${body.totalQuestions} questions` },
        { status: 400 }
      );
    }

    // Prepare configuration data
    const configData = {
      name: body.name,
      code: body.code,
      description: body.description,
      test_type: body.testType || 'mock',
      test_category: body.testCategory || 'entrance',
      
      // Duration and Questions
      duration_minutes: body.durationMinutes,
      total_questions: body.totalQuestions,
      questions_per_page: body.questionsPerPage || 20,
      passing_percentage: body.passingPercentage || 40.00,
      
      // Domain and Category Distribution
      domain_distribution: body.domainDistribution || {},
      category_distribution: body.subdomainDistribution || {},
      cognitive_distribution: body.cognitiveDistribution || {},
      difficulty_distribution: body.difficultyDistribution || {
        "very_easy": 5,
        "easy": 25,
        "medium": 40,
        "hard": 25,
        "very_hard": 5
      },
      
      // Marking Scheme
      enable_negative_marking: body.enableNegativeMarking || false,
      negative_marking_ratio: body.negativeMarkingRatio || 0.25,
      partial_marking_enabled: body.partialMarkingEnabled || false,
      
      // Test Behavior
      shuffle_questions: body.shuffleQuestions !== false,
      shuffle_options: body.shuffleOptions !== false,
      allow_question_navigation: body.allowQuestionNavigation !== false,
      allow_question_review: body.allowQuestionReview !== false,
      allow_answer_change: body.allowAnswerChange !== false,
      show_calculator: body.showCalculator || false,
      show_timer: body.showTimer !== false,
      auto_submit: body.autoSubmit !== false,
      pause_allowed: body.pauseAllowed || false,
      
      // Result Display
      show_result_immediately: body.showResultImmediately !== false,
      show_score_immediately: body.showScoreImmediately !== false,
      show_correct_answers: body.showCorrectAnswers !== false,
      show_explanations: body.showExplanations !== false,
      show_detailed_analytics: body.showDetailedAnalytics !== false,
      result_validity_days: body.resultValidityDays || 365,
      
      // Security Settings
      browser_lock_enabled: body.browserLockEnabled || false,
      prevent_copy_paste: body.preventCopyPaste !== false,
      prevent_right_click: body.preventRightClick !== false,
      fullscreen_required: body.fullscreenRequired || false,
      webcam_monitoring: body.webcamMonitoring || false,
      screen_recording: body.screenRecording || false,
      
      // Access Control
      is_public: body.isPublic || false,
      requires_approval: body.requiresApproval || false,
      access_code: body.accessCode || null,
      max_attempts_per_user: body.maxAttemptsPerUser !== undefined ? body.maxAttemptsPerUser : 1,
      retry_after_days: body.retryAfterDays !== undefined ? body.retryAfterDays : 0,
      
      // Scheduling
      available_from: body.availableFrom || null,
      available_until: body.availableUntil || null,
      registration_deadline: body.registrationDeadline || null,
      
      // Pricing
      is_free: body.isFree !== false,
      price: body.price || 0,
      currency: body.currency || 'NPR',
      
      // Instructions
      instructions: body.instructions || '',
      rules_and_regulations: body.rulesAndRegulations || '',
      
      // Metadata
      created_by: user.id,
      is_active: true
    };

    const { data, error } = await supabaseAdmin
      .from('test_configurations')
      .insert([configData])
      .select(`
        *,
        creator:created_by(full_name, email)
      `)
      .single();

    if (error) {
      console.error('Error creating test configuration:', error);
      return NextResponse.json(
        { success: false, message: `Failed to create test configuration: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: 'Test configuration created successfully'
    });

  } catch (error) {
    console.error('Test configuration creation error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update test configuration
export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Configuration ID is required' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const { user, error: authError } = await getAuthenticatedUser(request);
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    try {
      requireAdmin(user);
    } catch (adminError) {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      );
    }

    // Validate cognitive distribution if provided
    if (updateData.cognitiveDistribution) {
      const cognitiveTotal = Object.values(updateData.cognitiveDistribution).reduce((sum, val) => sum + val, 0);
      if (cognitiveTotal !== 100) {
        return NextResponse.json(
          { success: false, message: 'Cognitive distribution must total 100%' },
          { status: 400 }
        );
      }
    }

    // Validate domain distribution if provided
    if (updateData.domainDistribution && updateData.totalQuestions) {
      const domainTotal = Object.values(updateData.domainDistribution).reduce((sum, val) => sum + val, 0);
      if (domainTotal !== updateData.totalQuestions) {
        return NextResponse.json(
          { success: false, message: `Domain distribution must total ${updateData.totalQuestions} questions` },
          { status: 400 }
        );
      }
    }

    // Prepare update data with snake_case field names
    const configUpdateData = {
      name: updateData.name,
      code: updateData.code,
      description: updateData.description,
      test_type: updateData.testType,
      test_category: updateData.testCategory,
      duration_minutes: updateData.durationMinutes,
      total_questions: updateData.totalQuestions,
      questions_per_page: updateData.questionsPerPage,
      passing_percentage: updateData.passingPercentage,
      domain_distribution: updateData.domainDistribution,
      category_distribution: updateData.subdomainDistribution,
      cognitive_distribution: updateData.cognitiveDistribution,
      enable_negative_marking: updateData.enableNegativeMarking,
      negative_marking_ratio: updateData.negativeMarkingRatio,
      partial_marking_enabled: updateData.partialMarkingEnabled,
      shuffle_questions: updateData.shuffleQuestions,
      shuffle_options: updateData.shuffleOptions,
      allow_question_navigation: updateData.allowQuestionNavigation,
      allow_question_review: updateData.allowQuestionReview,
      allow_answer_change: updateData.allowAnswerChange,
      show_calculator: updateData.showCalculator,
      show_timer: updateData.showTimer,
      auto_submit: updateData.autoSubmit,
      pause_allowed: updateData.pauseAllowed,
      show_result_immediately: updateData.showResultImmediately,
      show_score_immediately: updateData.showScoreImmediately,
      show_correct_answers: updateData.showCorrectAnswers,
      show_explanations: updateData.showExplanations,
      show_detailed_analytics: updateData.showDetailedAnalytics,
      result_validity_days: updateData.resultValidityDays,
      browser_lock_enabled: updateData.browserLockEnabled,
      prevent_copy_paste: updateData.preventCopyPaste,
      prevent_right_click: updateData.preventRightClick,
      fullscreen_required: updateData.fullscreenRequired,
      webcam_monitoring: updateData.webcamMonitoring,
      screen_recording: updateData.screenRecording,
      is_public: updateData.isPublic,
      requires_approval: updateData.requiresApproval,
      access_code: updateData.accessCode,
      max_attempts_per_user: updateData.maxAttemptsPerUser,
      retry_after_days: updateData.retryAfterDays,
      available_from: updateData.availableFrom,
      available_until: updateData.availableUntil,
      registration_deadline: updateData.registrationDeadline,
      is_free: updateData.isFree,
      price: updateData.price,
      currency: updateData.currency,
      instructions: updateData.instructions,
      rules_and_regulations: updateData.rulesAndRegulations,
      is_active: updateData.isActive,
      updated_at: new Date().toISOString()
    };

    // Remove undefined values and handle empty strings for timestamp fields
    Object.keys(configUpdateData).forEach(key => {
      if (configUpdateData[key] === undefined) {
        delete configUpdateData[key];
      }
      // Convert empty strings to null for timestamp fields
      if (['available_from', 'available_until', 'registration_deadline'].includes(key) && configUpdateData[key] === '') {
        configUpdateData[key] = null;
      }
    });

    const { data, error } = await supabaseAdmin
      .from('test_configurations')
      .update(configUpdateData)
      .eq('id', id)
      .select(`
        *,
        creator:created_by(full_name, email)
      `)
      .single();

    if (error) {
      console.error('Error updating test configuration:', error);
      return NextResponse.json(
        { success: false, message: `Failed to update test configuration: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: 'Test configuration updated successfully'
    });

  } catch (error) {
    console.error('Test configuration update error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete test configuration
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Configuration ID is required' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const { user, error: authError } = await getAuthenticatedUser(request);
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    try {
      requireAdmin(user);
    } catch (adminError) {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      );
    }

    // Check if configuration exists and is not being used
    const { data: existingConfig, error: fetchError } = await supabaseAdmin
      .from('test_configurations')
      .select('id, name')
      .eq('id', id)
      .single();

    if (fetchError || !existingConfig) {
      return NextResponse.json(
        { success: false, message: 'Test configuration not found' },
        { status: 404 }
      );
    }

    // Check if configuration is being used in any tests
    const { data: testsUsingConfig, error: testsError } = await supabaseAdmin
      .from('tests')
      .select('id')
      .eq('test_config_id', id)
      .limit(1);

    if (testsError) {
      console.error('Error checking tests usage:', testsError);
      return NextResponse.json(
        { success: false, message: 'Failed to check configuration usage' },
        { status: 500 }
      );
    }

    if (testsUsingConfig && testsUsingConfig.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Cannot delete configuration that is being used in tests. Please deactivate instead.' },
        { status: 400 }
      );
    }

    // Delete the configuration
    const { error: deleteError } = await supabaseAdmin
      .from('test_configurations')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting test configuration:', deleteError);
      return NextResponse.json(
        { success: false, message: `Failed to delete test configuration: ${deleteError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Test configuration deleted successfully'
    });

  } catch (error) {
    console.error('Test configuration deletion error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 