-- Fix script to ensure proper signal ordering and geofences
-- Run this on the deployed database to fix data issues

-- ============================================================================
-- FIX 1: Ensure "All Sightings" signal exists with proper configuration
-- ============================================================================

-- Update or create the "All Sightings" signal with an earlier created_at timestamp
-- to ensure it appears first in database ordering
INSERT INTO signals (id, name, description, target, conditions, triggers, owner_id, is_active, created_at, updated_at)
VALUES
  ('signal-all', 'All Sightings', 'All sightings across all areas',
   '{"kind":"global"}',
   '{}',
   ARRAY['new_sighting'],
   'user-001', true, NOW() - INTERVAL '1 year', NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  target = EXCLUDED.target,
  conditions = EXCLUDED.conditions,
  triggers = EXCLUDED.triggers,
  is_active = EXCLUDED.is_active,
  created_at = NOW() - INTERVAL '1 year',  -- Force earlier timestamp
  updated_at = EXCLUDED.updated_at;

-- ============================================================================
-- FIX 2: Ensure all sightings are associated with "All Sightings" signal
-- ============================================================================

-- Add any missing sightings to the "All Sightings" signal
INSERT INTO signal_sightings (id, signal_id, sighting_id, added_at)
SELECT 'ss-all-' || id, 'signal-all', id, created_at
FROM sightings
WHERE NOT EXISTS (
  SELECT 1 FROM signal_sightings
  WHERE signal_id = 'signal-all' AND sighting_id = sightings.id
)
ON CONFLICT (signal_id, sighting_id) DO NOTHING;

-- ============================================================================
-- FIX 3: Verify geofences exist for signals that reference them
-- ============================================================================

-- This will show any signals that reference non-existent geofences
DO $$
DECLARE
  missing_geofences RECORD;
  missing_count INTEGER := 0;
BEGIN
  -- Check for signals with geofence targets that reference missing geofences
  FOR missing_geofences IN
    SELECT
      s.id,
      s.name,
      s.target->>'geofenceId' as geofence_id
    FROM signals s
    WHERE s.target->>'kind' = 'geofence'
      AND NOT EXISTS (
        SELECT 1 FROM geofences g
        WHERE g.id = s.target->>'geofenceId'
      )
  LOOP
    missing_count := missing_count + 1;
    RAISE NOTICE 'Signal "%" (id: %) references missing geofence: %',
      missing_geofences.name,
      missing_geofences.id,
      missing_geofences.geofence_id;
  END LOOP;

  IF missing_count = 0 THEN
    RAISE NOTICE '✓ All geofence references are valid';
  ELSE
    RAISE WARNING '⚠ Found % signals with missing geofence references', missing_count;
  END IF;
END $$;

-- ============================================================================
-- FIX 4: Summary
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Database Fix Summary:';
  RAISE NOTICE '====================================';
  RAISE NOTICE '"All Sightings" signal: %', (SELECT CASE WHEN COUNT(*) > 0 THEN '✓ EXISTS' ELSE '✗ MISSING' END FROM signals WHERE id = 'signal-all');
  RAISE NOTICE 'Total signals: %', (SELECT COUNT(*) FROM signals);
  RAISE NOTICE 'Active signals: %', (SELECT COUNT(*) FROM signals WHERE is_active = true);
  RAISE NOTICE 'Total geofences: %', (SELECT COUNT(*) FROM geofences);
  RAISE NOTICE 'Sightings in "All Sightings": %', (SELECT COUNT(*) FROM signal_sightings WHERE signal_id = 'signal-all');
  RAISE NOTICE 'Total sightings: %', (SELECT COUNT(*) FROM sightings);
  RAISE NOTICE '====================================';
END $$;
