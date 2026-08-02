-- 安全护栏拦截日志表 (F07 安全护栏)

CREATE TABLE IF NOT EXISTS guardrail_logs (
  id            SERIAL PRIMARY KEY,
  session_id    VARCHAR(64),
  input_text    TEXT NOT NULL,
  block_reason  VARCHAR(100),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guardrail_session ON guardrail_logs(session_id);
