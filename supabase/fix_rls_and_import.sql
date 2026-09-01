-- ============================================
-- FIX: Infinite recursion in admins RLS policies
-- The original policies query the admins table to check
-- if the user is an admin, but the policy IS on the admins table,
-- causing infinite recursion.
-- ============================================

-- Step 1: Drop the recursive policies on admins
DROP POLICY IF EXISTS "Admins can view admins" ON admins;
DROP POLICY IF EXISTS "Admins can manage admins" ON admins;

-- Step 2: Create a security definer function to check admin status
-- This function runs as the definer (superuser) and bypasses RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admins 
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Step 3: Recreate admin policies using the function
CREATE POLICY "Admins can view admins" ON admins
  FOR SELECT USING (
    auth.uid() = user_id OR public.is_admin()
  );

CREATE POLICY "Admins can manage admins" ON admins
  FOR ALL USING (
    auth.uid() = user_id OR public.is_admin()
  );

-- Step 4: Fix other policies that reference admins table (same recursion risk)
-- Users policies
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;

CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can update all users" ON users
  FOR UPDATE USING (public.is_admin());

-- Universities policies - keep public read, fix admin write
DROP POLICY IF EXISTS "Anyone can view universities" ON universities;
DROP POLICY IF EXISTS "Admins can manage universities" ON universities;

CREATE POLICY "Anyone can view universities" ON universities
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage universities" ON universities
  FOR ALL USING (public.is_admin());

-- Applications policies
DROP POLICY IF EXISTS "Users can view own applications" ON applications;
DROP POLICY IF EXISTS "Users can update own applications" ON applications;
DROP POLICY IF EXISTS "Admins can delete applications" ON applications;

CREATE POLICY "Users can view own applications" ON applications
  FOR SELECT USING (
    auth.uid() = user_id OR public.is_admin()
  );

CREATE POLICY "Users can create applications" ON applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own applications" ON applications
  FOR UPDATE USING (
    auth.uid() = user_id OR public.is_admin()
  );

CREATE POLICY "Admins can delete applications" ON applications
  FOR DELETE USING (public.is_admin());

-- Scrape requests
DROP POLICY IF EXISTS "Users can view own scrape requests" ON scrape_requests;
CREATE POLICY "Users can view own scrape requests" ON scrape_requests
  FOR SELECT USING (
    auth.uid() = user_id OR public.is_admin()
  );

-- Scrape jobs
DROP POLICY IF EXISTS "Admins can manage scrape jobs" ON scrape_jobs;
CREATE POLICY "Admins can manage scrape jobs" ON scrape_jobs
  FOR ALL USING (public.is_admin());

-- Scrape batch jobs
DROP POLICY IF EXISTS "Admins can manage batch jobs" ON scrape_batch_jobs;
CREATE POLICY "Admins can manage batch jobs" ON scrape_batch_jobs
  FOR ALL USING (public.is_admin());

-- ============================================
-- Done! RLS is now fixed. No more infinite recursion.
-- ============================================
