import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET - Get forum statistics
export async function GET() {
  try {
    // Get overall forum statistics
    const { data: stats, error: statsError } = await supabase
      .rpc('get_forum_stats');

    if (statsError) {
      console.error('Error fetching forum stats:', statsError);
      return NextResponse.json({ error: 'Failed to fetch forum stats' }, { status: 500 });
    }

    // Get category counts
    const { data: categoryCounts, error: categoryError } = await supabase
      .rpc('get_forum_category_counts');

    if (categoryError) {
      console.error('Error fetching category counts:', categoryError);
      return NextResponse.json({ error: 'Failed to fetch category counts' }, { status: 500 });
    }

    // Structure the response
    const categories = [
      { 
        value: 'all', 
        label: 'All Topics', 
        count: stats.total_topics 
      },
      { 
        value: 'general', 
        label: 'General', 
        count: categoryCounts.general || 0 
      },
      { 
        value: 'help', 
        label: 'Help & Support', 
        count: categoryCounts.help || 0 
      },
      { 
        value: 'study', 
        label: 'Study Tips', 
        count: categoryCounts.study || 0 
      },
      { 
        value: 'suggestions', 
        label: 'Feature Requests', 
        count: categoryCounts.suggestions || 0 
      },
      { 
        value: 'technical', 
        label: 'Technical Issues', 
        count: categoryCounts.technical || 0 
      }
    ];

    return NextResponse.json({
      stats: {
        total_topics: stats.total_topics,
        total_replies: stats.total_replies,
        active_users: stats.active_users,
        todays_posts: stats.todays_posts
      },
      categories
    });

  } catch (error) {
    console.error('Error in GET /api/forum/stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 