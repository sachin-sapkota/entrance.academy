import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAuthenticatedUser, isAdmin } from '@/lib/auth-helpers';
import { createClient } from '@supabase/supabase-js';

// Create admin client for bypassing RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// POST - Publish practice set from draft
export async function POST(request) {
  try {
    const body = await request.json();
    const { sessionId, isLive = true } = body;

    if (!sessionId) {
      return NextResponse.json(
        { success: false, message: 'Session ID is required' },
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

    if (!isAdmin(user)) {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get practice set by sessionId in code field using admin client
    const { data: practiceSet, error: findError } = await supabaseAdmin
      .from('practice_sets')
      .select('*')
      .eq('code', `session_${sessionId}`)
      .single();

    if (findError || !practiceSet) {
      console.error('Practice set fetch error:', findError);
      return NextResponse.json(
        { success: false, message: 'Session expired or not found: ' + (findError?.message || 'No practice set found') },
        { status: 404 }
      );
    }

    // Check if user has permission to publish this practice set
    if (practiceSet.created_by !== user.id && !isAdmin(user)) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    // Check if this is a scheduled test
    const metaData = practiceSet.meta_data || {};
    const isScheduled = metaData.isScheduled === true;

    if (isScheduled && isLive) {
      // Check if this was originally a test configuration being edited
      const originalTestConfigId = metaData.originalTestConfigId;
      
      console.log('Converting scheduled practice set to test configuration...');
      
      // Validate scheduling fields
      if (!metaData.scheduledDate || !metaData.scheduledTime) {
        return NextResponse.json(
          { success: false, message: 'Scheduled date and time are required for scheduled tests' },
          { status: 400 }
        );
      }

      // Create combined datetime strings
      const available_from = `${metaData.scheduledDate}T${metaData.scheduledTime}:00.000Z`;
      const available_until = metaData.availableUntil ? 
        `${metaData.availableUntil}T23:59:59.000Z` : 
        new Date(new Date(available_from).getTime() + (metaData.duration || 120) * 60000).toISOString();
      const registration_deadline = metaData.registrationDeadline ? 
        `${metaData.registrationDeadline}T23:59:59.000Z` : 
        new Date(new Date(available_from).getTime() - 24 * 60 * 60 * 1000).toISOString();

      const testConfigData = {
        name: practiceSet.title,
        description: practiceSet.description || '',
        test_type: 'scheduled',
        test_category: 'practice',
        duration_minutes: metaData.duration || practiceSet.estimated_time_minutes || 120,
        total_questions: metaData.totalQuestions || practiceSet.questions_count || 50,
        passing_percentage: practiceSet.passing_percentage || 40,
        enable_negative_marking: metaData.enableNegativeMarking !== undefined ? metaData.enableNegativeMarking : true,
        negative_marking_ratio: metaData.negativeMarkingRatio || 0.25,
        instructions: metaData.instructions || '',
        is_free: practiceSet.is_free !== undefined ? practiceSet.is_free : true,
        price: practiceSet.is_free ? 0 : practiceSet.price || 0,
        is_public: true,
        is_active: true,
        available_from: available_from,
        available_until: available_until,
        registration_deadline: registration_deadline,
        domain_distribution: practiceSet.domains ? practiceSet.domains.reduce((acc, domain) => {
          acc[domain] = Math.ceil((metaData.totalQuestions || 50) / practiceSet.domains.length);
          return acc;
        }, {}) : {},
        updated_at: new Date().toISOString(),
        meta_data: {
          original_practice_set_id: practiceSet.id,
          original_test_type: metaData.testType,
          scheduling_status: 'scheduled',
          created_from_practice_set: true,
          questions: practiceSet.questions || [],
          question_ids: practiceSet.questions ? practiceSet.questions.map(q => q.id).filter(Boolean) : []
        }
      };

      let testConfig;
      let testError;

      if (originalTestConfigId) {
        // Update existing test configuration
        console.log('Updating existing test configuration:', originalTestConfigId);
        const { data: updatedConfig, error: updateError } = await supabaseAdmin
          .from('test_configurations')
          .update(testConfigData)
          .eq('id', originalTestConfigId)
          .select()
          .single();
        
        testConfig = updatedConfig;
        testError = updateError;
      } else {
        // Create new test configuration
        testConfigData.created_by = user.id;
        const { data: newConfig, error: insertError } = await supabaseAdmin
          .from('test_configurations')
          .insert([testConfigData])
          .select()
          .single();
        
        testConfig = newConfig;
        testError = insertError;
      }

      if (testError) {
        console.error('Test configuration error:', testError);
        return NextResponse.json(
          { success: false, message: `Failed to ${originalTestConfigId ? 'update' : 'create'} scheduled test: ` + testError.message },
          { status: 500 }
        );
      }

      // Delete the temporary practice set since it's been converted
      const { error: deleteError } = await supabaseAdmin
        .from('practice_sets')
        .delete()
        .eq('id', practiceSet.id);

      if (deleteError) {
        console.warn('Failed to delete temporary practice set:', deleteError);
        // Don't fail the whole operation for this
      }

      return NextResponse.json({
        success: true,
        testConfiguration: testConfig,
        message: `Scheduled test ${originalTestConfigId ? 'updated' : 'created'} successfully and will be available at the specified time`
      });
    }

    // For regular practice sets (non-scheduled)
    const updateData = {
      status: isLive ? 'published' : 'draft',
      is_live: isLive,
      code: null, // Clear session code
      updated_at: new Date().toISOString()
    };

    if (isLive) {
      updateData.published_at = new Date().toISOString();
      updateData.published_by = user.id;
    }

    const { data: updatedPracticeSet, error: updateError } = await supabaseAdmin
      .from('practice_sets')
      .update(updateData)
      .eq('id', practiceSet.id)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { success: false, message: 'Failed to update practice set: ' + updateError.message },
        { status: 500 }
      );
    }

    // Format response
    const formattedSet = {
      id: updatedPracticeSet.id,
      title: updatedPracticeSet.title,
      description: updatedPracticeSet.description,
      domains: updatedPracticeSet.domains || [],
      questionsCount: updatedPracticeSet.questions_count || 0,
      isLive: updatedPracticeSet.is_live,
      createdAt: updatedPracticeSet.created_at,
      updatedAt: updatedPracticeSet.updated_at,
      publishedAt: updatedPracticeSet.published_at,
      questions: updatedPracticeSet.questions || []
    };

    return NextResponse.json({
      success: true,
      practiceSet: formattedSet,
      message: `Practice set ${isLive ? 'published' : 'saved as draft'} successfully`
    });
  } catch (error) {
    console.error('Error publishing practice set:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to publish practice set' },
      { status: 500 }
    );
  }
} 