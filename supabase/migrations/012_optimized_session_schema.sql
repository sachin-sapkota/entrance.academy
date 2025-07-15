-- Migration 012: Optimized Session Schema for Better Performance
-- This migration creates separate tables for answers and optimizes session management

-- Create separate table for individual answers (incremental updates)
CREATE TABLE public.session_answers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID NOT NULL, -- References test_sessions.id
    question_id TEXT NOT NULL, -- Store as text to handle temp IDs
    selected_answer TEXT NOT NULL,
    is_flagged BOOLEAN DEFAULT false,
    time_spent_seconds INTEGER DEFAULT 0,
    answer_sequence INTEGER DEFAULT 1, -- Track answer changes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one current answer per question per session
    UNIQUE(session_id, question_id)
);

-- Add indexes for fast lookups
CREATE INDEX idx_session_answers_session ON session_answers(session_id);
CREATE INDEX idx_session_answers_question ON session_answers(question_id);
CREATE INDEX idx_session_answers_flagged ON session_answers(is_flagged) WHERE is_flagged = true;
CREATE INDEX idx_session_answers_updated ON session_answers(updated_at DESC);

-- Create session state table for lightweight metadata
CREATE TABLE public.session_state (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES test_sessions(id) ON DELETE CASCADE,
    current_page INTEGER DEFAULT 1,
    time_left_seconds INTEGER DEFAULT 7200,
    total_duration_seconds INTEGER DEFAULT 7200,
    is_paused BOOLEAN DEFAULT false,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_auto_save_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Metadata for performance tracking
    save_count INTEGER DEFAULT 0,
    answer_count INTEGER DEFAULT 0,
    flagged_count INTEGER DEFAULT 0,
    
    -- Ensure one state per session
    UNIQUE(session_id)
);

-- Add indexes for session state
CREATE INDEX idx_session_state_session ON session_state(session_id);
CREATE INDEX idx_session_state_activity ON session_state(last_activity_at DESC);
CREATE INDEX idx_session_state_auto_save ON session_state(last_auto_save_at DESC);

-- Create function for fast answer upsert
CREATE OR REPLACE FUNCTION upsert_session_answer(
    p_session_id UUID,
    p_question_id TEXT,
    p_selected_answer TEXT,
    p_is_flagged BOOLEAN DEFAULT false,
    p_time_spent INTEGER DEFAULT 0
) RETURNS UUID AS $$
DECLARE
    answer_id UUID;
    prev_flagged BOOLEAN := false;
    is_new_answer BOOLEAN := false;
BEGIN
    -- Check if answer already exists
    SELECT id, is_flagged INTO answer_id, prev_flagged
    FROM session_answers 
    WHERE session_id = p_session_id AND question_id = p_question_id;
    
    IF answer_id IS NULL THEN
        -- Insert new answer
        INSERT INTO session_answers (
            session_id, question_id, selected_answer, is_flagged, time_spent_seconds
        ) VALUES (
            p_session_id, p_question_id, p_selected_answer, p_is_flagged, p_time_spent
        ) RETURNING id INTO answer_id;
        
        is_new_answer := true;
    ELSE
        -- Update existing answer
        UPDATE session_answers 
        SET 
            selected_answer = p_selected_answer,
            is_flagged = p_is_flagged,
            time_spent_seconds = GREATEST(time_spent_seconds, p_time_spent),
            answer_sequence = answer_sequence + 1,
            updated_at = NOW()
        WHERE id = answer_id;
    END IF;
    
    -- Update session state counters efficiently
    UPDATE session_state 
    SET 
        answer_count = CASE 
            WHEN is_new_answer THEN answer_count + 1 
            ELSE answer_count 
        END,
        flagged_count = flagged_count + 
            CASE 
                WHEN p_is_flagged AND NOT prev_flagged THEN 1
                WHEN NOT p_is_flagged AND prev_flagged THEN -1
                ELSE 0
            END,
        save_count = save_count + 1,
        last_activity_at = NOW(),
        updated_at = NOW()
    WHERE session_id = p_session_id;
    
    RETURN answer_id;
END;
$$ LANGUAGE plpgsql;

