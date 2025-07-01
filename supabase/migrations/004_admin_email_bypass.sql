-- Add bypass policy for admin email
-- This allows the admin@entrance.academy user to create practice sets even if role-based policies fail

CREATE POLICY "Admin email can create practice sets" ON practice_sets
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = 'admin@entrance.academy'
        )
    );

CREATE POLICY "Admin email can update practice sets" ON practice_sets
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = 'admin@entrance.academy'
        )
    );

CREATE POLICY "Admin email can delete practice sets" ON practice_sets
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = 'admin@entrance.academy'
        )
    );

CREATE POLICY "Admin email can view all practice sets" ON practice_sets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = 'admin@entrance.academy'
        )
    ); 