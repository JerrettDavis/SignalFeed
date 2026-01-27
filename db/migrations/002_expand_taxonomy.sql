-- Migration: Expand taxonomy to 3-level hierarchy with tags
-- Phase 1: Core Infrastructure

-- Create subcategories table
CREATE TABLE IF NOT EXISTS subcategories (
  id VARCHAR(255) PRIMARY KEY,
  label VARCHAR(100) NOT NULL,
  category_id VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subcategories_category ON subcategories(category_id);

-- Update categories table to add icon and description
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS icon VARCHAR(50),
  ADD COLUMN IF NOT EXISTS description TEXT;

-- Update sighting_types table to add subcategory, tags, and icon
ALTER TABLE sighting_types
  ADD COLUMN IF NOT EXISTS subcategory_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS tags TEXT[],
  ADD COLUMN IF NOT EXISTS icon VARCHAR(50);

-- Add foreign key constraint if using PostgreSQL
-- Note: Adjust based on your database engine
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_subcategories_category'
  ) THEN
    ALTER TABLE subcategories
      ADD CONSTRAINT fk_subcategories_category
      FOREIGN KEY (category_id) REFERENCES categories(id)
      ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_sighting_types_subcategory'
  ) THEN
    ALTER TABLE sighting_types
      ADD CONSTRAINT fk_sighting_types_subcategory
      FOREIGN KEY (subcategory_id) REFERENCES subcategories(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- Add comments
COMMENT ON TABLE subcategories IS '3-level taxonomy: categories → subcategories → types';
COMMENT ON COLUMN sighting_types.tags IS 'Flexible tagging for cross-category discovery';
