-- Production Seed Data for SightSignal
-- Tulsa, OK based seed data matching src/data/seed.ts
-- Run with: psql $DATABASE_URL -f scripts/seed-production.sql

-- ============================================================================
-- "All Sightings" signal - ensures it always exists
-- ============================================================================
INSERT INTO signals (id, name, description, target, conditions, triggers, owner_id, is_active, classification, view_count, unique_viewers, active_viewers, last_viewed_at, subscriber_count, sighting_count, created_at, updated_at)
VALUES
  ('signal-all', 'All Sightings', 'All sightings across all areas',
   '{"kind":"global"}',
   '{}',
   ARRAY['new_sighting'],
   'seed-user-admin', true, 'official', 12456, 5234, 234, NOW() - INTERVAL '2 minutes', 4200, 20, NOW() + INTERVAL '10 years', NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  target = EXCLUDED.target,
  conditions = EXCLUDED.conditions,
  triggers = EXCLUDED.triggers,
  is_active = EXCLUDED.is_active,
  classification = EXCLUDED.classification,
  view_count = EXCLUDED.view_count,
  unique_viewers = EXCLUDED.unique_viewers,
  active_viewers = EXCLUDED.active_viewers,
  last_viewed_at = EXCLUDED.last_viewed_at,
  subscriber_count = EXCLUDED.subscriber_count,
  sighting_count = EXCLUDED.sighting_count,
  updated_at = EXCLUDED.updated_at;
