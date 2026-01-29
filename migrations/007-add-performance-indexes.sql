-- Add indexes for hot_score and created_at to optimize sorting queries
-- These are the two most common sorting fields used in the list query

-- Index for hot_score (used for trending/popular sorting)
CREATE INDEX IF NOT EXISTS idx_sightings_hot_score
ON sightings (hot_score DESC);

-- Index for created_at (used for recency sorting)
CREATE INDEX IF NOT EXISTS idx_sightings_created_at
ON sightings (created_at DESC);

-- Composite index for the common query pattern: ORDER BY hot_score DESC, created_at DESC
-- This is more efficient than using two separate indexes
CREATE INDEX IF NOT EXISTS idx_sightings_hot_score_created_at
ON sightings (hot_score DESC, created_at DESC);

-- Index for status filtering (commonly used with hot_score sorting)
CREATE INDEX IF NOT EXISTS idx_sightings_status_hot_score
ON sightings (status, hot_score DESC);

-- Index for type_id filtering with hot_score
CREATE INDEX IF NOT EXISTS idx_sightings_type_hot_score
ON sightings (type_id, hot_score DESC);

-- Index for category_id filtering with hot_score
CREATE INDEX IF NOT EXISTS idx_sightings_category_hot_score
ON sightings (category_id, hot_score DESC);

-- Comment explaining the indexes
COMMENT ON INDEX idx_sightings_hot_score IS 'Optimizes sorting by hot_score for trending signals';
COMMENT ON INDEX idx_sightings_created_at IS 'Optimizes sorting by created_at for recent signals';
COMMENT ON INDEX idx_sightings_hot_score_created_at IS 'Composite index for default sort order';
COMMENT ON INDEX idx_sightings_status_hot_score IS 'Optimizes filtering by status with hot_score sort';
COMMENT ON INDEX idx_sightings_type_hot_score IS 'Optimizes filtering by type with hot_score sort';
COMMENT ON INDEX idx_sightings_category_hot_score IS 'Optimizes filtering by category with hot_score sort';
