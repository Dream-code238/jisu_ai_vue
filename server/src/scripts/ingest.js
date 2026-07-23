import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { PGVectorStore } from "@langchain/community/vectorstores/pgvector";
import { Document } from "@langchain/core/documents";
import { embeddings } from "../models/embedding.js";
import { pool } from "../db/postgres.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// 1. 加载文档
const loadDocs = () => {
  const files = ["products.md", "policies.md"];
  return files.map((file) => {
    const content = readFileSync(
      join(__dirname, "../data/knowledge", file),
      "utf-8",
    );
    return new Document({
      pageContent: content,
      metadata: { source: file },
    });
  });
};

// 2. 切分文档
// chunkSize：每个切片的最大字符数
// chunkOverlap：相邻切片的重叠字符数，保证语义不在切割处断裂
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 500,
  chunkOverlap: 50,
});

// 3. 向量化并存入 pgvector
const ingest = async () => {
  console.log("开始处理文档...");

  const docs = loadDocs();
  const chunks = await splitter.splitDocuments(docs);
  console.log(`文档切分完成，共 ${chunks.length} 个片段`);

  const vectorStore = await PGVectorStore.fromDocuments(chunks, embeddings, {
    pool,
    tableName: "knowledge_embeddings",
    columns: {
      idColumnName: "id",
      vectorColumnName: "embedding",
      contentColumnName: "content",
      metadataColumnName: "metadata",
    },
  });

  console.log("文档入库完成");
  await pool.end();
};

ingest().catch(console.error);
