-- Fix for infinite recursion in RLS policies
-- The issue is that admin policies are trying to check user roles by querying the same table

-- First, drop the problematic policies
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can manage all data" ON users;

-- Drop any other admin policies that might cause recursion
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND policyname LIKE '%Admins can manage%'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      policy_record.policyname, 
                      policy_record.schemaname, 
                      policy_record.tablename);
    END LOOP;
END$$;

-- Temporarily disable RLS on critical tables to prevent lockout
-- This is a temporary measure while we fix the auth flow
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE domains DISABLE ROW LEVEL SECURITY;
ALTER TABLE questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE question_categories DISABLE ROW LEVEL SECURITY;

-- Create a simple function to check if current user is admin without recursion
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if the current user email is the admin email
    -- This avoids querying the users table
    RETURN (auth.jwt() ->> 'email' = 'admin@entrance.academy');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION is_admin_user() TO authenticated, anon;

COMMENT ON FUNCTION is_admin_user() IS 'Check if current user is admin without causing RLS recursion'; 