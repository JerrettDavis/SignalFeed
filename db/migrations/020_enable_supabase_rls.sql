-- ============================================================================
-- Enable RLS for Supabase-exposed public tables
-- ============================================================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE sighting_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE sightings ENABLE ROW LEVEL SECURITY;
ALTER TABLE geofences ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE passkeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reputation ENABLE ROW LEVEL SECURITY;
ALTER TABLE reputation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE sighting_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_sightings ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_activity_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_view_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_privacy_settings ENABLE ROW LEVEL SECURITY;

-- Stable public reference/feed data.
DROP POLICY IF EXISTS "Public read categories" ON categories;
CREATE POLICY "Public read categories" ON categories
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Public read subcategories" ON subcategories;
CREATE POLICY "Public read subcategories" ON subcategories
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Public read sighting types" ON sighting_types;
CREATE POLICY "Public read sighting types" ON sighting_types
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Public read active sightings" ON sightings;
CREATE POLICY "Public read active sightings" ON sightings
  FOR SELECT TO anon, authenticated
  USING (status = 'active');

DROP POLICY IF EXISTS "Users manage own sightings" ON sightings;
CREATE POLICY "Users manage own sightings" ON sightings
  FOR ALL TO authenticated
  USING (reporter_id = auth.uid()::text)
  WITH CHECK (reporter_id = auth.uid()::text);

DROP POLICY IF EXISTS "Public read public geofences" ON geofences;
CREATE POLICY "Public read public geofences" ON geofences
  FOR SELECT TO anon, authenticated
  USING (visibility = 'public' OR owner_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users manage own geofences" ON geofences;
CREATE POLICY "Users manage own geofences" ON geofences
  FOR ALL TO authenticated
  USING (owner_id = auth.uid()::text)
  WITH CHECK (owner_id = auth.uid()::text);

-- User-owned data and credentials. Service-role/server access bypasses RLS.
DROP POLICY IF EXISTS "Users read own profile" ON users;
CREATE POLICY "Users read own profile" ON users
  FOR SELECT TO authenticated
  USING (id = auth.uid()::text);

DROP POLICY IF EXISTS "Users manage own passkeys" ON passkeys;
CREATE POLICY "Users manage own passkeys" ON passkeys
  FOR ALL TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users read own reputation events" ON reputation_events;
CREATE POLICY "Users read own reputation events" ON reputation_events
  FOR SELECT TO authenticated
  USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Public read reputation scores" ON user_reputation;
CREATE POLICY "Public read reputation scores" ON user_reputation
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Public read sighting reactions" ON sighting_reactions;
CREATE POLICY "Public read sighting reactions" ON sighting_reactions
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Users manage own sighting reactions" ON sighting_reactions;
CREATE POLICY "Users manage own sighting reactions" ON sighting_reactions
  FOR ALL TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Public read active signals" ON signals;
CREATE POLICY "Public read active signals" ON signals
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Users manage own signals" ON signals;
CREATE POLICY "Users manage own signals" ON signals
  FOR ALL TO authenticated
  USING (owner_id = auth.uid()::text)
  WITH CHECK (owner_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users manage own signal subscriptions" ON signal_subscriptions;
CREATE POLICY "Users manage own signal subscriptions" ON signal_subscriptions
  FOR ALL TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Public read signal sightings" ON signal_sightings;
CREATE POLICY "Public read signal sightings" ON signal_sightings
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Signal owners manage signal sightings" ON signal_sightings;
CREATE POLICY "Signal owners manage signal sightings" ON signal_sightings
  FOR ALL TO authenticated
  USING (
    added_by = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM signals
      WHERE signals.id = signal_sightings.signal_id
        AND signals.owner_id = auth.uid()::text
    )
  )
  WITH CHECK (
    added_by = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM signals
      WHERE signals.id = signal_sightings.signal_id
        AND signals.owner_id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Public read signal activity snapshots" ON signal_activity_snapshots;
CREATE POLICY "Public read signal activity snapshots" ON signal_activity_snapshots
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Users manage own signal view sessions" ON signal_view_sessions;
CREATE POLICY "Users manage own signal view sessions" ON signal_view_sessions
  FOR ALL TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users manage own privacy settings" ON user_privacy_settings;
CREATE POLICY "Users manage own privacy settings" ON user_privacy_settings
  FOR ALL TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

ALTER FUNCTION public.update_signal_sighting_count() SET search_path = public;
ALTER FUNCTION public.update_signal_subscriber_count() SET search_path = public;
