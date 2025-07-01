-- =====================================================
-- FEEDBACK AND ISSUE REPORTING SYSTEM
-- =====================================================

-- Feedback submissions table
CREATE TABLE public.feedback_submissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- Submitter Information
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Nullable for anonymous feedback
    name TEXT, -- Optional name for anonymous users
    email TEXT, -- Optional email for anonymous users
    
    -- Feedback Content
    rating INTEGER CHECK (rating BETWEEN 1 AND 5), -- Star rating 1-5
    recommendation BOOLEAN, -- Would recommend (true/false)
    message TEXT NOT NULL,
    
    -- Feedback Type and Category
    feedback_type TEXT DEFAULT 'general' CHECK (feedback_type IN ('general', 'feature_request', 'bug_report', 'improvement')),
    category TEXT, -- Optional category like 'ui', 'performance', 'content', etc.
    
    -- Context Information
    page_url TEXT, -- Which page the feedback was submitted from
    user_agent TEXT, -- Browser information
    screen_resolution TEXT, -- Screen size for UI feedback
    
    -- Status and Processing
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'in_progress', 'resolved', 'dismissed')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    
    -- Admin Notes
    admin_notes TEXT,
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Issue reports table
CREATE TABLE public.issue_reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- Reporter Information
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Nullable for anonymous reports
    title TEXT NOT NULL,
    email TEXT, -- Contact email
    
    -- Issue Details
    issue_type TEXT NOT NULL CHECK (issue_type IN ('bug_report', 'performance_issue', 'security_concern', 'other')),
    description TEXT NOT NULL,
    steps_to_reproduce TEXT, -- For bug reports
    expected_behavior TEXT, -- What should happen
    actual_behavior TEXT, -- What actually happens
    
    -- Technical Information
    browser TEXT, -- Browser name and version
    operating_system TEXT, -- OS information
    device_type TEXT, -- Desktop, mobile, tablet
    page_url TEXT, -- Where the issue occurred
    error_message TEXT, -- Any error messages seen
    
    -- Attachments and Evidence
    screenshot_urls TEXT[], -- Array of screenshot URLs
    video_url TEXT, -- Optional video URL
    
    -- Classification and Processing
    severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'confirmed', 'in_progress', 'resolved', 'duplicate', 'wont_fix')),
    category TEXT, -- 'ui', 'functionality', 'performance', 'security', etc.
    
    -- Admin Management
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    admin_notes TEXT,
    duplicate_of UUID REFERENCES issue_reports(id) ON DELETE SET NULL, -- Link to original if duplicate
    
    -- Resolution
    resolution_notes TEXT,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feedback responses table (for follow-up communication)
CREATE TABLE public.feedback_responses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    feedback_id UUID REFERENCES feedback_submissions(id) ON DELETE CASCADE,
    
    -- Response Details
    response_text TEXT NOT NULL,
    response_type TEXT DEFAULT 'admin_reply' CHECK (response_type IN ('admin_reply', 'auto_reply', 'status_update')),
    
    -- Author
    responded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Delivery
    sent_via_email BOOLEAN DEFAULT false,
    email_sent_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Issue report responses table
CREATE TABLE public.issue_responses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    issue_id UUID REFERENCES issue_reports(id) ON DELETE CASCADE,
    
    -- Response Details
    response_text TEXT NOT NULL,
    response_type TEXT DEFAULT 'admin_reply' CHECK (response_type IN ('admin_reply', 'status_update', 'request_info')),
    
    -- Author
    responded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Visibility
    is_public BOOLEAN DEFAULT true, -- Whether visible to reporter
    
    -- Delivery
    sent_via_email BOOLEAN DEFAULT false,
    email_sent_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Feedback submissions indexes
CREATE INDEX idx_feedback_submissions_user ON feedback_submissions(user_id);
CREATE INDEX idx_feedback_submissions_status ON feedback_submissions(status);
CREATE INDEX idx_feedback_submissions_type ON feedback_submissions(feedback_type);
CREATE INDEX idx_feedback_submissions_created ON feedback_submissions(created_at DESC);
CREATE INDEX idx_feedback_submissions_rating ON feedback_submissions(rating);
CREATE INDEX idx_feedback_submissions_priority ON feedback_submissions(priority);

-- Issue reports indexes
CREATE INDEX idx_issue_reports_user ON issue_reports(user_id);
CREATE INDEX idx_issue_reports_status ON issue_reports(status);
CREATE INDEX idx_issue_reports_type ON issue_reports(issue_type);
CREATE INDEX idx_issue_reports_severity ON issue_reports(severity);
CREATE INDEX idx_issue_reports_created ON issue_reports(created_at DESC);
CREATE INDEX idx_issue_reports_assigned ON issue_reports(assigned_to);
CREATE INDEX idx_issue_reports_category ON issue_reports(category);

-- Response indexes
CREATE INDEX idx_feedback_responses_feedback ON feedback_responses(feedback_id);
CREATE INDEX idx_feedback_responses_created ON feedback_responses(created_at DESC);
CREATE INDEX idx_issue_responses_issue ON issue_responses(issue_id);
CREATE INDEX idx_issue_responses_created ON issue_responses(created_at DESC);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Apply updated_at trigger to feedback and issue tables
CREATE TRIGGER update_feedback_submissions_updated_at 
    BEFORE UPDATE ON feedback_submissions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_issue_reports_updated_at 
    BEFORE UPDATE ON issue_reports 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE feedback_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_responses ENABLE ROW LEVEL SECURITY;

-- Feedback Submissions Policies
CREATE POLICY "Anyone can submit feedback" ON feedback_submissions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own feedback" ON feedback_submissions
    FOR SELECT USING (
        user_id IS NULL OR auth.uid() = user_id
    );

