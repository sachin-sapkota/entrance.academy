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

// GET - Get draft for session
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const practiceSetId = searchParams.get('practiceSetId');

    if (!sessionId && !practiceSetId) {
      return NextResponse.json(
        { success: false, message: 'Session ID or Practice Set ID is required' },
        { status: 400 }
      );
    }

    // Get practice set by ID (sessionId is stored in code field temporarily)
    let query = supabaseAdmin.from('practice_sets').select('*');
    
    if (sessionId) {
      query = query.eq('code', `session_${sessionId}`);
    } else {
      query = query.eq('id', practiceSetId);
    }

    console.log('GET request - Query params:', { sessionId, practiceSetId });
    console.log('GET request - Query:', sessionId ? `session_${sessionId}` : practiceSetId);

    const { data: practiceSets, error } = await query
      .order('updated_at', { ascending: false })
      .limit(1);

    console.log('GET request - Query result:', { 
      practiceSetsCount: practiceSets?.length || 0, 
      error: error?.message,
      practiceSetIds: practiceSets?.map(p => p.id) || []
    });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch draft' },
        { status: 500 }
      );
    }

    // Get the most recent practice set (first one after ordering by updated_at desc)
    const practiceSet = practiceSets && practiceSets.length > 0 ? practiceSets[0] : null;

    // Error handling is now done above

    if (!practiceSet) {
      return NextResponse.json({
        success: true,
        draft: null,
        message: 'No active draft found'
      });
    }

    // Format the draft response
    const metaData = practiceSet.meta_data || {};
    const formattedDraft = {
      id: practiceSet.id,
      practiceSetId: practiceSet.id,
      sessionId: practiceSet.code?.replace('session_', '') || sessionId,
      title: practiceSet.title,
      description: practiceSet.description,
      domains: practiceSet.domains || [],
      questions: practiceSet.questions || [],
      // Enhanced fields from existing columns and meta_data
      testType: metaData.testType || 'practice',
      duration: practiceSet.estimated_time_minutes || 120,
      totalQuestions: metaData.totalQuestions || 50,
      difficulty: practiceSet.difficulty_level || 'medium',
      passingPercentage: practiceSet.passing_percentage || 40,
      instructions: metaData.instructions || '',
      isFree: practiceSet.is_free !== undefined ? practiceSet.is_free : true,
      price: practiceSet.price || 0,
      // Negative marking fields
      enableNegativeMarking: metaData.enableNegativeMarking !== undefined ? metaData.enableNegativeMarking : true,
      negativeMarkingRatio: metaData.negativeMarkingRatio || 0.25,
      isScheduled: metaData.isScheduled || false,
      scheduledDate: metaData.scheduledDate || '',
      scheduledTime: metaData.scheduledTime || '',
      registrationDeadline: metaData.registrationDeadline || '',
      availableUntil: metaData.availableUntil || '',
      createdAt: practiceSet.created_at,
      updatedAt: practiceSet.updated_at,
      expiresAt: null, // We'll track this differently
      autoSaveCount: 0 // We'll track this differently
    };

    return NextResponse.json({
      success: true,
      draft: formattedDraft
    });
  } catch (error) {
    console.error('Error fetching draft:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch draft' },
      { status: 500 }
    );
  }
}

