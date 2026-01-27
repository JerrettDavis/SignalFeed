-- Create users table for user management
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  username TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Index for username lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username) WHERE username IS NOT NULL;

-- Index for role filtering
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Index for sorting by creation date
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
