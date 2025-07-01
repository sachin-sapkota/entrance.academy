-- Comprehensive MCQ Test Platform Database Schema
-- This migration creates all tables, functions, and policies for the complete platform

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements"; -- For query analytics

-- Drop existing types to recreate them
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS test_status CASCADE;
DROP TYPE IF EXISTS difficulty_level CASCADE;
DROP TYPE IF EXISTS question_type CASCADE;
DROP TYPE IF EXISTS performance_category CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS subscription_plan CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;
DROP TYPE IF EXISTS content_status CASCADE;

-- Create all enums
CREATE TYPE user_role AS ENUM ('admin', 'instructor', 'free_user', 'paid_user', 'guest');
CREATE TYPE test_status AS ENUM ('not_started', 'in_progress', 'paused', 'submitted', 'evaluated', 'expired');
CREATE TYPE difficulty_level AS ENUM ('very_easy', 'easy', 'medium', 'hard', 'very_hard');
CREATE TYPE question_type AS ENUM ('single_choice', 'multiple_choice', 'true_false', 'numerical', 'fill_blank');
CREATE TYPE performance_category AS ENUM ('excellent', 'good', 'average', 'below_average', 'poor');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded', 'cancelled');
CREATE TYPE subscription_plan AS ENUM ('free', 'basic', 'premium', 'enterprise');
CREATE TYPE notification_type AS ENUM ('email', 'sms', 'push', 'in_app');
CREATE TYPE content_status AS ENUM ('draft', 'published', 'archived', 'deleted');

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role user_role DEFAULT 'free_user',
    phone TEXT,
    phone_verified BOOLEAN DEFAULT false,
    
    -- Profile Information
    profile_image_url TEXT,
    bio TEXT,
    date_of_birth DATE,
    gender TEXT,
    
    -- Educational Information
    student_id TEXT UNIQUE,
    institution TEXT,
    grade_level TEXT,
    course TEXT,
    academic_year INTEGER,
    
    -- Account Status
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    email_verified_at TIMESTAMP WITH TIME ZONE,
    
    -- Preferences
    preferred_language TEXT DEFAULT 'en',
    timezone TEXT DEFAULT 'UTC',
    notification_preferences JSONB DEFAULT '{"email": true, "sms": false, "push": true}'::jsonb,
    ui_preferences JSONB DEFAULT '{"theme": "light", "fontSize": "medium"}'::jsonb,
    
    -- Subscription Information
    subscription_plan subscription_plan DEFAULT 'free',
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    credits_remaining INTEGER DEFAULT 0,
    
    -- Activity Tracking
    last_login_at TIMESTAMP WITH TIME ZONE,
    login_count INTEGER DEFAULT 0,
    total_study_time_minutes INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete
    
    -- Additional fields for future features
    referral_code TEXT UNIQUE,
    referred_by UUID REFERENCES users(id),
    stripe_customer_id TEXT,
    meta_data JSONB DEFAULT '{}'::jsonb
);

-- Domains/Subjects table
CREATE TABLE public.domains (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    code TEXT UNIQUE NOT NULL, -- e.g., 'MATH', 'PHYS'
    description TEXT,
    
    -- Visual Elements
    icon_url TEXT,
    banner_url TEXT,
    color_code TEXT DEFAULT '#3B82F6',
    
    -- Configuration
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    
    -- Scoring Configuration
    difficulty_weight DECIMAL(3,2) DEFAULT 1.0,
    negative_marking_ratio DECIMAL(3,2) DEFAULT 0.25,
    passing_percentage DECIMAL(5,2) DEFAULT 40.00,
    time_per_question_seconds INTEGER DEFAULT 60,
    
    -- Statistics
    total_questions_available INTEGER DEFAULT 0,
    total_tests_taken INTEGER DEFAULT 0,
    average_score DECIMAL(5,2) DEFAULT 0,
    
    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    meta_data JSONB DEFAULT '{}'::jsonb
);

-- Question Categories within domains
CREATE TABLE public.question_categories (
    id SERIAL PRIMARY KEY,
    domain_id INTEGER REFERENCES domains(id) ON DELETE CASCADE,
    parent_category_id INTEGER REFERENCES question_categories(id) ON DELETE CASCADE, -- For subcategories
    name TEXT NOT NULL,
    code TEXT,
    description TEXT,
    
    -- Configuration
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    weight DECIMAL(3,2) DEFAULT 1.0, -- Importance in tests
    
    -- Statistics
    total_questions INTEGER DEFAULT 0,
    average_difficulty DECIMAL(3,2) DEFAULT 0.5,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(domain_id, name)
);

