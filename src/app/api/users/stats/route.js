import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    // Get auth header
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        error: 'Authorization header missing or invalid' 
      }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify the token with Supabase
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Invalid token',
        details: authError?.message 
      }, { status: 401 });
    }

    // Fetch completed tests (both evaluated and submitted)
    const { data: tests, error: testsError } = await supabaseAdmin
      .from('tests')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['evaluated', 'submitted'])
      .order('submitted_at', { ascending: false });

    if (testsError) {
      console.error('Error fetching tests:', testsError);
      return NextResponse.json({ error: 'Failed to fetch tests' }, { status: 500 });
    }

    // Calculate statistics
    const stats = {
      totalTests: tests?.length || 0,
      completedTests: tests?.filter(t => t.status === 'evaluated' || t.status === 'submitted').length || 0,
      averageScore: 0,
      bestScore: 0,
      totalTimeSpent: 0,
      studyStreak: 0
    };

    if (tests && tests.length > 0) {
      // Calculate scores
      const scores = tests.map(t => t.percentage || 0);
      stats.averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      stats.bestScore = Math.round(Math.max(...scores));
      
      // Calculate total time spent
      stats.totalTimeSpent = tests.reduce((total, test) => {
        return total + (test.time_spent_seconds || 0);
      }, 0);

      // Calculate study streak - count consecutive days with tests from most recent backwards
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset to start of day
      
      // Get all test dates sorted descending
      const testDates = tests
        .map(t => {
          const date = new Date(t.submitted_at);
          date.setHours(0, 0, 0, 0);
          return date.getTime();
        })
        .sort((a, b) => b - a); // Most recent first
      
      const uniqueDates = [...new Set(testDates)];
      
      if (uniqueDates.length === 0) {
        stats.studyStreak = 0;
      } else {
        let streak = 0;
        let checkDate = new Date(today);
        
        // Start from today and go backwards
        for (let i = 0; i < 365; i++) { // Check up to a year
          const checkTime = checkDate.getTime();
          
          if (uniqueDates.includes(checkTime)) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else if (i === 0) {
            // If no test today, check if yesterday had a test to continue streak
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            // Streak broken
            break;
          }
        }
        
        stats.studyStreak = streak;
      }
    }

    return NextResponse.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
} 