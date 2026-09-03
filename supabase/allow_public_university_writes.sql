-- Allow public (anon) users to insert and update universities
-- Run this in Supabase SQL Editor

-- Drop the restrictive admin-only write policy
DROP POLICY IF EXISTS "Admins can manage universities" ON universities;

-- Allow anyone to read (already exists but ensure it)
DROP POLICY IF EXISTS "Anyone can view universities" ON universities;
CREATE POLICY "Anyone can view universities" ON universities
  FOR SELECT USING (true);

-- Allow anyone to insert universities
CREATE POLICY "Anyone can insert universities" ON universities
  FOR INSERT WITH CHECK (true);

-- Allow anyone to update universities
CREATE POLICY "Anyone can update universities" ON universities
  FOR UPDATE USING (true);

-- Allow anyone to delete universities (optional, for cleanup)
CREATE POLICY "Anyone can delete universities" ON universities
  FOR DELETE USING (true);
