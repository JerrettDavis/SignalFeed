-- Migration 015: Add Signal Viral Tracking
-- Track daily activity snapshots for viral spike detection (24h vs 7-day average)

CREATE TABLE IF NOT EXISTS signal_activity_snapshots (
  id TEXT PRIMARY KEY,
  signal_id TEXT NOT NULL REFERENCES signals(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  new_subscribers INTEGER NOT NULL DEFAULT 0,
  new_sightings INTEGER NOT NULL DEFAULT 0,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(signal_id, snapshot_date)
);

-- Indexes for viral detection queries
CREATE INDEX IF NOT EXISTS idx_signal_activity_signal
  ON signal_activity_snapshots(signal_id, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_signal_activity_date
  ON signal_activity_snapshots(snapshot_date DESC);

-- Comments for documentation
COMMENT ON TABLE signal_activity_snapshots IS 'Daily activity snapshots for viral spike detection (24h vs 7-day average)';
COMMENT ON COLUMN signal_activity_snapshots.snapshot_date IS 'Date of snapshot (one per day per signal)';
COMMENT ON COLUMN signal_activity_snapshots.new_subscribers IS 'New subscribers added on this date';
COMMENT ON COLUMN signal_activity_snapshots.new_sightings IS 'New sightings added to signal on this date';
COMMENT ON COLUMN signal_activity_snapshots.view_count IS 'Total views on this date';
