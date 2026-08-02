-- 模型调用成本追踪表 (F09 成本追踪与可观测性)

CREATE TABLE IF NOT EXISTS cost_records (
  id            SERIAL PRIMARY KEY,
  session_id    VARCHAR(64),
  node          VARCHAR(50) NOT NULL,
  model         VARCHAR(100) NOT NULL,
  input_tokens  INT DEFAULT 0,
  output_tokens INT DEFAULT 0,
  cost          DECIMAL(10,6) DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cost_session ON cost_records(session_id);
CREATE INDEX IF NOT EXISTS idx_cost_model  ON cost_records(model);
