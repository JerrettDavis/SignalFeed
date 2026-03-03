-- Migration 012: Add Signal Classification and Analytics
-- Adds classification system and analytics tracking columns to signals table

-- Add classification to signals
ALTER TABLE signals
  ADD COLUMN IF NOT EXISTS classification TEXT NOT NULL DEFAULT 'personal'
  CHECK (classification IN ('official', 'community', 'personal', 'verified'));

-- Add analytics columns to signals
ALTER TABLE signals
  ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unique_viewers INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS active_viewers INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sighting_count INTEGER NOT NULL DEFAULT 0;

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_signals_classification ON signals(classification);
CREATE INDEX IF NOT EXISTS idx_signals_view_count ON signals(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_signals_last_viewed_at ON signals(last_viewed_at DESC);

-- Composite index for ranking queries
CREATE INDEX IF NOT EXISTS idx_signals_ranking
  ON signals(classification, is_active, view_count DESC, created_at DESC);

-- Comments for documentation
COMMENT ON COLUMN signals.classification IS 'Signal classification: official (admin), community (promoted), personal (default), verified (quality stamp)';
COMMENT ON COLUMN signals.view_count IS 'Total number of views across all time';
COMMENT ON COLUMN signals.unique_viewers IS 'Count of distinct users who viewed this signal';
COMMENT ON COLUMN signals.active_viewers IS 'Number of users viewing in last 5 minutes';
COMMENT ON COLUMN signals.last_viewed_at IS 'Timestamp of most recent view';
COMMENT ON COLUMN signals.sighting_count IS 'Cached count of associated sightings';