// POST - Start editing session or create new draft
export async function POST(request) {
  try {
    const body = await request.json();
    const { practiceSetId, title, description, domains } = body;

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

    // Generate session ID
    const sessionId = crypto.randomUUID();

    // Clean up any existing session codes for this user to prevent duplicates
    const { error: cleanupError } = await supabaseAdmin
      .from('practice_sets')
      .delete()
      .eq('created_by', user.id)
      .like('code', 'session_%')
      .eq('status', 'draft')
      .eq('questions_count', 0);

    if (cleanupError) {
      console.warn('Failed to cleanup old sessions:', cleanupError);
      // Continue anyway, not critical
    }

    // If practiceSetId is provided, start editing session
    if (practiceSetId) {
      // First try to find as practice set
      let { data: practiceSet, error: fetchError } = await supabaseAdmin
        .from('practice_sets')
        .select('*')
        .eq('id', practiceSetId)
        .single();

      let isTestConfiguration = false;

      // If not found as practice set, try as test configuration (scheduled test)
      if (fetchError || !practiceSet) {
        console.log('Not found as practice set, checking test configurations...');
        const { data: testConfig, error: testError } = await supabaseAdmin
          .from('test_configurations')
          .select('*')
          .eq('id', practiceSetId)
          .single();

        if (testError || !testConfig) {
          console.error('Practice set/test config fetch error:', fetchError, testError);
          return NextResponse.json(
            { success: false, message: 'Practice set not found' },
            { status: 404 }
          );
        }

        // Convert test configuration back to practice set format for editing
        const metaData = testConfig.meta_data || {};
        
        // Create a temporary practice set from the test configuration
        const tempPracticeSet = {
          title: testConfig.name,
          description: testConfig.description || '',
          domains: Object.keys(testConfig.domain_distribution || {}),
          questions: metaData.questions || [],
          questions_count: metaData.questions ? metaData.questions.length : 0,
          estimated_time_minutes: testConfig.duration_minutes,
          difficulty_level: 'mixed',
          passing_percentage: testConfig.passing_percentage,
          is_free: testConfig.is_free,
          price: testConfig.price,
          status: 'draft',
          is_live: false,
          code: `session_${sessionId}`,
          created_by: user.id,
          meta_data: {
            testType: metaData.original_test_type || 'scheduled',
            isScheduled: true,
            scheduledDate: testConfig.available_from ? testConfig.available_from.split('T')[0] : '',
            scheduledTime: testConfig.available_from ? testConfig.available_from.split('T')[1].slice(0,5) : '',
            registrationDeadline: testConfig.registration_deadline ? testConfig.registration_deadline.split('T')[0] : '',
            availableUntil: testConfig.available_until ? testConfig.available_until.split('T')[0] : '',
            duration: testConfig.duration_minutes,
            totalQuestions: testConfig.total_questions,
            instructions: testConfig.instructions || '',
            enableNegativeMarking: testConfig.enable_negative_marking,
            negativeMarkingRatio: testConfig.negative_marking_ratio,
            isTestConfiguration: true,
            originalTestConfigId: testConfig.id
          }
        };

        // Check if session code already exists
        const { data: existingSession, error: checkError } = await supabaseAdmin
          .from('practice_sets')
          .select('id, created_by')
          .eq('code', `session_${sessionId}`)
          .limit(1);

        if (checkError) {
          console.error('Error checking session code:', checkError);
          return NextResponse.json(
            { success: false, message: 'Failed to create session' },
            { status: 500 }
          );
        }

        if (existingSession && existingSession.length > 0) {
          console.error('Session code collision detected:', sessionId);
          
          // If the existing session belongs to the same user, we can clean it up
          if (existingSession[0].created_by === user.id) {
            console.log('Cleaning up existing session for same user');
            const { error: cleanupError } = await supabaseAdmin
              .from('practice_sets')
              .delete()
              .eq('id', existingSession[0].id);

            if (cleanupError) {
              console.error('Failed to cleanup existing session:', cleanupError);
              return NextResponse.json(
                { success: false, message: 'Session creation failed, please try again' },
                { status: 500 }
              );
            }
          } else {
            return NextResponse.json(
              { success: false, message: 'Session creation failed, please try again' },
              { status: 500 }
            );
          }
        }

        // Create practice set for editing
        const { data: newPracticeSet, error: createError } = await supabaseAdmin
          .from('practice_sets')
          .insert([tempPracticeSet])
          .select()
          .single();

        if (createError) {
          console.error('Failed to create editing practice set:', createError);
          return NextResponse.json(
            { success: false, message: 'Failed to start editing session: ' + createError.message },
            { status: 500 }
          );
        }

        practiceSet = newPracticeSet;
        isTestConfiguration = true;
      } else {
        // Check if this practice set already has a session code
        if (practiceSet.code && practiceSet.code.startsWith('session_')) {
          console.log('Practice set already has session code:', practiceSet.code);
          
          // Check if there are other practice sets with the same session code
          const { data: existingSessions, error: checkError } = await supabaseAdmin
            .from('practice_sets')
            .select('id')
            .eq('code', practiceSet.code)
            .neq('id', practiceSetId);

          if (checkError) {
            console.error('Error checking existing sessions:', checkError);
            return NextResponse.json(
              { success: false, message: 'Failed to check existing sessions' },
              { status: 500 }
            );
          }

          if (existingSessions && existingSessions.length > 0) {
            console.log('Found existing sessions with same code, cleaning up...');
            // Delete the other sessions with the same code
            const { error: cleanupError } = await supabaseAdmin
              .from('practice_sets')
              .delete()
              .in('id', existingSessions.map(s => s.id));

            if (cleanupError) {
              console.error('Failed to cleanup existing sessions:', cleanupError);
              // Continue anyway
            }
          }
        }

        // Update existing practice set with session info
        const { data: updatedPracticeSet, error: updateError } = await supabaseAdmin
          .from('practice_sets')
          .update({
            code: `session_${sessionId}`,
            updated_at: new Date().toISOString()
          })
          .eq('id', practiceSetId)
          .select()
          .single();

        if (updateError) {
          console.error('Session update error:', updateError);
          return NextResponse.json(
            { success: false, message: 'Failed to start editing session: ' + updateError.message },
            { status: 500 }
          );
        }

        practiceSet = updatedPracticeSet;
      }

      // Return formatted response
      const metaData = practiceSet.meta_data || {};
      return NextResponse.json({
        success: true,
        sessionId: sessionId,
        draft: {
          id: practiceSet.id,
          practiceSetId: practiceSet.id,
          sessionId: sessionId,
          title: practiceSet.title,
          description: practiceSet.description,
          domains: practiceSet.domains || [],
          questions: practiceSet.questions || [],
          // Enhanced fields from metadata
          testType: metaData.testType || 'practice',
          duration: practiceSet.estimated_time_minutes || metaData.duration || 120,
          totalQuestions: metaData.totalQuestions || 50,
          difficulty: practiceSet.difficulty_level || 'medium',
          passingPercentage: practiceSet.passing_percentage || 40,
          instructions: metaData.instructions || '',
          isFree: practiceSet.is_free !== undefined ? practiceSet.is_free : true,
          price: practiceSet.price || 0,
          enableNegativeMarking: metaData.enableNegativeMarking !== undefined ? metaData.enableNegativeMarking : true,
          negativeMarkingRatio: metaData.negativeMarkingRatio || 0.25,
          isScheduled: metaData.isScheduled || false,
          scheduledDate: metaData.scheduledDate || '',
          scheduledTime: metaData.scheduledTime || '',
          registrationDeadline: metaData.registrationDeadline || '',
          availableUntil: metaData.availableUntil || '',
          createdAt: practiceSet.created_at,
          updatedAt: practiceSet.updated_at,
          expiresAt: null,
          autoSaveCount: 0
        }
      });
    } else {
          // Check if session code already exists (shouldn't happen with UUID, but just in case)
    const { data: existingSession, error: checkError } = await supabaseAdmin
      .from('practice_sets')
      .select('id, created_by')
      .eq('code', `session_${sessionId}`)
      .limit(1);

    if (checkError) {
      console.error('Error checking session code:', checkError);
      return NextResponse.json(
        { success: false, message: 'Failed to create session' },
        { status: 500 }
      );
    }

    if (existingSession && existingSession.length > 0) {
      console.error('Session code collision detected:', sessionId);
      
      // If the existing session belongs to the same user, we can clean it up
      if (existingSession[0].created_by === user.id) {
        console.log('Cleaning up existing session for same user');
        const { error: cleanupError } = await supabaseAdmin
          .from('practice_sets')
          .delete()
          .eq('id', existingSession[0].id);

        if (cleanupError) {
          console.error('Failed to cleanup existing session:', cleanupError);
          return NextResponse.json(
            { success: false, message: 'Session creation failed, please try again' },
            { status: 500 }
          );
        }
      } else {
        return NextResponse.json(
          { success: false, message: 'Session creation failed, please try again' },
          { status: 500 }
        );
      }
    }

      // Create new practice set as draft using admin client to bypass RLS
      const { data: newPracticeSet, error: practiceSetError } = await supabaseAdmin
        .from('practice_sets')
        .insert([{
          title: title || 'Untitled Practice Set',
          description: description || '',
          domains: domains || [],
          questions: [],
          questions_count: 0,
          status: 'draft',
          is_live: false,
          code: `session_${sessionId}`,
          created_by: user.id
        }])
        .select()
        .single();

      if (practiceSetError) {
        console.error('Practice set error:', practiceSetError);
        return NextResponse.json(
          { success: false, message: 'Failed to create practice set: ' + practiceSetError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        sessionId: sessionId,
        practiceSetId: newPracticeSet.id,
        draft: {
          id: newPracticeSet.id,
          practiceSetId: newPracticeSet.id,
          sessionId: sessionId,
          title: newPracticeSet.title,
          description: newPracticeSet.description,
          domains: newPracticeSet.domains || [],
          questions: newPracticeSet.questions || [],
          createdAt: newPracticeSet.created_at,
          updatedAt: newPracticeSet.updated_at,
          expiresAt: null,
          autoSaveCount: 0
        }
      });
    }
  } catch (error) {
    console.error('Error in draft POST:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to process request' },
      { status: 500 }
    );
  }
}

