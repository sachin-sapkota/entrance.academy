import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAuthenticatedUser, requireAdmin } from '@/lib/auth-helpers';

// GET - Fetch all question sets
export async function GET(request) {
  try {
    // Get authenticated user and check admin permission
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

    const { data: questionSets, error } = await supabase
      .from('question_sets')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch question sets' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      questionSets
    });
  } catch (error) {
    console.error('Error fetching question sets:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch question sets' },
      { status: 500 }
    );
  }
}

// POST - Create question set from JSON
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, description, questionsJson, totalQuestions = 200 } = body;

    if (!name || !questionsJson) {
      return NextResponse.json(
        { success: false, message: 'Name and questions JSON are required' },
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

    // Validate questions JSON
    let parsedQuestions;
    try {
      parsedQuestions = Array.isArray(questionsJson) ? questionsJson : JSON.parse(questionsJson);
    } catch (parseError) {
      return NextResponse.json(
        { success: false, message: 'Invalid JSON format' },
        { status: 400 }
      );
    }

    if (!Array.isArray(parsedQuestions)) {
      return NextResponse.json(
        { success: false, message: 'Questions must be an array' },
        { status: 400 }
      );
    }

    // Validate question structure and domains
    const allowedDomains = ['Botany', 'Zoology', 'MAT', 'Physics', 'Chemistry'];
    const domainCounts = {};
    const questionIds = [];

    for (let i = 0; i < parsedQuestions.length; i++) {
      const q = parsedQuestions[i];
      
      // Validate required fields
      if (!q.domain || !q.text || !q.options || !q.correctAnswer) {
        return NextResponse.json(
          { success: false, message: `Question ${i + 1}: Missing required fields (domain, text, options, correctAnswer)` },
          { status: 400 }
        );
      }

      // Validate domain
      if (!allowedDomains.includes(q.domain)) {
        return NextResponse.json(
          { success: false, message: `Question ${i + 1}: Invalid domain. Must be one of: ${allowedDomains.join(', ')}` },
          { status: 400 }
        );
      }

      // Validate options
      if (!Array.isArray(q.options) || q.options.length !== 4) {
        return NextResponse.json(
          { success: false, message: `Question ${i + 1}: Must have exactly 4 options` },
          { status: 400 }
        );
      }

      // Validate correct answer
      if (!['A', 'B', 'C', 'D'].includes(q.correctAnswer)) {
        return NextResponse.json(
          { success: false, message: `Question ${i + 1}: correctAnswer must be A, B, C, or D` },
          { status: 400 }
        );
      }

      // Count domains
      domainCounts[q.domain] = (domainCounts[q.domain] || 0) + 1;
    }

    // Get or create domains and insert questions
    for (const question of parsedQuestions) {
      // Get domain ID
      let { data: domain, error: domainError } = await supabase
        .from('domains')
        .select('id')
        .eq('name', question.domain)
        .single();

      if (domainError || !domain) {
        // Create domain if it doesn't exist
        const { data: newDomain, error: createDomainError } = await supabase
          .from('domains')
          .insert([{
            name: question.domain,
            code: question.domain.substring(0, 4).toUpperCase(),
            description: `${question.domain} questions for MCQ tests`,
            created_by: user.id
          }])
          .select('id')
          .single();

        if (createDomainError) {
          console.error('Domain creation error:', createDomainError);
          return NextResponse.json(
            { success: false, message: `Failed to create domain: ${question.domain}` },
            { status: 500 }
          );
        }
        domain = newDomain;
      }

      // Prepare question data
      const questionData = {
        domain_id: domain.id,
        text: question.text,
        options: question.options,
        correct_answer: question.correctAnswer,
        explanation: question.explanation || null,
        question_image_url: question.image || null,
        difficulty_level: question.difficulty || 'medium',
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
        .select('id')
        .single();

      if (questionError) {
        console.error('Question creation error:', questionError);
        return NextResponse.json(
          { success: false, message: 'Failed to create question' },
          { status: 500 }
        );
      }

      questionIds.push(newQuestion.id);
    }

    // Create question set
    const questionSetData = {
      name,
      description: description || '',
      total_questions: parsedQuestions.length,
      domain_distribution: domainCounts,
      questions: questionIds,
      created_by: user.id,
      is_active: true,
      is_published: true,
      published_by: user.id,
      published_at: new Date().toISOString()
    };

    const { data: questionSet, error: setError } = await supabase
      .from('question_sets')
      .insert([questionSetData])
      .select()
      .single();

    if (setError) {
      console.error('Question set creation error:', setError);
      return NextResponse.json(
        { success: false, message: 'Failed to create question set' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      questionSet,
      message: `Question set created successfully with ${parsedQuestions.length} questions`,
      domainDistribution: domainCounts
    });

  } catch (error) {
    console.error('Error creating question set:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create question set' },
      { status: 500 }
    );
  }
}

// PUT - Update question set
export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, name, description, questionsJson } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Question set ID is required' },
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

    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    const { data: updatedSet, error } = await supabase
      .from('question_sets')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to update question set' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      questionSet: updatedSet,
      message: 'Question set updated successfully'
    });

  } catch (error) {
    console.error('Error updating question set:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update question set' },
      { status: 500 }
    );
  }
}

// DELETE - Delete question set
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Question set ID is required' },
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

    const { error } = await supabase
      .from('question_sets')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to delete question set' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Question set deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting question set:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete question set' },
      { status: 500 }
    );
  }
} 