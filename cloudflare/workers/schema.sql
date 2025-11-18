-- Spaktok D1 Database Schema - Ultra-Low-Cost Architecture
-- Cloudflare D1: $0.75/GB storage, reads/writes FREE (included in Workers)
-- Replaces 90% of Firestore usage

-- Users table (profiles, coins, stats)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  coins INTEGER DEFAULT 0,
  received_gifts INTEGER DEFAULT 0,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  videos_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- Videos table (metadata only, files in R2/Stream)
CREATE TABLE IF NOT EXISTS videos (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  stream_uid TEXT, -- Cloudflare Stream UID
  title TEXT,
  description TEXT,
  captions TEXT, -- JSON array
  thumbnail_url TEXT,
  duration INTEGER,
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  metadata TEXT, -- JSON
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_videos_user ON videos(user_id, created_at DESC);
CREATE INDEX idx_videos_created_at ON videos(created_at DESC);
CREATE INDEX idx_videos_views ON videos(views_count DESC);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  video_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  parent_id TEXT, -- for replies
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (video_id) REFERENCES videos(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_comments_video ON comments(video_id, created_at DESC);
CREATE INDEX idx_comments_user ON comments(user_id, created_at DESC);

-- Likes table
CREATE TABLE IF NOT EXISTS likes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  target_type TEXT NOT NULL, -- 'video', 'comment', 'story'
  target_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE UNIQUE INDEX idx_likes_unique ON likes(user_id, target_type, target_id);
CREATE INDEX idx_likes_target ON likes(target_type, target_id);

-- Follows table
CREATE TABLE IF NOT EXISTS follows (
  id TEXT PRIMARY KEY,
  follower_id TEXT NOT NULL,
  following_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (follower_id) REFERENCES users(id),
  FOREIGN KEY (following_id) REFERENCES users(id)
);

CREATE UNIQUE INDEX idx_follows_unique ON follows(follower_id, following_id);
CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);

-- Chat messages (replaces Firestore chat)
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  chat_room_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  type TEXT NOT NULL,
  text TEXT,
  media_url TEXT,
  timestamp INTEGER NOT NULL,
  status TEXT DEFAULT 'sent',
  is_ephemeral INTEGER DEFAULT 0
);

CREATE INDEX idx_messages_room_time ON messages(chat_room_id, timestamp DESC);

-- AR tables
CREATE TABLE IF NOT EXISTS ar_objects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  object_url TEXT NOT NULL,
  transform TEXT,
  metadata TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS ar_experiences (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT,
  description TEXT,
  object_urls TEXT,
  thumbnail_url TEXT,
  settings TEXT,
  usage_count INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS ar_recordings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  placed_objects TEXT,
  duration INTEGER,
  created_at INTEGER NOT NULL
);

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