-- Questions table with comprehensive fields
CREATE TABLE public.questions (
    id SERIAL PRIMARY KEY,
    domain_id INTEGER REFERENCES domains(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES question_categories(id) ON DELETE SET NULL,
    
    -- Question Content
    question_type question_type DEFAULT 'single_choice',
    difficulty_level difficulty_level DEFAULT 'medium',
    text TEXT NOT NULL,
    text_html TEXT, -- Rich text version
    latex_content TEXT, -- For mathematical equations
    
    -- Options and Answers
    options JSONB NOT NULL, -- Array of {text, imageUrl, isCorrect, explanation}
    correct_answer JSONB NOT NULL, -- Can be single or multiple values
    
    -- Explanations and Help
    explanation TEXT,
    explanation_html TEXT,
    hint TEXT,
    solution_steps JSONB, -- Step-by-step solution
    reference_material TEXT,
    related_concepts TEXT[],
    
    -- Media Attachments
    question_image_url TEXT,
    question_video_url TEXT,
    question_audio_url TEXT,
    explanation_image_url TEXT,
    explanation_video_url TEXT,
    
    -- Scoring
    points DECIMAL(4,2) DEFAULT 1.0,
    negative_points DECIMAL(4,2) DEFAULT 0.25,
    partial_marking_enabled BOOLEAN DEFAULT false,
    partial_marking_scheme JSONB, -- Define partial marks for each option
    
    -- Time Management
    estimated_time_seconds INTEGER DEFAULT 60,
    minimum_time_seconds INTEGER, -- Can't submit before this
    maximum_time_seconds INTEGER, -- Auto-submit after this
    
    -- Analytics Fields
    total_attempts INTEGER DEFAULT 0,
    correct_attempts INTEGER DEFAULT 0,
    average_time_spent DECIMAL(6,2) DEFAULT 0,
    difficulty_score DECIMAL(3,2) DEFAULT 0.5, -- Calculated based on performance
    discrimination_index DECIMAL(3,2) DEFAULT 0, -- How well it differentiates students
    
    -- Quality Control
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    needs_review BOOLEAN DEFAULT false,
    review_notes TEXT,
    
    -- Metadata
    tags TEXT[], -- For searching and filtering
    language TEXT DEFAULT 'en',
    source TEXT, -- Where the question came from
    academic_year INTEGER,
    
    -- Tracking
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    version INTEGER DEFAULT 1,
    
    -- Search optimization (will be populated via trigger)
    search_vector tsvector
);

-- Test Configurations (Templates for tests)
CREATE TABLE public.test_configurations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE,
    description TEXT,
    
    -- Test Type and Category
    test_type TEXT DEFAULT 'practice', -- practice, mock, actual, quiz
    test_category TEXT, -- entrance, competitive, academic
    
    -- Duration and Questions
    duration_minutes INTEGER NOT NULL DEFAULT 120,
    total_questions INTEGER NOT NULL DEFAULT 100,
    questions_per_page INTEGER DEFAULT 20,
    passing_percentage DECIMAL(5,2) DEFAULT 40.00,
    
    -- Domain and Difficulty Distribution
    domain_distribution JSONB DEFAULT '{}', -- {domain_id: question_count}
    category_distribution JSONB DEFAULT '{}', -- {category_id: question_count}
    difficulty_distribution JSONB DEFAULT '{"easy": 0.3, "medium": 0.5, "hard": 0.2}'::jsonb,
    
    -- Marking Scheme
    enable_negative_marking BOOLEAN DEFAULT true,
    negative_marking_ratio DECIMAL(3,2) DEFAULT 0.25,
    partial_marking_enabled BOOLEAN DEFAULT false,
    
    -- Test Behavior
    shuffle_questions BOOLEAN DEFAULT true,
    shuffle_options BOOLEAN DEFAULT true,
    allow_question_navigation BOOLEAN DEFAULT true,
    allow_question_review BOOLEAN DEFAULT true,
    allow_answer_change BOOLEAN DEFAULT true,
    show_calculator BOOLEAN DEFAULT false,
    show_timer BOOLEAN DEFAULT true,
    auto_submit BOOLEAN DEFAULT true,
    pause_allowed BOOLEAN DEFAULT false,
    
    -- Result Display
    show_result_immediately BOOLEAN DEFAULT true,
    show_score_immediately BOOLEAN DEFAULT true,
    show_correct_answers BOOLEAN DEFAULT true,
    show_explanations BOOLEAN DEFAULT true,
    show_detailed_analytics BOOLEAN DEFAULT true,
    result_validity_days INTEGER DEFAULT 365,
    
    -- Security Settings
    browser_lock_enabled BOOLEAN DEFAULT false,
    prevent_copy_paste BOOLEAN DEFAULT true,
    prevent_right_click BOOLEAN DEFAULT true,
    fullscreen_required BOOLEAN DEFAULT false,
    webcam_monitoring BOOLEAN DEFAULT false,
    screen_recording BOOLEAN DEFAULT false,
    
    -- Access Control
    is_public BOOLEAN DEFAULT false,
    requires_approval BOOLEAN DEFAULT false,
    access_code TEXT,
    max_attempts_per_user INTEGER DEFAULT 1,
    retry_after_days INTEGER DEFAULT 0,
    
    -- Scheduling
    available_from TIMESTAMP WITH TIME ZONE,
    available_until TIMESTAMP WITH TIME ZONE,
    registration_deadline TIMESTAMP WITH TIME ZONE,
    
    -- Pricing
    is_free BOOLEAN DEFAULT true,
    price DECIMAL(10,2) DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    
    -- Instructions and Rules
    instructions TEXT,
    rules_and_regulations TEXT,
    
    -- Metadata
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    meta_data JSONB DEFAULT '{}'::jsonb
);

