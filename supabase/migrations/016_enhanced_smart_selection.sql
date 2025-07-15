-- Migration: Enhanced Smart Question Selection Algorithm
-- This migration improves the question selection with performance analytics and better distribution

-- Enhanced weighted question selection function with performance analytics
CREATE OR REPLACE FUNCTION select_weighted_questions_enhanced(
    p_target_count INTEGER,
    p_subdomain_code TEXT DEFAULT NULL,
    p_domain_code TEXT DEFAULT NULL,
    p_cognitive_level TEXT DEFAULT NULL,
    p_difficulty_level TEXT DEFAULT NULL,
    p_avoid_recent_days INTEGER DEFAULT 7,
    p_importance_weight_factor DECIMAL DEFAULT 1.5,
    p_recency_weight_factor DECIMAL DEFAULT 0.8,
    p_performance_weight_factor DECIMAL DEFAULT 1.2,
    p_variety_bonus DECIMAL DEFAULT 0.1
)
RETURNS TABLE (
    question_id INTEGER,
    importance_points INTEGER,
    weight_score DECIMAL,
    cognitive_level TEXT,
    difficulty_level TEXT,
    subdomain_code TEXT,
    domain_code TEXT,
    performance_score DECIMAL,
    selection_reason TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH question_performance AS (
        -- Calculate performance metrics for each question
        SELECT 
            q.id,
            COALESCE(qa.overall_accuracy, 50.0) as accuracy_rate,
            COALESCE(qa.total_attempts, 0) as attempt_count,
            COALESCE(qa.discrimination_index, 0.5) as discrimination,
            -- Performance score: lower accuracy = higher educational value
            CASE 
                WHEN qa.total_attempts >= 10 THEN
                    CASE 
                        WHEN qa.overall_accuracy BETWEEN 40 AND 70 THEN 1.0  -- Optimal difficulty
                        WHEN qa.overall_accuracy BETWEEN 30 AND 80 THEN 0.8  -- Good difficulty
                        ELSE 0.6  -- Too easy or too hard
                    END
                ELSE 0.9  -- New questions get benefit of doubt
            END as performance_factor
        FROM questions q
        LEFT JOIN question_analytics qa ON q.id = qa.question_id
    ),
    weighted_questions AS (
        SELECT 
            q.id,
            q.importance_points,
            q.cognitive_level,
            q.difficulty_level,
            qc.code as subdomain_code,
            d.code as domain_code,
            qp.accuracy_rate,
            qp.performance_factor,
            
            -- Base importance weight
            (q.importance_points * p_importance_weight_factor) as base_weight,
            
            -- Recency adjustment
            CASE 
                WHEN q.last_asked_date IS NULL OR q.last_asked_date < CURRENT_DATE - INTERVAL '1 day' * p_avoid_recent_days
                THEN 1.0
                ELSE p_recency_weight_factor
            END as recency_factor,
            
            -- Performance adjustment (reward questions with good discrimination)
            (qp.performance_factor * p_performance_weight_factor) as performance_factor,
            
            -- Variety bonus for less frequently used questions
            CASE 
                WHEN q.times_asked_count <= 5 THEN 1.0 + p_variety_bonus
                WHEN q.times_asked_count <= 10 THEN 1.0
                ELSE 0.95
            END as variety_factor,
            
            -- Random factor for questions with same weight
            RANDOM() as random_factor
            
        FROM questions q
        JOIN question_categories qc ON q.category_id = qc.id
        JOIN domains d ON qc.domain_id = d.id
        JOIN question_performance qp ON q.id = qp.id
        WHERE q.is_active = true
        AND q.is_verified = true
        AND (p_subdomain_code IS NULL OR qc.code = p_subdomain_code)
        AND (p_domain_code IS NULL OR d.code = p_domain_code)
        AND (p_cognitive_level IS NULL OR q.cognitive_level = p_cognitive_level)
        AND (p_difficulty_level IS NULL OR q.difficulty_level = p_difficulty_level)
    ),
    scored_questions AS (
        SELECT *,
            -- Calculate final weight score
            (base_weight * recency_factor * performance_factor * variety_factor) as final_weight,
            
            -- Selection reason for debugging
            CASE 
                WHEN base_weight >= 4.0 THEN 'High Importance'
                WHEN performance_factor >= 1.1 THEN 'Good Discrimination'
                WHEN variety_factor > 1.0 THEN 'Underutilized'
                WHEN recency_factor < 1.0 THEN 'Recently Used'
                ELSE 'Standard Selection'
            END as selection_reason
            
        FROM weighted_questions
    ),
    ranked_questions AS (
        SELECT *,
            ROW_NUMBER() OVER (
                ORDER BY final_weight DESC, random_factor DESC
            ) as rank
        FROM scored_questions
    )
    SELECT 
        rq.id,
        rq.importance_points,
        rq.final_weight,
        rq.cognitive_level,
        rq.difficulty_level,
        rq.subdomain_code,
        rq.domain_code,
        rq.performance_factor,
        rq.selection_reason
    FROM ranked_questions rq
    WHERE rq.rank <= p_target_count
    ORDER BY rq.final_weight DESC, rq.random_factor DESC;
END;
$$ LANGUAGE plpgsql;

-- Enhanced question set generation with better distribution accuracy
CREATE OR REPLACE FUNCTION generate_question_set_enhanced(
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
    cognitive_percentage INTEGER;
    cognitive_count INTEGER;
    selected_questions JSONB := '[]';
    question_record RECORD;
    generated_set_id UUID;
    total_selected INTEGER := 0;
    distribution_accuracy DECIMAL := 0.0;
    target_total INTEGER;
    actual_total INTEGER;
    domain_accuracy JSONB := '{}';
BEGIN
    -- Get template configuration
    SELECT * INTO template_record 
    FROM question_set_templates 
    WHERE id = p_template_id AND is_active = true;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Template not found or inactive: %', p_template_id;
    END IF;
    
    target_total := template_record.total_questions;
    
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
            'generated_at', NOW(),
            'algorithm_version', '2.0'
        ),
        p_generated_by
    ) RETURNING id INTO generated_set_id;
    
    -- Process each domain in the distribution
    FOR domain_key, domain_config IN 
        SELECT * FROM jsonb_each(template_record.domain_distribution)
    LOOP
        -- Check if subdomain distribution is specified
        IF domain_config ? 'subdomain_distribution' THEN
            -- Process each subdomain with enhanced selection
            FOR subdomain_key, subdomain_target IN 
                SELECT * FROM jsonb_each_text(domain_config->'subdomain_distribution')
            LOOP
                -- Process each cognitive level for this subdomain
                FOR cognitive_key IN SELECT * FROM jsonb_object_keys(template_record.cognitive_distribution)
                LOOP
                    cognitive_percentage := (template_record.cognitive_distribution->>cognitive_key)::INTEGER;
                    cognitive_count := GREATEST(1, ROUND(subdomain_target::DECIMAL * cognitive_percentage / 100));
                    
                    -- Use enhanced selection algorithm
                    FOR question_record IN 
                        SELECT * FROM select_weighted_questions_enhanced(
                            cognitive_count,
                            subdomain_key,
                            domain_key,
                            cognitive_key,
                            NULL, -- Let difficulty vary naturally
                            template_record.avoid_recent_days,
                            template_record.importance_weight_factor,
                            template_record.recency_weight_factor,
                            1.2, -- performance_weight_factor
                            0.1  -- variety_bonus
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
                            'performance_score', question_record.performance_score,
                            'selection_reason', question_record.selection_reason,
                            'selected_at', NOW()
                        );
                        
                        total_selected := total_selected + 1;
                        
                        -- Mark question as asked with enhanced tracking
                        PERFORM mark_question_asked(question_record.question_id);
                    END LOOP;
                END LOOP;
            END LOOP;
            
            -- Calculate domain accuracy
            DECLARE
                domain_target INTEGER := (domain_config->>'target_count')::INTEGER;
                domain_actual INTEGER;
            BEGIN
                SELECT COUNT(*)::INTEGER INTO domain_actual
                FROM jsonb_array_elements(selected_questions) q
                WHERE q->>'domain' = domain_key;
                
                domain_accuracy := jsonb_set(
                    domain_accuracy,
                    ARRAY[domain_key],
                    jsonb_build_object(
                        'target', domain_target,
                        'actual', domain_actual,
                        'accuracy', CASE WHEN domain_target > 0 THEN (domain_actual::DECIMAL / domain_target * 100) ELSE 0 END
                    )
                );
            END;
        ELSE
            -- Handle domain-level distribution without subdomain specificity
            DECLARE
                domain_target INTEGER := (domain_config->>'target_count')::INTEGER;
            BEGIN
                FOR cognitive_key IN SELECT * FROM jsonb_object_keys(template_record.cognitive_distribution)
                LOOP
                    cognitive_percentage := (template_record.cognitive_distribution->>cognitive_key)::INTEGER;
                    cognitive_count := GREATEST(1, ROUND(domain_target::DECIMAL * cognitive_percentage / 100));
                    
                    FOR question_record IN 
                        SELECT * FROM select_weighted_questions_enhanced(
                            cognitive_count,
                            NULL, -- Any subdomain in this domain
                            domain_key,
                            cognitive_key,
                            NULL,
                            template_record.avoid_recent_days,
                            template_record.importance_weight_factor,
                            template_record.recency_weight_factor,
                            1.2,
                            0.1
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
                            'performance_score', question_record.performance_score,
                            'selection_reason', question_record.selection_reason,
                            'selected_at', NOW()
                        );
                        
                        total_selected := total_selected + 1;
                        
                        PERFORM mark_question_asked(question_record.question_id);
                    END LOOP;
                END LOOP;
            END;
        END IF;
    END LOOP;
    
    -- Calculate overall distribution accuracy
    distribution_accuracy := CASE 
        WHEN target_total > 0 THEN (total_selected::DECIMAL / target_total * 100)
        ELSE 0 
    END;
    
    -- Update the generated set with results and analytics
    UPDATE generated_question_sets SET
        questions = selected_questions,
        total_questions = total_selected,
        distribution_accuracy_score = LEAST(100, distribution_accuracy),
        generation_config = generation_config || jsonb_build_object(
            'domain_accuracy', domain_accuracy,
            'total_accuracy', distribution_accuracy,
            'selection_algorithm', 'enhanced_v2.0'
        ),
        updated_at = NOW()
    WHERE id = generated_set_id;
    
    RETURN generated_set_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to analyze question set quality
