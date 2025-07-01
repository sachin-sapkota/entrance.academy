-- Migration to add meta_data column to practice_sets table
-- This will store enhanced configuration data like test type, instructions, etc.

ALTER TABLE public.practice_sets 
ADD COLUMN IF NOT EXISTS meta_data JSONB DEFAULT '{}'::jsonb;

-- Add index for better performance on meta_data queries
CREATE INDEX IF NOT EXISTS idx_practice_sets_meta_data ON practice_sets USING GIN(meta_data);

-- Update existing records to have proper meta_data structure
UPDATE practice_sets 
SET meta_data = '{}'::jsonb 
WHERE meta_data IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN practice_sets.meta_data IS 'Enhanced configuration data including test type, instructions, scheduling info, etc.'; 