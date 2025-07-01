import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

// This endpoint can be called periodically to make tests live
// It checks all scheduled tests and activates them if their time has come
export async function POST(request) {
  try {
    const now = new Date().toISOString();
    
    // Get all scheduled tests that should be live now
    const { data: testsToActivate, error: fetchError } = await supabaseAdmin
      .from('test_configurations')
      .select('*')
      .eq('test_type', 'scheduled')
      .eq('is_active', true)
      .lte('available_from', now)
      .gte('available_until', now);

    if (fetchError) {
      console.error('Error fetching tests to activate:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    const activatedTests = [];

    // For each test that should be live, create test instances for registered users
    for (const testConfig of testsToActivate) {
      try {
        // Check if we have questions for this test
        if (!testConfig.questions_order || testConfig.questions_order.length === 0) {
          console.log(`Test ${testConfig.id} has no questions, skipping activation`);
          continue;
        }

        // In a real application, you would:
        // 1. Get all registered users for this test
        // 2. Create test instances in the 'tests' table for each user
        // 3. Set up the test sessions
        
        // For now, we'll just mark that the test is ready to be taken
        const { data: updatedTest, error: updateError } = await supabaseAdmin
          .from('test_configurations')
          .update({
            // Add any status fields if needed
            meta_data: {
              ...testConfig.meta_data,
              auto_activated_at: now,
              status: 'live'
            }
          })
          .eq('id', testConfig.id)
          .select()
          .single();

        if (updateError) {
          console.error(`Error updating test ${testConfig.id}:`, updateError);
          continue;
        }

        activatedTests.push(updatedTest);
        console.log(`Test ${testConfig.id} (${testConfig.name}) is now live`);
        
      } catch (testError) {
        console.error(`Error processing test ${testConfig.id}:`, testError);
        continue;
      }
    }

    // Also check for tests that should be closed (past available_until)
    const { data: testsToClose, error: closeError } = await supabaseAdmin
      .from('test_configurations')
      .select('*')
      .eq('test_type', 'scheduled')
      .eq('is_active', true)
      .lt('available_until', now);

    if (!closeError && testsToClose.length > 0) {
      for (const testConfig of testsToClose) {
        await supabaseAdmin
          .from('test_configurations')
          .update({
            meta_data: {
              ...testConfig.meta_data,
              auto_closed_at: now,
              status: 'closed'
            }
          })
          .eq('id', testConfig.id);
      }
    }

    return NextResponse.json({
      message: 'Test activation check completed',
      activated: activatedTests.length,
      closed: testsToClose?.length || 0,
      activatedTests: activatedTests.map(t => ({
        id: t.id,
        name: t.name,
        available_from: t.available_from
      }))
    });

  } catch (error) {
    console.error('Error in test activation:', error);
    return NextResponse.json({
      error: 'Failed to activate tests'
    }, { status: 500 });
  }
}

// GET endpoint to check which tests are ready to go live
export async function GET() {
  try {
    const now = new Date().toISOString();
    
    const { data: upcomingTests, error } = await supabaseAdmin
      .from('test_configurations')
      .select('id, name, available_from, available_until, is_active')
      .eq('test_type', 'scheduled')
      .eq('is_active', true)
      .order('available_from', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const categorizedTests = {
      readyToGo: [],
      live: [],
      upcoming: [],
      closed: []
    };

    upcomingTests.forEach(test => {
      const availableFrom = new Date(test.available_from);
      const availableUntil = new Date(test.available_until);
      const nowDate = new Date(now);

      if (nowDate >= availableFrom && nowDate <= availableUntil) {
        categorizedTests.live.push(test);
      } else if (nowDate < availableFrom) {
        categorizedTests.upcoming.push(test);
      } else if (nowDate > availableUntil) {
        categorizedTests.closed.push(test);
      }
    });

    return NextResponse.json({
      current_time: now,
      ...categorizedTests
    });

  } catch (error) {
    console.error('Error checking test status:', error);
    return NextResponse.json({
      error: 'Failed to check test status'
    }, { status: 500 });
  }
}