-- Run in Supabase SQL Editor
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  tags TEXT[] DEFAULT '{}',
  cover_image TEXT,
  author_name TEXT DEFAULT 'FindMyUni Team',
  author_avatar TEXT,
  meta_title TEXT,
  meta_description TEXT,
  read_time_minutes INTEGER DEFAULT 5,
  views INTEGER DEFAULT 0,
  published BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_blog_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_category ON blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_blog_published ON blog_posts(published);
CREATE INDEX IF NOT EXISTS idx_blog_created ON blog_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_tags ON blog_posts USING GIN(tags);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_blog_fts ON blog_posts USING GIN(
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(excerpt, '') || ' ' || coalesce(content, ''))
);

-- RLS
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Everyone can read published posts
CREATE POLICY "Public can read published posts" ON blog_posts
  FOR SELECT USING (published = true);

-- Admins can do everything
CREATE POLICY "Admins can manage posts" ON blog_posts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admins WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  );
