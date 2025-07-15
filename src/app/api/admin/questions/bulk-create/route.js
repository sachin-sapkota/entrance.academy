import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAuthenticatedUser, requireAdmin } from '@/lib/auth-helpers';
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

export async function POST(request) {
  try {
    const body = await request.json();
    const { domain, subdomain, questions } = body;

    if (!domain || !subdomain || !questions || !Array.isArray(questions)) {
      return NextResponse.json(
        { success: false, message: 'Domain, subdomain, and questions array are required' },
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

    // Get domain information
    const { data: domainData, error: domainError } = await supabase
      .from('domains')
      .select('id, code, name')
      .eq('code', domain)
      .eq('is_active', true)
      .single();

    if (domainError || !domainData) {
      return NextResponse.json(
        { success: false, message: 'Invalid domain specified' },
        { status: 400 }
      );
    }

    // Get subdomain information
    const { data: subdomainData, error: subdomainError } = await supabase
      .from('question_categories')
      .select(`
        id,
        code,
        name,
        domain_id
      `)
      .eq('code', subdomain)
      .eq('domain_id', domainData.id)
      .eq('is_active', true)
      .single();

    if (subdomainError || !subdomainData) {
      return NextResponse.json(
        { success: false, message: 'Invalid subdomain specified for the selected domain' },
        { status: 400 }
      );
    }

    let created_count = 0;
    let failed_count = 0;
    const creation_errors = [];

    // Process each question
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      
      try {
        // Validate question structure
        if (!question.text || !question.options || !question.correctAnswer || !question.explanation) {
          throw new Error(`Question ${i + 1}: Missing required fields (text, options, correctAnswer, explanation)`);
        }

        if (!Array.isArray(question.options) || question.options.length !== 4) {
          throw new Error(`Question ${i + 1}: Must have exactly 4 options`);
        }

        if (!['A', 'B', 'C', 'D'].includes(question.correctAnswer)) {
          throw new Error(`Question ${i + 1}: correctAnswer must be A, B, C, or D`);
        }

        // Prepare question data for database
        const allowedCognitiveLevels = ['recall', 'understanding', 'application'];
        let cognitiveLevel = (question.cognitive_level || 'understanding').toLowerCase();
        if (!allowedCognitiveLevels.includes(cognitiveLevel)) {
          cognitiveLevel = 'understanding';
        }
        const questionData = {
          domain_id: domainData.id,
          category_id: subdomainData.id,
          question_type: 'single_choice',
          difficulty_level: question.difficulty || 'medium',
          cognitive_level: cognitiveLevel,
          text: question.text,
          text_html: question.text_html || null,
          options: question.options,
          correct_answer: JSON.stringify(question.correctAnswer),
          explanation: question.explanation,
          explanation_html: question.explanation_html || null,
          hint: question.hint || null,
          reference_material: question.reference_material || null,
          related_concepts: question.related_concepts || null,
          question_image_url: question.image || null,
          explanation_image_url: question.explanation_image_url || null,
          points: 1.0,
          negative_points: 0.25,
          estimated_time_seconds: 60, // Default since not in JSON anymore
          importance_points: question.importance_points || 3,
          is_active: true,
          is_verified: true,
          verified_by: user.id,
          verified_at: new Date().toISOString(),
          tags: question.tags || [],
          language: 'en',
          created_by: user.id,
          updated_by: user.id
        };

        // Insert question into database
        const { data: insertedQuestion, error: insertError } = await supabase
          .from('questions')
          .insert(questionData)
          .select('id')
          .single();

        if (insertError) {
          throw new Error(`Database error: ${insertError.message}`);
        }

        created_count++;

        // Update question analytics using admin client to bypass RLS
        const { error: analyticsError } = await supabaseAdmin
          .from('question_analytics')
          .insert({
            question_id: insertedQuestion.id,
            total_attempts: 0,
            correct_attempts: 0,
            overall_accuracy: 0,
            average_time_spent: 0,
            last_calculated_at: new Date().toISOString()
          });

        if (analyticsError) {
          console.warn(`Failed to create analytics for question ${insertedQuestion.id}:`, analyticsError);
        }

      } catch (error) {
        failed_count++;
        creation_errors.push(`Question ${i + 1}: ${error.message}`);
        console.error(`Error creating question ${i + 1}:`, error);
      }
    }

    // Update subdomain statistics
    try {
      const { data: currentSubdomain } = await supabase
        .from('question_categories')
        .select('total_questions')
        .eq('id', subdomainData.id)
        .single();

      const { error: updateError } = await supabase
        .from('question_categories')
        .update({
          total_questions: (currentSubdomain?.total_questions || 0) + created_count,
          updated_at: new Date().toISOString()
        })
        .eq('id', subdomainData.id);

      if (updateError) {
        console.warn('Failed to update subdomain statistics:', updateError);
      }
    } catch (error) {
      console.warn('Error updating subdomain statistics:', error);
    }

    // Update domain statistics
    try {
      const { data: domainQuestionCount } = await supabase
        .from('questions')
        .select('id', { count: 'exact' })
        .eq('domain_id', domainData.id)
        .eq('is_active', true);

      const { error: domainUpdateError } = await supabase
        .from('domains')
        .update({
          total_questions_available: domainQuestionCount?.length || 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', domainData.id);

      if (domainUpdateError) {
        console.warn('Failed to update domain statistics:', domainUpdateError);
      }
    } catch (error) {
      console.warn('Error updating domain statistics:', error);
    }

    // Create audit log entry using admin client to bypass RLS
    try {
      const { error: auditError } = await supabaseAdmin
        .from('audit_logs')
        .insert({
          user_id: user.id,
          action: 'bulk_question_create',
          entity_type: 'questions',
          entity_id: `${domain}_${subdomain}`,
          new_values: {
            domain,
            subdomain,
            questions_attempted: questions.length,
            questions_created: created_count,
            questions_failed: failed_count
          }
        });

      if (auditError) {
        console.warn('Failed to create audit log:', auditError);
      }
    } catch (error) {
      console.warn('Error creating audit log:', error);
    }

    const response_data = {
      success: true,
      message: `Successfully created ${created_count} questions`,
      created_count,
      failed_count,
      total_attempted: questions.length,
      domain: {
        code: domainData.code,
        name: domainData.name
      },
      subdomain: {
        code: subdomainData.code,
        name: subdomainData.name
      }
    };

    // Include errors if any failed
    if (failed_count > 0) {
      response_data.errors = creation_errors.slice(0, 10); // Limit to first 10 errors
      response_data.message += `. ${failed_count} questions failed to create.`;
    }

    return NextResponse.json(response_data);

  } catch (error) {
    console.error('Error in bulk question creation:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create questions' },
      { status: 500 }
    );
  }
} 