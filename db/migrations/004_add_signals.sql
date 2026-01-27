-- Migration: Add signals and signal subscriptions
-- Phase 2: Signals Infrastructure

-- Signals table
CREATE TABLE IF NOT EXISTS signals (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  owner_id VARCHAR(255) NOT NULL,
  target JSONB NOT NULL,
  triggers TEXT[] NOT NULL DEFAULT '{}',
  conditions JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for signals
CREATE INDEX IF NOT EXISTS idx_signals_owner ON signals(owner_id);
CREATE INDEX IF NOT EXISTS idx_signals_target ON signals USING GIN(target);
CREATE INDEX IF NOT EXISTS idx_signals_is_active ON signals(is_active);
CREATE INDEX IF NOT EXISTS idx_signals_created_at ON signals(created_at DESC);

-- Signal subscriptions table
CREATE TABLE IF NOT EXISTS signal_subscriptions (
  id VARCHAR(255) PRIMARY KEY,
  signal_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  delivery_method VARCHAR(50) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(signal_id, user_id, delivery_method)
);

-- Add foreign key to signals
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_signal_subscriptions_signal'
  ) THEN
    ALTER TABLE signal_subscriptions
      ADD CONSTRAINT fk_signal_subscriptions_signal
      FOREIGN KEY (signal_id) REFERENCES signals(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- Indexes for signal_subscriptions
CREATE INDEX IF NOT EXISTS idx_signal_subscriptions_signal ON signal_subscriptions(signal_id);
CREATE INDEX IF NOT EXISTS idx_signal_subscriptions_user ON signal_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_signal_subscriptions_created_at ON signal_subscriptions(created_at DESC);

-- Add check constraint for delivery methods
ALTER TABLE signal_subscriptions
  DROP CONSTRAINT IF EXISTS check_delivery_method;

ALTER TABLE signal_subscriptions
  ADD CONSTRAINT check_delivery_method
  CHECK (delivery_method IN ('email', 'push', 'webhook', 'sms'));

-- Add comments for documentation
COMMENT ON TABLE signals IS 'User-created signals that trigger notifications based on sightings';
COMMENT ON TABLE signal_subscriptions IS 'User subscriptions to signals for notifications';
COMMENT ON COLUMN signals.target IS 'Geographic target: {kind: "global"} | {kind: "geofence", geofenceId: "..."} | {kind: "polygon", polygon: {...}}';
COMMENT ON COLUMN signals.triggers IS 'Array of trigger types: new_sighting, sighting_confirmed, sighting_disputed, score_threshold';
COMMENT ON COLUMN signals.conditions IS 'Additional filtering conditions (JSONB object)';
COMMENT ON COLUMN signal_subscriptions.delivery_method IS 'One of: email, push, webhook, sms';
