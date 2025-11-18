-- Spaktok D1 Database Schema
-- Cloudflare D1 is SQLite-based; use simple, denormalized tables for fast edge queries

-- Users table (lightweight cache for user profiles)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  coins INTEGER DEFAULT 0,
  received_gifts INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX idx_users_username ON users(username);

-- Gifts table (lightweight cache for recent gift transactions)
CREATE TABLE IF NOT EXISTS gifts (
  id TEXT PRIMARY KEY,
  gift_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  receiver_id TEXT NOT NULL,
  context TEXT NOT NULL,
  context_id TEXT,
  price_coins INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_gifts_receiver ON gifts(receiver_id, created_at DESC);
CREATE INDEX idx_gifts_sender ON gifts(sender_id, created_at DESC);

-- Sessions table (for KV alternative or cross-region session sync)
CREATE TABLE IF NOT EXISTS sessions (
  session_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  data TEXT
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
