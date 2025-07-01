import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// POST - Submit feedback
export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      name, 
      email, 
      rating, 
      recommendation, 
      message, 
      user_id,
      feedback_type = 'general',
      page_url 
    } = body;

    // Validate required fields
    if (!message || message.trim().length === 0) {
      return NextResponse.json({ 
        error: 'Message is required' 
      }, { status: 400 });
    }

    // Get user agent and other request info
    const userAgent = request.headers.get('user-agent') || '';
    
    // Prepare feedback data
    const feedbackData = {
      message: message.trim(),
      feedback_type,
      user_agent: userAgent,
      page_url,
      created_at: new Date().toISOString()
    };

    // Add user info if authenticated
    if (user_id) {
      feedbackData.user_id = user_id;
    } else {
      // For anonymous feedback
      if (name) feedbackData.name = name.trim();
      if (email) feedbackData.email = email.trim();
    }

    // Add optional fields
    if (rating !== undefined && rating >= 1 && rating <= 5) {
      feedbackData.rating = rating;
    }
    
    if (recommendation !== undefined) {
      feedbackData.recommendation = recommendation;
    }

    // Insert feedback into database
    const { data: feedback, error } = await supabase
      .from('feedback_submissions')
      .insert(feedbackData)
      .select('id, created_at, status')
      .single();

    if (error) {
      console.error('Error inserting feedback:', error);
      return NextResponse.json({ 
        error: 'Failed to submit feedback' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Feedback submitted successfully',
      feedback: {
        id: feedback.id,
        status: feedback.status,
        submitted_at: feedback.created_at
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/feedback:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// GET - Get feedback (for admins or user's own feedback)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit')) || 20;
    const offset = parseInt(searchParams.get('offset')) || 0;

    let query = supabase
      .from('feedback_submissions')
      .select(`
        id,
        name,
        email,
        rating,
        recommendation,
        message,
        feedback_type,
        status,
        priority,
        page_url,
        created_at,
        user:users(full_name, email)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by user if specified
    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    // Filter by status if specified
    if (status) {
      query = query.eq('status', status);
    }

    const { data: feedbacks, error } = await query;

    if (error) {
      console.error('Error fetching feedback:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch feedback' 
      }, { status: 500 });
    }

    return NextResponse.json({
      feedbacks,
      hasMore: feedbacks.length === limit
    });

  } catch (error) {
    console.error('Error in GET /api/feedback:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 