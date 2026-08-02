/**
 * 修复知识库向量表中来源文件名的乱码
 *
 * 问题根因：历史上传时 multer 按 latin1 解析 multipart filename，导致中文文件名被
 * 以 GBK 字节存储为乱码字符串（如 "ÉÌÆ·Ä¿Â¼Óë¹æ¸ñËµÃ÷.md"）。
 * 修复策略：以 kb_documents 表中已正确的 filename 为准，按 documentId 批量更新
 * knowledge_embeddings 的 metadata.source 字段。
 */
import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: parseInt(process.env.PG_PORT || '5432'),
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || 'postgres',
  database: process.env.PG_DATABASE || 'jisu_ai',
});

async function fixKbSourceEncoding() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. 找出所有有乱码来源的向量记录及其对应文档
    const { rows: mapping } = await client.query(`
      SELECT DISTINCT
        e.metadata->>'documentId' AS document_id,
        d.filename AS correct_filename
      FROM knowledge_embeddings e
      JOIN kb_documents d ON d.id = (e.metadata->>'documentId')::int
      WHERE e.metadata->>'source' IS DISTINCT FROM d.filename
    `);

    if (mapping.length === 0) {
      console.log('[FixKbEncoding] 没有发现需要修复的乱码来源。');
      await client.query('COMMIT');
      return;
    }

    console.log(`[FixKbEncoding] 发现 ${mapping.length} 个文档需要修复来源名：`);
    for (const m of mapping) {
      console.log(`  documentId=${m.document_id} -> ${m.correct_filename}`);
    }

    // 2. 逐文档更新 metadata.source
    let updated = 0;
    for (const m of mapping) {
      const res = await client.query(
        `UPDATE knowledge_embeddings
         SET metadata = jsonb_set(metadata, '{source}', to_jsonb($1::text))
         WHERE metadata->>'documentId' = $2`,
        [m.correct_filename, String(m.document_id)]
      );
      updated += res.rowCount;
    }
    console.log(`[FixKbEncoding] 已更新 ${updated} 条向量记录。`);

    // 3. 清理语义缓存，避免命中旧的乱码来源
    const cacheRes = await client.query('DELETE FROM cache_entries');
    console.log(`[FixKbEncoding] 已清理 ${cacheRes.rowCount} 条语义缓存。`);

    await client.query('COMMIT');
    console.log('[FixKbEncoding] 修复完成。');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

fixKbSourceEncoding().catch((err) => {
  console.error('[FixKbEncoding] 修复失败:', err);
  process.exit(1);
});
