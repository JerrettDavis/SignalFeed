-- Migration: Add reputation system tables
-- Phase 1: Core Infrastructure

-- User reputation scores
CREATE TABLE IF NOT EXISTS user_reputation (
  user_id VARCHAR(255) PRIMARY KEY,
  score INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_reputation_score ON user_reputation(score DESC);

-- Reputation events (audit log)
CREATE TABLE IF NOT EXISTS reputation_events (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  amount INT NOT NULL,
  reason VARCHAR(50) NOT NULL,
  reference_id VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reputation_events_user ON reputation_events(user_id);
CREATE INDEX idx_reputation_events_created ON reputation_events(created_at DESC);
CREATE INDEX idx_reputation_events_reason ON reputation_events(reason);

-- Add comment for documentation
COMMENT ON TABLE user_reputation IS 'Tracks user reputation scores for quality control';
COMMENT ON TABLE reputation_events IS 'Audit log of all reputation changes';
COMMENT ON COLUMN reputation_events.reason IS 'One of: sighting_created, sighting_upvoted, sighting_confirmed, sighting_disputed, signal_created, signal_subscribed, signal_verified, report_upheld';
