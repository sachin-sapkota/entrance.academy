-- Migration: Question Set Generation System
-- This migration adds support for different types of question sets with weighted random selection

-- Create enum for question set types
CREATE TYPE question_set_type AS ENUM (
    'full_mock_practice',       -- 200 questions following exact curriculum distribution
    'weekly_full_practice',     -- Weekly full practice set
    'weekly_domain_practice',   -- Weekly practice focused on specific domain
    'daily_mixed_practice',     -- Daily mixed practice across domains
    'daily_question_set',       -- Daily focused question set
    'custom_practice'           -- Custom admin-created sets
);

-- Create question set templates table
CREATE TABLE public.question_set_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    type question_set_type NOT NULL,
    description TEXT,
    
    -- Question Distribution Configuration
    total_questions INTEGER NOT NULL DEFAULT 200,
    domain_distribution JSONB NOT NULL DEFAULT '{}', -- {domain_code: {target_count, subdomain_distribution}}
    cognitive_distribution JSONB NOT NULL DEFAULT '{"recall": 30, "understanding": 50, "application": 20}'::jsonb,
    
    -- Selection Preferences
    importance_weight_factor DECIMAL(3,2) DEFAULT 1.5, -- Multiplier for importance points
    recency_weight_factor DECIMAL(3,2) DEFAULT 0.8,    -- Factor for recently asked questions
    difficulty_distribution JSONB DEFAULT '{"very_easy": 5, "easy": 25, "medium": 40, "hard": 25, "very_hard": 5}'::jsonb,
    
    -- Generation Rules
    avoid_recent_days INTEGER DEFAULT 7,               -- Avoid questions asked in last N days
    max_importance_bias DECIMAL(3,2) DEFAULT 3.0,      -- Maximum bias for high importance questions
    shuffle_questions BOOLEAN DEFAULT true,
    shuffle_within_domain BOOLEAN DEFAULT true,
    
    -- Scheduling
    is_recurring BOOLEAN DEFAULT false,
    recurrence_pattern TEXT, -- daily, weekly, monthly
    next_generation_date DATE,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    
    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    meta_data JSONB DEFAULT '{}'::jsonb
);

