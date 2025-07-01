import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET - Get specific forum topic with replies
export async function GET(request, { params }) {
  try {
    const topicId = params.id;

    // Get topic details
    const { data: topic, error: topicError } = await supabase
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
        )
      `)
      .eq('id', topicId)
      .eq('is_active', true)
      .single();

    if (topicError || !topic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    // Get replies for this topic
    const { data: replies, error: repliesError } = await supabase
      .from('forum_replies')
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
        ),
        likes:forum_reply_likes(count)
      `)
      .eq('topic_id', topicId)
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (repliesError) {
      console.error('Error fetching replies:', repliesError);
      return NextResponse.json({ error: 'Failed to fetch replies' }, { status: 500 });
    }

    // Get topic likes count
    const { count: likesCount } = await supabase
      .from('forum_topic_likes')
      .select('*', { count: 'exact', head: true })
      .eq('topic_id', topicId);

    // Increment view count
    await supabase
      .from('forum_topics')
      .update({ views: topic.views + 1 })
      .eq('id', topicId);

    // Structure replies with nested replies
    const structuredReplies = [];
    const replyMap = new Map();

    // First pass: create map of all replies
    replies.forEach(reply => {
      replyMap.set(reply.id, {
        ...reply,
        likes_count: reply.likes[0]?.count || 0,
        nested_replies: []
      });
    });

    // Second pass: organize into parent-child structure
    replies.forEach(reply => {
      const replyWithLikes = replyMap.get(reply.id);
      if (reply.parent_reply_id) {
        const parentReply = replyMap.get(reply.parent_reply_id);
        if (parentReply) {
          parentReply.nested_replies.push(replyWithLikes);
        }
      } else {
        structuredReplies.push(replyWithLikes);
      }
    });

    return NextResponse.json({
      topic: {
        ...topic,
        likes_count: likesCount || 0,
        replies_count: replies.length
      },
      replies: structuredReplies
    });

  } catch (error) {
    console.error('Error in GET /api/forum/topics/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update forum topic
export async function PUT(request, { params }) {
  try {
    const topicId = params.id;
    const body = await request.json();
    const { title, content, category, tags, user_id } = body;

    // Check if user is the author or admin
    const { data: topic, error: topicError } = await supabase
      .from('forum_topics')
      .select('author_id')
      .eq('id', topicId)
      .single();

    if (topicError || !topic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    // Get user role
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user_id)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check permissions
    if (topic.author_id !== user_id && user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update topic
    const { data: updatedTopic, error: updateError } = await supabase
      .from('forum_topics')
      .update({
        title: title?.trim(),
        content: content?.trim(),
        category,
        tags: tags || [],
        updated_at: new Date().toISOString()
      })
      .eq('id', topicId)
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

    if (updateError) {
      console.error('Error updating topic:', updateError);
      return NextResponse.json({ error: 'Failed to update topic' }, { status: 500 });
    }

    return NextResponse.json({ topic: updatedTopic });

  } catch (error) {
    console.error('Error in PUT /api/forum/topics/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete forum topic
export async function DELETE(request, { params }) {
  try {
    const topicId = params.id;
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');

    if (!user_id) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Check if user is the author or admin
    const { data: topic, error: topicError } = await supabase
      .from('forum_topics')
      .select('author_id')
      .eq('id', topicId)
      .single();

    if (topicError || !topic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    // Get user role
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user_id)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check permissions
    if (topic.author_id !== user_id && user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Soft delete topic
    const { error: deleteError } = await supabase
      .from('forum_topics')
      .update({ is_active: false })
      .eq('id', topicId);

    if (deleteError) {
      console.error('Error deleting topic:', deleteError);
      return NextResponse.json({ error: 'Failed to delete topic' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Topic deleted successfully' });

  } catch (error) {
    console.error('Error in DELETE /api/forum/topics/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 