-- Tests/Exam Sessions table
CREATE TABLE public.tests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    test_config_id UUID REFERENCES test_configurations(id),
    
    -- Test Information
    test_name TEXT NOT NULL,
    test_code TEXT,
    attempt_number INTEGER DEFAULT 1,
    
    -- Status and Timing
    status test_status DEFAULT 'not_started',
    started_at TIMESTAMP WITH TIME ZONE,
    submitted_at TIMESTAMP WITH TIME ZONE,
    evaluated_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Time Tracking
    total_time_seconds INTEGER DEFAULT 0,
    time_spent_seconds INTEGER DEFAULT 0,
    time_remaining_seconds INTEGER,
    pause_count INTEGER DEFAULT 0,
    total_pause_duration_seconds INTEGER DEFAULT 0,
    
    -- Question Management
    total_questions INTEGER NOT NULL,
    questions_order JSONB NOT NULL, -- Array of question IDs in display order
    
    -- Answer Statistics
    attempted_questions INTEGER DEFAULT 0,
    unattempted_questions INTEGER DEFAULT 0,
    marked_for_review INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    wrong_answers INTEGER DEFAULT 0,
    partial_correct_answers INTEGER DEFAULT 0,
    
    -- Scoring
    total_marks DECIMAL(6,2) DEFAULT 0,
    obtained_marks DECIMAL(6,2) DEFAULT 0,
    negative_marks DECIMAL(6,2) DEFAULT 0,
    bonus_marks DECIMAL(6,2) DEFAULT 0,
    final_score DECIMAL(6,2) DEFAULT 0,
    percentage DECIMAL(5,2) DEFAULT 0,
    percentile DECIMAL(5,2), -- Among all test takers
    rank INTEGER,
    
    -- Category-wise Performance
    domain_scores JSONB DEFAULT '{}', -- {domain_id: {attempted, correct, score}}
    category_scores JSONB DEFAULT '{}',
    difficulty_scores JSONB DEFAULT '{}',
    
    -- Performance Analysis
    performance_category performance_category,
    strengths JSONB DEFAULT '[]', -- Array of strong areas
    weaknesses JSONB DEFAULT '[]', -- Array of weak areas
    accuracy_percentage DECIMAL(5,2) DEFAULT 0,
    speed_percentile DECIMAL(5,2) DEFAULT 0,
    
    -- Session Information
    ip_address INET,
    user_agent TEXT,
    device_info JSONB,
    browser_fingerprint TEXT,
    
    -- Security and Monitoring
    violation_count INTEGER DEFAULT 0,
    violations JSONB DEFAULT '[]', -- Array of {type, timestamp, details}
    tab_switch_count INTEGER DEFAULT 0,
    copy_paste_attempts INTEGER DEFAULT 0,
    suspicious_activity_flags JSONB DEFAULT '[]',
    
    -- Verification
    is_verified BOOLEAN DEFAULT false,
    verified_by UUID REFERENCES users(id),
    verification_notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    meta_data JSONB DEFAULT '{}'::jsonb
);

-- Attempts/Answers table
CREATE TABLE public.attempts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
    question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
    
    -- Answer Information
    selected_answer JSONB, -- Can be single or multiple selections
    answer_text TEXT, -- For text-based answers
    is_correct BOOLEAN,
    is_partially_correct BOOLEAN DEFAULT false,
    
    -- Scoring
    marks_obtained DECIMAL(4,2) DEFAULT 0,
    marks_deducted DECIMAL(4,2) DEFAULT 0,
    
    -- Time Analytics
    time_spent_seconds INTEGER DEFAULT 0,
    first_seen_at TIMESTAMP WITH TIME ZONE,
    first_interaction_at TIMESTAMP WITH TIME ZONE,
    last_interaction_at TIMESTAMP WITH TIME ZONE,
    submitted_at TIMESTAMP WITH TIME ZONE,
    
    -- Interaction Analytics
    view_count INTEGER DEFAULT 1,
    interaction_count INTEGER DEFAULT 0,
    option_change_count INTEGER DEFAULT 0,
    time_to_first_answer INTEGER, -- Seconds
    hesitation_time INTEGER, -- Time between first view and first answer
    
    -- Answer Changes History
    answer_history JSONB DEFAULT '[]', -- Array of {answer, timestamp}
    
    -- Review Status
    marked_for_review BOOLEAN DEFAULT false,
    review_count INTEGER DEFAULT 0,
    
    -- Confidence and Difficulty
    confidence_level INTEGER CHECK (confidence_level BETWEEN 1 AND 5),
    perceived_difficulty INTEGER CHECK (perceived_difficulty BETWEEN 1 AND 5),
    
    -- Metadata
    question_order INTEGER, -- Display order in test
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint to prevent duplicate attempts
    UNIQUE(test_id, question_id)
);

