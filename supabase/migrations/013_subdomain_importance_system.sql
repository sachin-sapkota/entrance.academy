-- Migration: Add Subdomain Structure and Importance Points System
-- This migration adds support for detailed subdomains and question importance points

-- Fix weight field precision in question_categories to accommodate larger values
ALTER TABLE question_categories ALTER COLUMN weight TYPE DECIMAL(5,2);

-- Add importance_points to questions table
ALTER TABLE questions ADD COLUMN IF NOT EXISTS importance_points INTEGER DEFAULT 1;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS cognitive_level TEXT DEFAULT 'recall' CHECK (cognitive_level IN ('recall', 'understanding', 'application'));
ALTER TABLE questions ADD COLUMN IF NOT EXISTS last_asked_date DATE;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS times_asked_count INTEGER DEFAULT 0;

-- Add index for importance points for better query performance
CREATE INDEX IF NOT EXISTS idx_questions_importance_points ON questions(importance_points DESC);
CREATE INDEX IF NOT EXISTS idx_questions_cognitive_level ON questions(cognitive_level);

-- Update existing domains to match the curriculum
UPDATE domains SET 
    name = 'Zoology',
    code = 'ZOO',
    description = 'Animal biology, classification, human biology and diseases'
WHERE name = 'Zoology';

UPDATE domains SET 
    name = 'Botany', 
    code = 'BOT',
    description = 'Plant biology, ecology, cell biology and genetics'
WHERE name = 'Botany';

UPDATE domains SET 
    name = 'Chemistry',
    code = 'CHEM', 
    description = 'General, physical, inorganic and organic chemistry'
WHERE name = 'Chemistry';

UPDATE domains SET 
    name = 'Physics',
    code = 'PHYS',
    description = 'Mechanics, thermodynamics, optics, electricity and modern physics'
WHERE name = 'Physics';

UPDATE domains SET 
    name = 'Mental Agility Test',
    code = 'MAT',
    description = 'Verbal, numerical, logical and spatial reasoning'
WHERE name = 'Mental Agility Test';

-- Clear existing categories to add curriculum-specific ones
DELETE FROM question_categories;

-- Insert curriculum-specific subdomains for each domain
DO $$
DECLARE
    zoology_domain_id INTEGER;
    botany_domain_id INTEGER;
    chemistry_domain_id INTEGER;
    physics_domain_id INTEGER;
    mat_domain_id INTEGER;
BEGIN
    -- Get domain IDs
    SELECT id INTO zoology_domain_id FROM domains WHERE code = 'ZOO';
    SELECT id INTO botany_domain_id FROM domains WHERE code = 'BOT';
    SELECT id INTO chemistry_domain_id FROM domains WHERE code = 'CHEM';
    SELECT id INTO physics_domain_id FROM domains WHERE code = 'PHYS';
    SELECT id INTO mat_domain_id FROM domains WHERE code = 'MAT';

    -- Zoology subdomains (40 questions total)
    INSERT INTO question_categories (domain_id, name, code, description, weight, display_order) VALUES
        (zoology_domain_id, 'Biology, origin and evolution of life', 'ZOO_BIOLOGY_EVOLUTION', 'Basic biology concepts and evolutionary principles', 4.0, 1),
        (zoology_domain_id, 'General characteristics and classification of protozoa to chordata', 'ZOO_CLASSIFICATION', 'Systematic classification from protozoa to chordata', 8.0, 2),
        (zoology_domain_id, 'Plasmodium, earthworm and frog', 'ZOO_SPECIMENS', 'Detailed study of key specimens', 8.0, 3),
        (zoology_domain_id, 'Human biology and human diseases', 'ZOO_HUMAN_BIOLOGY', 'Human anatomy, physiology and pathology', 14.0, 4),
        (zoology_domain_id, 'Animal tissues', 'ZOO_TISSUES', 'Histological study of animal tissues', 4.0, 5),
        (zoology_domain_id, 'Environmental pollution, adaptation and animal behavior, application of zoology', 'ZOO_ECOLOGY_BEHAVIOR', 'Environmental aspects and applications', 2.0, 6);

    -- Botany subdomains (40 questions total)
    INSERT INTO question_categories (domain_id, name, code, description, weight, display_order) VALUES
        (botany_domain_id, 'Basic component of life and biodiversity', 'BOT_LIFE_BIODIVERSITY', 'Fundamental life processes and biodiversity', 11.0, 1),
        (botany_domain_id, 'Ecology and environment', 'BOT_ECOLOGY', 'Plant ecology and environmental interactions', 5.0, 2),
        (botany_domain_id, 'Cell biology and genetics', 'BOT_CELL_GENETICS', 'Plant cell structure and genetic principles', 12.0, 3),
        (botany_domain_id, 'Anatomy and physiology', 'BOT_ANATOMY_PHYSIOLOGY', 'Plant structure and functional processes', 7.0, 4),
        (botany_domain_id, 'Developmental and applied botany', 'BOT_DEVELOPMENT_APPLIED', 'Plant development and practical applications', 5.0, 5);

    -- Chemistry subdomains (50 questions total)
    INSERT INTO question_categories (domain_id, name, code, description, weight, display_order) VALUES
        (chemistry_domain_id, 'General and physical chemistry', 'CHEM_GENERAL_PHYSICAL', 'Basic principles and physical chemistry concepts', 18.0, 1),
        (chemistry_domain_id, 'Inorganic chemistry', 'CHEM_INORGANIC', 'Inorganic compounds and reactions', 14.0, 2),
        (chemistry_domain_id, 'Organic chemistry', 'CHEM_ORGANIC', 'Organic compounds and mechanisms', 18.0, 3);

    -- Physics subdomains (50 questions total)
    INSERT INTO question_categories (domain_id, name, code, description, weight, display_order) VALUES
        (physics_domain_id, 'Mechanics', 'PHYS_MECHANICS', 'Classical mechanics and motion', 10.0, 1),
        (physics_domain_id, 'Heat and thermodynamics', 'PHYS_THERMODYNAMICS', 'Thermal physics and thermodynamic principles', 6.0, 2),
        (physics_domain_id, 'Geometrical optics and physical optics', 'PHYS_OPTICS', 'Light behavior and optical phenomena', 6.0, 3),
        (physics_domain_id, 'Current electricity and magnetism', 'PHYS_ELECTRICITY_MAGNETISM', 'Electrical circuits and magnetic fields', 9.0, 4),
        (physics_domain_id, 'Sound waves, electrostatics and capacitors', 'PHYS_WAVES_ELECTROSTATICS', 'Wave motion and electrostatic principles', 6.0, 5),
        (physics_domain_id, 'Modern physics and nuclear physics', 'PHYS_MODERN_NUCLEAR', 'Quantum mechanics and nuclear science', 6.0, 6),
        (physics_domain_id, 'Solid and semiconductor devices (electronics)', 'PHYS_ELECTRONICS', 'Electronic devices and semiconductors', 4.0, 7),
        (physics_domain_id, 'Particle physics, source of energy and universe', 'PHYS_PARTICLE_COSMOLOGY', 'Advanced physics and cosmology', 3.0, 8);

    -- Mental Agility Test subdomains (20 questions total)
    INSERT INTO question_categories (domain_id, name, code, description, weight, display_order) VALUES
        (mat_domain_id, 'Verbal reasoning', 'MAT_VERBAL', 'Language comprehension and verbal logic', 5.0, 1),
        (mat_domain_id, 'Numerical reasoning', 'MAT_NUMERICAL', 'Mathematical problem solving and numerical analysis', 5.0, 2),
        (mat_domain_id, 'Logical sequencing', 'MAT_LOGICAL', 'Pattern recognition and logical sequences', 5.0, 3),
        (mat_domain_id, 'Spatial relation / Abstract reasoning', 'MAT_SPATIAL_ABSTRACT', 'Spatial visualization and abstract thinking', 5.0, 4);

