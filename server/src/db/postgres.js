import pg from "pg";
import "dotenv/config";

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.PG_HOST || "localhost",
  port: parseInt(process.env.PG_PORT || "5432"),
  user: process.env.PG_USER || "postgres",
  password: process.env.PG_PASSWORD || "postgres",
  database: process.env.PG_DATABASE || "langchain_course",
});

// ─── 会话 CRUD ───
export const conversationDB = {
  async create(sessionId, title = "新对话", userId = "anonymous") {
    const { rows } = await pool.query(
      "INSERT INTO conversations (session_id, title, user_id) VALUES ($1, $2, $3) RETURNING *",
      [sessionId, title, userId],
    );
    return rows[0];
  },
  async list(userId = "anonymous") {
    const { rows } = await pool.query(
      "SELECT * FROM conversations WHERE user_id = $1 ORDER BY created_at DESC",
      [userId],
    );
    return rows;
  },
  async getBySession(sessionId) {
    const { rows } = await pool.query(
      "SELECT * FROM conversations WHERE session_id = $1",
      [sessionId],
    );
    return rows[0];
  },
  async updateTitle(sessionId, title) {
    await pool.query(
      "UPDATE conversations SET title = $1 WHERE session_id = $2",
      [title, sessionId],
    );
  },
  async delete(sessionId) {
    await pool.query("DELETE FROM conversations WHERE session_id = $1", [
      sessionId,
    ]);
  },
};

// ─── 消息 CRUD ───
export const messageDB = {
  async add(sessionId, role, content, metadata = {}, tokenCount = 0) {
    const { rows } = await pool.query(
      "INSERT INTO messages (session_id, role, content, metadata, token_count) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [sessionId, role, content, JSON.stringify(metadata), tokenCount],
    );
    return rows[0];
  },
  async getBySession(sessionId, limit = 50) {
    const { rows } = await pool.query(
      "SELECT * FROM messages WHERE session_id = $1 ORDER BY created_at ASC LIMIT $2",
      [sessionId, limit],
    );
    return rows;
  },
  async countBySession(sessionId) {
    const { rows } = await pool.query(
      "SELECT COUNT(*) as count FROM messages WHERE session_id = $1",
      [sessionId],
    );
    return parseInt(rows[0].count);
  },
};

// ─── 成本记录 ───
export const costDB = {
  async add(sessionId, node, model, inputTokens, outputTokens, cost) {
    await pool.query(
      "INSERT INTO cost_records (session_id, node, model, input_tokens, output_tokens, cost) VALUES ($1, $2, $3, $4, $5, $6)",
      [sessionId, node, model, inputTokens, outputTokens, cost],
    );
  },
  async getStats(days = 7) {
    const { rows } = await pool.query(
      `SELECT model, SUM(input_tokens) as input_sum, SUM(output_tokens) as output_sum,
              SUM(cost) as total_cost, COUNT(*) as call_count
       FROM cost_records WHERE created_at >= NOW() - INTERVAL '${days} days'
       GROUP BY model ORDER BY total_cost DESC`,
    );
    return rows;
  },
};

// ─── 知识库文档 ───
export const kbDocumentDB = {
  async add(filename, fileType, chunkCount = 0, status = "processing") {
    const { rows } = await pool.query(
      "INSERT INTO kb_documents (filename, file_type, chunk_count, status) VALUES ($1, $2, $3, $4) RETURNING *",
      [filename, fileType, chunkCount, status],
    );
    return rows[0];
  },
  async list() {
    const { rows } = await pool.query(
      "SELECT * FROM kb_documents ORDER BY uploaded_at DESC",
    );
    return rows;
  },
  async updateStatus(id, status, chunkCount = null) {
    if (chunkCount !== null) {
      await pool.query(
        "UPDATE kb_documents SET status = $1, chunk_count = $2 WHERE id = $3",
        [status, chunkCount, id],
      );
    } else {
      await pool.query("UPDATE kb_documents SET status = $1 WHERE id = $2", [
        status,
        id,
      ]);
    }
  },
  async delete(id) {
    await pool.query("DELETE FROM kb_documents WHERE id = $1", [id]);
  },
  async getStats() {
    const { rows } = await pool.query(
      "SELECT COUNT(*) as total, SUM(chunk_count) as chunks, COUNT(*) FILTER (WHERE status = 'ready') as ready FROM kb_documents",
    );
    return rows[0];
  },
};

// ─── 安全护栏日志 ───
export const guardrailDB = {
  async add(sessionId, inputText, blockReason) {
    await pool.query(
      "INSERT INTO guardrail_logs (session_id, input_text, block_reason) VALUES ($1, $2, $3)",
      [sessionId, inputText, blockReason],
    );
  },
  async getRecent(limit = 20) {
    const { rows } = await pool.query(
      "SELECT * FROM guardrail_logs ORDER BY created_at DESC LIMIT $1",
      [limit],
    );
    return rows;
  },
};
