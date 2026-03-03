-- Migration 014: Add User Signal Preferences
-- User-specific preferences for signal visibility and ordering

CREATE TABLE IF NOT EXISTS user_signal_preferences (
  user_id TEXT NOT NULL,
  signal_id TEXT NOT NULL REFERENCES signals(id) ON DELETE CASCADE,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  is_unimportant BOOLEAN NOT NULL DEFAULT false, -- For global community signals
  custom_rank INTEGER, -- Optional manual ordering (lower = higher priority)
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, signal_id)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_signal_preferences_user
  ON user_signal_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_signal_preferences_signal
  ON user_signal_preferences(signal_id);
CREATE INDEX IF NOT EXISTS idx_user_signal_preferences_pinned
  ON user_signal_preferences(user_id, is_pinned)
  WHERE is_pinned = true;
CREATE INDEX IF NOT EXISTS idx_user_signal_preferences_hidden
  ON user_signal_preferences(user_id, is_hidden)
  WHERE is_hidden = true;

-- Comments for documentation
COMMENT ON TABLE user_signal_preferences IS 'User-specific preferences for signal visibility and ordering';
COMMENT ON COLUMN user_signal_preferences.is_hidden IS 'User has hidden this signal from their feed';
COMMENT ON COLUMN user_signal_preferences.is_pinned IS 'User has pinned this signal to top of feed';
COMMENT ON COLUMN user_signal_preferences.is_unimportant IS 'User marked global community signal as unimportant (drops to bottom)';
COMMENT ON COLUMN user_signal_preferences.custom_rank IS 'User-defined ordering rank (lower value = higher priority)';
