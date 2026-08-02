-- 消息持久化表 (F01 会话记忆持久化)
-- 外键依赖: conversations.session_id (必须先执行 001)

CREATE TABLE IF NOT EXISTS messages (
  id          SERIAL PRIMARY KEY,
  session_id  VARCHAR(64) NOT NULL REFERENCES conversations(session_id) ON DELETE CASCADE,
  role        VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content     TEXT NOT NULL,
  metadata    JSONB DEFAULT '{}',
  token_count INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(session_id, created_at);
