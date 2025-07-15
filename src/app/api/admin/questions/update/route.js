import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAuthenticatedUser, requireAdmin } from '@/lib/auth-helpers';

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