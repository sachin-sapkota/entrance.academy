-- =====================================================
-- FORUM SYSTEM TABLES
-- =====================================================

-- Forum Topics table
CREATE TABLE public.forum_topics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('general', 'help', 'study', 'suggestions', 'technical')),
    tags TEXT[] DEFAULT '{}',
    
    -- Author and Status
    author_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    is_pinned BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    -- Statistics
    views INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Forum Replies table
CREATE TABLE public.forum_replies (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    topic_id UUID REFERENCES forum_topics(id) ON DELETE CASCADE NOT NULL,
    parent_reply_id UUID REFERENCES forum_replies(id) ON DELETE CASCADE, -- For nested replies
    content TEXT NOT NULL,
    
    -- Author and Status
    author_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Forum Topic Likes table
CREATE TABLE public.forum_topic_likes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    topic_id UUID REFERENCES forum_topics(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint to prevent duplicate likes
    UNIQUE(topic_id, user_id)
);

-- Forum Reply Likes table
CREATE TABLE public.forum_reply_likes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    reply_id UUID REFERENCES forum_replies(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint to prevent duplicate likes
    UNIQUE(reply_id, user_id)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Forum topics indexes
CREATE INDEX idx_forum_topics_author ON forum_topics(author_id);
CREATE INDEX idx_forum_topics_category ON forum_topics(category);
CREATE INDEX idx_forum_topics_active ON forum_topics(is_active) WHERE is_active = true;
CREATE INDEX idx_forum_topics_created ON forum_topics(created_at DESC);
CREATE INDEX idx_forum_topics_updated ON forum_topics(updated_at DESC);
CREATE INDEX idx_forum_topics_views ON forum_topics(views DESC);
CREATE INDEX idx_forum_topics_pinned ON forum_topics(is_pinned) WHERE is_pinned = true;
CREATE INDEX idx_forum_topics_tags ON forum_topics USING GIN(tags);

-- Forum replies indexes
CREATE INDEX idx_forum_replies_topic ON forum_replies(topic_id);
CREATE INDEX idx_forum_replies_author ON forum_replies(author_id);
CREATE INDEX idx_forum_replies_parent ON forum_replies(parent_reply_id);
CREATE INDEX idx_forum_replies_active ON forum_replies(is_active) WHERE is_active = true;
CREATE INDEX idx_forum_replies_created ON forum_replies(created_at ASC);

-- Forum likes indexes
CREATE INDEX idx_forum_topic_likes_topic ON forum_topic_likes(topic_id);
CREATE INDEX idx_forum_topic_likes_user ON forum_topic_likes(user_id);
CREATE INDEX idx_forum_reply_likes_reply ON forum_reply_likes(reply_id);
CREATE INDEX idx_forum_reply_likes_user ON forum_reply_likes(user_id);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Apply updated_at trigger to forum tables
CREATE TRIGGER update_forum_topics_updated_at 
    BEFORE UPDATE ON forum_topics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_forum_replies_updated_at 
    BEFORE UPDATE ON forum_replies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on forum tables
ALTER TABLE forum_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_topic_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_reply_likes ENABLE ROW LEVEL SECURITY;

-- Forum Topics Policies
CREATE POLICY "Anyone can view active forum topics" ON forum_topics
    FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can create forum topics" ON forum_topics
    FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their own topics" ON forum_topics
    FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Authors and admins can delete topics" ON forum_topics
    FOR DELETE USING (
        auth.uid() = author_id OR 
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Forum Replies Policies
CREATE POLICY "Anyone can view active forum replies" ON forum_replies
    FOR SELECT USING (
        is_active = true AND 
        EXISTS (
            SELECT 1 FROM forum_topics 
            WHERE forum_topics.id = forum_replies.topic_id 
            AND forum_topics.is_active = true
        )
    );

CREATE POLICY "Authenticated users can create forum replies" ON forum_replies
    FOR INSERT WITH CHECK (
        auth.uid() = author_id AND
        EXISTS (
            SELECT 1 FROM forum_topics 
            WHERE forum_topics.id = forum_replies.topic_id 
            AND forum_topics.is_active = true
        )
    );

CREATE POLICY "Authors can update their own replies" ON forum_replies
    FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Authors and admins can delete replies" ON forum_replies
    FOR DELETE USING (
        auth.uid() = author_id OR 
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Forum Likes Policies
CREATE POLICY "Anyone can view forum topic likes" ON forum_topic_likes
    FOR SELECT USING (true);

CREATE POLICY "Users can like/unlike topics" ON forum_topic_likes
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view forum reply likes" ON forum_reply_likes
    FOR SELECT USING (true);

CREATE POLICY "Users can like/unlike replies" ON forum_reply_likes
    FOR ALL USING (auth.uid() = user_id);

-- Admin policies for all forum tables
CREATE POLICY "Admins can manage all forum topics" ON forum_topics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can manage all forum replies" ON forum_replies
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can manage all forum likes" ON forum_topic_likes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can manage all forum reply likes" ON forum_reply_likes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON forum_topics TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON forum_replies TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON forum_topic_likes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON forum_reply_likes TO authenticated;

-- Grant all permissions to service role
GRANT ALL ON forum_topics TO service_role;
GRANT ALL ON forum_replies TO service_role;
GRANT ALL ON forum_topic_likes TO service_role;
GRANT ALL ON forum_reply_likes TO service_role;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get forum statistics
CREATE OR REPLACE FUNCTION get_forum_stats()
RETURNS JSON AS $$
DECLARE
    stats JSON;
BEGIN
    SELECT json_build_object(
        'total_topics', (SELECT COUNT(*) FROM forum_topics WHERE is_active = true),
        'total_replies', (SELECT COUNT(*) FROM forum_replies WHERE is_active = true),
        'active_users', (SELECT COUNT(DISTINCT author_id) FROM forum_topics WHERE is_active = true AND created_at >= NOW() - INTERVAL '7 days'),
        'todays_posts', (SELECT COUNT(*) FROM forum_topics WHERE is_active = true AND created_at >= CURRENT_DATE)
    ) INTO stats;
    
    RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get category counts
CREATE OR REPLACE FUNCTION get_forum_category_counts()
RETURNS JSON AS $$
DECLARE
    counts JSON;
BEGIN
    SELECT json_object_agg(category, topic_count) INTO counts
    FROM (
        SELECT 
            category,
            COUNT(*) as topic_count
        FROM forum_topics 
        WHERE is_active = true 
        GROUP BY category
    ) category_stats;
    
    RETURN COALESCE(counts, '{}'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE forum_topics IS 'Forum discussion topics created by users';
COMMENT ON TABLE forum_replies IS 'Replies to forum topics with support for nested replies';
COMMENT ON TABLE forum_topic_likes IS 'User likes for forum topics';
COMMENT ON TABLE forum_reply_likes IS 'User likes for forum replies';

COMMENT ON COLUMN forum_topics.category IS 'Topic category: general, help, study, suggestions, technical';
COMMENT ON COLUMN forum_topics.tags IS 'Array of topic tags for better searchability';
COMMENT ON COLUMN forum_topics.is_pinned IS 'Whether the topic is pinned to the top';
COMMENT ON COLUMN forum_replies.parent_reply_id IS 'Reference to parent reply for nested replies';
COMMENT ON COLUMN forum_topics.views IS 'Number of times the topic has been viewed'; 