-- Remove Apple Authentication Support
-- This migration removes Apple sign-in functionality from the platform

-- Drop Apple ID index
DROP INDEX IF EXISTS idx_users_apple_id;

-- Remove Apple ID column
ALTER TABLE public.users DROP COLUMN IF EXISTS apple_id;

-- Update comment to reflect only Google OAuth support
COMMENT ON COLUMN public.users.auth_provider IS 'Authentication provider used: email, google, passkey'; 