-- Create function for batch answer updates
CREATE OR REPLACE FUNCTION batch_update_session_answers(
    p_session_id UUID,
    p_answers JSONB, -- Format: {"question_id": "answer", ...}
    p_flagged_questions TEXT[] DEFAULT '{}',
    p_current_page INTEGER DEFAULT NULL,
    p_time_left INTEGER DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    answer_key TEXT;
    answer_value TEXT;
    result JSONB := '{}';
    updated_count INTEGER := 0;
    new_count INTEGER := 0;
BEGIN
    -- Update answers in batch
    FOR answer_key, answer_value IN SELECT * FROM jsonb_each_text(p_answers)
    LOOP
        -- Upsert each answer
        PERFORM upsert_session_answer(
            p_session_id,
            answer_key,
            answer_value,
            answer_key = ANY(p_flagged_questions),
            0
        );
        
        updated_count := updated_count + 1;
    END LOOP;
    
    -- Update session state if provided
    IF p_current_page IS NOT NULL OR p_time_left IS NOT NULL THEN
        UPDATE session_state 
        SET 
            current_page = COALESCE(p_current_page, current_page),
            time_left_seconds = COALESCE(p_time_left, time_left_seconds),
            last_activity_at = NOW(),
            updated_at = NOW()
        WHERE session_id = p_session_id;
    END IF;
    
    -- Return statistics
    result := jsonb_build_object(
        'updated_count', updated_count,
        'session_id', p_session_id,
        'timestamp', extract(epoch from now())
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create function to get session with answers efficiently
CREATE OR REPLACE FUNCTION get_session_with_answers(p_session_id UUID)
RETURNS JSONB AS $$
DECLARE
    session_data JSONB;
    answers_data JSONB := '{}';
    flagged_questions TEXT[] := '{}';
    state_data RECORD;
BEGIN
    -- Get session state
    SELECT * INTO state_data FROM session_state WHERE session_id = p_session_id;
    
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;
    
    -- Get answers as JSON object
    SELECT 
        jsonb_object_agg(question_id, selected_answer),
        array_agg(question_id) FILTER (WHERE is_flagged = true)
    INTO answers_data, flagged_questions
    FROM session_answers 
    WHERE session_id = p_session_id;
    
    -- Build response
    session_data := jsonb_build_object(
        'session_id', p_session_id,
        'answers', COALESCE(answers_data, '{}'),
        'flagged_questions', COALESCE(flagged_questions, '{}'),
        'current_page', state_data.current_page,
        'time_left', state_data.time_left_seconds,
        'total_duration', state_data.total_duration_seconds,
        'is_paused', state_data.is_paused,
        'last_activity_at', state_data.last_activity_at,
        'answer_count', state_data.answer_count,
        'flagged_count', state_data.flagged_count,
        'save_count', state_data.save_count
    );
    
    RETURN session_data;
END;
$$ LANGUAGE plpgsql;

-- Create function for lightweight timer updates
CREATE OR REPLACE FUNCTION update_session_timer(
    p_session_id UUID,
    p_time_left INTEGER,
    p_is_paused BOOLEAN DEFAULT false
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE session_state 
    SET 
        time_left_seconds = p_time_left,
        is_paused = p_is_paused,
        last_activity_at = NOW(),
        updated_at = NOW()
    WHERE session_id = p_session_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers for new tables
CREATE TRIGGER update_session_answers_updated_at BEFORE UPDATE ON session_answers 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_session_state_updated_at BEFORE UPDATE ON session_state 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies for new tables
ALTER TABLE session_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_state ENABLE ROW LEVEL SECURITY;

-- Session answers policies
CREATE POLICY "Users can manage their session answers" ON session_answers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM test_sessions ts 
            WHERE ts.id = session_answers.session_id 
            AND ts.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all session answers" ON session_answers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Session state policies
CREATE POLICY "Users can manage their session state" ON session_state
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM test_sessions ts 
            WHERE ts.id = session_state.session_id 
            AND ts.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all session state" ON session_state
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON session_answers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON session_state TO authenticated;
GRANT ALL ON session_answers TO service_role;
GRANT ALL ON session_state TO service_role;

-- Create view for admin monitoring
CREATE VIEW session_performance_view AS
SELECT 
    ts.id as session_id,
    ts.user_id,
    ts.test_id,
    ts.created_at as session_created,
    ss.current_page,
    ss.time_left_seconds,
    ss.answer_count,
    ss.flagged_count,
    ss.save_count,
    ss.last_activity_at,
    EXTRACT(EPOCH FROM (NOW() - ts.created_at)) as session_duration_seconds,
    CASE 
        WHEN ss.answer_count > 0 THEN ss.save_count::float / ss.answer_count
        ELSE 0
    END as saves_per_answer
FROM test_sessions ts
JOIN session_state ss ON ts.id = ss.session_id
WHERE ts.is_active = true;

-- Grant view access
GRANT SELECT ON session_performance_view TO authenticated;

COMMENT ON TABLE session_answers IS 'Individual answer storage for incremental updates';
COMMENT ON TABLE session_state IS 'Lightweight session metadata for performance';
COMMENT ON FUNCTION upsert_session_answer IS 'Efficiently upsert individual answers';
COMMENT ON FUNCTION batch_update_session_answers IS 'Batch update multiple answers';
COMMENT ON FUNCTION get_session_with_answers IS 'Efficiently retrieve session with all answers';
COMMENT ON FUNCTION update_session_timer IS 'Lightweight timer updates only'; 