CREATE OR REPLACE FUNCTION analyze_question_set_quality(
    p_generated_set_id UUID
)
RETURNS JSONB AS $$
DECLARE
    set_record RECORD;
    questions JSONB;
    quality_report JSONB := '{}';
    cognitive_distribution JSONB := '{}';
    difficulty_distribution JSONB := '{}';
    domain_distribution JSONB := '{}';
    importance_stats JSONB := '{}';
    performance_stats JSONB := '{}';
BEGIN
    SELECT * INTO set_record 
    FROM generated_question_sets 
    WHERE id = p_generated_set_id;
    
    IF NOT FOUND THEN
        RETURN '{"error": "Question set not found"}'::jsonb;
    END IF;
    
    questions := set_record.questions;
    
    -- Analyze cognitive distribution
    WITH cognitive_counts AS (
        SELECT 
            q->>'cognitive_level' as level,
            COUNT(*) as count
        FROM jsonb_array_elements(questions) q
        GROUP BY q->>'cognitive_level'
    )
    SELECT jsonb_object_agg(level, count) INTO cognitive_distribution
    FROM cognitive_counts;
    
    -- Analyze difficulty distribution
    WITH difficulty_counts AS (
        SELECT 
            q->>'difficulty_level' as level,
            COUNT(*) as count
        FROM jsonb_array_elements(questions) q
        GROUP BY q->>'difficulty_level'
    )
    SELECT jsonb_object_agg(level, count) INTO difficulty_distribution
    FROM difficulty_counts;
    
    -- Analyze domain distribution
    WITH domain_counts AS (
        SELECT 
            q->>'domain' as domain,
            COUNT(*) as count
        FROM jsonb_array_elements(questions) q
        GROUP BY q->>'domain'
    )
    SELECT jsonb_object_agg(domain, count) INTO domain_distribution
    FROM domain_counts;
    
    -- Calculate importance statistics
    WITH importance_data AS (
        SELECT 
            AVG((q->>'importance_points')::DECIMAL) as avg_importance,
            MIN((q->>'importance_points')::DECIMAL) as min_importance,
            MAX((q->>'importance_points')::DECIMAL) as max_importance,
            PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY (q->>'importance_points')::DECIMAL) as median_importance
        FROM jsonb_array_elements(questions) q
    )
    SELECT row_to_json(importance_data)::jsonb INTO importance_stats
    FROM importance_data;
    
    -- Calculate performance statistics
    WITH performance_data AS (
        SELECT 
            AVG((q->>'performance_score')::DECIMAL) as avg_performance,
            COUNT(*) FILTER (WHERE q->>'selection_reason' = 'High Importance') as high_importance_count,
            COUNT(*) FILTER (WHERE q->>'selection_reason' = 'Good Discrimination') as good_discrimination_count,
            COUNT(*) FILTER (WHERE q->>'selection_reason' = 'Underutilized') as underutilized_count
        FROM jsonb_array_elements(questions) q
    )
    SELECT row_to_json(performance_data)::jsonb INTO performance_stats
    FROM performance_data;
    
    -- Compile quality report
    quality_report := jsonb_build_object(
        'set_id', p_generated_set_id,
        'total_questions', set_record.total_questions,
        'distribution_accuracy', set_record.distribution_accuracy_score,
        'cognitive_distribution', cognitive_distribution,
        'difficulty_distribution', difficulty_distribution,
        'domain_distribution', domain_distribution,
        'importance_stats', importance_stats,
        'performance_stats', performance_stats,
        'analysis_timestamp', NOW()
    );
    
    RETURN quality_report;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update question usage tracking                                          
