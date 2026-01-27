-- ============================================================================
-- Initial Schema Migration
-- Creates base tables for SightSignal
-- ============================================================================

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  icon TEXT,
  description TEXT
);

-- Subcategories table
CREATE TABLE IF NOT EXISTS subcategories (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  description TEXT
);

-- Sighting types table
CREATE TABLE IF NOT EXISTS sighting_types (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  subcategory_id TEXT NOT NULL REFERENCES subcategories(id) ON DELETE CASCADE,
  tags TEXT[] NOT NULL DEFAULT '{}',
  icon TEXT
);

-- Sightings table
CREATE TABLE IF NOT EXISTS sightings (
  id TEXT PRIMARY KEY,
  type_id TEXT NOT NULL,
  category_id TEXT NOT NULL,
  location JSONB NOT NULL,
  description TEXT NOT NULL,
  details TEXT,
  importance TEXT NOT NULL CHECK (importance IN ('low', 'normal', 'high')),
  status TEXT NOT NULL CHECK (status IN ('active', 'resolved', 'archived')),
  observed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  fields JSONB NOT NULL DEFAULT '{}'::JSONB,
  reporter_id TEXT,
  upvotes INTEGER NOT NULL DEFAULT 0,
  downvotes INTEGER NOT NULL DEFAULT 0,
  confirmations INTEGER NOT NULL DEFAULT 0,
  disputes INTEGER NOT NULL DEFAULT 0,
  spam_reports INTEGER NOT NULL DEFAULT 0,
  score INTEGER NOT NULL DEFAULT 0,
  hot_score REAL NOT NULL DEFAULT 0
);

-- Geofences table
CREATE TABLE IF NOT EXISTS geofences (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  visibility TEXT NOT NULL CHECK (visibility IN ('public', 'private')),
  polygon JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  owner_id TEXT
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  target JSONB NOT NULL,
  category_ids TEXT[] NOT NULL DEFAULT '{}',
  type_ids TEXT[] NOT NULL DEFAULT '{}',
  trust_level TEXT NOT NULL CHECK (trust_level IN ('raw', 'all', 'vetted', 'trusted')),
  created_at TIMESTAMPTZ NOT NULL
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- Taxonomy indexes
CREATE INDEX IF NOT EXISTS idx_subcategories_category_id ON subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_sighting_types_category_id ON sighting_types(category_id);
CREATE INDEX IF NOT EXISTS idx_sighting_types_subcategory_id ON sighting_types(subcategory_id);

-- Sightings indexes
CREATE INDEX IF NOT EXISTS idx_sightings_status ON sightings(status);
CREATE INDEX IF NOT EXISTS idx_sightings_type_id ON sightings(type_id);
CREATE INDEX IF NOT EXISTS idx_sightings_category_id ON sightings(category_id);
CREATE INDEX IF NOT EXISTS idx_sightings_created_at ON sightings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sightings_observed_at ON sightings(observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_sightings_importance ON sightings(importance);
CREATE INDEX IF NOT EXISTS idx_sightings_score ON sightings(score DESC);
CREATE INDEX IF NOT EXISTS idx_sightings_hot_score ON sightings(hot_score DESC);
CREATE INDEX IF NOT EXISTS idx_sightings_reporter_id ON sightings(reporter_id) WHERE reporter_id IS NOT NULL;

-- Geofences indexes
CREATE INDEX IF NOT EXISTS idx_geofences_visibility ON geofences(visibility);
CREATE INDEX IF NOT EXISTS idx_geofences_owner_id ON geofences(owner_id) WHERE owner_id IS NOT NULL;

-- Subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_email ON subscriptions(email);
