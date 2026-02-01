-- Fix Missing Geofence Reference
-- Updates seed-signal-002 and seed-subscription-003 to use the correct Downtown geofence

-- ============================================================================
-- FIX: Update Downtown Traffic Monitoring signal to use correct geofence
-- ============================================================================

-- Change seed-signal-002 from non-existent seed-geofence-002 to seed-geofence-011 (Downtown Tulsa)
UPDATE signals
SET target = '{"kind":"geofence","geofenceId":"seed-geofence-011"}'::jsonb
WHERE id = 'seed-signal-002';

-- ============================================================================
-- FIX: Update downtown subscription to use correct geofence
-- ============================================================================

-- Change seed-subscription-003 from non-existent seed-geofence-002 to seed-geofence-011
UPDATE subscriptions
SET target = '{"kind":"geofence","geofenceId":"seed-geofence-011"}'::jsonb
WHERE id = 'seed-subscription-003';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  signal_target JSONB;
  subscription_target JSONB;
  geofence_exists BOOLEAN;
BEGIN
  -- Check signal
  SELECT target INTO signal_target
  FROM signals
  WHERE id = 'seed-signal-002';

  -- Check subscription
  SELECT target INTO subscription_target
  FROM subscriptions
  WHERE id = 'seed-subscription-003';

  -- Check geofence exists
  SELECT EXISTS (
    SELECT 1 FROM geofences WHERE id = 'seed-geofence-011'
  ) INTO geofence_exists;

  RAISE NOTICE '====================================';
  RAISE NOTICE 'Fix Verification:';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Signal seed-signal-002 target: %', signal_target;
  RAISE NOTICE 'Subscription seed-subscription-003 target: %', subscription_target;
  RAISE NOTICE 'Geofence seed-geofence-011 exists: %', geofence_exists;

  IF signal_target->>'geofenceId' = 'seed-geofence-011'
     AND subscription_target->>'geofenceId' = 'seed-geofence-011'
     AND geofence_exists THEN
    RAISE NOTICE '✓ Fix applied successfully!';
  ELSE
    RAISE WARNING '⚠ Fix may not have been applied correctly';
  END IF;
  RAISE NOTICE '====================================';
END $$;
