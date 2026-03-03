-- Migration 016: Add Signal View Sessions
-- Track active viewing sessions for real-time "active viewers" count (last 5 minutes)

CREATE TABLE IF NOT EXISTS signal_view_sessions (
  user_id TEXT NOT NULL,
  signal_id TEXT NOT NULL REFERENCES signals(id) ON DELETE CASCADE,
  last_heartbeat TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, signal_id)
);

-- Index for cleanup and active viewer counting
CREATE INDEX IF NOT EXISTS idx_signal_view_sessions_heartbeat
  ON signal_view_sessions(signal_id, last_heartbeat);

-- Index for efficient cleanup of old sessions
CREATE INDEX IF NOT EXISTS idx_signal_view_sessions_cleanup
  ON signal_view_sessions(last_heartbeat)
  WHERE last_heartbeat < NOW() - INTERVAL '10 minutes';

-- Comments for documentation
COMMENT ON TABLE signal_view_sessions IS 'Active viewing sessions for real-time "active viewers" count (last 5 minutes)';
COMMENT ON COLUMN signal_view_sessions.last_heartbeat IS 'Timestamp of last activity (updated every 30-60 seconds while viewing)';