END$$;

-- Update questions table to set total_questions for categories
UPDATE question_categories SET 
    total_questions = weight::INTEGER
WHERE domain_id IN (SELECT id FROM domains WHERE code IN ('ZOO', 'BOT', 'CHEM', 'PHYS', 'MAT'));

-- Add function to update importance points
CREATE OR REPLACE FUNCTION update_question_importance(
    question_id INTEGER,
    new_importance INTEGER
)
RETURNS VOID AS $$
BEGIN
    UPDATE questions 
    SET 
        importance_points = new_importance,
        updated_at = NOW()
    WHERE id = question_id;
    
    -- Log the change
    INSERT INTO audit_logs (action, entity_type, entity_id, new_values)
    VALUES (
        'importance_update',
        'question',
        question_id::TEXT,
        jsonb_build_object('importance_points', new_importance)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add function to mark question as asked
CREATE OR REPLACE FUNCTION mark_question_asked(question_id INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE questions 
    SET 
        last_asked_date = CURRENT_DATE,
        times_asked_count = times_asked_count + 1,
        updated_at = NOW()
    WHERE id = question_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create view for question statistics by subdomain
CREATE OR REPLACE VIEW subdomain_question_stats AS
SELECT 
    d.name as domain_name,
    d.code as domain_code,
    qc.name as subdomain_name,
    qc.code as subdomain_code,
    qc.weight as target_questions,
    COUNT(q.id) as available_questions,
    AVG(q.importance_points) as avg_importance,
    COUNT(q.id) FILTER (WHERE q.cognitive_level = 'recall') as recall_questions,
    COUNT(q.id) FILTER (WHERE q.cognitive_level = 'understanding') as understanding_questions,
    COUNT(q.id) FILTER (WHERE q.cognitive_level = 'application') as application_questions
FROM domains d
LEFT JOIN question_categories qc ON d.id = qc.domain_id
LEFT JOIN questions q ON qc.id = q.category_id AND q.is_active = true
WHERE d.code IN ('ZOO', 'BOT', 'CHEM', 'PHYS', 'MAT')
GROUP BY d.id, d.name, d.code, qc.id, qc.name, qc.code, qc.weight
ORDER BY d.display_order, qc.display_order;

-- Grant permissions
GRANT SELECT ON subdomain_question_stats TO authenticated;
GRANT EXECUTE ON FUNCTION update_question_importance(INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_question_asked(INTEGER) TO authenticated;

COMMENT ON COLUMN questions.importance_points IS 'Admin-assigned importance level for question selection priority (default: 1)';
COMMENT ON COLUMN questions.cognitive_level IS 'Cognitive complexity level: recall (30%), understanding (50%), application (20%)';
COMMENT ON COLUMN questions.last_asked_date IS 'Date when question was last included in a test';
COMMENT ON COLUMN questions.times_asked_count IS 'Number of times question has been used in tests';
COMMENT ON VIEW subdomain_question_stats IS 'Statistical overview of questions per subdomain with cognitive level breakdown'; 