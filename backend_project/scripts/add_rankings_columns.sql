-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- Adds rankings and logo columns to the universities table

ALTER TABLE universities 
ADD COLUMN IF NOT EXISTS rankings JSONB DEFAULT NULL;

ALTER TABLE universities 
ADD COLUMN IF NOT EXISTS logo_url TEXT DEFAULT NULL;

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_universities_rankings ON universities USING gin (rankings);

COMMENT ON COLUMN universities.rankings IS 'JSON with keys: world_qs, world_times, national, hec, programs (dict of program-specific ranks)';
COMMENT ON COLUMN universities.logo_url IS 'URL to university logo image';
