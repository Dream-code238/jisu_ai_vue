-- 会话管理表 (F01 会话记忆持久化)
-- 依赖: pgcrypto 扩展 (gen_random_uuid)

CREATE TABLE IF NOT EXISTS conversations (
  id          VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  session_id  VARCHAR(64) UNIQUE NOT NULL,
  title       VARCHAR(200) NOT NULL DEFAULT '新对话',
  user_id     VARCHAR(64) DEFAULT 'anonymous',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_session ON conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user    ON conversations(user_id);