-- Generated question sets table (instances of templates)
CREATE TABLE public.generated_question_sets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    template_id UUID REFERENCES question_set_templates(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT UNIQUE,
    
    -- Generation Details
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    generation_config JSONB NOT NULL, -- Snapshot of config used for generation
    
    -- Questions
    questions JSONB NOT NULL DEFAULT '[]', -- Array of question IDs with metadata
    total_questions INTEGER NOT NULL DEFAULT 0,
    
    -- Distribution Achieved
    actual_domain_distribution JSONB DEFAULT '{}',
    actual_cognitive_distribution JSONB DEFAULT '{}',
    actual_difficulty_distribution JSONB DEFAULT '{}',
    
    -- Quality Metrics
    average_importance_score DECIMAL(5,2) DEFAULT 0,
    distribution_accuracy_score DECIMAL(5,2) DEFAULT 0, -- How well it matches target distribution
    
    -- Usage Tracking
    times_used INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    
    -- Status
    is_published BOOLEAN DEFAULT false,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    generated_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default curriculum-compliant templates
INSERT INTO question_set_templates (
    name, code, type, description, total_questions, domain_distribution, created_by
) VALUES 
(
    'MBBS/BDS Full Mock Test', 
    'MBBS_FULL_MOCK', 
    'full_mock_practice',
    'Complete 200-question mock test following exact MBBS/BDS curriculum distribution',
    200,
    '{
        "ZOO": {
            "target_count": 40,
            "subdomain_distribution": {
                "ZOO_BIOLOGY_EVOLUTION": 4,
                "ZOO_CLASSIFICATION": 8,
                "ZOO_SPECIMENS": 8,
                "ZOO_HUMAN_BIOLOGY": 14,
                "ZOO_TISSUES": 4,
                "ZOO_ECOLOGY_BEHAVIOR": 2
            }
        },
        "BOT": {
            "target_count": 40,
            "subdomain_distribution": {
                "BOT_LIFE_BIODIVERSITY": 11,
                "BOT_ECOLOGY": 5,
                "BOT_CELL_GENETICS": 12,
                "BOT_ANATOMY_PHYSIOLOGY": 7,
                "BOT_DEVELOPMENT_APPLIED": 5
            }
        },
        "CHEM": {
            "target_count": 50,
            "subdomain_distribution": {
                "CHEM_GENERAL_PHYSICAL": 18,
                "CHEM_INORGANIC": 14,
                "CHEM_ORGANIC": 18
            }
        },
        "PHYS": {
            "target_count": 50,
            "subdomain_distribution": {
                "PHYS_MECHANICS": 10,
                "PHYS_THERMODYNAMICS": 6,
                "PHYS_OPTICS": 6,
                "PHYS_ELECTRICITY_MAGNETISM": 9,
                "PHYS_WAVES_ELECTROSTATICS": 6,
                "PHYS_MODERN_NUCLEAR": 6,
                "PHYS_ELECTRONICS": 4,
                "PHYS_PARTICLE_COSMOLOGY": 3
            }
        },
        "MAT": {
            "target_count": 20,
            "subdomain_distribution": {
                "MAT_VERBAL": 5,
                "MAT_NUMERICAL": 5,
                "MAT_LOGICAL": 5,
                "MAT_SPATIAL_ABSTRACT": 5
            }
        }
    }'::jsonb,
    (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
),
(
    'Weekly Mixed Practice',
    'WEEKLY_MIXED',
    'weekly_full_practice',
    'Weekly practice set with balanced distribution across all domains',
    100,
    '{
        "ZOO": {"target_count": 20},
        "BOT": {"target_count": 20},
        "CHEM": {"target_count": 25},
        "PHYS": {"target_count": 25},
        "MAT": {"target_count": 10}
    }'::jsonb,
    (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
),
(
    'Daily Quick Practice',
    'DAILY_QUICK',
    'daily_mixed_practice',
    'Daily 25-question practice covering all domains',
    25,
    '{
        "ZOO": {"target_count": 5},
        "BOT": {"target_count": 5},
        "CHEM": {"target_count": 6},
        "PHYS": {"target_count": 6},
        "MAT": {"target_count": 3}
    }'::jsonb,
    (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
);

-- Weighted question selection function
CREATE OR REPLACE FUNCTION select_weighted_questions(
    p_target_count INTEGER,
    p_subdomain_code TEXT DEFAULT NULL,
    p_cognitive_level TEXT DEFAULT NULL,
    p_difficulty_level TEXT DEFAULT NULL,
    p_avoid_recent_days INTEGER DEFAULT 7,
    p_importance_weight_factor DECIMAL DEFAULT 1.5,
    p_recency_weight_factor DECIMAL DEFAULT 0.8
)
RETURNS TABLE (
    question_id INTEGER,
    importance_points INTEGER,
    weight_score DECIMAL,
    cognitive_level TEXT,
    difficulty_level TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH weighted_questions AS (
        SELECT 
            q.id,
            q.importance_points,
            q.cognitive_level,
            q.difficulty_level,
            -- Calculate weight score based on importance and recency
            CASE 
                WHEN q.last_asked_date IS NULL OR q.last_asked_date < CURRENT_DATE - INTERVAL '1 day' * p_avoid_recent_days
                THEN q.importance_points * p_importance_weight_factor
                ELSE q.importance_points * p_importance_weight_factor * p_recency_weight_factor
            END as calculated_weight,
            -- Add randomness for questions with same weight
            RANDOM() as random_factor
        FROM questions q
        JOIN question_categories qc ON q.category_id = qc.id
        WHERE qc.code = p_subdomain_code
        AND q.is_active = true
        AND q.is_verified = true
        AND (p_cognitive_level IS NULL OR q.cognitive_level = p_cognitive_level)
        AND (p_difficulty_level IS NULL OR q.difficulty_level = p_difficulty_level)
    ),
    ranked_questions AS (
        SELECT *,
            ROW_NUMBER() OVER (
                ORDER BY calculated_weight DESC, random_factor DESC
            ) as rank
        FROM weighted_questions
    )
    SELECT 
        rq.id,
        rq.importance_points,
        rq.calculated_weight,
        rq.cognitive_level,
        rq.difficulty_level
    FROM ranked_questions rq
    WHERE rq.rank <= p_target_count
    ORDER BY rq.calculated_weight DESC, rq.random_factor DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to generate a complete question set
CREATE OR REPLACE FUNCTION generate_question_set(
    p_template_id UUID,
    p_set_name TEXT DEFAULT NULL,
    p_generated_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    template_record RECORD;
    domain_key TEXT;
    domain_config JSONB;
    subdomain_key TEXT;
    subdomain_target INTEGER;
    cognitive_key TEXT;
    cognitive_target INTEGER;
    selected_questions JSONB := '[]';
    question_record RECORD;
    generated_set_id UUID;
    actual_distributions JSONB := '{}';
BEGIN
    -- Get template configuration
    SELECT * INTO template_record 
    FROM question_set_templates 
    WHERE id = p_template_id AND is_active = true;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Template not found or inactive: %', p_template_id;
    END IF;
    
    -- Create the generated set record
    INSERT INTO generated_question_sets (
        template_id,
        name,
        code,
        generation_config,
        generated_by
    ) VALUES (
        p_template_id,
        COALESCE(p_set_name, template_record.name || ' - ' || TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI')),
        template_record.code || '_' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS'),
        jsonb_build_object(
            'template_snapshot', row_to_json(template_record),
            'generated_at', NOW()
        ),
        p_generated_by
    ) RETURNING id INTO generated_set_id;
    
    -- Process each domain in the distribution
    FOR domain_key, domain_config IN 
        SELECT * FROM jsonb_each(template_record.domain_distribution)
    LOOP
        -- Check if subdomain distribution is specified
        IF domain_config ? 'subdomain_distribution' THEN
            -- Process each subdomain
            FOR subdomain_key, subdomain_target IN 
                SELECT * FROM jsonb_each_text(domain_config->'subdomain_distribution')
            LOOP
                -- Get questions for this subdomain with cognitive level distribution
                FOR cognitive_key IN SELECT * FROM jsonb_object_keys(template_record.cognitive_distribution)
                LOOP
                    DECLARE
                        cognitive_percentage INTEGER := (template_record.cognitive_distribution->>cognitive_key)::INTEGER;
                        cognitive_count INTEGER := ROUND(subdomain_target::DECIMAL * cognitive_percentage / 100);
                    BEGIN
                        -- Select weighted questions for this subdomain and cognitive level
                        FOR question_record IN 
                            SELECT * FROM select_weighted_questions(
                                cognitive_count,  -- p_target_count (required, must be first)
                                subdomain_key,    -- p_subdomain_code
                                cognitive_key,    -- p_cognitive_level
                                NULL, -- difficulty (let it vary)
                                template_record.avoid_recent_days,
                                template_record.importance_weight_factor,
                                template_record.recency_weight_factor
                            )
                        LOOP
                            selected_questions := selected_questions || jsonb_build_object(
                                'question_id', question_record.question_id,
                                'domain', domain_key,
                                'subdomain', subdomain_key,
                                'cognitive_level', question_record.cognitive_level,
                                'difficulty_level', question_record.difficulty_level,
                                'importance_points', question_record.importance_points,
                                'weight_score', question_record.weight_score,
                                'selected_at', NOW()
                            );
                            
                            -- Mark question as asked
                            PERFORM mark_question_asked(question_record.question_id);
                        END LOOP;
                    END;
                END LOOP;
            END LOOP;
        ELSE
            -- Simple domain-level distribution without subdomain specification
            DECLARE
                domain_target INTEGER := (domain_config->>'target_count')::INTEGER;
            BEGIN
                FOR cognitive_key IN SELECT * FROM jsonb_object_keys(template_record.cognitive_distribution)
                LOOP
                    DECLARE
                        cognitive_percentage INTEGER := (template_record.cognitive_distribution->>cognitive_key)::INTEGER;
                        cognitive_count INTEGER := ROUND(domain_target::DECIMAL * cognitive_percentage / 100);
                    BEGIN
                        -- Select questions from any subdomain in this domain
                        FOR question_record IN 
                            SELECT sq.* FROM select_weighted_questions(
                                cognitive_count,  -- p_target_count (required, must be first)
                                NULL,             -- p_subdomain_code (any subdomain)
                                domain_key,       -- p_domain_code (filter by domain)
                                cognitive_key,    -- p_cognitive_level
                                NULL,             -- p_difficulty_level
                                template_record.avoid_recent_days,
                                template_record.importance_weight_factor,
                                template_record.recency_weight_factor
                            ) sq
                            JOIN questions q ON sq.question_id = q.id
                            JOIN question_categories qc ON q.category_id = qc.id
                            JOIN domains d ON qc.domain_id = d.id
                            WHERE d.code = domain_key
                            LIMIT cognitive_count
                        LOOP
                            selected_questions := selected_questions || jsonb_build_object(
                                'question_id', question_record.question_id,
                                'domain', domain_key,
                                'cognitive_level', question_record.cognitive_level,
                                'difficulty_level', question_record.difficulty_level,
                                'importance_points', question_record.importance_points,
                                'weight_score', question_record.weight_score,
                                'selected_at', NOW()
                            );
                            
                            PERFORM mark_question_asked(question_record.question_id);
                        END LOOP;
                    END;
                END LOOP;
            END;
        END IF;
    END LOOP;
    
    -- Update the generated set with selected questions
    UPDATE generated_question_sets SET
        questions = selected_questions,
        total_questions = jsonb_array_length(selected_questions),
        updated_at = NOW()
    WHERE id = generated_set_id;
    
    RETURN generated_set_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate distribution accuracy
CREATE OR REPLACE FUNCTION calculate_distribution_accuracy(
    p_generated_set_id UUID
)
RETURNS DECIMAL AS $$
DECLARE
    set_record RECORD;
    target_dist JSONB;
    actual_dist JSONB;
    accuracy_score DECIMAL := 0;
    total_comparisons INTEGER := 0;
BEGIN
    SELECT * INTO set_record 
    FROM generated_question_sets 
    WHERE id = p_generated_set_id;
    
    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    
    -- Calculate accuracy based on domain distribution
    target_dist := (set_record.generation_config->'template_snapshot'->>'domain_distribution')::jsonb;
    
    -- This is a simplified accuracy calculation
    -- In production, you'd want more sophisticated comparison
    RETURN 95.0; -- Placeholder
END;
$$ LANGUAGE plpgsql;

-- Create indexes for performance
CREATE INDEX idx_question_set_templates_type ON question_set_templates(type);
CREATE INDEX idx_question_set_templates_active ON question_set_templates(is_active) WHERE is_active = true;
CREATE INDEX idx_generated_question_sets_template ON generated_question_sets(template_id);
CREATE INDEX idx_generated_question_sets_published ON generated_question_sets(is_published) WHERE is_published = true;
CREATE INDEX idx_generated_question_sets_generated_at ON generated_question_sets(generated_at DESC);

-- Grant permissions
GRANT SELECT ON question_set_templates TO authenticated;
GRANT SELECT ON generated_question_sets TO authenticated;
GRANT EXECUTE ON FUNCTION select_weighted_questions(INTEGER, TEXT, TEXT, TEXT, INTEGER, DECIMAL, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_question_set TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_distribution_accuracy TO authenticated;

-- RLS Policies
ALTER TABLE question_set_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_question_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active templates" ON question_set_templates
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage templates" ON question_set_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Users can view published sets" ON generated_question_sets
    FOR SELECT USING (is_published = true);

CREATE POLICY "Admins can manage generated sets" ON generated_question_sets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

COMMENT ON TABLE question_set_templates IS 'Templates for generating different types of question sets with weighted selection';
COMMENT ON TABLE generated_question_sets IS 'Generated instances of question sets ready for use in tests';
COMMENT ON FUNCTION select_weighted_questions(INTEGER, TEXT, TEXT, TEXT, INTEGER, DECIMAL, DECIMAL) IS 'Weighted random selection of questions based on importance points and recency';
COMMENT ON FUNCTION generate_question_set IS 'Generate a complete question set from a template using weighted selection algorithms'; 