// PUT - Save draft
export async function PUT(request) {
  try {
    const body = await request.json();
    const { 
      sessionId, 
      title, 
      description, 
      domains, 
      questions,
      // Enhanced fields
      testType,
      duration,
      totalQuestions,
      difficulty,
      passingPercentage,
      instructions,
      isFree,
      price,
      // Negative marking fields
      enableNegativeMarking,
      negativeMarkingRatio,
      isScheduled,
      scheduledDate,
      scheduledTime,
      registrationDeadline,
      availableUntil
    } = body;

    console.log('PUT request received for sessionId:', sessionId);
    console.log('PUT request body:', { title, description, domains, questionsCount: questions?.length || 0 });

    if (!sessionId) {
      return NextResponse.json(
        { success: false, message: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const { user, error: authError } = await getAuthenticatedUser(request);
    
    if (authError || !user) {
      console.error('Authentication failed in PUT:', authError);
      return NextResponse.json(
        { success: false, message: 'Authentication required: ' + (authError || 'No user') },
        { status: 401 }
      );
    }

    console.log('User authenticated:', user.email, 'isAdmin:', isAdmin(user));

    // Find practice set by sessionId in code field using admin client
    console.log('PUT request - Looking for practice set with code:', `session_${sessionId}`);
    
    const { data: practiceSets, error: findError } = await supabaseAdmin
      .from('practice_sets')
      .select('*')
      .eq('code', `session_${sessionId}`)
      .order('updated_at', { ascending: false })
      .limit(1);

    console.log('PUT request - Practice set search result:', { 
      practiceSetsCount: practiceSets?.length, 
      error: findError?.message,
      practiceSetIds: practiceSets?.map(p => p.id) || []
    });

    if (findError) {
      console.error('Find practice set error in PUT:', findError);
      
      // Let's also try to find any practice sets for this user to debug
      const { data: userPracticeSets } = await supabaseAdmin
        .from('practice_sets')
        .select('id, code, title, created_by')
        .eq('created_by', user.id)
        .limit(5);
      
      console.log('User practice sets:', userPracticeSets);
      
      return NextResponse.json(
        { success: false, message: 'Draft session expired or not found: ' + (findError?.message || 'No practice set found') },
        { status: 404 }
      );
    }

    // Get the most recent practice set (first one after ordering by updated_at desc)
    const practiceSet = practiceSets && practiceSets.length > 0 ? practiceSets[0] : null;

    if (!practiceSet) {
      console.error('No practice set found for session:', sessionId);
      
      // Let's also try to find any practice sets for this user to debug
      const { data: userPracticeSets } = await supabaseAdmin
        .from('practice_sets')
        .select('id, code, title, created_by')
        .eq('created_by', user.id)
        .limit(5);
      
      console.log('User practice sets:', userPracticeSets);
      
      return NextResponse.json(
        { success: false, message: 'Draft session expired or not found: No practice set found' },
        { status: 404 }
      );
    }

    // Check if user has permission to edit this practice set
    if (practiceSet.created_by !== user.id && !isAdmin(user)) {
      console.error('Access denied for user:', user.id, 'practice set created by:', practiceSet.created_by);
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    console.log('Permission check passed, updating practice set:', practiceSet.id);

    // Update the practice set
    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (domains !== undefined) updateData.domains = domains;
    if (questions !== undefined) {
      updateData.questions = questions;
      updateData.questions_count = Array.isArray(questions) ? questions.length : 0;
    }

    // Update existing columns with sanitized values
    if (difficulty !== undefined) updateData.difficulty_level = difficulty;
    if (duration !== undefined) {
      const sanitizedDuration = duration === '' ? 120 : Number(duration) || 120;
      updateData.estimated_time_minutes = sanitizedDuration;
    }
    if (passingPercentage !== undefined) {
      const sanitizedPercentage = passingPercentage === '' ? 40 : Number(passingPercentage) || 40;
      updateData.passing_percentage = sanitizedPercentage;
    }
    if (isFree !== undefined) updateData.is_free = isFree;
    if (price !== undefined) {
      const sanitizedPrice = price === '' ? 0 : Number(price) || 0;
      updateData.price = isFree ? 0 : sanitizedPrice;
    }

    // Update enhanced fields in meta_data
    const currentMetaData = practiceSet.meta_data || {};
    const newMetaData = { ...currentMetaData };

    if (testType !== undefined) newMetaData.testType = testType;
    if (totalQuestions !== undefined) {
      const sanitizedTotalQuestions = totalQuestions === '' ? 50 : Number(totalQuestions) || 50;
      newMetaData.totalQuestions = sanitizedTotalQuestions;
    }
    if (instructions !== undefined) newMetaData.instructions = instructions;
    // Negative marking fields
    if (enableNegativeMarking !== undefined) newMetaData.enableNegativeMarking = enableNegativeMarking;
    if (negativeMarkingRatio !== undefined) {
      const sanitizedRatio = negativeMarkingRatio === '' ? 0.25 : Number(negativeMarkingRatio) || 0.25;
      newMetaData.negativeMarkingRatio = sanitizedRatio;
    }
    if (isScheduled !== undefined) newMetaData.isScheduled = isScheduled;
    if (scheduledDate !== undefined) newMetaData.scheduledDate = scheduledDate;
    if (scheduledTime !== undefined) newMetaData.scheduledTime = scheduledTime;
    if (registrationDeadline !== undefined) newMetaData.registrationDeadline = registrationDeadline;
    if (availableUntil !== undefined) newMetaData.availableUntil = availableUntil;

    updateData.meta_data = newMetaData;

    console.log('Updating practice set with data:', updateData);
    
    const { data: updatedPracticeSet, error } = await supabaseAdmin
      .from('practice_sets')
      .update(updateData)
      .eq('id', practiceSet.id)
      .select()
      .single();

    if (error) {
      console.error('Save draft error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to save draft: ' + error.message },
        { status: 500 }
      );
    }

    console.log('Practice set updated successfully:', updatedPracticeSet.id);

    return NextResponse.json({
      success: true,
      draft: {
        id: updatedPracticeSet.id,
        practiceSetId: updatedPracticeSet.id,
        sessionId: sessionId,
        title: updatedPracticeSet.title,
        description: updatedPracticeSet.description,
        domains: updatedPracticeSet.domains || [],
        questions: updatedPracticeSet.questions || [],
        createdAt: updatedPracticeSet.created_at,
        updatedAt: updatedPracticeSet.updated_at,
        expiresAt: null,
        autoSaveCount: 0
      },
      message: 'Draft saved successfully'
    });
  } catch (error) {
    console.error('Error saving draft:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to save draft' },
      { status: 500 }
    );
  }
}

// DELETE - Delete draft and end editing session
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { success: false, message: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const { user, error: authError } = await getAuthenticatedUser(request);
    
    if (authError || !user) {
      console.error('Authentication error in DELETE:', authError);
      return NextResponse.json(
        { success: false, message: 'Authentication required: ' + (authError || 'No user') },
        { status: 401 }
      );
    }

    // Use admin client to find practice set by sessionId in code field
    const { data: practiceSets, error: findError } = await supabaseAdmin
      .from('practice_sets')
      .select('*')
      .eq('code', `session_${sessionId}`)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (findError) {
      console.error('Find practice set error:', findError);
      // If no practice set found, still return success (session cleanup)
      return NextResponse.json({
        success: true,
        message: 'Session ended (no active draft found)'
      });
    }

    // Get the most recent practice set (first one after ordering by updated_at desc)
    const practiceSet = practiceSets && practiceSets.length > 0 ? practiceSets[0] : null;

    if (!practiceSet) {
      console.error('No practice set found for session:', sessionId);
      // If no practice set found, still return success (session cleanup)
      return NextResponse.json({
        success: true,
        message: 'Session ended (no active draft found)'
      });
    }

    // Check if user has permission to delete this practice set
    if (practiceSet.created_by !== user.id && !isAdmin(user)) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    // Only delete if it's a completely new draft that was never published
    // and has no meaningful content (no questions and generic title)
    const isNewEmptyDraft = (
      practiceSet.status === 'draft' && 
      !practiceSet.is_live && 
      (!practiceSet.questions || practiceSet.questions.length === 0) &&
      (practiceSet.title === 'Untitled Practice Set' || !practiceSet.title?.trim())
    );

    let actionMessage = '';

    if (isNewEmptyDraft) {
      const { error: deleteError } = await supabaseAdmin
        .from('practice_sets')
        .delete()
        .eq('id', practiceSet.id);

      if (deleteError) {
        console.error('Delete practice set error:', deleteError);
        return NextResponse.json(
          { success: false, message: 'Failed to delete draft' },
          { status: 500 }
        );
      }
      actionMessage = 'Empty draft deleted and editing session ended';
    } else {
      // For existing practice sets (including previously live ones), 
      // just clear the editing session and revert to draft status
      const updateData = {
        code: null, // Clear the session code
        updated_at: new Date().toISOString()
      };

      // If it was a live practice set being edited, revert it back to draft
      if (practiceSet.is_live) {
        updateData.status = 'draft';
        updateData.is_live = false;
        actionMessage = 'Live practice set converted to draft and editing session ended';
      } else {
        actionMessage = 'Draft saved and editing session ended';
      }

      const { error: updateError } = await supabaseAdmin
        .from('practice_sets')
        .update(updateData)
        .eq('id', practiceSet.id);

      if (updateError) {
        console.error('Update practice set error:', updateError);
        return NextResponse.json(
          { success: false, message: 'Failed to end editing session' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: actionMessage
    });
  } catch (error) {
    console.error('Error deleting draft:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete draft' },
      { status: 500 }
    );
  }
} 