/**
 * 语义缓存 — 基于 Embedding 余弦相似度匹配
 * 命中条件：相似度 ≥ 0.92 且未过期
 */
import { embeddings } from "../models/embedding.js";
import { pool } from "../db/postgres.js";

const SIMILARITY_THRESHOLD = 0.92;

/**
 * 查询缓存
 * @param {string} question - 用户问题
 * @returns {Promise<{ hit: boolean, answer?: string }>}
 */
export async function queryCache(question) {
  try {
    const questionEmbedding = await embeddings.embedQuery(question);
    // 使用 pgvector 的余弦距离查询
    const { rows } = await pool.query(
      `SELECT answer, 1 - (embedding <=> $1) as similarity
       FROM cache_entries
       WHERE expires_at > NOW()
       ORDER BY embedding <=> $1
       LIMIT 1`,
      [`[${questionEmbedding.join(",")}]`],
    );

    if (rows.length > 0 && rows[0].similarity >= SIMILARITY_THRESHOLD) {
      // 更新命中次数
      await pool.query(
        "UPDATE cache_entries SET hit_count = hit_count + 1 WHERE answer = $1",
        [rows[0].answer],
      );
      return { hit: true, answer: rows[0].answer };
    }

    return { hit: false };
  } catch (err) {
    console.error("[Cache Query Error]", err.message);
    return { hit: false };
  }
}

/**
 * 写入缓存
 * @param {string} question - 用户问题
 * @param {string} answer - AI 回答
 */
export async function writeCache(question, answer) {
  try {
    const questionEmbedding = await embeddings.embedQuery(question);
    await pool.query(
      `INSERT INTO cache_entries (question, answer, embedding)
       VALUES ($1, $2, $3)`,
      [question, answer, `[${questionEmbedding.join(",")}]`],
    );
  } catch (err) {
    console.error("[Cache Write Error]", err.message);
  }
}
