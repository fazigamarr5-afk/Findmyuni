-- Run in Supabase SQL Editor
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT,
  pros TEXT,
  cons TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, university_id)
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read reviews
CREATE POLICY "Public can read reviews" ON reviews FOR SELECT USING (true);
-- Users can insert their own reviews
CREATE POLICY "Users can add reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Users can update their own reviews
CREATE POLICY "Users can update own reviews" ON reviews FOR UPDATE USING (auth.uid() = user_id);
-- Users can delete their own reviews
CREATE POLICY "Users can delete own reviews" ON reviews FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_reviews_university ON reviews(university_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
