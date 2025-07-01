import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../../../lib/logger';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    logger.info('Starting cleanup of sample/mock test data');
    
    // Define patterns that identify sample/mock data
    const samplePatterns = [
      '%sample%',
      '%mock%',
      '%english%communication%skills%',
      '%foundation%test%',
      '%model%exam%',
      '%quick%practice%',
      '%assessment%',
      '%demo%',
      '%test%data%',
      '%example%',
      'MATH_PRACTICE_001',
      'FULL_SYL_001',
      'PHYS_MECH_001',
      'WEEK_CHEM_001',
      'WEEK_FULL_001',
      'DAILY_MATH_001',
      'MINI_PHYS_001',
      'ENG_GRAM_001',
      'BIO_COMP_001',
      'MATH_COMP_001',
      'PHYS_QUICK_001',
      'CHEM_MOCK_001',
      'MIX_SCI_001',
      'ENG_COMM_001'
    ];

    let totalDeleted = 0;

    // Clean up test configurations
    for (const pattern of samplePatterns) {
      // Delete by name pattern
      const { data: deletedByName, error: nameError } = await supabaseAdmin
        .from('test_configurations')
        .delete()
        .ilike('name', pattern)
        .select('id');

      if (nameError) {
        logger.warn('Error deleting test configurations by name pattern', { pattern, error: nameError });
      } else if (deletedByName) {
        totalDeleted += deletedByName.length;
        logger.info('Deleted test configurations by name', { pattern, count: deletedByName.length });
      }

      // Delete by code pattern
      const { data: deletedByCode, error: codeError } = await supabaseAdmin
        .from('test_configurations')
        .delete()
        .ilike('code', pattern)
        .select('id');

      if (codeError) {
        logger.warn('Error deleting test configurations by code pattern', { pattern, error: codeError });
      } else if (deletedByCode) {
        totalDeleted += deletedByCode.length;
        logger.info('Deleted test configurations by code', { pattern, count: deletedByCode.length });
      }

      // Delete by description pattern
      const { data: deletedByDesc, error: descError } = await supabaseAdmin
        .from('test_configurations')
        .delete()
        .ilike('description', pattern)
        .select('id');

      if (descError) {
        logger.warn('Error deleting test configurations by description pattern', { pattern, error: descError });
      } else if (deletedByDesc) {
        totalDeleted += deletedByDesc.length;
        logger.info('Deleted test configurations by description', { pattern, count: deletedByDesc.length });
      }
    }

    // Clean up practice sets
    let practiceSetDeleted = 0;
    for (const pattern of samplePatterns) {
      // Delete practice sets by title pattern
      const { data: deletedPracticeByTitle, error: practiceError } = await supabaseAdmin
        .from('practice_sets')
        .delete()
        .ilike('title', pattern)
        .select('id');

      if (practiceError) {
        logger.warn('Error deleting practice sets by title pattern', { pattern, error: practiceError });
      } else if (deletedPracticeByTitle) {
        practiceSetDeleted += deletedPracticeByTitle.length;
        logger.info('Deleted practice sets by title', { pattern, count: deletedPracticeByTitle.length });
      }

      // Delete practice sets by description pattern
      const { data: deletedPracticeByDesc, error: practiceDescError } = await supabaseAdmin
        .from('practice_sets')
        .delete()
        .ilike('description', pattern)
        .select('id');

      if (practiceDescError) {
        logger.warn('Error deleting practice sets by description pattern', { pattern, error: practiceDescError });
      } else if (deletedPracticeByDesc) {
        practiceSetDeleted += deletedPracticeByDesc.length;
        logger.info('Deleted practice sets by description', { pattern, count: deletedPracticeByDesc.length });
      }
    }

    // Clean up any practice sets with "Untitled" in the name (common for drafts)
    const { data: deletedUntitled, error: untitledError } = await supabaseAdmin
      .from('practice_sets')
      .delete()
      .ilike('title', '%untitled%')
      .select('id');

    if (!untitledError && deletedUntitled) {
      practiceSetDeleted += deletedUntitled.length;
      logger.info('Deleted untitled practice sets', { count: deletedUntitled.length });
    }

    // Clean up any orphaned tests (tests without valid test_config_id)
    const { data: orphanedTests, error: orphanError } = await supabaseAdmin
      .from('tests')
      .delete()
      .is('test_config_id', null)
      .select('id');

    let orphanedCount = 0;
    if (!orphanError && orphanedTests) {
      orphanedCount = orphanedTests.length;
      logger.info('Deleted orphaned tests', { count: orphanedTests.length });
    }

    // Clean up any test sessions for deleted tests
    const { data: orphanedSessions, error: sessionError } = await supabaseAdmin
      .rpc('delete_orphaned_sessions');

    logger.info('Cleanup completed successfully', {
      testConfigurationsDeleted: totalDeleted,
      practiceSetsDeleted: practiceSetDeleted,
      orphanedTestsDeleted: orphanedCount,
      totalItemsRemoved: totalDeleted + practiceSetDeleted + orphanedCount
    });

    return NextResponse.json({
      success: true,
      message: `Cleanup completed successfully`,
      details: {
        testConfigurationsDeleted: totalDeleted,
        practiceSetsDeleted: practiceSetDeleted,
        orphanedTestsDeleted: orphanedCount,
        totalItemsRemoved: totalDeleted + practiceSetDeleted + orphanedCount
      }
    });

  } catch (error) {
    logger.error('Cleanup operation failed', { error: error.message });
    return NextResponse.json({ 
      success: false, 
      error: 'Cleanup operation failed',
      details: error.message 
    }, { status: 500 });
  }
} 