-- Practice Sets for organizing questions
CREATE TABLE public.practice_sets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    code TEXT UNIQUE,
    description TEXT,
    
    -- Content
    domains TEXT[] DEFAULT '{}',
    questions JSONB DEFAULT '[]', -- Array of question objects or IDs
    questions_count INTEGER DEFAULT 0,
    
    -- Configuration
    difficulty_level TEXT DEFAULT 'mixed',
    estimated_time_minutes INTEGER DEFAULT 60,
    passing_percentage DECIMAL(5,2) DEFAULT 40.00,
    
    -- Status
    status content_status DEFAULT 'draft',
    is_live BOOLEAN DEFAULT false,
    
    -- Access Control
    is_public BOOLEAN DEFAULT true,
    is_free BOOLEAN DEFAULT true,
    price DECIMAL(10,2) DEFAULT 0,
    
    -- Version Control
    version INTEGER DEFAULT 1,
    published_version INTEGER DEFAULT 0,
    
    -- SEO and Discovery
    tags TEXT[] DEFAULT '{}',
    meta_title TEXT,
    meta_description TEXT,
    slug TEXT UNIQUE,
    
    -- Analytics
    view_count INTEGER DEFAULT 0,
    attempt_count INTEGER DEFAULT 0,
    average_score DECIMAL(5,2) DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    
    -- Metadata
    created_by UUID REFERENCES users(id),
    published_by UUID REFERENCES users(id),
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Session Management for real-time test taking
CREATE TABLE public.test_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    
    -- Session State
    is_active BOOLEAN DEFAULT true,
    current_question_index INTEGER DEFAULT 0,
    current_page INTEGER DEFAULT 1,
    
    -- Answer State
    answers JSONB DEFAULT '{}', -- {question_id: answer}
    flagged_questions INTEGER[] DEFAULT '{}',
    
    -- Time Management
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_sync_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Browser State
    browser_state JSONB DEFAULT '{}', -- Store UI state
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Question Sets for organizing large test collections
CREATE TABLE public.question_sets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE,
    description TEXT,
    
    -- Set Configuration
    total_questions INTEGER NOT NULL DEFAULT 200,
    domain_distribution JSONB NOT NULL DEFAULT '{}', -- {domain_id: question_count}
    
    -- Question Management
    questions JSONB NOT NULL DEFAULT '[]', -- Array of question IDs
    
    -- Import/Export
    import_format TEXT DEFAULT 'json', -- json, csv, xlsx
    source_file_url TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_published BOOLEAN DEFAULT false,
    
    -- Metadata
    created_by UUID REFERENCES users(id),
    published_by UUID REFERENCES users(id),
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Validation
    CONSTRAINT valid_total_questions CHECK (total_questions > 0 AND total_questions <= 1000)
);

-- File Uploads for managing images and other media
CREATE TABLE public.file_uploads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- File Information
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    
    -- File Type and Usage
    file_type TEXT NOT NULL, -- 'question_image', 'explanation_image', 'profile_image', etc.
    entity_type TEXT, -- 'question', 'user', 'domain', etc.
    entity_id TEXT, -- ID of the related entity
    
    -- Upload Information
    uploaded_by UUID REFERENCES users(id),
    upload_source TEXT DEFAULT 'web', -- 'web', 'api', 'bulk_import'
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_processed BOOLEAN DEFAULT false,
    processing_status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    
    -- Metadata
    alt_text TEXT,
    caption TEXT,
    metadata JSONB DEFAULT '{}', -- Store additional file metadata
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ANALYTICS TABLES
-- =====================================================

-- User Performance Analytics
CREATE TABLE public.user_performance_analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    domain_id INTEGER REFERENCES domains(id) ON DELETE CASCADE,
    
    -- Test Statistics
    total_tests INTEGER DEFAULT 0,
    completed_tests INTEGER DEFAULT 0,
    
    -- Question Statistics
    total_questions_attempted INTEGER DEFAULT 0,
    total_questions_correct INTEGER DEFAULT 0,
    
    -- Score Statistics
    average_score DECIMAL(5,2) DEFAULT 0,
    best_score DECIMAL(5,2) DEFAULT 0,
    worst_score DECIMAL(5,2) DEFAULT 0,
    latest_score DECIMAL(5,2) DEFAULT 0,
    score_trend DECIMAL(5,2) DEFAULT 0, -- Positive or negative trend
    
    -- Accuracy by Difficulty
    very_easy_accuracy DECIMAL(5,2) DEFAULT 0,
    easy_accuracy DECIMAL(5,2) DEFAULT 0,
    medium_accuracy DECIMAL(5,2) DEFAULT 0,
    hard_accuracy DECIMAL(5,2) DEFAULT 0,
    very_hard_accuracy DECIMAL(5,2) DEFAULT 0,
    
    -- Time Analytics
    average_time_per_question DECIMAL(6,2) DEFAULT 0,
    fastest_correct_answer DECIMAL(6,2) DEFAULT 0,
    slowest_correct_answer DECIMAL(6,2) DEFAULT 0,
    
    -- Learning Analytics
    improvement_rate DECIMAL(5,2) DEFAULT 0,
    consistency_score DECIMAL(3,2) DEFAULT 0,
    learning_velocity DECIMAL(5,2) DEFAULT 0,
    mastery_level DECIMAL(3,2) DEFAULT 0,
    
    -- Comparative Analytics
    percentile_rank DECIMAL(5,2) DEFAULT 0,
    domain_rank INTEGER,
    global_rank INTEGER,
    
    -- Weak Areas
    weak_categories JSONB DEFAULT '[]',
    recommended_topics JSONB DEFAULT '[]',
    
    -- Calculation Metadata
    last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    calculation_version INTEGER DEFAULT 1,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint
    UNIQUE(user_id, domain_id)
);

