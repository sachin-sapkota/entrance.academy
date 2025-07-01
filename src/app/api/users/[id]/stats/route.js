import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request, { params }) {
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

    const resolvedParams = await params;
    const userId = resolvedParams.id;
    
    // Check if requesting user is viewing their own stats or is admin
    if (user.id !== userId) {
      return NextResponse.json({ 
        error: 'Unauthorized access - user ID mismatch' 
      }, { status: 403 });
    }

    // Fetch completed tests (both evaluated and submitted)
    const { data: tests, error: testsError } = await supabaseAdmin
      .from('tests')
      .select('*')
      .eq('user_id', userId)
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
      studyStreak: 0,
      recentTests: [],
      performanceByDomain: {},
      weeklyProgress: [],
      totalQuestions: 0,
      correctAnswers: 0,
      accuracy: 0
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

      // Get recent tests (last 5)
      stats.recentTests = tests.slice(0, 5).map(test => ({
        id: test.id,
        name: test.test_name,
        date: test.submitted_at,
        score: Math.round(test.percentage || 0),
        questions: test.total_questions,
        correct: test.correct_answers,
        timeSpent: test.time_spent_seconds
      }));

      // Calculate total questions and accuracy
      stats.totalQuestions = tests.reduce((total, test) => total + (test.total_questions || 0), 0);
      stats.correctAnswers = tests.reduce((total, test) => total + (test.correct_answers || 0), 0);
      stats.accuracy = stats.totalQuestions > 0 
        ? Math.round((stats.correctAnswers / stats.totalQuestions) * 100) 
        : 0;

      // Calculate performance by domain
      tests.forEach(test => {
        if (test.domain_scores) {
          Object.entries(test.domain_scores).forEach(([domainId, score]) => {
            if (!stats.performanceByDomain[domainId]) {
              stats.performanceByDomain[domainId] = {
                totalAttempts: 0,
                totalScore: 0,
                averageScore: 0
              };
            }
            stats.performanceByDomain[domainId].totalAttempts++;
            stats.performanceByDomain[domainId].totalScore += score.score || 0;
          });
        }
      });

      // Calculate average scores by domain
      Object.keys(stats.performanceByDomain).forEach(domainId => {
        const domain = stats.performanceByDomain[domainId];
        domain.averageScore = Math.round(domain.totalScore / domain.totalAttempts);
      });

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

      // Calculate weekly progress (last 4 weeks)
      const fourWeeksAgo = new Date();
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
      
      const weeklyTests = tests.filter(t => new Date(t.submitted_at) >= fourWeeksAgo);
      const weeks = {};
      
      weeklyTests.forEach(test => {
        const weekStart = getWeekStart(new Date(test.submitted_at));
        const weekKey = weekStart.toISOString().split('T')[0];
        
        if (!weeks[weekKey]) {
          weeks[weekKey] = {
            week: weekKey,
            tests: 0,
            averageScore: 0,
            scores: []
          };
        }
        
        weeks[weekKey].tests++;
        weeks[weekKey].scores.push(test.percentage || 0);
      });

      // Calculate weekly averages
      stats.weeklyProgress = Object.values(weeks).map(week => ({
        ...week,
        averageScore: Math.round(week.scores.reduce((a, b) => a + b, 0) / week.scores.length)
      })).sort((a, b) => a.week.localeCompare(b.week));
    }

    // Fetch user performance analytics if available
    const { data: analytics } = await supabaseAdmin
      .from('user_performance_analytics')
      .select('*')
      .eq('user_id', userId);

    return NextResponse.json({
      success: true,
      stats,
      analytics: analytics || []
    });

  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  return new Date(d.setDate(diff));
} 