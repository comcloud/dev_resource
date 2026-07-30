-- Host prerequisites: users(id), public_profiles(id,user_id), social_follows,
-- social_notifications, social_moderation_events, and storage cleanup infrastructure.
-- Apply through an ordered migration with PRAGMA foreign_keys = ON.

CREATE TABLE IF NOT EXISTS social_conversations (
  id TEXT PRIMARY KEY,
  pair_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'request'
    CHECK(status IN ('request', 'active', 'readonly', 'blocked')),
  requester_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  greeting_status TEXT NOT NULL DEFAULT 'pending'
    CHECK(greeting_status IN ('pending', 'accepted', 'ignored', 'none')),
  last_message_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS social_conversation_members (
  conversation_id TEXT NOT NULL REFERENCES social_conversations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_read_at TEXT,
  deleted_at TEXT,
  muted INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS social_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES social_conversations(id) ON DELETE CASCADE,
  sender_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_kind TEXT NOT NULL CHECK(message_kind IN ('text', 'voice', 'image', 'system')),
  content TEXT NOT NULL DEFAULT '',
  media_url TEXT,
  media_storage_key TEXT,
  status TEXT NOT NULL DEFAULT 'sent' CHECK(status IN ('pending', 'sent', 'blocked', 'deleted')),
  moderation_json TEXT NOT NULL DEFAULT '{}',
  client_request_id TEXT NOT NULL,
  request_fingerprint TEXT,
  created_at TEXT NOT NULL,
  UNIQUE(sender_user_id, client_request_id)
);

CREATE TABLE IF NOT EXISTS social_message_media (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  media_kind TEXT NOT NULL CHECK (media_kind IN ('voice', 'image')),
  storage_key TEXT NOT NULL UNIQUE,
  media_url TEXT,
  review_text TEXT NOT NULL DEFAULT '',
  moderation_json TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('allowed', 'blocked')),
  used_message_id TEXT REFERENCES social_messages(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_social_members_user
  ON social_conversation_members(user_id, conversation_id);
CREATE INDEX IF NOT EXISTS idx_social_messages_conversation
  ON social_messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_message_media_user
  ON social_message_media(user_id, created_at DESC);
