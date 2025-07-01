import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    console.log('🔍 Checking all test-related data...');

    // Check test_configurations
    const { data: testConfigs, error: configError } = await supabaseAdmin
      .from('test_configurations')
      .select('*')
      .order('created_at', { ascending: false });

    // Check practice_sets  
    const { data: practiceSets, error: practiceError } = await supabaseAdmin
      .from('practice_sets')
      .select('*')
      .order('created_at', { ascending: false });

    // Check tests (actual test instances)
    const { data: tests, error: testsError } = await supabaseAdmin
      .from('tests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    console.log('Test configurations found:', testConfigs?.length || 0);
    console.log('Practice sets found:', practiceSets?.length || 0);
    console.log('Test instances found:', tests?.length || 0);

    return NextResponse.json({
      success: true,
      data: {
        testConfigurations: testConfigs || [],
        practiceSets: practiceSets || [],
        testInstances: tests || [],
        summary: {
          totalConfigs: testConfigs?.length || 0,
          totalPracticeSets: practiceSets?.length || 0,
          totalTestInstances: tests?.length || 0
        }
      }
    });

  } catch (error) {
    console.error('❌ Debug API Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
} 