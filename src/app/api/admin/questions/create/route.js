import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAuthenticatedUser, requireAdmin } from '@/lib/auth-helpers';

// POST - Create individual question
export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      domain, 
      text, 
      options, 
      correctAnswer, 
      explanation, 
      difficulty = 'medium',
      questionImage,
      optionImages
    } = body;

    if (!domain || !text || !options || !correctAnswer) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: domain, text, options, correctAnswer' },
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

    // Validate domain
    const allowedDomains = ['Botany', 'Zoology', 'MAT', 'Physics', 'Chemistry'];
    if (!allowedDomains.includes(domain)) {
      return NextResponse.json(
        { success: false, message: `Invalid domain. Must be one of: ${allowedDomains.join(', ')}` },
        { status: 400 }
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

    // Get or create domain
    let { data: domainRecord, error: domainError } = await supabase
      .from('domains')
      .select('id')
      .eq('name', domain)
      .single();

    if (domainError || !domainRecord) {
      // Create domain if it doesn't exist
      const { data: newDomain, error: createDomainError } = await supabase
        .from('domains')
        .insert([{
          name: domain,
          code: domain.substring(0, 4).toUpperCase(),
          description: `${domain} questions for MCQ tests`,
          created_by: user.id
        }])
        .select('id')
        .single();

      if (createDomainError) {
        console.error('Domain creation error:', createDomainError);
        return NextResponse.json(
          { success: false, message: `Failed to create domain: ${domain}` },
          { status: 500 }
        );
      }
      domainRecord = newDomain;
    }

    // Prepare options with images
    const processedOptions = options.map((option, index) => {
      const optionKey = ['A', 'B', 'C', 'D'][index];
      return {
        text: typeof option === 'string' ? option : option.text,
        image: optionImages && optionImages[optionKey] ? optionImages[optionKey] : (option.image || null),
        key: optionKey
      };
    });

    // Prepare question data
    const questionData = {
      domain_id: domainRecord.id,
      text: text,
      options: processedOptions,
      correct_answer: correctAnswer,
      explanation: explanation || null,
      question_image_url: questionImage || null,
      difficulty_level: difficulty,
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
        domain:domains(id, name, code)
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