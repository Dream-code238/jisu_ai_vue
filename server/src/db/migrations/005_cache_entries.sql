-- 需要 pgvector 扩展：CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE IF NOT EXISTS cache_entries (
  id          SERIAL PRIMARY KEY,
  question    TEXT NOT NULL,
  answer      TEXT NOT NULL,
  embedding   vector(1536),  -- 智谱 AI embedding-3 维度，与 embedding.js 一致
  hit_count   INT DEFAULT 0,
  expires_at  TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cache_expires ON cache_entries(expires_at);