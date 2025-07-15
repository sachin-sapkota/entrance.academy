-- Fix RLS policies for question_analytics and audit_logs tables
-- These tables need to allow system-level operations while maintaining security

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can manage question_analytics" ON question_analytics;
DROP POLICY IF EXISTS "Admins can manage audit_logs" ON audit_logs;

-- Create specific policies for question_analytics
CREATE POLICY "Anyone can view question analytics" ON question_analytics
    FOR SELECT USING (true);

CREATE POLICY "System can manage question analytics" ON question_analytics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Create specific policies for audit_logs
CREATE POLICY "Admins can view audit logs" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "System can create audit logs" ON audit_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Add service role bypass for system functions
CREATE POLICY "Service role bypass question analytics" ON question_analytics
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role bypass audit logs" ON audit_logs
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Grant additional permissions to authenticated users for analytics viewing
GRANT SELECT ON question_analytics TO authenticated;
GRANT SELECT ON audit_logs TO authenticated;

-- Comments for documentation
COMMENT ON POLICY "Anyone can view question analytics" ON question_analytics IS 'Allow public read access to question analytics for transparency';
COMMENT ON POLICY "System can manage question analytics" ON question_analytics IS 'Allow admin users to manage question analytics';
COMMENT ON POLICY "Service role bypass question analytics" ON question_analytics IS 'Allow service role to bypass RLS for system operations';
COMMENT ON POLICY "Admins can view audit logs" ON audit_logs IS 'Allow admin users to view audit logs';
COMMENT ON POLICY "System can create audit logs" ON audit_logs IS 'Allow admin users to create audit logs';
COMMENT ON POLICY "Service role bypass audit logs" ON audit_logs IS 'Allow service role to bypass RLS for system operations'; 