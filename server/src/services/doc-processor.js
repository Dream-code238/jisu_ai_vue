/**
 * 文档处理服务
 *
 * 解析上传的文件 → 分段 → 向量化 → 入库到 knowledge_embeddings 表
 * 支持 .md / .txt / .pdf / .docx 格式
 *
 * 与 ingest.js 的区别：
 *   - ingest.js 是命令行脚本，全量清空后重新入库
 *   - doc-processor 是运行时服务，增量添加文档
 */
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { PGVectorStore } from "@langchain/community/vectorstores/pgvector";
import { Document } from "@langchain/core/documents";
import { embeddings } from "../models/embedding.js";
import { pool } from "../db/postgres.js";
import { normalizeFilename } from "../utils/filename-encoding.js";

// 文本分段器：500 字符一段，50 字符重叠
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 500,
  chunkOverlap: 50,
});

// PGVectorStore 配置（与 rag-chain.js 保持一致）
const PG_CONFIG = {
  pool,
  tableName: "knowledge_embeddings",
  columns: {
    idColumnName: "id",
    vectorColumnName: "embedding",
    contentColumnName: "content",
    metadataColumnName: "metadata",
  },
};

// 懒加载 VectorStore 实例（避免模块加载时就连接数据库）
let vectorStoreInstance = null;

async function getVectorStore() {
  if (!vectorStoreInstance) {
    vectorStoreInstance = await PGVectorStore.initialize(embeddings, PG_CONFIG);
  }
  return vectorStoreInstance;
}

/**
 * 解析文件内容为纯文本
 * @param {Object} file - multer file 对象（包含 buffer 和 originalname）
 * @returns {Promise<string>}
 */
async function parseFile(file) {
  const ext = file.originalname.split(".").pop().toLowerCase();

  switch (ext) {
    case "md":
    case "txt":
      return file.buffer.toString("utf-8");

    case "pdf": {
      const pdfParse = (await import("pdf-parse")).default;
      const data = await pdfParse(file.buffer);
      return data.text;
    }

    case "docx": {
      const mammoth = (await import("mammoth")).default;
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      return result.value;
    }

    default:
      throw new Error(`不支持的文件类型: .${ext}`);
  }
}

/**
 * 处理文档：解析 → 分段 → 向量化 → 入库
 * @param {Object} file - multer file 对象
 * @param {number} documentId - kb_documents 表记录 ID
 * @returns {Promise<{ chunkCount: number }>}
 */
export async function processDocument(file, documentId) {
  // 归一化文件名：防御中文被按 latin1/GBK 误解析导致的乱码
  const originalName = normalizeFilename(file.originalname);

  // 1. 解析文件为纯文本
  const text = await parseFile(file);

  if (!text || text.trim().length === 0) {
    throw new Error("文件内容为空");
  }

  // 2. 分段
  const chunks = await splitter.splitText(text);

  // 3. 构建 Document 对象（metadata 中存储来源和文档 ID）
  const documents = chunks.map(
    (content) =>
      new Document({
        pageContent: content,
        metadata: {
          source: originalName,
          documentId,
          uploadedAt: new Date().toISOString(),
        },
      }),
  );

  // 4. 向量化入库
  const vectorStore = await getVectorStore();
  await vectorStore.addDocuments(documents);

  return { chunkCount: chunks.length };
}

/**
 * 删除指定文档的所有向量数据
 * @param {number} documentId - kb_documents 表记录 ID
 */
export async function deleteDocumentVectors(documentId) {
  await pool.query(
    "DELETE FROM knowledge_embeddings WHERE metadata->>'documentId' = $1",
    [String(documentId)],
  );
}
