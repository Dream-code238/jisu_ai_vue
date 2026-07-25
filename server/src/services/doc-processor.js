/**
 * 文档处理服务 — 解析 + 分段 + 向量化入库
 * 支持 .md / .txt / .pdf / .docx
 */
import { readFileSync } from "fs";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { PGVectorStore } from "@langchain/community/vectorstores/pgvector";
import { embeddings } from "../models/embedding.js";
import { pool } from "../db/postgres.js";

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 500,
  chunkOverlap: 50,
});

/**
 * 解析文件内容为纯文本
 * @param {Object} file - multer file 对象
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
  // 1. 解析文件
  const text = await parseFile(file);

  // 2. 分段
  const chunks = await splitter.splitText(text);

  // 3. 向量化入库到 PGVectorStore
  const vectorStore = await PGVectorStore.initialize(embeddings, {
    pool,
    tableName: "knowledge_embeddings",
    columns: [
      { name: "id", type: "serial", primaryKey: true },
      { name: "content", type: "text" },
      { name: "embedding", type: "vector(1536)" },
      { name: "metadata", type: "jsonb" },
      { name: "document_id", type: "integer" },
    ],
  });

  await vectorStore.addDocuments(
    chunks.map((content) => ({
      pageContent: content,
      metadata: {
        source: file.originalname,
        documentId,
        uploadedAt: new Date().toISOString(),
      },
    })),
  );

  return { chunkCount: chunks.length };
}
