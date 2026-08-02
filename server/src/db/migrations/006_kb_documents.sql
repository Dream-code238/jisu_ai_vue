-- 知识库文档管理表 (F02 知识库管理)

CREATE TABLE IF NOT EXISTS kb_documents (
  id           SERIAL PRIMARY KEY,
  filename     VARCHAR(255) NOT NULL,
  file_type    VARCHAR(20) NOT NULL,
  chunk_count  INT DEFAULT 0,
  status       VARCHAR(20) DEFAULT 'processing',
  uploaded_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kbdocs_status ON kb_documents(status);
