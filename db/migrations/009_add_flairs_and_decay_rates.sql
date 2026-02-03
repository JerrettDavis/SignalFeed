-- Migration: Add flair system and category-specific time decay rates
-- This migration adds:
-- 1. Flair definitions (system-wide and category-specific)
-- 2. Sighting flairs (many-to-many relationship)
-- 3. Category decay rate configurations
-- 4. Enhanced time-based scoring

-- ============================================================================
-- FLAIR DEFINITIONS
-- ============================================================================

-- System-wide and category-specific flair types
CREATE TABLE flairs (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT, -- hex color for UI display
  category_id TEXT, -- NULL for system-wide flairs, specific category for category-specific
  flair_type TEXT NOT NULL CHECK (flair_type IN ('status', 'safety', 'urgency', 'resolution', 'community')),
  score_modifier REAL DEFAULT 0, -- multiplier or additive score adjustment
  visibility_impact TEXT CHECK (visibility_impact IN ('boost', 'neutral', 'suppress', 'hide')),
  auto_assign_conditions JSONB, -- conditions for automatic flair assignment
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE INDEX idx_flairs_category_id ON flairs(category_id);
CREATE INDEX idx_flairs_type ON flairs(flair_type);
CREATE INDEX idx_flairs_active ON flairs(is_active) WHERE is_active = true;

-- ============================================================================
-- SIGHTING FLAIRS (many-to-many)
-- ============================================================================

CREATE TABLE sighting_flairs (
  sighting_id TEXT NOT NULL,
  flair_id TEXT NOT NULL,
  assigned_by TEXT, -- user_id who assigned the flair
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assignment_method TEXT CHECK (assignment_method IN ('manual', 'auto', 'consensus', 'moderator')),
  metadata JSONB, -- additional context (e.g., vote counts for consensus)

  PRIMARY KEY (sighting_id, flair_id),
  FOREIGN KEY (sighting_id) REFERENCES sightings(id) ON DELETE CASCADE,
  FOREIGN KEY (flair_id) REFERENCES flairs(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_sighting_flairs_sighting ON sighting_flairs(sighting_id);
CREATE INDEX idx_sighting_flairs_flair ON sighting_flairs(flair_id);
CREATE INDEX idx_sighting_flairs_assigned_by ON sighting_flairs(assigned_by);
CREATE INDEX idx_sighting_flairs_method ON sighting_flairs(assignment_method);

-- ============================================================================
-- FLAIR SUGGESTIONS (for community consensus)
-- ============================================================================

CREATE TABLE flair_suggestions (
  id TEXT PRIMARY KEY,
  sighting_id TEXT NOT NULL,
  flair_id TEXT NOT NULL,
  suggested_by TEXT NOT NULL,
  suggested_at TIMESTAMPTZ DEFAULT NOW(),
  vote_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'rejected')),

  FOREIGN KEY (sighting_id) REFERENCES sightings(id) ON DELETE CASCADE,
  FOREIGN KEY (flair_id) REFERENCES flairs(id) ON DELETE CASCADE,
  FOREIGN KEY (suggested_by) REFERENCES users(id) ON DELETE CASCADE,

  UNIQUE (sighting_id, flair_id, suggested_by)
);

CREATE INDEX idx_flair_suggestions_sighting ON flair_suggestions(sighting_id);
CREATE INDEX idx_flair_suggestions_status ON flair_suggestions(status);

-- ============================================================================
-- CATEGORY TIME DECAY CONFIGURATIONS
-- ============================================================================

CREATE TABLE category_decay_config (
  category_id TEXT PRIMARY KEY,
  decay_rate REAL NOT NULL DEFAULT 1.5, -- power factor for time decay (higher = faster decay)
  relevance_window_hours INTEGER NOT NULL DEFAULT 168, -- 7 days default
  importance_multiplier JSONB DEFAULT '{"critical": 2.0, "high": 1.5, "normal": 1.0, "low": 0.5}',
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE INDEX idx_category_decay_config_rate ON category_decay_config(decay_rate);

-- ============================================================================
-- ADD COLUMNS TO EXISTING SIGHTINGS TABLE
-- ============================================================================

-- Add time-based scoring columns
ALTER TABLE sightings
  ADD COLUMN time_adjusted_score REAL DEFAULT 0,
  ADD COLUMN relevance_score REAL DEFAULT 1.0,
  ADD COLUMN decay_rate REAL,
  ADD COLUMN last_score_update TIMESTAMPTZ DEFAULT NOW();

-- Add flair-related computed columns
ALTER TABLE sightings
  ADD COLUMN flair_count INTEGER DEFAULT 0,
  ADD COLUMN primary_flair_id TEXT,
  ADD COLUMN visibility_state TEXT DEFAULT 'visible' CHECK (
    visibility_state IN ('visible', 'boosted', 'suppressed', 'hidden', 'archived')
  );

CREATE INDEX idx_sightings_time_adjusted_score ON sightings(time_adjusted_score DESC);
CREATE INDEX idx_sightings_relevance_score ON sightings(relevance_score DESC);
CREATE INDEX idx_sightings_visibility_state ON sightings(visibility_state);
CREATE INDEX idx_sightings_primary_flair ON sightings(primary_flair_id);

-- ============================================================================
-- SEED SYSTEM-WIDE FLAIRS
-- ============================================================================

INSERT INTO flairs (id, label, description, icon, color, category_id, flair_type, score_modifier, visibility_impact, display_order) VALUES
  -- Resolution flairs
  ('flair-resolved', 'Resolved', 'Issue has been resolved or is no longer active', '✅', '#10b981', NULL, 'resolution', -0.5, 'suppress', 1),
  ('flair-cleared', 'Cleared', 'Area or situation has been cleared', '🟢', '#22c55e', NULL, 'resolution', -0.6, 'suppress', 2),
  ('flair-false-alarm', 'False Alarm', 'Report was incorrect or resolved before arrival', '❌', '#6b7280', NULL, 'resolution', -1.0, 'hide', 3),

  -- Safety flairs
  ('flair-safety-hazard', 'Safety Hazard', 'Immediate safety concern requiring attention', '⚠️', '#ef4444', NULL, 'safety', 2.0, 'boost', 4),
  ('flair-avoid-area', 'Avoid Area', 'Recommend avoiding this location', '🚫', '#f97316', NULL, 'safety', 1.5, 'boost', 5),
  ('flair-all-clear', 'All Clear', 'Area is safe, hazard has passed', '✨', '#3b82f6', NULL, 'safety', 0.0, 'neutral', 6),

  -- Urgency flairs
  ('flair-urgent', 'Urgent', 'Requires immediate attention', '🔴', '#dc2626', NULL, 'urgency', 1.8, 'boost', 7),
  ('flair-time-sensitive', 'Time Sensitive', 'Relevance decreases quickly with time', '⏰', '#f59e0b', NULL, 'urgency', 1.2, 'boost', 8),

  -- Status flairs
  ('flair-ongoing', 'Ongoing', 'Situation is still developing', '🔄', '#8b5cf6', NULL, 'status', 0.8, 'boost', 9),
  ('flair-verified', 'Verified', 'Confirmed by multiple sources or authorities', '✓', '#06b6d4', NULL, 'status', 1.3, 'boost', 10),
  ('flair-unconfirmed', 'Unconfirmed', 'Awaiting verification', '❓', '#94a3b8', NULL, 'status', -0.2, 'neutral', 11),

  -- Community flairs
  ('flair-trending', 'Trending', 'High community engagement', '🔥', '#f43f5e', NULL, 'community', 1.0, 'boost', 12),
  ('flair-popular', 'Popular', 'Many views and interactions', '⭐', '#eab308', NULL, 'community', 0.5, 'neutral', 13),
  ('flair-needs-attention', 'Needs Attention', 'Requires more community input', '📢', '#a855f7', NULL, 'community', 0.3, 'neutral', 14),
  ('flair-duplicate', 'Duplicate', 'Similar sighting already reported', '📋', '#64748b', NULL, 'community', -0.8, 'suppress', 15);

-- ============================================================================
-- SEED CATEGORY-SPECIFIC FLAIRS
-- ============================================================================

-- Transportation specific
INSERT INTO flairs (id, label, description, icon, color, category_id, flair_type, score_modifier, visibility_impact, display_order) VALUES
  ('flair-trans-heavy-traffic', 'Heavy Traffic', 'Significant traffic congestion', '🚗', '#dc2626', 'cat-transportation', 'status', 1.5, 'boost', 1),
  ('flair-trans-accident-cleared', 'Accident Cleared', 'Accident scene has been cleared', '🟢', '#10b981', 'cat-transportation', 'resolution', -0.7, 'suppress', 2),
  ('flair-trans-road-closed', 'Road Closed', 'Road is completely closed', '🚧', '#ef4444', 'cat-transportation', 'safety', 2.0, 'boost', 3);

-- Weather specific
INSERT INTO flairs (id, label, description, icon, color, category_id, flair_type, score_modifier, visibility_impact, display_order) VALUES
  ('flair-weather-severe', 'Severe Weather', 'Dangerous weather conditions', '⛈️', '#dc2626', 'cat-weather', 'safety', 2.5, 'boost', 1),
  ('flair-weather-passing', 'Passing Through', 'Weather system moving through area', '🌤️', '#f59e0b', 'cat-weather', 'status', 0.5, 'neutral', 2),
  ('flair-weather-ended', 'Weather Ended', 'Weather event has concluded', '☀️', '#22c55e', 'cat-weather', 'resolution', -0.5, 'suppress', 3);

-- Law Enforcement specific
INSERT INTO flairs (id, label, description, icon, color, category_id, flair_type, score_modifier, visibility_impact, display_order) VALUES
  ('flair-le-active-scene', 'Active Scene', 'Active law enforcement operation', '🚔', '#dc2626', 'cat-law-enforcement', 'urgency', 2.0, 'boost', 1),
  ('flair-le-scene-cleared', 'Scene Cleared', 'Law enforcement has left the scene', '✅', '#10b981', 'cat-law-enforcement', 'resolution', -0.6, 'suppress', 2);

-- Public Safety specific
INSERT INTO flairs (id, label, description, icon, color, category_id, flair_type, score_modifier, visibility_impact, display_order) VALUES
  ('flair-safety-emergency', 'Emergency', 'Active emergency situation', '🚨', '#dc2626', 'cat-public-safety', 'urgency', 3.0, 'boost', 1),
  ('flair-safety-contained', 'Contained', 'Emergency has been contained', '✓', '#10b981', 'cat-public-safety', 'resolution', -0.4, 'suppress', 2);

-- Lost & Found specific
INSERT INTO flairs (id, label, description, icon, color, category_id, flair_type, score_modifier, visibility_impact, display_order) VALUES
  ('flair-lf-found', 'Found', 'Item or pet has been found', '🎉', '#10b981', 'cat-lost-found', 'resolution', -0.8, 'suppress', 1),
  ('flair-lf-reunited', 'Reunited', 'Pet reunited with owner', '❤️', '#22c55e', 'cat-lost-found', 'resolution', -1.0, 'suppress', 2);

-- Infrastructure specific
INSERT INTO flairs (id, label, description, icon, color, category_id, flair_type, score_modifier, visibility_impact, display_order) VALUES
  ('flair-infra-in-progress', 'Work in Progress', 'Construction or repairs ongoing', '🔨', '#f59e0b', 'cat-infrastructure', 'status', 0.3, 'neutral', 1),
  ('flair-infra-completed', 'Work Completed', 'Construction or repairs finished', '✅', '#10b981', 'cat-infrastructure', 'resolution', -0.5, 'suppress', 2);

-- ============================================================================
-- SEED CATEGORY DECAY CONFIGURATIONS
-- ============================================================================

INSERT INTO category_decay_config (category_id, decay_rate, relevance_window_hours, notes) VALUES
  -- Fast decay (hours)
  ('cat-transportation', 2.5, 6, 'Traffic incidents become irrelevant quickly'),
  ('cat-weather', 2.0, 12, 'Weather conditions change rapidly'),
  ('cat-food-drink', 2.2, 8, 'Food trucks and deals are time-sensitive'),
  ('cat-hazards', 1.8, 24, 'Active hazards need visibility, resolved ones fade'),

  -- Medium decay (days)
  ('cat-law-enforcement', 1.5, 48, 'Active scenes stay relevant for a day or two'),
  ('cat-public-safety', 1.4, 72, 'Safety alerts need longer visibility'),
  ('cat-community-events', 1.6, 48, 'Events are relevant before and shortly after'),
  ('cat-market-activity', 1.7, 36, 'Markets and fairs have defined timeframes'),
  ('cat-curb-alerts', 1.5, 24, 'Free items get picked up within a day'),

  -- Slow decay (weeks)
  ('cat-lost-found', 1.0, 336, 'Lost items stay relevant for 2 weeks'),
  ('cat-wildlife', 1.2, 168, 'Wildlife sightings useful for patterns'),
  ('cat-infrastructure', 0.8, 720, 'Construction projects last weeks/months'),
  ('cat-urban-finds', 1.1, 504, 'Street art and murals persist'),
  ('cat-automotive', 1.3, 168, 'Car events and spotting have longer relevance'),
  ('cat-civic-engagement', 1.4, 168, 'Civic activities have extended relevance');

-- ============================================================================
-- FUNCTIONS FOR AUTOMATIC SCORE UPDATES
-- ============================================================================

-- Function to calculate time-adjusted score with category-specific decay
CREATE OR REPLACE FUNCTION calculate_time_adjusted_score(
  p_sighting_id TEXT
) RETURNS REAL AS $$
DECLARE
  v_base_score INTEGER;
  v_observed_at TIMESTAMPTZ;
  v_category_id TEXT;
  v_importance TEXT;
  v_decay_rate REAL;
  v_age_hours REAL;
  v_importance_mult REAL;
  v_flair_modifier REAL;
  v_time_adjusted_score REAL;
BEGIN
  -- Get sighting data
  SELECT s.score, s.observed_at, s.category_id, s.importance
  INTO v_base_score, v_observed_at, v_category_id, v_importance
  FROM sightings s
  WHERE s.id = p_sighting_id;

  -- Calculate age in hours
  v_age_hours := EXTRACT(EPOCH FROM (NOW() - v_observed_at)) / 3600.0;

  -- Get category decay rate (default 1.5 if not configured)
  SELECT COALESCE(decay_rate, 1.5)
  INTO v_decay_rate
  FROM category_decay_config
  WHERE category_id = v_category_id;

  -- Get importance multiplier from category config
  SELECT COALESCE(
    (importance_multiplier->>(v_importance))::REAL,
    CASE v_importance
      WHEN 'critical' THEN 2.0
      WHEN 'high' THEN 1.5
      WHEN 'normal' THEN 1.0
      WHEN 'low' THEN 0.5
      ELSE 1.0
    END
  )
  INTO v_importance_mult
  FROM category_decay_config
  WHERE category_id = v_category_id;

  IF v_importance_mult IS NULL THEN
    v_importance_mult := 1.0;
  END IF;

  -- Calculate flair modifier (sum of all active flairs)
  SELECT COALESCE(SUM(f.score_modifier), 0)
  INTO v_flair_modifier
  FROM sighting_flairs sf
  JOIN flairs f ON sf.flair_id = f.id
  WHERE sf.sighting_id = p_sighting_id AND f.is_active = true;

  -- Calculate time-adjusted score
  -- Formula: (base_score + flair_modifier) * importance_mult / (age_hours + 2)^decay_rate
  v_time_adjusted_score :=
    (v_base_score + v_flair_modifier) * v_importance_mult / POWER(v_age_hours + 2, v_decay_rate);

  RETURN v_time_adjusted_score;
END;
$$ LANGUAGE plpgsql;

-- Function to update sighting visibility based on flairs
CREATE OR REPLACE FUNCTION update_sighting_visibility(
  p_sighting_id TEXT
) RETURNS TEXT AS $$
DECLARE
  v_visibility_state TEXT;
  v_has_hide_flair BOOLEAN;
  v_has_boost_flair BOOLEAN;
  v_has_suppress_flair BOOLEAN;
BEGIN
  -- Check for hide flairs
  SELECT EXISTS(
    SELECT 1 FROM sighting_flairs sf
    JOIN flairs f ON sf.flair_id = f.id
    WHERE sf.sighting_id = p_sighting_id
      AND f.visibility_impact = 'hide'
      AND f.is_active = true
  ) INTO v_has_hide_flair;

  IF v_has_hide_flair THEN
    RETURN 'hidden';
  END IF;

  -- Check for boost flairs
  SELECT EXISTS(
    SELECT 1 FROM sighting_flairs sf
    JOIN flairs f ON sf.flair_id = f.id
    WHERE sf.sighting_id = p_sighting_id
      AND f.visibility_impact = 'boost'
      AND f.is_active = true
  ) INTO v_has_boost_flair;

  IF v_has_boost_flair THEN
    RETURN 'boosted';
  END IF;

  -- Check for suppress flairs
  SELECT EXISTS(
    SELECT 1 FROM sighting_flairs sf
    JOIN flairs f ON sf.flair_id = f.id
    WHERE sf.sighting_id = p_sighting_id
      AND f.visibility_impact = 'suppress'
      AND f.is_active = true
  ) INTO v_has_suppress_flair;

  IF v_has_suppress_flair THEN
    RETURN 'suppressed';
  END IF;

  -- Default to visible
  RETURN 'visible';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================================

-- Trigger to update time-adjusted score and visibility when flairs change
CREATE OR REPLACE FUNCTION update_sighting_on_flair_change()
RETURNS TRIGGER AS $$
DECLARE
  v_sighting_id TEXT;
BEGIN
  -- Get sighting_id from either NEW or OLD depending on operation
  IF TG_OP = 'DELETE' THEN
    v_sighting_id := OLD.sighting_id;
  ELSE
    v_sighting_id := NEW.sighting_id;
  END IF;

  -- Update sighting scores and visibility
  UPDATE sightings SET
    time_adjusted_score = calculate_time_adjusted_score(v_sighting_id),
    visibility_state = update_sighting_visibility(v_sighting_id),
    flair_count = (
      SELECT COUNT(*) FROM sighting_flairs WHERE sighting_id = v_sighting_id
    ),
    primary_flair_id = (
      SELECT sf.flair_id
      FROM sighting_flairs sf
      JOIN flairs f ON sf.flair_id = f.id
      WHERE sf.sighting_id = v_sighting_id
      ORDER BY f.display_order ASC
      LIMIT 1
    ),
    last_score_update = NOW()
  WHERE id = v_sighting_id;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_sighting_on_flair_add
AFTER INSERT ON sighting_flairs
FOR EACH ROW
EXECUTE FUNCTION update_sighting_on_flair_change();

CREATE TRIGGER trigger_update_sighting_on_flair_remove
AFTER DELETE ON sighting_flairs
FOR EACH ROW
EXECUTE FUNCTION update_sighting_on_flair_change();

-- Initial calculation of time_adjusted_score for all existing sightings
UPDATE sightings SET
  time_adjusted_score = calculate_time_adjusted_score(id),
  visibility_state = 'visible',
  last_score_update = NOW();
