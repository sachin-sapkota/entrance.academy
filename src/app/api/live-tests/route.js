import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../../../lib/logger';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    logger.info('Fetching available live tests');

    // Get available test configurations that are public and active
    // Exclude sample/mock data by filtering out common sample patterns
    const { data: testConfigs, error: configError } = await supabaseAdmin
      .from('test_configurations')
      .select(`
        *,
        domains:domain_distribution
      `)
      .eq('is_active', true)
      .eq('is_public', true)
      .or('available_from.is.null,available_from.lte.now()')
      .or('available_until.is.null,available_until.gte.now()')
      // Exclude sample/mock data patterns
      .not('name', 'ilike', '%sample%')
      .not('name', 'ilike', '%mock%')
      .not('name', 'ilike', '%test%english%communication%skills%')
      .not('name', 'ilike', '%foundation%test%')
      .not('code', 'ilike', '%sample%')
      .not('code', 'ilike', '%mock%')
      .not('code', 'ilike', '%test%')
      .order('created_at', { ascending: false });

    if (configError) {
      logger.error('Error fetching test configurations', { error: configError });
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch test configurations' 
      }, { status: 500 });
    }

    // Additional filtering for sample data patterns in JavaScript
    const filteredTestConfigs = (testConfigs || []).filter(config => {
      const name = (config.name || '').toLowerCase();
      const code = (config.code || '').toLowerCase();
      const description = (config.description || '').toLowerCase();
      
      // Exclude common sample data patterns
      const samplePatterns = [
        'sample',
        'mock',
        'english communication skills',
        'foundation test',
        'model exam',
        'quick practice',
        'assessment',
        'demo',
        'test data',
        'example'
      ];
      
      // Check if any sample pattern is found in name, code, or description
      return !samplePatterns.some(pattern => 
        name.includes(pattern) || 
        code.includes(pattern) || 
        description.includes(pattern)
      );
    });

    // Get practice sets that are live (excluding sample data)
    const { data: practiceSets, error: practiceError } = await supabaseAdmin
      .from('practice_sets')
      .select('*')
      .eq('is_live', true)
      .eq('status', 'published')
      .not('title', 'ilike', '%sample%')
      .not('title', 'ilike', '%mock%')
      .not('title', 'ilike', '%test%')
      .not('title', 'ilike', '%demo%')
      .order('created_at', { ascending: false });

    if (practiceError) {
      logger.warn('Error fetching practice sets', { error: practiceError });
    }

    // Additional filtering for practice sets
    const filteredPracticeSets = (practiceSets || []).filter(practiceSet => {
      const title = (practiceSet.title || '').toLowerCase();
      const description = (practiceSet.description || '').toLowerCase();
      
      const samplePatterns = [
        'sample',
        'mock',
        'demo',
        'test data',
        'example',
        'untitled'
      ];
      
      return !samplePatterns.some(pattern => 
        title.includes(pattern) || 
        description.includes(pattern)
      );
    });

    // Get domain information
    const { data: domains, error: domainError } = await supabaseAdmin
      .from('domains')
      .select('id, name, code, color_code')
      .eq('is_active', true);

    if (domainError) {
      logger.error('Error fetching domains', { error: domainError });
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch domains' 
      }, { status: 500 });
    }

    // Create domain lookup
    const domainLookup = domains.reduce((acc, domain) => {
      acc[domain.id] = domain;
      return acc;
    }, {});

    // Get real participant counts and ratings from the database
    const testIds = filteredTestConfigs.map(config => config.id);
    
    // Get actual participant counts for each test configuration
    const { data: participantCounts, error: participantError } = await supabaseAdmin
      .from('tests')
      .select('test_config_id, user_id')
      .in('test_config_id', testIds)
      .not('user_id', 'is', null);

    // Count participants per test config
    const participantLookup = {};
    if (participantCounts && !participantError) {
      participantCounts.forEach(test => {
        const configId = test.test_config_id;
        participantLookup[configId] = (participantLookup[configId] || 0) + 1;
      });
    }

    // Helper function to determine test type based on various factors
    const determineTestType = (config) => {
      // First check if test type is explicitly set in metadata
      const metaData = config.meta_data || {};
      if (metaData.testType) {
        return metaData.testType;
      }

      // Check the test_type field
      if (config.test_type) {
        const typeMapping = {
          'practice': 'practice',
          'mock': 'full_syllabus',
          'actual': 'full_syllabus',
          'quiz': 'daily_quiz'
        };
        if (typeMapping[config.test_type]) {
          return typeMapping[config.test_type];
        }
      }

      // Determine by question count and duration
      const questionCount = config.total_questions || 50;
      const duration = config.duration_minutes || 120;

      if (questionCount <= 10) {
        return 'mini_quiz';
      } else if (questionCount <= 20 && duration <= 30) {
        return 'daily_quiz';
      } else if (questionCount >= 100 || duration >= 180) {
        return 'full_syllabus';
      } else if (config.test_category === 'weekly') {
        return questionCount >= 50 ? 'weekly_full' : 'weekly_domain';
      } else if (config.domain_distribution && Object.keys(config.domain_distribution).length === 1) {
        return 'domain_specific';
      } else {
        return 'practice';
      }
    };

    // Process test configurations into live tests format
    const liveTests = filteredTestConfigs.map(config => {
      // Get primary domain for the test
      let primaryDomain = 'Mixed';
      let domainDistribution = config.domain_distribution || {};
      
      if (typeof domainDistribution === 'object' && Object.keys(domainDistribution).length > 0) {
        // Find the domain with the most questions
        const primaryDomainId = Object.keys(domainDistribution).reduce((a, b) => 
          domainDistribution[a] > domainDistribution[b] ? a : b
        );
        primaryDomain = domainLookup[primaryDomainId]?.name || 'Mixed';
      }

      // Calculate estimated time based on duration
      const totalMinutes = config.duration_minutes || 120;
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      
      let estimatedTime;
      if (hours > 0) {
        estimatedTime = minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
      } else {
        estimatedTime = `${minutes}m`;
      }

      // Determine test type using the new logic
      const testType = determineTestType(config);

      // Determine difficulty based on configuration
      let difficulty = 'medium';
      const difficultyDist = config.difficulty_distribution || {};
      if (difficultyDist.hard && difficultyDist.hard > 0.4) {
        difficulty = 'hard';
      } else if (difficultyDist.easy && difficultyDist.easy > 0.5) {
        difficulty = 'easy';
      }

      // Get real participant count
      const participantCount = participantLookup[config.id] || 0;

      return {
        id: config.id,
        name: config.name || `${primaryDomain} Test`,
        domain: primaryDomain,
        type: testType,
        testType: testType, // Include both for compatibility
        difficulty: difficulty,
        duration: config.duration_minutes || 120,
        questions: config.total_questions || 50,
        participants: participantCount,
        description: config.description || `Test covering ${primaryDomain} topics with ${config.total_questions} questions`,
        isLive: true,
        estimatedTime: estimatedTime,
        featured: config.is_featured || false,
        config: {
          id: config.id,
          code: config.code,
          passingPercentage: config.passing_percentage,
          negativeMarking: config.enable_negative_marking,
          instructions: config.instructions
        }
      };
    });

    // Add practice sets as live tests
    const practiceSetTests = filteredPracticeSets.map(practiceSet => {
      const metaData = practiceSet.meta_data || {};
      const testType = metaData.testType || 'practice';
      
      // Get primary domain from domains array
      const primaryDomain = practiceSet.domains && practiceSet.domains.length > 0 
        ? practiceSet.domains[0] 
        : 'Mixed';

      const totalMinutes = metaData.duration || practiceSet.estimated_time_minutes || 60;
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      
      let estimatedTime;
      if (hours > 0) {
        estimatedTime = minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
      } else {
        estimatedTime = `${minutes}m`;
      }

      return {
        id: practiceSet.id,
        name: practiceSet.title,
        domain: primaryDomain,
        type: testType,
        testType: testType,
        difficulty: metaData.difficulty || practiceSet.difficulty_level || 'medium',
        duration: totalMinutes,
        questions: practiceSet.questions_count || metaData.totalQuestions || 50,
        participants: practiceSet.attempt_count || 0,
        description: practiceSet.description || `Practice set for ${primaryDomain}`,
        isLive: true,
        estimatedTime: estimatedTime,
        featured: false,
        config: {
          id: practiceSet.id,
          code: practiceSet.code,
          passingPercentage: practiceSet.passing_percentage || 40,
          negativeMarking: metaData.enableNegativeMarking || false,
          instructions: metaData.instructions || ''
        }
      };
    });

    // Combine all tests
    const allTests = [...liveTests, ...practiceSetTests];

    logger.info('Successfully fetched live tests (excluding sample data)', { 
      totalConfigsFound: testConfigs?.length || 0,
      filteredConfigs: liveTests.length,
      totalPracticeSetsFound: practiceSets?.length || 0,
      filteredPracticeSets: practiceSetTests.length,
      finalTestCount: allTests.length
    });

    return NextResponse.json({
      success: true,
      tests: allTests,
      totalCount: allTests.length
    });

  } catch (error) {
    logger.error('Live Tests API Error', { error: error.message });
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 