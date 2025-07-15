-- Migration: Fix weighted question selection function
-- This migration improves the weighted selection to handle domain-level selections

-- Drop the old function
DROP FUNCTION IF EXISTS select_weighted_questions(TEXT, TEXT, INTEGER, TEXT, TEXT, INTEGER, DECIMAL, DECIMAL);

-- Create improved weighted question selection function
CREATE OR REPLACE FUNCTION select_weighted_questions(
    p_target_count INTEGER,
    p_subdomain_code TEXT DEFAULT NULL,
    p_domain_code TEXT DEFAULT NULL,
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
    difficulty_level TEXT,
    subdomain_code TEXT,
    domain_code TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH weighted_questions AS (
        SELECT 
            q.id,
            q.importance_points,
            q.cognitive_level,
            q.difficulty_level,
            qc.code as subdomain_code,
            d.code as domain_code,
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
        JOIN domains d ON qc.domain_id = d.id
        WHERE q.is_active = true
        AND q.is_verified = true
        AND (p_subdomain_code IS NULL OR qc.code = p_subdomain_code)
        AND (p_domain_code IS NULL OR d.code = p_domain_code)
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
        rq.difficulty_level,
        rq.subdomain_code,
        rq.domain_code
    FROM ranked_questions rq
    WHERE rq.rank <= p_target_count
    ORDER BY rq.calculated_weight DESC, rq.random_factor DESC;
END;
$$ LANGUAGE plpgsql;

-- Update the generate_question_set function to use the improved selection
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
    total_selected INTEGER := 0;
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
            -- Process each subdomain with precise distribution
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
                        -- Skip if cognitive count is 0
                        IF cognitive_count > 0 THEN
                            -- Select weighted questions for this subdomain and cognitive level
                            FOR question_record IN 
                                SELECT * FROM select_weighted_questions(
                                    cognitive_count,  -- p_target_count (required, must be first)
                                    subdomain_key,    -- p_subdomain_code
                                    NULL,             -- p_domain_code (not needed when subdomain is specified)
                                    cognitive_key,    -- p_cognitive_level
                                    NULL,             -- p_difficulty_level (let it vary)
                                    template_record.avoid_recent_days,
                                    template_record.importance_weight_factor,
                                    template_record.recency_weight_factor
                                )
                            LOOP
                                selected_questions := selected_questions || jsonb_build_object(
                                    'question_id', question_record.question_id,
                                    'domain', domain_key,
                                    'subdomain', question_record.subdomain_code,
                                    'cognitive_level', question_record.cognitive_level,
                                    'difficulty_level', question_record.difficulty_level,
                                    'importance_points', question_record.importance_points,
                                    'weight_score', question_record.weight_score,
                                    'selected_at', NOW()
                                );
                                
                                total_selected := total_selected + 1;
                                
                                -- Mark question as asked
                                PERFORM mark_question_asked(question_record.question_id);
                            END LOOP;
                        END IF;
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
                        -- Skip if cognitive count is 0
                        IF cognitive_count > 0 THEN
                            -- Select questions from any subdomain in this domain
                            FOR question_record IN 
                                SELECT * FROM select_weighted_questions(
                                    cognitive_count,  -- p_target_count (required, must be first)
                                    NULL,             -- p_subdomain_code (any subdomain)
                                    domain_key,       -- p_domain_code
                                    cognitive_key,    -- p_cognitive_level
                                    NULL,             -- p_difficulty_level
                                    template_record.avoid_recent_days,
                                    template_record.importance_weight_factor,
                                    template_record.recency_weight_factor
                                )
                            LOOP
                                selected_questions := selected_questions || jsonb_build_object(
                                    'question_id', question_record.question_id,
                                    'domain', question_record.domain_code,
                                    'subdomain', question_record.subdomain_code,
                                    'cognitive_level', question_record.cognitive_level,
                                    'difficulty_level', question_record.difficulty_level,
                                    'importance_points', question_record.importance_points,
                                    'weight_score', question_record.weight_score,
                                    'selected_at', NOW()
                                );
                                
                                total_selected := total_selected + 1;
                                
                                PERFORM mark_question_asked(question_record.question_id);
                            END LOOP;
                        END IF;
                    END;
                END LOOP;
            END;
        END IF;
    END LOOP;
    
    -- Update the generated set with selected questions
    UPDATE generated_question_sets SET
        questions = selected_questions,
        total_questions = total_selected,
        updated_at = NOW()
    WHERE id = generated_set_id;
    
    RETURN generated_set_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions on updated function
GRANT EXECUTE ON FUNCTION select_weighted_questions(INTEGER, TEXT, TEXT, TEXT, TEXT, INTEGER, DECIMAL, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_question_set TO authenticated;

COMMENT ON FUNCTION select_weighted_questions(INTEGER, TEXT, TEXT, TEXT, TEXT, INTEGER, DECIMAL, DECIMAL) IS 'Improved weighted random selection supporting both subdomain and domain-level selection with cognitive and difficulty filtering'; 