-- Migration 019: Add Missing Sighting Scoring Columns
-- Adds time_adjusted_score, relevance_score, and last_score_update columns to sightings table

-- Add time_adjusted_score column
ALTER TABLE sightings
ADD COLUMN IF NOT EXISTS time_adjusted_score REAL NOT NULL DEFAULT 0;

-- Add relevance_score column
ALTER TABLE sightings
ADD COLUMN IF NOT EXISTS relevance_score REAL NOT NULL DEFAULT 1;

-- Add last_score_update column
ALTER TABLE sightings
ADD COLUMN IF NOT EXISTS last_score_update TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW();

-- Add flairCount column (from sighting entity)
ALTER TABLE sightings
ADD COLUMN IF NOT EXISTS flair_count INTEGER NOT NULL DEFAULT 0;

-- Add primaryFlairId column (from sighting entity)
ALTER TABLE sightings
ADD COLUMN IF NOT EXISTS primary_flair_id TEXT;

-- Add visibilityState column (from sighting entity)
ALTER TABLE sightings
ADD COLUMN IF NOT EXISTS visibility_state TEXT NOT NULL DEFAULT 'visible';

-- Add decayRate column (from sighting entity)
ALTER TABLE sightings
ADD COLUMN IF NOT EXISTS decay_rate REAL;

-- Create index on time_adjusted_score for ranking queries
CREATE INDEX IF NOT EXISTS idx_sightings_time_adjusted_score ON sightings(time_adjusted_score DESC);

-- Create index on last_score_update for score recalculation queries
CREATE INDEX IF NOT EXISTS idx_sightings_last_score_update ON sightings(last_score_update);
