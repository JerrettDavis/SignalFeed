-- Minimal seed data for current database schema

-- Users
INSERT INTO users (id, email, username, role, status, created_at, updated_at)
VALUES
  ('user-001', 'admin@signalfeed.app', 'admin', 'admin', 'active', NOW(), NOW()),
  ('user-004', 'reporter1@signalfeed.app', 'reporter1', 'user', 'active', NOW(), NOW()),
  ('user-005', 'reporter2@signalfeed.app', 'reporter2', 'user', 'active', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Geofences
INSERT INTO geofences (id, name, visibility, owner_id, polygon, created_at)
VALUES
  ('geofence-001', 'Downtown SF', 'public', 'user-001',
   '{"type":"Polygon","coordinates":[[[-122.4195,37.7749],[-122.4095,37.7749],[-122.4095,37.7849],[-122.4195,37.7849],[-122.4195,37.7749]]]}',
   NOW())
ON CONFLICT (id) DO NOTHING;

-- Basic sighting types (already added)

-- Sightings
INSERT INTO sightings (id, reporter_id, type_id, category_id, description, location, status, importance, score, observed_at, created_at, fields)
VALUES
  ('sight-001', 'user-004', 'type-fire', 'cat-emergency', 'Large fire at commercial building',
   '{"lat":37.7799,"lng":-122.4149}', 'active', 'high', 95, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours', '{}'),
  ('sight-002', 'user-005', 'type-wildlife', 'cat-wildlife', 'Seals near pier',
   '{"lat":37.7815,"lng":-122.3920}', 'active', 'low', 75, NOW() - INTERVAL '4 hours', NOW() - INTERVAL '4 hours', '{}'),
  ('sight-003', 'user-004', 'type-accident', 'cat-traffic', 'Three vehicle collision',
   '{"lat":37.7699,"lng":-122.4195}', 'active', 'high', 88, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour', '{}')
ON CONFLICT (id) DO NOTHING;

-- Signals (minimal columns only)
INSERT INTO signals (id, name, description, target, conditions, triggers, owner_id, is_active, created_at, updated_at)
VALUES
  ('signal-all', 'All Sightings', 'All sightings across all areas',
   '{"kind":"global"}', '{}', ARRAY['new_sighting'], 'user-001', true, NOW(), NOW()),
  ('signal-001', 'Downtown Emergencies', 'Critical events in downtown',
   '{"kind":"geofence","geofenceId":"geofence-001"}',
   '{"categoryIds":["cat-emergency"]}', ARRAY['new_sighting'], 'user-001', true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  target = EXCLUDED.target,
  conditions = EXCLUDED.conditions,
  is_active = EXCLUDED.is_active;