-- Question Performance Analytics
CREATE TABLE public.question_analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE UNIQUE,
    
    -- Usage Statistics
    total_attempts INTEGER DEFAULT 0,
    unique_users INTEGER DEFAULT 0,
    
    -- Correctness Statistics
    correct_attempts INTEGER DEFAULT 0,
    partially_correct_attempts INTEGER DEFAULT 0,
    wrong_attempts INTEGER DEFAULT 0,
    skipped_count INTEGER DEFAULT 0,
    
    -- Accuracy Metrics
    overall_accuracy DECIMAL(5,2) DEFAULT 0,
    first_attempt_accuracy DECIMAL(5,2) DEFAULT 0,
    
    -- Time Analytics
    average_time_spent DECIMAL(6,2) DEFAULT 0,
    median_time_spent DECIMAL(6,2) DEFAULT 0,
    minimum_time_spent DECIMAL(6,2) DEFAULT 0,
    maximum_time_spent DECIMAL(6,2) DEFAULT 0,
    
    -- Option Analysis
    option_selection_distribution JSONB DEFAULT '{}', -- {option: count}
    option_accuracy JSONB DEFAULT '{}', -- {option: accuracy}
    
    -- Quality Metrics
    difficulty_rating DECIMAL(3,2) DEFAULT 0.5,
    discrimination_index DECIMAL(3,2) DEFAULT 0,
    point_biserial DECIMAL(3,2) DEFAULT 0, -- Correlation with total score
    
    -- User Feedback
    reported_issues_count INTEGER DEFAULT 0,
    average_difficulty_rating DECIMAL(3,2) DEFAULT 0,
    average_quality_rating DECIMAL(3,2) DEFAULT 0,
    
    -- Review Status
    needs_review BOOLEAN DEFAULT false,
    review_priority INTEGER DEFAULT 0,
    last_reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES users(id),
    
    -- Metadata
    last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PAYMENT AND SUBSCRIPTION TABLES
-- =====================================================

-- Subscription Plans
CREATE TABLE public.subscription_plans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    
    -- Pricing
    price DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    billing_period TEXT DEFAULT 'monthly', -- monthly, yearly, lifetime
    trial_days INTEGER DEFAULT 0,
    
    -- Features
    features JSONB DEFAULT '{}', -- {feature_name: value/limit}
    test_limit_per_month INTEGER,
    question_limit_per_test INTEGER,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Subscriptions
CREATE TABLE public.user_subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES subscription_plans(id),
    
    -- Subscription Period
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    
    -- Payment Information
    payment_method TEXT,
    stripe_subscription_id TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    auto_renew BOOLEAN DEFAULT true,
    
    -- Usage
    tests_used INTEGER DEFAULT 0,
    tests_limit INTEGER,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, is_active)
);

-- Payment History
CREATE TABLE public.payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES user_subscriptions(id),
    
    -- Payment Details
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    payment_method TEXT,
    
    -- Transaction Information
    transaction_id TEXT UNIQUE,
    stripe_payment_intent_id TEXT,
    
    -- Status
    status payment_status DEFAULT 'pending',
    
    -- Metadata
    description TEXT,
    invoice_url TEXT,
    receipt_url TEXT,
    
    -- Timestamps
    paid_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    refunded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- COMMUNICATION TABLES
-- =====================================================

-- Notifications
CREATE TABLE public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Notification Content
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type notification_type DEFAULT 'in_app',
    category TEXT, -- test_reminder, result_ready, achievement, etc.
    
    -- Status
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Action
    action_url TEXT,
    action_data JSONB,
    
    -- Delivery
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivered_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    priority INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Achievements/Badges
CREATE TABLE public.user_achievements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Achievement Details
    achievement_type TEXT NOT NULL, -- first_test, perfect_score, streak_7days, etc.
    achievement_name TEXT NOT NULL,
    achievement_description TEXT,
    
    -- Visual Elements
    badge_image_url TEXT,
    badge_color TEXT,
    
    -- Progress
    progress_current INTEGER DEFAULT 0,
    progress_target INTEGER DEFAULT 1,
    is_completed BOOLEAN DEFAULT false,
    
    -- Metadata
    earned_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, achievement_type)
);

-- =====================================================
-- AUDIT AND SYSTEM TABLES
-- =====================================================

-- Audit Log for tracking important actions
CREATE TABLE public.audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Action Details
    action TEXT NOT NULL, -- login, test_submit, payment, etc.
    entity_type TEXT, -- user, test, question, etc.
    entity_id TEXT,
    
    -- Change Details
    old_values JSONB,
    new_values JSONB,
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System Settings for configuration
CREATE TABLE public.system_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    
    -- Metadata
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables with updated_at column
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'updated_at' 
        AND table_schema = 'public'
    LOOP
        EXECUTE format('CREATE TRIGGER update_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', t, t);
    END LOOP;
END$$;

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, phone, role)
    VALUES (
        NEW.id, 
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'free_user')
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, users.full_name),
        phone = COALESCE(EXCLUDED.phone, users.phone),
        updated_at = NOW();
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error creating user profile for %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to calculate test results
CREATE OR REPLACE FUNCTION calculate_test_results(test_id UUID)
RETURNS VOID AS $$
DECLARE
    test_record RECORD;
    attempt_record RECORD;
    total_marks DECIMAL(6,2) := 0;
    obtained_marks DECIMAL(6,2) := 0;
    negative_marks DECIMAL(6,2) := 0;
    correct_count INTEGER := 0;
    wrong_count INTEGER := 0;
    domain_scores JSONB := '{}';
