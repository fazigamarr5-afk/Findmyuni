-- =====================================================
-- RUN THIS IN SUPABASE SQL EDITOR
-- Dashboard → SQL Editor → New Query → Paste → Run
-- =====================================================

-- 1. Create admins table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add role column to users table (if missing)
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- 3. Enable RLS on admins
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- 4. Allow public read (needed for admin check)
DROP POLICY IF EXISTS "Public read admins" ON admins;
CREATE POLICY "Public read admins" ON admins FOR SELECT USING (true);

-- 5. Allow authenticated insert
DROP POLICY IF EXISTS "Auth insert admins" ON admins;
CREATE POLICY "Auth insert admins" ON admins FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 6. Make YOU the admin (replace with your email!)
-- Just uncomment the line below and replace YOUR_EMAIL:
-- INSERT INTO admins (email, name) VALUES ('YOUR_EMAIL@gmail.com', 'Admin') ON CONFLICT (email) DO NOTHING;
