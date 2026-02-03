-- Migration 013: Add User Category Interactions
-- Track user interactions with categories for personalized signal ranking

CREATE TABLE IF NOT EXISTS user_category_interactions (
  user_id TEXT NOT NULL,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  click_count INTEGER NOT NULL DEFAULT 0,
  subscription_count INTEGER NOT NULL DEFAULT 0,
  last_interaction TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, category_id)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_category_interactions_user
  ON user_category_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_category_interactions_category
  ON user_category_interactions(category_id);
CREATE INDEX IF NOT EXISTS idx_user_category_interactions_last
  ON user_category_interactions(user_id, last_interaction DESC);

-- Comments for documentation
COMMENT ON TABLE user_category_interactions IS 'Tracks user engagement with categories for personalized signal ranking';
COMMENT ON COLUMN user_category_interactions.click_count IS 'Number of times user clicked sightings in this category';
COMMENT ON COLUMN user_category_interactions.subscription_count IS 'Number of signals subscribed to in this category';
COMMENT ON COLUMN user_category_interactions.last_interaction IS 'Timestamp of most recent interaction';
