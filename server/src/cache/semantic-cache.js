/**
 * semantic-cache.js — 语义缓存层
 *
 * 基于 Embedding 余弦相似度匹配的问答缓存
 * 命中条件：相似度 ≥ 0.92 且未过期
 *
 * 数据表：cache_entries
 *   - question TEXT
 *   - answer TEXT
 *   - embedding vector(1536)（与 embedding.js 智谱 AI embedding-3 一致）
 *   - hit_count INT
 *   - expires_at TIMESTAMPTZ
 */
import { embeddings } from "../models/embedding.js";
import { pool } from "../db/postgres.js";

const SIMILARITY_THRESHOLD = 0.92;

/**
 * 查询语义缓存
 * @param {string} question - 用户问题
 * @returns {Promise<{ hit: boolean, answer?: string }>}
 */
export async function queryCache(question) {
  try {
    // 生成问题的 Embedding 向量
    const questionEmbedding = await embeddings.embedQuery(question);

    // 使用 pgvector 的余弦距离查询（<=> 操作符）
    // similarity = 1 - cosine_distance，值越大越相似
    const { rows } = await pool.query(
      `SELECT answer, 1 - (embedding <=> $1::vector) AS similarity
       FROM cache_entries
       WHERE expires_at > NOW()
       ORDER BY embedding <=> $1::vector
       LIMIT 1`,
      [`[${questionEmbedding.join(",")}]`],
    );

    if (
      rows.length > 0 &&
      parseFloat(rows[0].similarity) >= SIMILARITY_THRESHOLD
    ) {
      // 更新命中次数
      await pool.query(
        "UPDATE cache_entries SET hit_count = hit_count + 1 WHERE answer = $1",
        [rows[0].answer],
      );
      console.log(
        `[SemanticCache] HIT (similarity=${rows[0].similarity.toFixed(4)})`,
      );
      return { hit: true, answer: rows[0].answer };
    }

    return { hit: false };
  } catch (err) {
    console.error("[SemanticCache Query Error]", err.message);
    return { hit: false };
  }
}

/**
 * 写入语义缓存
 * @param {string} question - 用户问题
 * @param {string} answer - AI 回答
 */
export async function writeCache(question, answer) {
  try {
    const questionEmbedding = await embeddings.embedQuery(question);
    await pool.query(
      `INSERT INTO cache_entries (question, answer, embedding)
       VALUES ($1, $2, $3::vector)`,
      [question, answer, `[${questionEmbedding.join(",")}]`],
    );
    console.log("[SemanticCache] WRITE cached");
  } catch (err) {
    console.error("[SemanticCache Write Error]", err.message);
  }
}

/**
 * 获取缓存统计
 * @returns {Promise<{ total: number, active: number, totalHits: number }>}
 */
export async function getCacheStats() {
  try {
    const { rows } = await pool.query(
      `SELECT COUNT(*) AS total,
              COUNT(*) FILTER (WHERE expires_at > NOW()) AS active,
              COALESCE(SUM(hit_count), 0) AS total_hits
       FROM cache_entries`,
    );
    return rows[0];
  } catch (err) {
    console.error("[SemanticCache Stats Error]", err.message);
    return { total: 0, active: 0, total_hits: 0 };
  }
}
