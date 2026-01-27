-- Migration: Add sighting reactions and scoring
-- Phase 1: Core Infrastructure

-- Sighting reactions table
CREATE TABLE IF NOT EXISTS sighting_reactions (
  sighting_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (sighting_id, user_id, type)
);

-- Add foreign key if sightings table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sightings') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'fk_sighting_reactions_sighting'
    ) THEN
      ALTER TABLE sighting_reactions
        ADD CONSTRAINT fk_sighting_reactions_sighting
        FOREIGN KEY (sighting_id) REFERENCES sightings(id)
        ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

CREATE INDEX idx_sighting_reactions_sighting ON sighting_reactions(sighting_id);
CREATE INDEX idx_sighting_reactions_user ON sighting_reactions(user_id);
CREATE INDEX idx_sighting_reactions_type ON sighting_reactions(type);

-- Add scoring columns to sightings table
ALTER TABLE sightings
  ADD COLUMN IF NOT EXISTS upvotes INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS downvotes INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS confirmations INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS disputes INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS spam_reports INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS score INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS hot_score FLOAT NOT NULL DEFAULT 0;

-- Indexes for sorting and filtering
CREATE INDEX IF NOT EXISTS idx_sightings_hot_score ON sightings(hot_score DESC);
CREATE INDEX IF NOT EXISTS idx_sightings_score ON sightings(score DESC);
CREATE INDEX IF NOT EXISTS idx_sightings_created_at ON sightings(created_at DESC);

-- Add check constraint for reaction types
ALTER TABLE sighting_reactions
  DROP CONSTRAINT IF EXISTS check_reaction_type;

ALTER TABLE sighting_reactions
  ADD CONSTRAINT check_reaction_type
  CHECK (type IN ('upvote', 'downvote', 'confirmed', 'disputed', 'spam'));

-- Add comments
COMMENT ON TABLE sighting_reactions IS 'User reactions to sightings (upvote, confirm, etc)';
COMMENT ON COLUMN sighting_reactions.type IS 'One of: upvote, downvote, confirmed, disputed, spam';
COMMENT ON COLUMN sightings.score IS 'Base score: upvotes - downvotes + (confirmations * 2) - (disputes * 2) - (spam * 5)';
COMMENT ON COLUMN sightings.hot_score IS 'Time-decay ranking: score / (age_hours + 2)^1.5';
