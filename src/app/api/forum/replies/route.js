import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// POST - Create new forum reply
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
    const { topic_id, content, author_id, parent_reply_id } = body;

    // Validate required fields
    if (!topic_id || !content || !author_id) {
      return NextResponse.json({ 
        error: 'Missing required fields: topic_id, content, author_id' 
      }, { status: 400 });
    }

    // Ensure the authenticated user matches the author_id
    if (user.id !== author_id) {
      return NextResponse.json({ error: 'Unauthorized: User ID mismatch' }, { status: 403 });
    }

    // Check if topic exists and is active
    const { data: topic, error: topicError } = await supabase
      .from('forum_topics')
      .select('id')
      .eq('id', topic_id)
      .eq('is_active', true)
      .single();

    if (topicError || !topic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    // If replying to another reply, check if parent reply exists
    if (parent_reply_id) {
      const { data: parentReply, error: parentError } = await supabase
        .from('forum_replies')
        .select('id')
        .eq('id', parent_reply_id)
        .eq('is_active', true)
        .single();

      if (parentError || !parentReply) {
        return NextResponse.json({ error: 'Parent reply not found' }, { status: 404 });
      }
    }

    // Insert new reply
    const { data: reply, error } = await supabase
      .from('forum_replies')
      .insert({
        topic_id,
        content: content.trim(),
        author_id,
        parent_reply_id: parent_reply_id || null,
        is_active: true
      })
      .select(`
        id,
        content,
        created_at,
        updated_at,
        parent_reply_id,
        author:users!author_id (
          id,
          full_name,
          role
        )
      `)
      .single();

    if (error) {
      console.error('Error creating reply:', error);
      return NextResponse.json({ error: 'Failed to create reply' }, { status: 500 });
    }

    // Update topic's updated_at timestamp to bump it in recent discussions
    await supabase
      .from('forum_topics')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', topic_id);

    return NextResponse.json({ 
      reply: {
        ...reply,
        likes_count: 0,
        nested_replies: []
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/forum/replies:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 