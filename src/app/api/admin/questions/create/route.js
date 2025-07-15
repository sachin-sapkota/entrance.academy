import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAuthenticatedUser, requireAdmin } from '@/lib/auth-helpers';

// POST - Create individual question
// PUT - Update existing question
export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, ...questionData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Question ID is required for updates' },
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

    const { 
      domain,
      subdomain,
      text, 
      options, 
      correctAnswer, 
      explanation, 
      difficulty, 
      cognitive_level, 
      importance_points, 
      question_image,
      hint,
      tags,
      reference_material
    } = questionData;

    if (!text || !options || !correctAnswer || !explanation) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    let categoryRecord = null;
    let domainRecord = null;

    if (domain && subdomain) {
      // Get domain information
      const { data: domainData, error: domainError } = await supabase
        .from('domains')
        .select('id, code, name')
        .eq('code', domain)
        .eq('is_active', true)
        .single();

      if (domainError || !domainData) {
        return NextResponse.json(
          { success: false, message: `Domain '${domain}' not found` },
          { status: 400 }
        );
      }

      // Get subdomain (question category)
      const { data: subdomainData, error: subdomainError } = await supabase
        .from('question_categories')
        .select('id, name, code, domain_id')
        .eq('code', subdomain)
        .eq('domain_id', domainData.id)
        .eq('is_active', true)
        .single();

      if (subdomainError || !subdomainData) {
        return NextResponse.json(
          { success: false, message: `Subdomain '${subdomain}' not found in domain '${domain}'` },
          { status: 400 }
        );
      }

      domainRecord = domainData;
      categoryRecord = subdomainData;
    }

    // Prepare options with correct structure
    const processedOptions = options.map((option, index) => {
      const optionKey = ['A', 'B', 'C', 'D'][index];
      return {
        text: option.text || '',
        image: option.image || null,
        key: optionKey,
        isCorrect: correctAnswer === optionKey
      };
    });

    // Update question data
    const updateData = {
      domain_id: domainRecord?.id,
      category_id: categoryRecord?.id,
      text: text,
      options: processedOptions,
      correct_answer: JSON.stringify(correctAnswer),
      explanation: explanation,
      difficulty_level: difficulty || 'medium',
      cognitive_level: cognitive_level || 'understanding',
      importance_points: importance_points || 3,
      question_image_url: question_image || null,
      estimated_time_seconds: 60, // Default time
      hint: hint || null,
      tags: tags || [],
      reference_material: reference_material || null,
      updated_by: user.id,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('questions')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        domain:domains(name, code),
        category:question_categories(name, code)
      `)
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to update question in database' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: 'Question updated successfully'
    });

  } catch (error) {
    console.error('Update question error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      domain, 
      subdomain,
      text, 
      options, 
      correctAnswer, 
      explanation, 
      difficulty = 'medium',
      cognitive_level = 'understanding',
      importance_points = 3,
      question_image,
      hint,
      tags,
      reference_material
    } = body;

    if (!text || !options || !correctAnswer) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: text, options, correctAnswer' },
        { status: 400 }
      );
    }

    if (!subdomain && !domain) {
      return NextResponse.json(
        { success: false, message: 'Either subdomain or domain must be specified' },
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

    // Validate options
    if (!Array.isArray(options) || options.length !== 4) {
      return NextResponse.json(
        { success: false, message: 'Must have exactly 4 options' },
        { status: 400 }
      );
    }

    // Validate correct answer
    if (!['A', 'B', 'C', 'D'].includes(correctAnswer)) {
      return NextResponse.json(
        { success: false, message: 'correctAnswer must be A, B, C, or D' },
        { status: 400 }
      );
    }

    // Validate difficulty
    const allowedDifficulties = ['very_easy', 'easy', 'medium', 'hard', 'very_hard'];
    if (!allowedDifficulties.includes(difficulty)) {
      return NextResponse.json(
        { success: false, message: `Invalid difficulty. Must be one of: ${allowedDifficulties.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate cognitive level
    const allowedCognitiveLevels = ['recall', 'understanding', 'application'];
    if (!allowedCognitiveLevels.includes(cognitive_level)) {
      return NextResponse.json(
        { success: false, message: `Invalid cognitive level. Must be one of: ${allowedCognitiveLevels.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate importance points
    if (importance_points < 1 || importance_points > 10) {
      return NextResponse.json(
        { success: false, message: 'Importance points must be between 1 and 10' },
        { status: 400 }
      );
    }

    // Handle domain and subdomain lookup
    let domainRecord = null;
    let categoryRecord = null;

    if (domain && subdomain) {
      // Get domain information
      const { data: domainData, error: domainError } = await supabase
        .from('domains')
        .select('id, code, name')
        .eq('code', domain)
        .eq('is_active', true)
        .single();

      if (domainError || !domainData) {
        return NextResponse.json(
          { success: false, message: `Domain '${domain}' not found` },
          { status: 400 }
        );
      }

      // Get subdomain (question category)
      const { data: subdomainData, error: subdomainError } = await supabase
        .from('question_categories')
        .select('id, name, code, domain_id')
        .eq('code', subdomain)
        .eq('domain_id', domainData.id)
        .eq('is_active', true)
        .single();

      if (subdomainError || !subdomainData) {
        return NextResponse.json(
          { success: false, message: `Subdomain '${subdomain}' not found in domain '${domain}'` },
          { status: 400 }
        );
      }

      domainRecord = domainData;
      categoryRecord = subdomainData;
    } else {
      return NextResponse.json(
        { success: false, message: 'Both domain and subdomain are required' },
        { status: 400 }
      );
    }

    // Prepare options with images
    const processedOptions = options.map((option, index) => {
      const optionKey = ['A', 'B', 'C', 'D'][index];
      return {
        text: typeof option === 'string' ? option : option.text,
        image: option.image || null,
        key: optionKey
      };
    });

    // Prepare question data
    const questionData = {
      domain_id: domainRecord.id,
      category_id: categoryRecord ? categoryRecord.id : null,
      text: text,
      options: processedOptions,
      correct_answer: JSON.stringify(correctAnswer),
      explanation: explanation || null,
      question_image_url: question_image || null,
      difficulty_level: difficulty,
      cognitive_level: cognitive_level,
      importance_points: importance_points,
      hint: hint || null,
      tags: tags || [],
      reference_material: reference_material || null,
      estimated_time_seconds: 60,
      created_by: user.id,
      is_active: true,
      is_verified: true,
      verified_by: user.id,
      verified_at: new Date().toISOString()
    };

    // Insert question
    const { data: newQuestion, error: questionError } = await supabase
      .from('questions')
      .insert([questionData])
      .select(`
        *,
        domain:domains(id, name, code),
        question_categories(id, name, code)
      `)
      .single();

    if (questionError) {
      console.error('Question creation error:', questionError);
      return NextResponse.json(
        { success: false, message: 'Failed to create question' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      question: newQuestion,
      message: 'Question created successfully'
    });

  } catch (error) {
    console.error('Error creating question:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create question' },
      { status: 500 }
    );
  }
} 