-- ============================================
-- FindMyUni Supabase Schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE (replaces Firebase Auth + Firestore users)
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT DEFAULT '',
  photo_url TEXT DEFAULT '',
  phone_number TEXT DEFAULT '',
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
  bio TEXT DEFAULT '',
  address TEXT DEFAULT '',
  city TEXT DEFAULT '',
  province TEXT DEFAULT '',
  education_level TEXT DEFAULT '',
  academic_interest TEXT DEFAULT '',
  grades TEXT DEFAULT '',
  notifications JSONB DEFAULT '{"email": true, "application": true, "deadline": true, "news": false}',
  saved_universities UUID[] DEFAULT '{}',
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ADMINS TABLE
-- ============================================
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT DEFAULT '',
  permissions TEXT[] DEFAULT ARRAY['users.read', 'users.write', 'universities.read', 'universities.write'],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- UNIVERSITIES TABLE
-- ============================================
CREATE TABLE universities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  url TEXT DEFAULT '',
  apply_link TEXT DEFAULT '',
  phd_apply_link TEXT DEFAULT '',
  admission_open BOOLEAN DEFAULT true,
  basic_info JSONB DEFAULT '{}',
  programs JSONB DEFAULT '{}',
  scholarships JSONB DEFAULT '{}',
  facilities JSONB DEFAULT '{}',
  scraped_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- APPLICATIONS TABLE
-- ============================================
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  university_id UUID REFERENCES universities(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'under-review', 'accepted', 'rejected')),
  program TEXT DEFAULT '',
  first_name TEXT DEFAULT '',
  last_name TEXT DEFAULT '',
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  start_date DATE,
  education_level TEXT DEFAULT '',
  documents JSONB DEFAULT '[]',
  additional_notes TEXT DEFAULT '',
  admin_notes TEXT DEFAULT '',
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SCRAPE JOBS TABLE
-- ============================================
CREATE TABLE scrape_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  target TEXT DEFAULT '',
  university_id UUID REFERENCES universities(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  results JSONB DEFAULT '{}',
  error TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SCRAPE REQUESTS TABLE
-- ============================================
CREATE TABLE scrape_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  university_url TEXT DEFAULT '',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected')),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SCRAPE BATCH JOBS TABLE
-- ============================================
CREATE TABLE scrape_batch_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  total_universities INTEGER DEFAULT 0,
  completed_universities INTEGER DEFAULT 0,
  error_universities INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  execution_time_seconds FLOAT,
  output TEXT,
  error TEXT,
  created_by TEXT DEFAULT 'system',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_admins_email ON admins(email);
CREATE INDEX idx_universities_name ON universities(name);
CREATE INDEX idx_universities_admission ON universities(admission_open);
CREATE INDEX idx_applications_user ON applications(user_id);
CREATE INDEX idx_applications_university ON applications(university_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_scrape_jobs_status ON scrape_jobs(status);
CREATE INDEX idx_scrape_requests_user ON scrape_requests(user_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE scrape_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scrape_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE scrape_batch_jobs ENABLE ROW LEVEL SECURITY;

-- Users can read/update their own profile
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- Admins can view/manage all users
CREATE POLICY "Admins can view all users" ON users FOR SELECT USING (
  EXISTS (SELECT 1 FROM admins WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()))
);
CREATE POLICY "Admins can update all users" ON users FOR UPDATE USING (
  EXISTS (SELECT 1 FROM admins WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()))
);

-- Admins table policies
CREATE POLICY "Admins can view admins" ON admins FOR SELECT USING (
  EXISTS (SELECT 1 FROM admins WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()))
);
CREATE POLICY "Admins can manage admins" ON admins FOR ALL USING (
  EXISTS (SELECT 1 FROM admins WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()))
);

-- Universities are public read, admin write
CREATE POLICY "Anyone can view universities" ON universities FOR SELECT USING (true);
CREATE POLICY "Admins can manage universities" ON universities FOR ALL USING (
  EXISTS (SELECT 1 FROM admins WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()))
);

-- Applications: users see their own, admins see all
CREATE POLICY "Users can view own applications" ON applications FOR SELECT USING (
  auth.uid() = user_id OR EXISTS (SELECT 1 FROM admins WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()))
);
CREATE POLICY "Users can create applications" ON applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own applications" ON applications FOR UPDATE USING (
  auth.uid() = user_id OR EXISTS (SELECT 1 FROM admins WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()))
);
CREATE POLICY "Admins can delete applications" ON applications FOR DELETE USING (
  EXISTS (SELECT 1 FROM admins WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()))
);

-- Scrape requests
CREATE POLICY "Users can view own scrape requests" ON scrape_requests FOR SELECT USING (
  auth.uid() = user_id OR EXISTS (SELECT 1 FROM admins WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()))
);
CREATE POLICY "Users can create scrape requests" ON scrape_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Scrape jobs - admin only
CREATE POLICY "Admins can manage scrape jobs" ON scrape_jobs FOR ALL USING (
  EXISTS (SELECT 1 FROM admins WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()))
);

-- Scrape batch jobs - admin only
CREATE POLICY "Admins can manage batch jobs" ON scrape_batch_jobs FOR ALL USING (
  EXISTS (SELECT 1 FROM admins WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()))
);

-- ============================================
-- TRIGGER: Auto-update updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_universities_updated_at BEFORE UPDATE ON universities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_scrape_jobs_updated_at BEFORE UPDATE ON scrape_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TRIGGER: Auto-create user profile on signup
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, photo_url, created_at, last_login)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
