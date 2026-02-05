-- Production Seed Data (without membership_tier)
-- Minimal seed data for production database

-- ============================================================================
-- USERS
-- ============================================================================
INSERT INTO users (id, email, username, role, status, created_at, updated_at)
VALUES
  -- Admin users
  ('user-001', 'admin@signalfeed.app', 'admin', 'admin', 'active', NOW(), NOW()),
  ('user-002', 'city-admin@signalfeed.app', 'city_admin', 'admin', 'active', NOW(), NOW()),

  -- Moderator
  ('user-003', 'moderator@signalfeed.app', 'moderator', 'moderator', 'active', NOW(), NOW()),

  -- Regular users
  ('user-004', 'reporter1@signalfeed.app', 'reporter1', 'user', 'active', NOW(), NOW()),
  ('user-005', 'reporter2@signalfeed.app', 'reporter2', 'user', 'active', NOW(), NOW()),
  ('user-006', 'reporter3@signalfeed.app', 'reporter3', 'user', 'active', NOW(), NOW()),
  ('user-007', 'observer1@signalfeed.app', 'observer1', 'user', 'active', NOW(), NOW()),
  ('user-008', 'observer2@signalfeed.app', 'observer2', 'user', 'active', NOW(), NOW()),
  ('user-009', 'observer3@signalfeed.app', 'observer3', 'user', 'active', NOW(), NOW()),
  ('user-010', 'observer4@signalfeed.app', 'observer4', 'user', 'active', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- GEOFENCES
-- ============================================================================
INSERT INTO geofences (id, name, visibility, owner_id, polygon, created_at)
VALUES
  ('geofence-001', 'Downtown District, San Francisco, CA', 'public', 'user-001',
   '{"type":"Polygon","coordinates":[[[-122.4195,37.7749],[-122.4095,37.7749],[-122.4095,37.7849],[-122.4195,37.7849],[-122.4195,37.7749]]]}',
   NOW()),
  ('geofence-002', 'Harbor Area, San Francisco, CA', 'public', 'user-001',
   '{"type":"Polygon","coordinates":[[[-122.3995,37.7749],[-122.3895,37.7749],[-122.3895,37.7849],[-122.3995,37.7849],[-122.3995,37.7749]]]}',
   NOW()),
  ('geofence-003', 'University Campus, San Francisco, CA', 'public', 'user-001',
   '{"type":"Polygon","coordinates":[[[-122.4295,37.7649],[-122.4195,37.7649],[-122.4195,37.7749],[-122.4295,37.7749],[-122.4295,37.7649]]]}',
   NOW()),
  ('geofence-004', 'Airport Vicinity, San Francisco, CA', 'public', 'user-001',
   '{"type":"Polygon","coordinates":[[[-122.3795,37.6189],[-122.3695,37.6189],[-122.3695,37.6289],[-122.3795,37.6289],[-122.3795,37.6189]]]}',
   NOW()),
  ('geofence-005', 'Industrial Zone, San Francisco, CA', 'public', 'user-002',
   '{"type":"Polygon","coordinates":[[[-122.4495,37.7549],[-122.4395,37.7549],[-122.4395,37.7649],[-122.4495,37.7649],[-122.4495,37.7549]]]}',
   NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- BASIC SIGHTING TYPES (if not already present)
-- ============================================================================
INSERT INTO sighting_types (id, category_id, subcategory_id, label, icon)
VALUES
  ('type-fire', 'cat-emergency', 'subcat-emergency', 'Fire', '🔥'),
  ('type-medical', 'cat-emergency', 'subcat-emergency', 'Medical Emergency', '🚑'),
  ('type-accident', 'cat-traffic', 'subcat-traffic', 'Traffic Accident', '💥'),
  ('type-closure', 'cat-traffic', 'subcat-traffic', 'Road Closure', '🚧'),
  ('type-festival', 'cat-community', 'subcat-community', 'Festival', '🎪'),
  ('type-market', 'cat-community', 'subcat-community', 'Market', '🛍️'),
  ('type-wildlife', 'cat-wildlife', 'subcat-wildlife', 'Wildlife Sighting', '🦌'),
  ('type-rare-bird', 'cat-wildlife', 'subcat-wildlife', 'Rare Bird', '🦅'),
  ('type-construction', 'cat-infrastructure', 'subcat-infrastructure', 'Construction', '🏗️'),
  ('type-power-outage', 'cat-infrastructure', 'subcat-infrastructure', 'Power Outage', '⚡')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SIGHTINGS
-- ============================================================================
INSERT INTO sightings (id, reporter_id, type_id, category_id, description, location, status, importance, score, observed_at, created_at, fields)
VALUES
  -- Downtown emergencies
  ('sight-001', 'user-003', 'type-fire', 'cat-emergency', 'Large fire at commercial building on Main St',
   '{"lat":37.7799,"lng":-122.4149}', 'active', 'high', 95, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours', '{}'),

  -- Harbor area events
  ('sight-002', 'user-004', 'type-market', 'cat-community', 'Weekly farmers market at waterfront',
   '{"lat":37.7799,"lng":-122.3945}', 'active', 'low', 85, NOW() - INTERVAL '3 hours', NOW() - INTERVAL '3 hours', '{}'),
  ('sight-003', 'user-005', 'type-wildlife', 'cat-wildlife', 'Large group of seals near pier',
   '{"lat":37.7815,"lng":-122.3920}', 'active', 'low', 75, NOW() - INTERVAL '4 hours', NOW() - INTERVAL '4 hours', '{}'),

  -- Traffic incidents
  ('sight-004', 'user-003', 'type-accident', 'cat-traffic', 'Three vehicle collision causing delays',
   '{"lat":37.7699,"lng":-122.4195}', 'active', 'high', 88, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour', '{}'),
  ('sight-005', 'user-004', 'type-closure', 'cat-traffic', 'Bridge closed for emergency repairs',
   '{"lat":37.7799,"lng":-122.3945}', 'active', 'high', 90, NOW() - INTERVAL '5 hours', NOW() - INTERVAL '5 hours', '{}'),

  -- Campus activities
  ('sight-006', 'user-005', 'type-festival', 'cat-community', 'Annual campus open house event',
   '{"lat":37.7699,"lng":-122.4245}', 'active', 'low', 78, NOW() - INTERVAL '6 hours', NOW() - INTERVAL '6 hours', '{}'),

  -- Airport area
  ('sight-007', 'user-003', 'type-rare-bird', 'cat-wildlife', 'Bald eagle spotted near runway',
   '{"lat":37.6239,"lng":-122.3745}', 'active', 'low', 70, NOW() - INTERVAL '7 hours', NOW() - INTERVAL '7 hours', '{}'),

  -- Industrial zone
  ('sight-008', 'user-004', 'type-power-outage', 'cat-infrastructure', 'Widespread power outage affecting area',
   '{"lat":37.7599,"lng":-122.4445}', 'active', 'high', 92, NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '30 minutes', '{}'),
  ('sight-009', 'user-005', 'type-construction', 'cat-infrastructure', 'Large scale construction project',
   '{"lat":37.7575,"lng":-122.4420}', 'active', 'low', 65, NOW() - INTERVAL '8 hours', NOW() - INTERVAL '8 hours', '{}'),

  -- Additional downtown events
  ('sight-010', 'user-003', 'type-medical', 'cat-emergency', 'Ambulance requested at public plaza',
   '{"lat":37.7789,"lng":-122.4165}', 'active', 'high', 98, NOW() - INTERVAL '15 minutes', NOW() - INTERVAL '15 minutes', '{}')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SIGNALS
-- ============================================================================

-- "All Sightings" - Global signal that matches everything
INSERT INTO signals (id, name, description, target, conditions, triggers, owner_id, is_active, classification, view_count, unique_viewers, active_viewers, last_viewed_at, sighting_count, created_at, updated_at)
VALUES
  ('signal-all', 'All Sightings', 'All sightings across all areas',
   '{"kind":"global"}',
   '{}',
   ARRAY['new_sighting'],
   'user-001', true, 'official', 12456, 5234, 234, NOW() - INTERVAL '2 minutes', 10, NOW() + INTERVAL '10 years', NOW())
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
  sighting_count = EXCLUDED.sighting_count,
  updated_at = EXCLUDED.updated_at;

-- Downtown Emergency Signal
INSERT INTO signals (id, name, description, target, conditions, triggers, owner_id, is_active, classification, view_count, unique_viewers, active_viewers, last_viewed_at, sighting_count, created_at, updated_at)
VALUES
  ('signal-001', 'Downtown Emergencies', 'Critical events in downtown district',
   '{"kind":"geofence","geofenceId":"geofence-001"}',
   '{"categoryIds":["cat-emergency"],"importance":"high"}',
   ARRAY['new_sighting'],
   'user-001', true, 'official', 5623, 2341, 89, NOW() - INTERVAL '5 minutes', 2, NOW(), NOW())
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
  sighting_count = EXCLUDED.sighting_count;

-- Harbor Area Activities
INSERT INTO signals (id, name, description, target, conditions, triggers, owner_id, is_active, classification, view_count, unique_viewers, active_viewers, last_viewed_at, sighting_count, created_at, updated_at)
VALUES
  ('signal-002', 'Harbor Area Activities', 'Events and sightings at waterfront',
   '{"kind":"geofence","geofenceId":"geofence-002"}',
   '{}',
   ARRAY['new_sighting'],
   'user-004', true, 'community', 1247, 523, 23, NOW() - INTERVAL '8 minutes', 3, NOW(), NOW())
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
  sighting_count = EXCLUDED.sighting_count;

-- Traffic Watch Signal
INSERT INTO signals (id, name, description, target, conditions, triggers, owner_id, is_active, classification, view_count, unique_viewers, active_viewers, last_viewed_at, sighting_count, created_at, updated_at)
VALUES
  ('signal-003', 'Traffic Watch', 'Traffic accidents and road closures',
   '{"kind":"global"}',
   '{"categoryIds":["cat-traffic"]}',
   ARRAY['new_sighting'],
   'user-005', true, 'community', 3456, 1234, 45, NOW() - INTERVAL '12 minutes', 2, NOW(), NOW())
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
  sighting_count = EXCLUDED.sighting_count;

-- Wildlife Spotting Signal
INSERT INTO signals (id, name, description, target, conditions, triggers, owner_id, is_active, classification, view_count, unique_viewers, active_viewers, last_viewed_at, sighting_count, created_at, updated_at)
VALUES
  ('signal-004', 'Wildlife Spotting', 'Nature and wildlife observations',
   '{"kind":"global"}',
   '{"categoryIds":["cat-wildlife"]}',
   ARRAY['new_sighting'],
   'user-006', true, 'community', 2345, 891, 34, NOW() - INTERVAL '20 minutes', 2, NOW(), NOW())
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
  sighting_count = EXCLUDED.sighting_count;
