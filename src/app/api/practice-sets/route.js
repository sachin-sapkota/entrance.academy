import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request) {
  try {
    // Use service role client to bypass RLS for public data
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Fetch live practice sets (published and active)
    const { data: practiceSets, error } = await supabase
      .from('practice_sets')
      .select('*')
      .eq('status', 'published')
      .eq('is_live', true)
      .is('code', null) 
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching practice sets:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch practice sets' },
        { status: 500 }
      );
    }

    // Transform the data for frontend consumption
    const transformedPracticeSets = (practiceSets || []).map(set => ({
      id: set.id,
      title: set.title,
      description: set.description,
      domains: set.domains || [],
      questionsCount: set.questions_count || 0,
      estimatedTime: set.estimated_time_minutes || 60,
      difficulty: set.difficulty_level || 'mixed',
      tags: set.tags || [],
      stats: {
        viewCount: set.view_count || 0,
        attemptCount: set.attempt_count || 0,
        averageScore: set.average_score || 0
      },
      createdAt: set.created_at,
      updatedAt: set.updated_at
    }));

    return NextResponse.json({
      success: true,
      practiceSets: transformedPracticeSets,
      count: transformedPracticeSets.length
    });

  } catch (error) {
    console.error('Practice sets API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 