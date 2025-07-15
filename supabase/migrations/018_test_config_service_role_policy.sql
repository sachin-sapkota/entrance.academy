-- Allow service role to bypass RLS on test_configurations
CREATE POLICY "Service role bypass" ON test_configurations
  FOR ALL TO service_role USING (true) WITH CHECK (true); 