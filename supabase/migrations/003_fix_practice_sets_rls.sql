-- Fix RLS policies for practice_sets table
-- The issue is that admins cannot create practice sets due to missing INSERT policies

-- Drop any existing conflicting policies
DROP POLICY IF EXISTS "Admins can manage practice_sets" ON practice_sets;

-- Create specific policies for practice_sets
CREATE POLICY "Admins can create practice sets" ON practice_sets
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can update practice sets" ON practice_sets
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can delete practice sets" ON practice_sets
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can view all practice sets" ON practice_sets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Also allow users to create their own practice sets
CREATE POLICY "Users can create own practice sets" ON practice_sets
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can view own practice sets" ON practice_sets
    FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can update own practice sets" ON practice_sets
    FOR UPDATE USING (auth.uid() = created_by);

-- Grant INSERT permission on practice_sets to authenticated users
GRANT INSERT ON practice_sets TO authenticated;
GRANT UPDATE ON practice_sets TO authenticated;
GRANT DELETE ON practice_sets TO authenticated; 