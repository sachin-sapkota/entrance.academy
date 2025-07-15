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

// POST - Create practice set or draft session
export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      templateId, 
      customName,
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

    // Handle template-based practice set generation
    if (templateId) {
      return await generatePracticeSetFromTemplate(templateId, customName, user.id);
    }

    // Original practice set creation logic
    if (!title) {
      return NextResponse.json(
        { success: false, message: 'Title is required' },
        { status: 400 }
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
        // Marks per question
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
          test_type: 'scheduled',
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
          is_active: true,
          available_from: available_from,
          available_until: available_until,
          registration_deadline: registration_deadline,
          domain_distribution: domains.reduce((acc, domain) => {
            acc[domain] = Math.ceil(totalQuestions / domains.length);
            return acc;
          }, {}),
          created_by: user.id,
          meta_data: {
            original_test_type: testType,
            scheduling_status: 'scheduled',
            created_as_live: isLive,
            questions: questions || [],
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

// Helper function to generate practice set from template
async function generatePracticeSetFromTemplate(templateId, customName, userId) {
  try {
    // Get the template configuration
    const { data: template, error: templateError } = await supabaseAdmin
      .from('test_configurations')
      .select('*')
      .eq('id', templateId)
      .eq('is_active', true)
      .single();

    if (templateError || !template) {
      return NextResponse.json(
        { success: false, message: 'Template not found or inactive' },
        { status: 404 }
      );
    }

    // Generate questions using smart algorithm
    const selectedQuestions = await smartQuestionSelection(template);

    if (!selectedQuestions || selectedQuestions.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No questions available for the specified criteria' },
        { status: 400 }
      );
    }

    // Create practice set name
    const practiceSetName = customName || `${template.name} - ${new Date().toLocaleDateString()}`;

    // Create the practice set as draft
    const { data: practiceSet, error: createError } = await supabaseAdmin
      .from('practice_sets')
      .insert([{
        title: practiceSetName,
        description: `Generated from template: ${template.name}`,
        questions: selectedQuestions,
        questions_count: selectedQuestions.length,
        domains: Object.keys(template.domain_distribution || {}),
        difficulty_level: 'mixed',
        estimated_time_minutes: template.duration_minutes || 120,
        passing_percentage: template.passing_percentage || 40,
        status: 'draft',
        is_live: false,
        is_free: template.is_free !== false,
        price: template.price || 0,
        created_by: userId,
        meta_data: {
          generated_from_template: templateId,
          template_name: template.name,
          test_type: 'template_generated',
          enable_negative_marking: template.enable_negative_marking || false,
          negative_marking_ratio: template.negative_marking_ratio || 0.25,
          instructions: template.instructions || '',
          algorithm_settings: {
            importance_weight_factor: template.importance_weight_factor,
            min_high_importance: template.min_high_importance_questions,
            max_high_importance: template.max_high_importance_questions
          }
        }
      }])
      .select()
      .single();

    if (createError) {
      console.error('Error creating practice set:', createError);
      return NextResponse.json(
        { success: false, message: 'Failed to create practice set' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      practiceSet,
      message: `Practice set generated successfully with ${selectedQuestions.length} questions`,
      templateUsed: template.name,
      highImportanceQuestions: selectedQuestions.filter(q => q.importance_points >= 8).length
    });

  } catch (error) {
    console.error('Error generating practice set from template:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to generate practice set' },
      { status: 500 }
    );
  }
}

// Smart Question Selection Algorithm
async function smartQuestionSelection(template) {
  try {
    const domainDistribution = template.domain_distribution || {};
    const difficultyDistribution = template.difficulty_distribution || {};
    const minHighImportance = template.min_high_importance_questions || 1;
    const maxHighImportance = template.max_high_importance_questions || 3;
    const importanceWeightFactor = template.importance_weight_factor || 1.5;
    const recencyWeightFactor = template.recency_weight_factor || 0.8;
    const avoidRecentDays = template.avoid_recent_days || 7;

    let selectedQuestions = [];
    let highImportanceCount = 0;
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - avoidRecentDays);

    // For each domain, select questions according to distribution
    for (const [domainCode, targetCount] of Object.entries(domainDistribution)) {
      if (targetCount <= 0) continue;

      // Get domain ID
      const { data: domain, error: domainError } = await supabaseAdmin
        .from('domains')
        .select('id')
        .eq('code', domainCode)
        .single();

      if (domainError || !domain) {
        console.warn(`Domain ${domainCode} not found`);
        continue;
      }

      // Get available questions for this domain
      const { data: questions, error: questionsError } = await supabaseAdmin
        .from('questions')
        .select(`
          id,
          text,
          options,
          correct_answer,
          explanation,
          difficulty_level,
          domain_id,
          importance_points,
          created_at,
          updated_at
        `)
        .eq('domain_id', domain.id)
        .eq('is_active', true);

      if (questionsError || !questions || questions.length === 0) {
        console.warn(`No questions available for domain ${domainCode}`);
        continue;
      }

      // Calculate selection weights for each question
      const questionsWithWeights = questions.map(q => {
        let weight = 1;

        // Apply importance weighting
        const importancePoints = q.importance_points || 1;
        if (importancePoints >= 8) { // High importance (8-10)
          weight *= importanceWeightFactor;
        }

        // Apply recency factor (reduce weight for recently created/updated questions)
        const questionDate = new Date(Math.max(
          new Date(q.created_at).getTime(),
          new Date(q.updated_at).getTime()
        ));
        if (questionDate > recentDate) {
          weight *= recencyWeightFactor;
        }

        // Apply difficulty preference (slightly favor medium difficulty)
        if (q.difficulty_level === 'medium') {
          weight *= 1.2;
        }

        return {
          ...q,
          selectionWeight: weight,
          isHighImportance: importancePoints >= 8
        };
      });

      // Select questions for this domain
      const domainQuestions = weightedRandomSelection(
        questionsWithWeights,
        targetCount,
        { 
          ensureHighImportance: highImportanceCount < maxHighImportance,
          minHighImportance: Math.max(0, minHighImportance - highImportanceCount)
        }
      );

      // Add domain information to each question
      const questionsWithDomain = domainQuestions.map(q => ({
        ...q,
        domainCode: domainCode
      }));

      // Count high importance questions selected
      highImportanceCount += domainQuestions.filter(q => q.isHighImportance).length;
      selectedQuestions = selectedQuestions.concat(questionsWithDomain);
    }

    // Ensure we have at least the minimum high importance questions
    if (highImportanceCount < minHighImportance) {
      const additionalHighImportanceNeeded = minHighImportance - highImportanceCount;
      const additionalQuestions = await selectAdditionalHighImportanceQuestions(
        Object.keys(domainDistribution),
        additionalHighImportanceNeeded,
        selectedQuestions.map(q => q.id)
      );
      
      // Add domain information to additional questions (use first available domain)
      const additionalQuestionsWithDomain = additionalQuestions.map(q => ({
        ...q,
        domainCode: Object.keys(domainDistribution)[0] || 'UNKNOWN'
      }));
      
      selectedQuestions = selectedQuestions.concat(additionalQuestionsWithDomain);
    }

    // Shuffle questions if template allows
    if (template.shuffle_questions !== false) {
      selectedQuestions = shuffleArray(selectedQuestions);
    }

    return selectedQuestions.map(q => ({
      id: q.id,
      domain: q.domainCode,
      text: q.text,
      options: q.options,
      correctAnswer: q.correct_answer,
      explanation: q.explanation,
      difficulty: q.difficulty_level,
      importance_points: q.importance_points || 1
    }));

  } catch (error) {
    console.error('Error in smart question selection:', error);
    throw error;
  }
}

// Weighted random selection algorithm
function weightedRandomSelection(questions, count, options = {}) {
  if (questions.length === 0 || count <= 0) return [];
  
  const selected = [];
  const available = [...questions];
  
  // First, select high importance questions if required
  if (options.minHighImportance > 0) {
    const highImportanceQuestions = available.filter(q => q.isHighImportance);
    const highImportanceToSelect = Math.min(options.minHighImportance, highImportanceQuestions.length, count);
    
    for (let i = 0; i < highImportanceToSelect; i++) {
      if (highImportanceQuestions.length === 0) break;
      
      const randomIndex = Math.floor(Math.random() * highImportanceQuestions.length);
      const selectedQuestion = highImportanceQuestions.splice(randomIndex, 1)[0];
      selected.push(selectedQuestion);
      
      // Remove from available pool
      const availableIndex = available.findIndex(q => q.id === selectedQuestion.id);
      if (availableIndex !== -1) {
        available.splice(availableIndex, 1);
      }
    }
  }
  
  // Select remaining questions using weighted selection
  const remainingCount = count - selected.length;
  for (let i = 0; i < remainingCount && available.length > 0; i++) {
    const totalWeight = available.reduce((sum, q) => sum + q.selectionWeight, 0);
    let randomValue = Math.random() * totalWeight;
    
    let selectedQuestion = null;
    for (let j = 0; j < available.length; j++) {
      randomValue -= available[j].selectionWeight;
      if (randomValue <= 0) {
        selectedQuestion = available.splice(j, 1)[0];
        break;
      }
    }
    
    if (selectedQuestion) {
      selected.push(selectedQuestion);
    }
  }
  
  return selected;
}

// Select additional high importance questions if needed
async function selectAdditionalHighImportanceQuestions(domainCodes, count, excludeIds) {
  try {
    const { data: domains } = await supabaseAdmin
      .from('domains')
      .select('id')
      .in('code', domainCodes);

    if (!domains) return [];

    const domainIds = domains.map(d => d.id);

    const { data: questions } = await supabaseAdmin
      .from('questions')
      .select('*')
      .in('domain_id', domainIds)
      .gte('importance_points', 8)
      .not('id', 'in', `(${excludeIds.join(',')})`)
      .eq('is_active', true)
      .limit(count * 2); // Get more to allow for selection

    if (!questions || questions.length === 0) return [];

    // Randomly select from available high importance questions
    const shuffled = shuffleArray(questions);
    return shuffled.slice(0, count).map(q => ({
      ...q,
      isHighImportance: true,
      selectionWeight: 1
    }));

  } catch (error) {
    console.error('Error selecting additional high importance questions:', error);
    return [];
  }
}

// Utility function to shuffle array
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
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