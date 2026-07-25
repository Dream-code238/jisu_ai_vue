/**
 * rag-chain.js（改造版）
 * 改造点：导出 getRetriever / ragPrompt / formatDocs 供 /stream 端点使用
 * 原有 ragChain / ragChainWithSources 保留不变
 */
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { PGVectorStore } from "@langchain/community/vectorstores/pgvector";
import { embeddings } from "../models/embedding.js";
import { model } from "../models/deepseek.js";
import { pool } from "../db/postgres.js";
import { StringOutputParser } from "@langchain/core/output_parsers";

// Prompt 模板（导出供 /stream 使用）
export const ragPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `你是极速购 AI 客服助手。根据以下检索到的知识库内容回答用户问题。
如果知识库中没有相关信息，请诚实告知用户，不要编造信息。
回答控制在 150 字以内。

知识库内容：
{context}`,
  ],
  ["human", "{question}"],
]);

let vectorStoreInstance = null;

/**
 * 获取 PGVectorStore 实例（懒加载）
 */
export async function getVectorStore() {
  if (!vectorStoreInstance) {
    vectorStoreInstance = await PGVectorStore.initialize(embeddings, {
      pool,
      tableName: "knowledge_embeddings",
      columns: [
        { name: "id", type: "serial", primaryKey: true },
        { name: "content", type: "text" },
        { name: "embedding", type: "vector(1536)" },
        { name: "metadata", type: "jsonb" },
      ],
    });
  }
  return vectorStoreInstance;
}

/**
 * 获取 retriever（Top-K=4）
 */
export async function getRetriever() {
  const store = await getVectorStore();
  return store.asRetriever({ k: 4 });
}

/**
 * 格式化检索文档
 */
export function formatDocs(docs) {
  return docs.map((d) => d.pageContent).join("\n\n---\n\n");
}

// 原有 chain（保留不变）
export const ragChain = ragPrompt.pipe(model).pipe(new StringOutputParser());

// 带来源的 chain（保留不变）
export const ragChainWithSources = ragPrompt
  .pipe(model)
  .pipe(new StringOutputParser())
  .pipe(
    // 简化版：先检索再生成
    async (input) => {
      const retriever = await getRetriever();
      const docs = await retriever.invoke(input.question);
      const context = formatDocs(docs);
      const answer = await ragPrompt
        .pipe(model)
        .pipe(new StringOutputParser())
        .invoke({
          context,
          question: input.question,
        });
      return {
        answer,
        sources: docs.map((d, i) => ({
          index: i + 1,
          source: d.metadata.source,
          content: d.pageContent.slice(0, 100) + "...",
        })),
      };
    },
  );
