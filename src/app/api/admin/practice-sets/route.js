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

// GET - Fetch all practice sets
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

    if (!isAdmin(user)) {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      );
    }

    // Fetch all practice sets first, then filter in JavaScript
    const { data: allPracticeSets, error } = await supabaseAdmin
      .from('practice_sets')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch practice sets' },
        { status: 500 }
      );
    }

    // Filter out temporary session drafts
    const practiceSets = allPracticeSets.filter(set => 
      !set.code || !set.code.startsWith('session_')
    );

    // Format the data to match frontend expectations
    const formattedSets = practiceSets.map(set => {
      const metaData = set.meta_data || {};
      return {
        id: set.id,
        title: set.title,
        description: set.description,
        domains: set.domains || [],
        questionsCount: set.questions_count || 0,
        isLive: set.is_live,
        status: set.status || (set.is_live ? 'published' : 'draft'),
        createdAt: set.created_at,
        updatedAt: set.updated_at,
        publishedAt: set.published_at,
        questions: set.questions || [],
        // Enhanced fields
        testType: metaData.testType || 'practice',
        duration: set.estimated_time_minutes || 120,
        difficulty: set.difficulty_level || 'medium',
        passingPercentage: set.passing_percentage || 40,
        instructions: metaData.instructions || '',
        isFree: set.is_free !== undefined ? set.is_free : true,
        price: set.price || 0,
        // Negative marking fields
        enableNegativeMarking: metaData.enableNegativeMarking !== undefined ? metaData.enableNegativeMarking : true,
        negativeMarkingRatio: metaData.negativeMarkingRatio || 0.25
      };
    });

    return NextResponse.json({
      success: true,
      practiceSets: formattedSets
    });
  } catch (error) {
    console.error('Error fetching practice sets:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch practice sets' },
      { status: 500 }
    );
  }
}

// POST - Create new practice set
export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      title, 
      description, 
      domains, 
      questions, 
      isLive = false, 
      sessionId,
      // Enhanced fields
      testType = 'practice',
      duration = 120,
      totalQuestions = 50,
      difficulty = 'medium',
      passingPercentage = 40,
      instructions = '',
      isFree = true,
      price = 0,
      // Negative marking fields
      enableNegativeMarking = true,
      negativeMarkingRatio = 0.25,
      // Scheduling fields
      isScheduled = false,
      available_from,
      available_until,
      registration_deadline
    } = body;

    if (!title) {
      return NextResponse.json(
        { success: false, message: 'Title is required' },
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

    const practiceSetData = {
      title,
      description: description || '',
      domains: Array.isArray(domains) ? domains : [domains],
      questions: questions || [],
      questions_count: questions ? questions.length : 0,
      is_live: isLive,
      is_draft: !isLive,
      created_by: user.id,
      // Map to existing columns
      difficulty_level: difficulty || 'medium',
      estimated_time_minutes: duration || 120,
      passing_percentage: passingPercentage || 40,
      is_free: isFree !== undefined ? isFree : true,
      price: (isFree !== false) ? 0 : (price || 0),
      // Enhanced metadata for fields not in existing columns
      meta_data: {
        testType: testType || 'practice',
        instructions: instructions || '',
        isScheduled: isScheduled || false,
        totalQuestions: totalQuestions || 50,
        // Negative marking fields
        enableNegativeMarking: enableNegativeMarking !== undefined ? enableNegativeMarking : true,
        negativeMarkingRatio: negativeMarkingRatio || 0.25,
        // Marks per question (default to 1 as mentioned in issue)
        marksPerQuestion: 1
      }
    };

    // Add scheduling fields if scheduled
    if (isScheduled && available_from) {
      practiceSetData.available_from = available_from;
      practiceSetData.available_until = available_until;
      practiceSetData.registration_deadline = registration_deadline;
    }

    // If scheduled, create as test configuration
    if (isScheduled) {
      const { data: testConfig, error: testError } = await supabaseAdmin
        .from('test_configurations')
        .insert([{
          name: title,
          description: description || '',
          test_type: 'scheduled', // Always use 'scheduled' for scheduled tests
          test_category: 'practice',
          duration_minutes: duration,
          total_questions: totalQuestions,
          passing_percentage: passingPercentage,
          enable_negative_marking: enableNegativeMarking,
          negative_marking_ratio: negativeMarkingRatio,
          instructions: instructions,
          is_free: isFree,
          price: isFree ? 0 : price,
          is_public: true,
          is_active: true, // Always true for scheduled tests so they exist in system
          available_from: available_from,
          available_until: available_until,
          registration_deadline: registration_deadline,
          domain_distribution: domains.reduce((acc, domain) => {
            acc[domain] = Math.ceil(totalQuestions / domains.length);
            return acc;
          }, {}),
          created_by: user.id,
          meta_data: {
            original_test_type: testType, // Store original test type
            scheduling_status: 'scheduled', // Track that this is scheduled, not live
            created_as_live: isLive, // Track if user intended it to be live immediately
            questions: questions || [], // Store questions for when tests are created
            question_ids: questions ? questions.map(q => q.id).filter(Boolean) : []
          }
        }])
        .select()
        .single();

      if (testError) {
        console.error('Test configuration error:', testError);
        return NextResponse.json(
          { success: false, message: 'Failed to create scheduled test' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        testConfiguration: testConfig,
        message: 'Scheduled test created successfully'
      });
    }

    const { data: newPracticeSet, error } = await supabaseAdmin
      .from('practice_sets')
      .insert([practiceSetData])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to create practice set' },
        { status: 500 }
      );
    }

    // Format response
    const newMetaData = newPracticeSet.meta_data || {};
    const formattedSet = {
      id: newPracticeSet.id,
      title: newPracticeSet.title,
      description: newPracticeSet.description,
      domains: newPracticeSet.domains || [],
      questionsCount: newPracticeSet.questions_count || 0,
      isLive: newPracticeSet.is_live,
      createdAt: newPracticeSet.created_at,
      updatedAt: newPracticeSet.updated_at,
      questions: newPracticeSet.questions || [],
      // Enhanced fields
      testType: newMetaData.testType || 'practice',
      duration: newPracticeSet.estimated_time_minutes || 120,
      difficulty: newPracticeSet.difficulty_level || 'medium',
      passingPercentage: newPracticeSet.passing_percentage || 40,
      instructions: newMetaData.instructions || '',
      isFree: newPracticeSet.is_free !== undefined ? newPracticeSet.is_free : true,
      price: newPracticeSet.price || 0,
      // Negative marking fields
      enableNegativeMarking: newMetaData.enableNegativeMarking !== undefined ? newMetaData.enableNegativeMarking : true,
      negativeMarkingRatio: newMetaData.negativeMarkingRatio || 0.25
    };

    return NextResponse.json({
      success: true,
      practiceSet: formattedSet,
      message: 'Practice set created successfully'
    });
  } catch (error) {
    console.error('Error creating practice set:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create practice set' },
      { status: 500 }
    );
  }
}

