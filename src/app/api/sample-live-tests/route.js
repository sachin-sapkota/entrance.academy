import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../../../lib/logger';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  // Prevent sample data creation in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({
      success: false,
      error: 'Sample data creation is not allowed in production environment'
    }, { status: 403 });
  }

  try {
    logger.info('Creating sample test configurations for development/testing');
    
    // NOTE: This endpoint is only for development/testing purposes
    // It creates sample test configurations in the database
    // In production, real test configurations should be created through the admin interface

    // Get domains first
    const { data: domains, error: domainError } = await supabaseAdmin
      .from('domains')
      .select('id, name')
      .eq('is_active', true);

    if (domainError) {
      logger.error('Error fetching domains', { error: domainError });
      return NextResponse.json({ success: false, error: 'Failed to fetch domains' });
    }

    // Create a lookup for domain IDs
    const domainLookup = {};
    domains.forEach(domain => {
      domainLookup[domain.name] = domain.id;
    });

    // Sample test configurations with new test types
    const sampleTests = [
      // Practice Set
      {
        name: 'Mathematics Practice Set',
        code: 'MATH_PRACTICE_001',
        description: 'Standard practice question set covering basic mathematics concepts',
        test_type: 'practice',
        test_category: 'academic',
        duration_minutes: 90,
        total_questions: 50,
        questions_per_page: 20,
        passing_percentage: 40.00,
        domain_distribution: { [domainLookup['Mathematics']]: 50 },
        difficulty_distribution: { easy: 0.4, medium: 0.5, hard: 0.1 },
        enable_negative_marking: true,
        negative_marking_ratio: 0.25,
        is_public: true,
        is_active: true,
        shuffle_questions: true,
        shuffle_options: true,
        show_result_immediately: true,
        show_score_immediately: true,
        show_correct_answers: true,
        show_explanations: true,
        meta_data: { testType: 'practice' }
      },
      // Full Syllabus Test
      {
        name: 'Complete Science Syllabus Test',
        code: 'FULL_SYL_001',
        description: 'Comprehensive test covering all topics from mathematics, physics, chemistry, and biology',
        test_type: 'mock',
        test_category: 'competitive',
        duration_minutes: 180,
        total_questions: 120,
        questions_per_page: 20,
        passing_percentage: 50.00,
        domain_distribution: { 
          [domainLookup['Mathematics']]: 30,
          [domainLookup['Physics']]: 30,
          [domainLookup['Chemistry']]: 30,
          [domainLookup['Botany']]: 15,
          [domainLookup['Zoology']]: 15
        },
        difficulty_distribution: { easy: 0.2, medium: 0.5, hard: 0.3 },
        enable_negative_marking: true,
        negative_marking_ratio: 0.33,
        is_public: true,
        is_active: true,
        shuffle_questions: true,
        shuffle_options: true,
        show_result_immediately: true,
        show_score_immediately: true,
        show_correct_answers: true,
        show_explanations: true,
        meta_data: { testType: 'full_syllabus' }
      },
      // Domain Specific
      {
        name: 'Physics Mechanics Focused Test',
        code: 'PHYS_MECH_001',
        description: 'Focused test on physics mechanics including kinematics, dynamics, and work-energy',
        test_type: 'practice',
        test_category: 'academic',
        duration_minutes: 120,
        total_questions: 60,
        questions_per_page: 20,
        passing_percentage: 40.00,
        domain_distribution: { [domainLookup['Physics']]: 60 },
        difficulty_distribution: { easy: 0.3, medium: 0.5, hard: 0.2 },
        enable_negative_marking: true,
        negative_marking_ratio: 0.25,
        is_public: true,
        is_active: true,
        shuffle_questions: true,
        shuffle_options: true,
        show_result_immediately: true,
        show_score_immediately: true,
        show_correct_answers: true,
        show_explanations: true,
        meta_data: { testType: 'domain_specific' }
      },
      // Weekly Domain Test
      {
        name: 'Weekly Chemistry Review',
        code: 'WEEK_CHEM_001',
        description: 'Weekly test for chemistry covering organic and inorganic topics',
        test_type: 'practice',
        test_category: 'weekly',
        duration_minutes: 75,
        total_questions: 40,
        questions_per_page: 20,
        passing_percentage: 45.00,
        domain_distribution: { [domainLookup['Chemistry']]: 40 },
        difficulty_distribution: { easy: 0.3, medium: 0.6, hard: 0.1 },
        enable_negative_marking: true,
        negative_marking_ratio: 0.25,
        is_public: true,
        is_active: true,
        shuffle_questions: true,
        shuffle_options: true,
        show_result_immediately: true,
        show_score_immediately: true,
        show_correct_answers: true,
        show_explanations: true,
        meta_data: { testType: 'weekly_domain' }
      },
      // Weekly Full Test
      {
        name: 'Weekly Comprehensive Assessment',
        code: 'WEEK_FULL_001',
        description: 'Weekly comprehensive test covering multiple subjects for regular practice',
        test_type: 'practice',
        test_category: 'weekly',
        duration_minutes: 150,
        total_questions: 80,
        questions_per_page: 20,
        passing_percentage: 45.00,
        domain_distribution: { 
          [domainLookup['Mathematics']]: 25,
          [domainLookup['Physics']]: 25,
          [domainLookup['Chemistry']]: 25,
          [domainLookup['English']]: 5
        },
        difficulty_distribution: { easy: 0.3, medium: 0.5, hard: 0.2 },
        enable_negative_marking: true,
        negative_marking_ratio: 0.25,
        is_public: true,
        is_active: true,
        shuffle_questions: true,
        shuffle_options: true,
        show_result_immediately: true,
        show_score_immediately: true,
        show_correct_answers: true,
        show_explanations: true,
        meta_data: { testType: 'weekly_full' }
      },
      // Daily Quiz
      {
        name: 'Daily Math Challenge',
        code: 'DAILY_MATH_001',
        description: 'Short daily practice quiz to keep your math skills sharp',
        test_type: 'quiz',
        test_category: 'daily',
        duration_minutes: 20,
        total_questions: 15,
        questions_per_page: 15,
        passing_percentage: 60.00,
        domain_distribution: { [domainLookup['Mathematics']]: 15 },
        difficulty_distribution: { easy: 0.5, medium: 0.4, hard: 0.1 },
        enable_negative_marking: false,
        negative_marking_ratio: 0.00,
        is_public: true,
        is_active: true,
        shuffle_questions: true,
        shuffle_options: true,
        show_result_immediately: true,
        show_score_immediately: true,
        show_correct_answers: true,
        show_explanations: true,
        meta_data: { testType: 'daily_quiz' }
      },
      // Mini Quiz
      {
        name: 'Quick Physics Check',
        code: 'MINI_PHYS_001',
        description: 'Quick assessment with few questions to test basic physics concepts',
        test_type: 'quiz',
        test_category: 'quick',
        duration_minutes: 10,
        total_questions: 8,
        questions_per_page: 8,
        passing_percentage: 70.00,
        domain_distribution: { [domainLookup['Physics']]: 8 },
        difficulty_distribution: { easy: 0.7, medium: 0.3, hard: 0.0 },
        enable_negative_marking: false,
        negative_marking_ratio: 0.00,
        is_public: true,
        is_active: true,
        shuffle_questions: true,
        shuffle_options: true,
        show_result_immediately: true,
        show_score_immediately: true,
        show_correct_answers: true,
        show_explanations: true,
        meta_data: { testType: 'mini_quiz' }
      },
      // Additional Practice Set (different subject)
      {
        name: 'English Grammar & Vocabulary',
        code: 'ENG_GRAM_001',
        description: 'Practice set focusing on English grammar rules and vocabulary building',
        test_type: 'practice',
        test_category: 'language',
        duration_minutes: 60,
        total_questions: 35,
        questions_per_page: 35,
        passing_percentage: 60.00,
        domain_distribution: { [domainLookup['English']]: 35 },
        difficulty_distribution: { easy: 0.4, medium: 0.5, hard: 0.1 },
        enable_negative_marking: false,
        negative_marking_ratio: 0.00,
        is_public: true,
        is_active: true,
        shuffle_questions: true,
        shuffle_options: true,
        show_result_immediately: true,
        show_score_immediately: true,
        show_correct_answers: true,
        show_explanations: true,
        meta_data: { testType: 'practice' }
      },
      // Biology Domain Specific
      {
        name: 'Biology Comprehensive Review',
        code: 'BIO_COMP_001',
        description: 'Comprehensive biology test covering botany and zoology concepts',
        test_type: 'practice',
        test_category: 'academic',
        duration_minutes: 90,
        total_questions: 50,
        questions_per_page: 25,
        passing_percentage: 40.00,
        domain_distribution: { 
          [domainLookup['Botany']]: 25,
          [domainLookup['Zoology']]: 25
        },
        difficulty_distribution: { easy: 0.3, medium: 0.5, hard: 0.2 },
        enable_negative_marking: true,
        negative_marking_ratio: 0.25,
        is_public: true,
        is_active: true,
        shuffle_questions: true,
        shuffle_options: true,
        show_result_immediately: true,
        show_score_immediately: true,
        show_correct_answers: true,
        show_explanations: true,
        meta_data: { testType: 'domain_specific' }
      }
    ];

    // Filter out tests for domains that don't exist
    const validTests = sampleTests.filter(test => {
      const domainIds = Object.keys(test.domain_distribution);
      return domainIds.every(id => id !== 'undefined' && id !== null);
    });

    if (validTests.length === 0) {
      logger.warn('No valid test configurations to insert - missing domain mappings');
      return NextResponse.json({ 
        success: false, 
        error: 'No valid test configurations - domains not found',
        availableDomains: domains.map(d => d.name)
      });
    }

    // Insert the test configurations
    const { data: insertedConfigs, error: insertError } = await supabaseAdmin
      .from('test_configurations')
      .insert(validTests)
      .select();

    if (insertError) {
      logger.error('Error inserting test configurations', { error: insertError });
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to insert test configurations',
        details: insertError.message 
      });
    }

    logger.info('Successfully created sample test configurations', { 
      count: insertedConfigs.length 
    });

    return NextResponse.json({
      success: true,
      message: `Created ${insertedConfigs.length} sample test configurations`,
      configs: insertedConfigs.map(config => ({
        id: config.id,
        name: config.name,
        code: config.code,
        testType: config.meta_data?.testType || 'practice',
        duration: config.duration_minutes,
        questions: config.total_questions
      }))
    });

  } catch (error) {
    logger.error('Sample Live Tests API Error', { error: error.message });
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
} 