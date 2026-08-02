-- 语义缓存表 (F06 语义缓存)
-- 依赖: vector 扩展 (vector 类型)

CREATE TABLE IF NOT EXISTS cache_entries (
  id          SERIAL PRIMARY KEY,
  question    TEXT NOT NULL,
  answer      TEXT NOT NULL,
  embedding   vector(1024),  -- 智谱 AI embedding-3 维度（自定义 Embeddings，默认 1024）
  hit_count   INT DEFAULT 0,
  expires_at  TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cache_expires ON cache_entries(expires_at);
