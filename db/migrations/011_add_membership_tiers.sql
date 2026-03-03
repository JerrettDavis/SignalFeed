-- Migration 011: Add Membership Tiers
-- Adds membership tier system to users with configurable limits per tier

-- Add membership tier column to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS membership_tier TEXT NOT NULL DEFAULT 'free'
  CHECK (membership_tier IN ('free', 'paid', 'admin'));

-- Add tier metadata table (limits enforced in application layer)
CREATE TABLE IF NOT EXISTS membership_tier_limits (
  tier TEXT PRIMARY KEY CHECK (tier IN ('free', 'paid', 'admin')),
  max_geofence_area_km2 NUMERIC,  -- NULL = unlimited
  max_polygon_points INTEGER,
  max_sighting_types INTEGER,
  can_create_global_signals BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert tier configurations
INSERT INTO membership_tier_limits (tier, max_geofence_area_km2, max_polygon_points, max_sighting_types, can_create_global_signals)
VALUES
  ('free', 25, 20, 10, false),
  ('paid', 500, 100, 50, false),
  ('admin', NULL, NULL, NULL, true)
ON CONFLICT (tier) DO NOTHING;

-- Index for efficient tier lookups
CREATE INDEX IF NOT EXISTS idx_users_membership_tier ON users(membership_tier);

-- Comments for documentation
COMMENT ON COLUMN users.membership_tier IS 'User membership tier: free (default), paid, or admin';
COMMENT ON TABLE membership_tier_limits IS 'Configuration for membership tier limits and permissions';
COMMENT ON COLUMN membership_tier_limits.max_geofence_area_km2 IS 'Maximum geofence area in square kilometers (NULL = unlimited)';
COMMENT ON COLUMN membership_tier_limits.max_polygon_points IS 'Maximum number of polygon points (NULL = unlimited)';
COMMENT ON COLUMN membership_tier_limits.max_sighting_types IS 'Maximum sighting types per signal (NULL = unlimited)';
COMMENT ON COLUMN membership_tier_limits.can_create_global_signals IS 'Permission to create global signals (true for admin only)';