CREATE POLICY "Admins can view all feedback" ON feedback_submissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can update feedback" ON feedback_submissions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Issue Reports Policies
CREATE POLICY "Anyone can submit issue reports" ON issue_reports
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own issue reports" ON issue_reports
    FOR SELECT USING (
        user_id IS NULL OR auth.uid() = user_id
    );

CREATE POLICY "Admins can view all issue reports" ON issue_reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can manage issue reports" ON issue_reports
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Feedback Responses Policies
CREATE POLICY "Users can view responses to their feedback" ON feedback_responses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM feedback_submissions 
            WHERE feedback_submissions.id = feedback_responses.feedback_id 
            AND (feedback_submissions.user_id = auth.uid() OR feedback_submissions.user_id IS NULL)
        )
    );

CREATE POLICY "Admins can manage feedback responses" ON feedback_responses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Issue Responses Policies
CREATE POLICY "Users can view public responses to their issues" ON issue_responses
    FOR SELECT USING (
        is_public = true AND
        EXISTS (
            SELECT 1 FROM issue_reports 
            WHERE issue_reports.id = issue_responses.issue_id 
            AND (issue_reports.user_id = auth.uid() OR issue_reports.user_id IS NULL)
        )
    );

CREATE POLICY "Admins can manage issue responses" ON issue_responses
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

-- Grant permissions to authenticated and anonymous users
GRANT SELECT, INSERT ON feedback_submissions TO anon, authenticated;
GRANT SELECT, INSERT ON issue_reports TO anon, authenticated;
GRANT SELECT ON feedback_responses TO authenticated;
GRANT SELECT ON issue_responses TO authenticated;

-- Grant all permissions to service role
GRANT ALL ON feedback_submissions TO service_role;
GRANT ALL ON issue_reports TO service_role;
GRANT ALL ON feedback_responses TO service_role;
GRANT ALL ON issue_responses TO service_role;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get feedback statistics
CREATE OR REPLACE FUNCTION get_feedback_stats()
RETURNS JSON AS $$
DECLARE
    stats JSON;
BEGIN
    SELECT json_build_object(
        'total_feedback', (SELECT COUNT(*) FROM feedback_submissions),
        'average_rating', (SELECT ROUND(AVG(rating)::numeric, 2) FROM feedback_submissions WHERE rating IS NOT NULL),
        'recommendation_rate', (
            SELECT ROUND(
                (COUNT(*) FILTER (WHERE recommendation = true)::float / 
                 NULLIF(COUNT(*) FILTER (WHERE recommendation IS NOT NULL), 0)) * 100, 2
            ) FROM feedback_submissions
        ),
        'pending_feedback', (SELECT COUNT(*) FROM feedback_submissions WHERE status = 'pending'),
        'total_issues', (SELECT COUNT(*) FROM issue_reports),
        'open_issues', (SELECT COUNT(*) FROM issue_reports WHERE status NOT IN ('resolved', 'duplicate', 'wont_fix')),
        'critical_issues', (SELECT COUNT(*) FROM issue_reports WHERE severity = 'critical' AND status NOT IN ('resolved', 'duplicate', 'wont_fix'))
    ) INTO stats;
    
    RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-assign priority based on content
CREATE OR REPLACE FUNCTION auto_assign_feedback_priority()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-assign high priority for low ratings or critical keywords
    IF NEW.rating IS NOT NULL AND NEW.rating <= 2 THEN
        NEW.priority = 'high';
    ELSIF NEW.message ILIKE '%crash%' OR NEW.message ILIKE '%error%' OR NEW.message ILIKE '%broken%' THEN
        NEW.priority = 'high';
    ELSIF NEW.message ILIKE '%slow%' OR NEW.message ILIKE '%performance%' THEN
        NEW.priority = 'medium';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-assign issue severity
CREATE OR REPLACE FUNCTION auto_assign_issue_severity()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-assign severity based on issue type and keywords
    IF NEW.issue_type = 'security_concern' THEN
        NEW.severity = 'critical';
    ELSIF NEW.description ILIKE '%crash%' OR NEW.description ILIKE '%data loss%' OR NEW.description ILIKE '%cannot login%' THEN
        NEW.severity = 'high';
    ELSIF NEW.description ILIKE '%slow%' OR NEW.description ILIKE '%performance%' THEN
        NEW.severity = 'medium';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply auto-assignment triggers
CREATE TRIGGER auto_assign_feedback_priority_trigger
    BEFORE INSERT ON feedback_submissions
    FOR EACH ROW EXECUTE FUNCTION auto_assign_feedback_priority();

CREATE TRIGGER auto_assign_issue_severity_trigger
    BEFORE INSERT ON issue_reports
    FOR EACH ROW EXECUTE FUNCTION auto_assign_issue_severity();

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE feedback_submissions IS 'User feedback submissions with ratings and recommendations';
COMMENT ON TABLE issue_reports IS 'Bug reports and technical issues submitted by users';
COMMENT ON TABLE feedback_responses IS 'Admin responses to feedback submissions';
COMMENT ON TABLE issue_responses IS 'Admin responses and updates for issue reports';

COMMENT ON COLUMN feedback_submissions.rating IS 'Star rating from 1-5 stars';
COMMENT ON COLUMN feedback_submissions.recommendation IS 'Whether user would recommend the platform';
COMMENT ON COLUMN issue_reports.severity IS 'Impact level of the reported issue';
COMMENT ON COLUMN issue_reports.duplicate_of IS 'Reference to original issue if this is a duplicate';
COMMENT ON COLUMN issue_responses.is_public IS 'Whether response is visible to issue reporter'; 