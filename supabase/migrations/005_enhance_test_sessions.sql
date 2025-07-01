-- Migration to enhance test_sessions table for robust session management
-- This ensures the table can handle our session storage requirements

-- First, check if we need to modify the existing test_sessions table
DO $$
BEGIN
    -- Add session_key column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'test_sessions' 
        AND column_name = 'session_key'
    ) THEN
        ALTER TABLE test_sessions ADD COLUMN session_key TEXT UNIQUE;
    END IF;

    -- Add session_data column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'test_sessions' 
        AND column_name = 'session_data'
    ) THEN
        ALTER TABLE test_sessions ADD COLUMN session_data JSONB DEFAULT '{}'::jsonb;
    END IF;

    -- Add expires_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'test_sessions' 
        AND column_name = 'expires_at'
    ) THEN
        ALTER TABLE test_sessions ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_test_sessions_session_key ON test_sessions(session_key);
CREATE INDEX IF NOT EXISTS idx_test_sessions_active ON test_sessions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_test_sessions_expires ON test_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_test_sessions_user_test ON test_sessions(user_id, test_id);

-- Update RLS policies for test_sessions to allow session management
DROP POLICY IF EXISTS "Users can manage own sessions" ON test_sessions;
CREATE POLICY "Users can manage own sessions" ON test_sessions
    FOR ALL USING (auth.uid() = user_id);

-- Allow service role to manage all sessions (for session cleanup)
DROP POLICY IF EXISTS "Service role can manage all sessions" ON test_sessions;
CREATE POLICY "Service role can manage all sessions" ON test_sessions
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON test_sessions TO service_role;
GRANT SELECT, INSERT, UPDATE ON test_sessions TO authenticated;

-- Create a function to clean up expired sessions automatically
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    UPDATE test_sessions 
    SET is_active = false 
    WHERE expires_at < NOW() AND is_active = true;
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment on the table for documentation
COMMENT ON TABLE test_sessions IS 'Enhanced session management for real-time test taking with persistent storage';
COMMENT ON COLUMN test_sessions.session_key IS 'Unique session identifier in format: userId-testId';
COMMENT ON COLUMN test_sessions.session_data IS 'Complete session state including answers, timer, and navigation data';
COMMENT ON COLUMN test_sessions.expires_at IS 'Session expiration time for automatic cleanup'; 