-- Migration: Add system users and feed-related sighting types
-- This migration supports the external feeds integration feature
-- Phase 1: NOAA Weather and USGS Earthquake feeds

-- ============================================================================
-- SYSTEM USERS
-- ============================================================================
-- System users are special accounts that represent automated feed sources
-- They are used as reporterId for sightings created by external feeds

-- Add system users for external feeds
INSERT INTO users (id, email, username, role, status, membership_tier, created_at, updated_at)
VALUES
  ('system-noaa', 'feeds+noaa@sightsignal.app', 'NOAA Weather Service', 'system', 'active', 'system', NOW(), NOW()),
  ('system-usgs', 'feeds+usgs@sightsignal.app', 'USGS Earthquake Hazards', 'system', 'active', 'system', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Update users table to support 'system' role if not already present
-- This handles both existing and new installations
DO $$
BEGIN
  -- Check if 'system' is already a valid role
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'user_role' AND e.enumlabel = 'system'
  ) THEN
    -- Add 'system' role to the enum
    ALTER TYPE user_role ADD VALUE 'system';
  END IF;
END $$;

-- Update membership_tier enum to support 'system' tier if not already present
DO $$
BEGIN
  -- Check if 'system' is already a valid membership tier
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'membership_tier' AND e.enumlabel = 'system'
  ) THEN
    -- Add 'system' tier to the enum
    ALTER TYPE membership_tier ADD VALUE 'system';
  END IF;
END $$;

-- ============================================================================
-- FEED-RELATED SIGHTING TYPES
-- ============================================================================
-- Weather and earthquake related sighting types for external feed data

-- Insert new sighting types for NOAA Weather feed
-- All weather types go into cat-emergency category
INSERT INTO sighting_types (id, category_id, subcategory_id, label, icon, tags)
VALUES
  ('type-tornado', 'cat-emergency', 'subcat-emergency', 'Tornado', '🌪️', ARRAY['weather', 'severe', 'warning']),
  ('type-flood', 'cat-emergency', 'subcat-emergency', 'Flood', '🌊', ARRAY['weather', 'water', 'warning']),
  ('type-severe-weather', 'cat-emergency', 'subcat-emergency', 'Severe Weather', '⛈️', ARRAY['weather', 'storm', 'warning']),
  ('type-winter-storm', 'cat-emergency', 'subcat-emergency', 'Winter Storm', '❄️', ARRAY['weather', 'winter', 'warning']),
  ('type-hurricane', 'cat-emergency', 'subcat-emergency', 'Hurricane', '🌀', ARRAY['weather', 'tropical', 'warning']),
  ('type-heat-advisory', 'cat-emergency', 'subcat-emergency', 'Heat Advisory', '🌡️', ARRAY['weather', 'heat', 'advisory']),
  ('type-weather-alert', 'cat-emergency', 'subcat-emergency', 'Weather Alert', '⚠️', ARRAY['weather', 'general'])
ON CONFLICT (id) DO NOTHING;

-- Insert earthquake sighting type for USGS feed
INSERT INTO sighting_types (id, category_id, subcategory_id, label, icon, tags)
VALUES
  ('type-earthquake', 'cat-emergency', 'subcat-emergency', 'Earthquake', '🏔️', ARRAY['geological', 'seismic', 'usgs'])
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- INDEXES FOR FEED DATA
-- ============================================================================
-- Add index on fields JSONB column for efficient external ID lookups
-- This supports the findByExternalId query used for deduplication

-- Create index on externalId field in sightings.fields JSONB column
CREATE INDEX IF NOT EXISTS idx_sightings_external_id
  ON sightings ((fields->>'externalId'))
  WHERE fields->>'externalId' IS NOT NULL;

-- Create index on feedSource field for analytics
CREATE INDEX IF NOT EXISTS idx_sightings_feed_source
  ON sightings ((fields->>'feedSource'))
  WHERE fields->>'feedSource' IS NOT NULL;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON INDEX idx_sightings_external_id IS 'Efficient lookup of sightings by external feed ID for deduplication';
COMMENT ON INDEX idx_sightings_feed_source IS 'Analytics on sightings by feed source (noaa-weather, usgs-earthquakes, etc.)';
