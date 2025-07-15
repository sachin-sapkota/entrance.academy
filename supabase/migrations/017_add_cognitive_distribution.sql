-- Add cognitive_distribution column to test_configurations table
ALTER TABLE public.test_configurations 
ADD COLUMN cognitive_distribution JSONB DEFAULT '{"recall": 30, "understanding": 50, "application": 20}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.test_configurations.cognitive_distribution IS 'Distribution of cognitive levels (recall, understanding, application) as percentages'; 