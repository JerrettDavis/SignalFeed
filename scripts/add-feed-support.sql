-- Standalone script to add feed support
-- This script can be run on any database state and will only add what's missing

-- ============================================================================
-- SYSTEM USERS (conditional on membership_tier existence)
-- ============================================================================

-- First, check if we need to add membership_tier enum value
DO $$
BEGIN
  -- Check if membership_tier type exists and if 'system' value is missing
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'membership_tier') THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_enum e
      JOIN pg_type t ON e.enumtypid = t.oid
      WHERE t.typname = 'membership_tier' AND e.enumlabel = 'system'
    ) THEN
      ALTER TYPE membership_tier ADD VALUE 'system';
      RAISE NOTICE 'Added system to membership_tier enum';
    END IF;
  END IF;
END $$;

-- Check if we need to add user_role enum value
DO $$
BEGIN
  -- Check if user_role type exists and if 'system' value is missing
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_enum e
      JOIN pg_type t ON e.enumtypid = t.oid
      WHERE t.typname = 'user_role' AND e.enumlabel = 'system'
    ) THEN
      ALTER TYPE user_role ADD VALUE 'system';
      RAISE NOTICE 'Added system to user_role enum';
    END IF;
  END IF;
END $$;

-- Add system users (will fail gracefully if columns don't exist)
DO $$
BEGIN
  -- Try to insert with all columns
  BEGIN
    INSERT INTO users (id, email, username, role, status, membership_tier, created_at, updated_at)
    VALUES
      ('system-noaa', 'feeds+noaa@sightsignal.app', 'NOAA Weather Service', 'system', 'active', 'system', NOW(), NOW()),
      ('system-usgs', 'feeds+usgs@sightsignal.app', 'USGS Earthquake Hazards', 'system', 'active', 'system', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
    RAISE NOTICE 'Added system users with membership_tier';
  EXCEPTION WHEN OTHERS THEN
    -- If that fails, try without membership_tier column
    BEGIN
      INSERT INTO users (id, email, username, role, status, created_at, updated_at)
      VALUES
        ('system-noaa', 'feeds+noaa@sightsignal.app', 'NOAA Weather Service', 'system', 'active', NOW(), NOW()),
        ('system-usgs', 'feeds+usgs@sightsignal.app', 'USGS Earthquake Hazards', 'system', 'active', NOW(), NOW())
      ON CONFLICT (id) DO NOTHING;
      RAISE NOTICE 'Added system users without membership_tier';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not add system users: %', SQLERRM;
    END;
  END;
END $$;

-- ============================================================================
-- FEED-RELATED SIGHTING TYPES
-- ============================================================================

-- Insert new sighting types for NOAA Weather feed
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

-- Done!
DO $$
BEGIN
  RAISE NOTICE '✅ Feed support added successfully!';
END $$;