BEGIN
    -- Get test details
    SELECT * INTO test_record FROM tests WHERE id = test_id;
    
    -- Calculate scores from attempts
    FOR attempt_record IN 
        SELECT a.*, q.points, q.negative_points, q.domain_id
        FROM attempts a
        JOIN questions q ON a.question_id = q.id
        WHERE a.test_id = test_id
    LOOP
        total_marks := total_marks + attempt_record.points;
        
        IF attempt_record.is_correct THEN
            obtained_marks := obtained_marks + attempt_record.marks_obtained;
            correct_count := correct_count + 1;
        ELSIF attempt_record.selected_answer IS NOT NULL THEN
            negative_marks := negative_marks + attempt_record.marks_deducted;
            wrong_count := wrong_count + 1;
        END IF;
    END LOOP;
    
    -- Update test record
    UPDATE tests SET
        total_marks = total_marks,
        obtained_marks = obtained_marks,
        negative_marks = negative_marks,
        final_score = obtained_marks - negative_marks,
        percentage = CASE 
            WHEN total_marks > 0 THEN ((obtained_marks - negative_marks) / total_marks) * 100 
            ELSE 0 
        END,
        correct_answers = correct_count,
        wrong_answers = wrong_count,
        evaluated_at = NOW()
    WHERE id = test_id;
    
END;
$$ LANGUAGE plpgsql;

-- Function to update question analytics
CREATE OR REPLACE FUNCTION update_question_analytics(question_id INTEGER)
RETURNS VOID AS $$
DECLARE
    total_attempts_count INTEGER;
    correct_attempts_count INTEGER;
    avg_time DECIMAL(6,2);
BEGIN
    -- Calculate statistics
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE is_correct = true),
        AVG(time_spent_seconds)
    INTO 
        total_attempts_count,
        correct_attempts_count,
        avg_time
    FROM attempts
    WHERE attempts.question_id = update_question_analytics.question_id;
    
    -- Update or insert analytics
    INSERT INTO question_analytics (
        question_id,
        total_attempts,
        correct_attempts,
        overall_accuracy,
        average_time_spent
    ) VALUES (
        update_question_analytics.question_id,
        total_attempts_count,
        correct_attempts_count,
        CASE 
            WHEN total_attempts_count > 0 THEN (correct_attempts_count::DECIMAL / total_attempts_count) * 100
            ELSE 0
        END,
        COALESCE(avg_time, 0)
    )
    ON CONFLICT (question_id) DO UPDATE SET
        total_attempts = EXCLUDED.total_attempts,
        correct_attempts = EXCLUDED.correct_attempts,
        overall_accuracy = EXCLUDED.overall_accuracy,
        average_time_spent = EXCLUDED.average_time_spent,
        last_calculated_at = NOW();
        
    -- Update question difficulty score based on performance
    UPDATE questions SET
        difficulty_score = CASE
            WHEN total_attempts_count >= 10 THEN
                1 - (correct_attempts_count::DECIMAL / total_attempts_count)
            ELSE
                difficulty_score
        END
    WHERE id = update_question_analytics.question_id;
    
END;
$$ LANGUAGE plpgsql;

-- Function to create question set from JSON
CREATE OR REPLACE FUNCTION create_question_set_from_json(
    p_set_name TEXT,
    p_questions_json JSONB,
    p_created_by UUID
)
RETURNS UUID AS $$
DECLARE
    question_set_id UUID;
    question_record JSONB;
    domain_id INTEGER;
    question_id INTEGER;
    question_ids INTEGER[] := '{}';
    domain_counts JSONB := '{}';
BEGIN
    -- Create the question set
    INSERT INTO question_sets (name, created_by, total_questions)
    VALUES (p_set_name, p_created_by, jsonb_array_length(p_questions_json))
    RETURNING id INTO question_set_id;
    
    -- Process each question
    FOR question_record IN SELECT * FROM jsonb_array_elements(p_questions_json)
    LOOP
        -- Get or create domain
        SELECT id INTO domain_id 
        FROM domains 
        WHERE LOWER(name) = LOWER(question_record->>'domain');
        
        IF domain_id IS NULL THEN
            INSERT INTO domains (name, code, created_by)
            VALUES (
                question_record->>'domain',
                UPPER(SUBSTRING(question_record->>'domain', 1, 4)),
                p_created_by
            )
            RETURNING id INTO domain_id;
        END IF;
        
        -- Create the question
        INSERT INTO questions (
            domain_id,
            text,
            options,
            correct_answer,
            explanation,
            difficulty_level,
            created_by
        ) VALUES (
            domain_id,
            question_record->>'text',
            question_record->'options',
            question_record->'correctAnswer',
            question_record->>'explanation',
            COALESCE((question_record->>'difficulty')::difficulty_level, 'medium'),
            p_created_by
        )
        RETURNING id INTO question_id;
        
        -- Add to question IDs array
        question_ids := array_append(question_ids, question_id);
        
        -- Update domain count
        domain_counts := jsonb_set(
            domain_counts,
            ARRAY[domain_id::text],
            COALESCE(domain_counts->(domain_id::text), '0'::jsonb)::int + 1
        );
    END LOOP;
    
    -- Update question set with questions and domain distribution
    UPDATE question_sets 
    SET 
        questions = to_jsonb(question_ids),
        domain_distribution = domain_counts
    WHERE id = question_set_id;
    
    RETURN question_set_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update search vector for questions
