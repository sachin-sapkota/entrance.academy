import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET - List all forum topics
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'recent';
    const limit = parseInt(searchParams.get('limit')) || 20;
    const offset = parseInt(searchParams.get('offset')) || 0;

    let query = supabase
      .from('forum_topics')
      .select(`
        id,
        title,
        content,
        category,
        tags,
        is_pinned,
        views,
        created_at,
        updated_at,
        author:users!author_id (
          id,
          full_name,
          role
        ),
        replies:forum_replies(count),
        likes:forum_topic_likes(count)
      `)
      .eq('is_active', true);

    // Apply filters
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%,tags.cs.{${search}}`);
    }

    // Apply sorting
    switch (sortBy) {
      case 'popular':
        query = query.order('likes_count', { ascending: false });
        break;
      case 'replied':
        query = query.order('replies_count', { ascending: false });
        break;
      case 'views':
        query = query.order('views', { ascending: false });
        break;
      default: // recent
        query = query.order('updated_at', { ascending: false });
    }

    query = query.range(offset, offset + limit - 1);

    const { data: topics, error } = await query;

    if (error) {
      console.error('Error fetching topics:', error);
      return NextResponse.json({ error: 'Failed to fetch topics' }, { status: 500 });
    }

    // Transform data to include counts
    const topicsWithCounts = topics.map(topic => ({
      ...topic,
      replies_count: topic.replies[0]?.count || 0,
      likes_count: topic.likes[0]?.count || 0
    }));

    return NextResponse.json({
      topics: topicsWithCounts,
      hasMore: topics.length === limit
    });

  } catch (error) {
    console.error('Error in GET /api/forum/topics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new forum topic
export async function POST(request) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, category, tags, author_id } = body;

    // Validate required fields
    if (!title || !content || !category || !author_id) {
      return NextResponse.json({ 
        error: 'Missing required fields: title, content, category, author_id' 
      }, { status: 400 });
    }

    // Ensure the authenticated user matches the author_id
    if (user.id !== author_id) {
      return NextResponse.json({ error: 'Unauthorized: User ID mismatch' }, { status: 403 });
    }

    // Insert new topic
    const { data: topic, error } = await supabase
      .from('forum_topics')
      .insert({
        title: title.trim(),
        content: content.trim(),
        category,
        tags: tags || [],
        author_id,
        views: 0,
        is_pinned: false,
        is_active: true
      })
      .select(`
        id,
        title,
        content,
        category,
        tags,
        is_pinned,
        views,
        created_at,
        updated_at,
        author:users!author_id (
          id,
          full_name,
          role
        )
      `)
      .single();

    if (error) {
      console.error('Error creating topic:', error);
      return NextResponse.json({ error: 'Failed to create topic' }, { status: 500 });
    }

    return NextResponse.json({ topic }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/forum/topics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 