-- Migration 017: Add User Privacy Settings
-- Privacy-first controls for data collection and personalization

CREATE TABLE IF NOT EXISTS user_privacy_settings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  enable_personalization BOOLEAN NOT NULL DEFAULT false,
  enable_view_tracking BOOLEAN NOT NULL DEFAULT false,
  enable_location_sharing BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for efficient user lookups
CREATE INDEX IF NOT EXISTS idx_user_privacy_settings_user
  ON user_privacy_settings(user_id);

-- Comments for documentation
COMMENT ON TABLE user_privacy_settings IS 'Privacy-first controls for data collection and personalization features';
COMMENT ON COLUMN user_privacy_settings.enable_personalization IS 'Enable category interaction tracking for personalized signal ranking';
COMMENT ON COLUMN user_privacy_settings.enable_view_tracking IS 'Enable signal view analytics for improved recommendations';
COMMENT ON COLUMN user_privacy_settings.enable_location_sharing IS 'Enable location-based ranking and proximity features';