CREATE OR REPLACE FUNCTION update_question_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', coalesce(NEW.text, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(NEW.explanation, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(array_to_string(NEW.tags, ' '), '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update search vector on insert/update
CREATE TRIGGER update_question_search_vector_trigger
    BEFORE INSERT OR UPDATE ON questions
    FOR EACH ROW EXECUTE FUNCTION update_question_search_vector();

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_institution ON users(institution);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = true;

-- Questions indexes
CREATE INDEX idx_questions_domain ON questions(domain_id);
CREATE INDEX idx_questions_category ON questions(category_id);
CREATE INDEX idx_questions_difficulty ON questions(difficulty_level);
CREATE INDEX idx_questions_type ON questions(question_type);
CREATE INDEX idx_questions_active ON questions(is_active) WHERE is_active = true;
CREATE INDEX idx_questions_search ON questions USING GIN(search_vector);
CREATE INDEX idx_questions_tags ON questions USING GIN(tags);

-- Tests indexes
CREATE INDEX idx_tests_user ON tests(user_id);
CREATE INDEX idx_tests_config ON tests(test_config_id);
CREATE INDEX idx_tests_status ON tests(status);
CREATE INDEX idx_tests_dates ON tests(started_at, submitted_at);
CREATE INDEX idx_tests_user_status ON tests(user_id, status);

-- Attempts indexes
CREATE INDEX idx_attempts_test ON attempts(test_id);
CREATE INDEX idx_attempts_question ON attempts(question_id);
CREATE INDEX idx_attempts_correct ON attempts(is_correct);

-- Practice sets indexes
CREATE INDEX idx_practice_sets_status ON practice_sets(status, is_live);
CREATE INDEX idx_practice_sets_slug ON practice_sets(slug);

-- Test sessions indexes
CREATE INDEX idx_sessions_active ON test_sessions(user_id, is_active);
CREATE INDEX idx_sessions_token ON test_sessions(session_token);

-- User analytics indexes
CREATE INDEX idx_user_analytics_user ON user_performance_analytics(user_id);
CREATE INDEX idx_user_analytics_rank ON user_performance_analytics(percentile_rank DESC);

-- Payments indexes
CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);

-- Notifications indexes
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- Audit logs indexes
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

-- Question sets indexes
CREATE INDEX idx_question_sets_created_by ON question_sets(created_by);
CREATE INDEX idx_question_sets_active ON question_sets(is_active) WHERE is_active = true;
CREATE INDEX idx_question_sets_published ON question_sets(is_published) WHERE is_published = true;

-- File uploads indexes
CREATE INDEX idx_file_uploads_entity ON file_uploads(entity_type, entity_id);
CREATE INDEX idx_file_uploads_type ON file_uploads(file_type);
CREATE INDEX idx_file_uploads_user ON file_uploads(uploaded_by);
CREATE INDEX idx_file_uploads_status ON file_uploads(processing_status);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_performance_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Public read access
CREATE POLICY "Anyone can view domains" ON domains
    FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view categories" ON question_categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view active questions" ON questions
    FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view public practice sets" ON practice_sets
    FOR SELECT USING (is_public = true AND is_live = true);

CREATE POLICY "Anyone can view public test configs" ON test_configurations
    FOR SELECT USING (is_public = true AND is_active = true);

CREATE POLICY "Anyone can view subscription plans" ON subscription_plans
    FOR SELECT USING (is_active = true);

-- User-specific policies
CREATE POLICY "Users can view own tests" ON tests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tests" ON tests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tests" ON tests
    FOR UPDATE USING (auth.uid() = user_id AND status IN ('not_started', 'in_progress'));

CREATE POLICY "Users can view own attempts" ON attempts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tests 
            WHERE tests.id = attempts.test_id 
            AND tests.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create own attempts" ON attempts
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM tests 
            WHERE tests.id = attempts.test_id 
            AND tests.user_id = auth.uid()
            AND tests.status = 'in_progress'
        )
    );

CREATE POLICY "Users can view own sessions" ON test_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own sessions" ON test_sessions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own analytics" ON user_performance_analytics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own subscriptions" ON user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own payments" ON payments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own achievements" ON user_achievements
    FOR SELECT USING (auth.uid() = user_id);

-- Question sets policies
CREATE POLICY "Anyone can view published question sets" ON question_sets
    FOR SELECT USING (is_published = true AND is_active = true);

CREATE POLICY "Admins can manage question sets" ON question_sets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Users can create question sets" ON question_sets
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can view own question sets" ON question_sets
    FOR SELECT USING (auth.uid() = created_by);

-- File uploads policies
CREATE POLICY "Users can view own uploads" ON file_uploads
    FOR SELECT USING (auth.uid() = uploaded_by);

CREATE POLICY "Users can upload files" ON file_uploads
    FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can update own uploads" ON file_uploads
    FOR UPDATE USING (auth.uid() = uploaded_by);