CREATE OR REPLACE FUNCTION mark_question_asked(question_id INTEGER)      
RETURNS VOID AS $$                                                         
BEGIN                                                                      
    UPDATE questions                                                       
    SET                                                                    
        last_asked_date = CURRENT_DATE,                                    
        times_asked_count = COALESCE(times_asked_count, 0) + 1,            
        updated_at = NOW()                                                 
    WHERE id = mark_question_asked.question_id;                                              
                                                                           
    -- Update question analytics if needed                                 
    INSERT INTO question_analytics (                                       
        question_id,                                                       
        total_attempts,                                                    
        last_calculated_at                                                 
    ) VALUES (                                                             
        mark_question_asked.question_id,                                                     
        1,                                                                 
        NOW()                                                              
    )                                                                      
    ON CONFLICT (question_id) DO UPDATE SET                                
        total_attempts = question_analytics.total_attempts + 1,            
        last_calculated_at = NOW();                                        
END;                                                                       
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions on new functions
GRANT EXECUTE ON FUNCTION select_weighted_questions_enhanced(INTEGER, TEXT, TEXT, TEXT, TEXT, INTEGER, DECIMAL, DECIMAL, DECIMAL, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_question_set_enhanced TO authenticated;
GRANT EXECUTE ON FUNCTION analyze_question_set_quality TO authenticated;
GRANT EXECUTE ON FUNCTION mark_question_asked(INTEGER) TO authenticated;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_questions_performance_lookup ON questions(is_active, is_verified, last_asked_date, times_asked_count);
CREATE INDEX IF NOT EXISTS idx_question_analytics_performance ON question_analytics(overall_accuracy, discrimination_index, total_attempts);

-- Comments for documentation
COMMENT ON FUNCTION select_weighted_questions_enhanced(INTEGER, TEXT, TEXT, TEXT, TEXT, INTEGER, DECIMAL, DECIMAL, DECIMAL, DECIMAL) IS 'Enhanced weighted question selection with performance analytics, variety bonuses, and smarter distribution';
COMMENT ON FUNCTION generate_question_set_enhanced IS 'Enhanced question set generation with improved accuracy tracking and better selection algorithms';
COMMENT ON FUNCTION analyze_question_set_quality IS 'Comprehensive quality analysis of generated question sets including distribution accuracy and selection reasoning'; 