// PUT - Update practice set
export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, title, description, domains, questions, isLive } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Practice set ID is required' },
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

    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (domains !== undefined) updateData.domains = domains;
    if (questions !== undefined) {
      updateData.questions = questions;
      updateData.questions_count = questions.length;
    }
    if (isLive !== undefined) {
      updateData.is_live = isLive;
      updateData.is_draft = !isLive;
      if (isLive) {
        updateData.published_at = new Date().toISOString();
      }
    }

    const { data: updatedPracticeSet, error } = await supabaseAdmin
      .from('practice_sets')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to update practice set' },
        { status: 500 }
      );
    }

    if (!updatedPracticeSet) {
      return NextResponse.json(
        { success: false, message: 'Practice set not found' },
        { status: 404 }
      );
    }

    // Format response
    const updatedMetaData = updatedPracticeSet.meta_data || {};
    const formattedSet = {
      id: updatedPracticeSet.id,
      title: updatedPracticeSet.title,
      description: updatedPracticeSet.description,
      domains: updatedPracticeSet.domains || [],
      questionsCount: updatedPracticeSet.questions_count || 0,
      isLive: updatedPracticeSet.is_live,
      createdAt: updatedPracticeSet.created_at,
      updatedAt: updatedPracticeSet.updated_at,
      questions: updatedPracticeSet.questions || [],
      // Enhanced fields
      testType: updatedMetaData.testType || 'practice',
      duration: updatedPracticeSet.estimated_time_minutes || 120,
      difficulty: updatedPracticeSet.difficulty_level || 'medium',
      passingPercentage: updatedPracticeSet.passing_percentage || 40,
      instructions: updatedMetaData.instructions || '',
      isFree: updatedPracticeSet.is_free !== undefined ? updatedPracticeSet.is_free : true,
      price: updatedPracticeSet.price || 0,
      // Negative marking fields
      enableNegativeMarking: updatedMetaData.enableNegativeMarking !== undefined ? updatedMetaData.enableNegativeMarking : true,
      negativeMarkingRatio: updatedMetaData.negativeMarkingRatio || 0.25
    };

    return NextResponse.json({
      success: true,
      practiceSet: formattedSet,
      message: 'Practice set updated successfully'
    });
  } catch (error) {
    console.error('Error updating practice set:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update practice set' },
      { status: 500 }
    );
  }
}

// DELETE - Delete practice set
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Practice set ID is required' },
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

    const { error } = await supabaseAdmin
      .from('practice_sets')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to delete practice set' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Practice set deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting practice set:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete practice set' },
      { status: 500 }
    );
  }
}