CREATE POLICY "Admins can manage all uploads" ON file_uploads
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Enhanced admin policies for questions
CREATE POLICY "Admins can create questions" ON questions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can update questions" ON questions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can delete questions" ON questions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Admin policies
CREATE POLICY "Admins can manage all data" ON users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Apply similar admin policies to all tables
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        AND tablename NOT IN ('users') -- Already has admin policy
    LOOP
        EXECUTE format(
            'CREATE POLICY "Admins can manage %I" ON %I FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE users.id = auth.uid() 
                    AND users.role = ''admin''
                )
            )', t, t);
    END LOOP;
END$$;

-- Service role bypass
CREATE POLICY "Service role bypass" ON users
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant permissions to authenticated users
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON users, tests, attempts, test_sessions, question_sets, file_uploads, notifications, user_achievements TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant all permissions to service role
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Insert default domains
INSERT INTO domains (name, code, description, icon_url, color_code) VALUES 
    ('Mathematics', 'MATH', 'Mathematical concepts, algebra, calculus, and problem solving', '/icons/math.svg', '#3B82F6'),
    ('Physics', 'PHYS', 'Classical mechanics, thermodynamics, electromagnetism, and modern physics', '/icons/physics.svg', '#10B981'),
    ('Chemistry', 'CHEM', 'Organic, inorganic, physical chemistry, and chemical reactions', '/icons/chemistry.svg', '#F59E0B'),
    ('Botany', 'BOT', 'Plant biology, plant physiology, taxonomy, and plant ecology', '/icons/botany.svg', '#22C55E'),
    ('Zoology', 'ZOO', 'Animal biology, animal behavior, taxonomy, and animal physiology', '/icons/zoology.svg', '#EF4444'),
    ('Computer Science', 'CS', 'Programming, algorithms, data structures, and software engineering', '/icons/cs.svg', '#8B5CF6'),
    ('English', 'ENG', 'Grammar, vocabulary, comprehension, and communication skills', '/icons/english.svg', '#EC4899'),
    ('Mental Agility Test', 'MAT', 'Current affairs, history, geography, and general awareness', '/icons/gk.svg', '#6B7280')
ON CONFLICT (name) DO NOTHING;

-- Insert default subscription plans
INSERT INTO subscription_plans (name, code, description, price, features) VALUES
    ('Free', 'FREE', 'Basic access with limited features', 0, '{"tests_per_month": 5, "questions_per_test": 20, "basic_analytics": true}'::jsonb),
    ('Premium', 'PREMIUM', 'Full access with advanced features', 9.99, '{"tests_per_month": -1, "questions_per_test": -1, "advanced_analytics": true, "priority_support": true}'::jsonb),
    ('Enterprise', 'ENTERPRISE', 'Custom solution for institutions', 99.99, '{"unlimited_everything": true, "white_label": true, "dedicated_support": true}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- Insert system settings
INSERT INTO system_settings (key, value, description) VALUES
    ('maintenance_mode', 'false'::jsonb, 'Enable/disable maintenance mode'),
    ('registration_enabled', 'true'::jsonb, 'Enable/disable new user registration'),
    ('default_test_duration', '7200'::jsonb, 'Default test duration in seconds'),
    ('max_file_upload_size', '10485760'::jsonb, 'Maximum file upload size in bytes')
ON CONFLICT (key) DO NOTHING;

-- Create sample questions for each domain
DO $$
DECLARE
    domain_record RECORD;
    i INTEGER;
BEGIN
    FOR domain_record IN SELECT id, name FROM domains LIMIT 5
    LOOP
        FOR i IN 1..3
        LOOP
            INSERT INTO questions (
                domain_id,
                text,
                options,
                correct_answer,
                explanation,
                difficulty_level
            ) VALUES (
                domain_record.id,
                format('Sample question %s for %s', i, domain_record.name),
                jsonb_build_array(
                    jsonb_build_object('text', 'Option A', 'id', 'A'),
                    jsonb_build_object('text', 'Option B', 'id', 'B'),
                    jsonb_build_object('text', 'Option C', 'id', 'C'),
                    jsonb_build_object('text', 'Option D', 'id', 'D')
                ),
                '"B"'::jsonb,
                'This is a sample explanation for the correct answer.',
                CASE 
                    WHEN i = 1 THEN 'easy'::difficulty_level
                    WHEN i = 2 THEN 'medium'::difficulty_level
                    ELSE 'hard'::difficulty_level
                END
            );
        END LOOP;
    END LOOP;
END$$;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE users IS 'Core user table extending Supabase auth with profile and preferences';
COMMENT ON TABLE domains IS 'Subject areas for organizing questions and tests';
COMMENT ON TABLE questions IS 'Question bank with comprehensive metadata and analytics';
COMMENT ON TABLE tests IS 'Individual test sessions taken by users';
COMMENT ON TABLE attempts IS 'User answers and interactions for each question in a test';
COMMENT ON TABLE practice_sets IS 'Curated collections of questions for practice';
COMMENT ON TABLE test_sessions IS 'Real-time session management for active tests';
COMMENT ON TABLE user_performance_analytics IS 'Aggregated performance metrics per user per domain';
COMMENT ON TABLE question_analytics IS 'Question quality and performance metrics';
COMMENT ON COLUMN questions.discrimination_index IS 'How well this question differentiates between high and low performers';
COMMENT ON COLUMN tests.performance_category IS 'Categorization based on overall performance';
COMMENT ON COLUMN attempts.hesitation_time IS 'Time between first viewing and first answer selection'; 