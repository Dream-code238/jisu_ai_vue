import {
  RunnableSequence,
  RunnablePassthrough,
} from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { PGVectorStore } from "@langchain/community/vectorstores/pgvector";
import { createModel } from "../models/deepseek.js";
import { embeddings } from "../models/embedding.js";
import { pool } from "../db/postgres.js";
import { rerankDocuments } from "./reranker.js";

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

// 初始化 VectorStore（模块加载时执行一次）
const vectorStore = await PGVectorStore.initialize(embeddings, PG_CONFIG);

// 标准检索器（k=4，供原有端点兼容使用）
export const retriever = vectorStore.asRetriever({ k: 4 });

// 粗检索器（k=10，第一阶段检索）
const coarseRetriever = vectorStore.asRetriever({ k: 10 });

/**
 * 两阶段检索 — 粗检索 + LLM 重排序
 * 第一阶段：向量相似度检索 top-10
 * 第二阶段：LLM 重排序取 top-4
 * @param {string} question
 * @param {number} topK - 最终返回数量，默认 4
 * @returns {Promise<Array>} 重排序后的文档数组
 */
export async function retrieveWithRerank(question, topK = 4) {
  const docs = await coarseRetriever.invoke(question);
  return await rerankDocuments(question, docs, topK);
}

// T10: 导出 ragPrompt 供 /stream 端点使用
export const ragPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `你是极速购电商平台的专业客服助手小购。

请根据以下知识库内容回答用户的问题。
如果知识库中没有相关内容，请如实告知用户，不要编造信息。
回答语气友好，称呼用户为"亲"，回复简洁清晰。

知识库内容：
{context}`,
  ],
  ["human", "{question}"],
]);

// T10: 导出 formatDocs 供 /stream 端点使用
export const formatDocs = (docs) =>
  docs.map((doc) => doc.pageContent).join("\n\n---\n\n");

// 从 chunk 内容中提取最有意义的 Markdown 标题作为章节标签
function extractSectionTitle(content = "") {
  const lines = content
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const headings = [];

  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      headings.push({
        level: match[1].length,
        title: match[2].trim(),
      });
    }
  }

  if (headings.length === 0) {
    const preview = content.replace(/\s+/g, " ").trim();
    return preview.length > 10
      ? preview.slice(0, 10) + "..."
      : preview || "相关片段";
  }

  // 如果只有一个标题，直接用它
  if (headings.length === 1) return headings[0].title;

  // 优先使用二级或三级标题（比文档标题更具体的章节）
  const specific = headings.find((h) => h.level >= 2 && h.level <= 3);
  if (specific) return specific.title;

  return headings[0].title;
}

// 导出提取来源信息的工具函数
export const extractSources = (docs) =>
  docs.map((doc, idx) => ({
    content: doc.pageContent.slice(0, 120) + "...",
    source: doc.metadata.source || "未知文档",
    section: extractSectionTitle(doc.pageContent),
    page: doc.metadata.page,
    score: doc.metadata.score ?? 1 - idx * 0.05, // 降序默认分数
  }));

const model = createModel({ temperature: 0 });

// 流式模型（用于 /stream 端点的逐字输出）
export const streamingRagModel = createModel({
  temperature: 0,
  streaming: true,
});

// 流式 RAG Chain（prompt → streamingModel → parser）
export const ragStreamChain = ragPrompt
  .pipe(streamingRagModel)
  .pipe(new StringOutputParser());

// 标准 RAG Chain（原有，使用 k=4 直接检索）
export const ragChain = RunnableSequence.from([
  {
    context: (input) => retriever.pipe(formatDocs).invoke(input.question),
    question: (input) => input.question,
  },
  ragPrompt,
  model,
  new StringOutputParser(),
]);

// 重排序 RAG Chain（使用两阶段检索）
export const ragChainWithRerank = RunnableSequence.from([
  {
    context: async (input) => {
      const docs = await retrieveWithRerank(input.question);
      return formatDocs(docs);
    },
    question: (input) => input.question,
  },
  ragPrompt,
  model,
  new StringOutputParser(),
]);

// 带来源信息的 RAG Chain
export const ragChainWithSources = RunnableSequence.from([
  RunnablePassthrough.assign({
    docs: (input) => retriever.invoke(input.question),
  }),
  {
    answer: RunnableSequence.from([
      (input) => ({
        context: formatDocs(input.docs),
        question: input.question,
      }),
      ragPrompt,
      model,
      new StringOutputParser(),
    ]),
    sources: (input) => extractSources(input.docs),
  },
]);

// 重排序 + 来源信息的 RAG Chain（供 Graph 的 ragNode 使用）
export const ragChainWithSourcesAndRerank = RunnableSequence.from([
  RunnablePassthrough.assign({
    docs: async (input) => retrieveWithRerank(input.question, 4),
  }),
  {
    answer: RunnableSequence.from([
      (input) => ({
        context: formatDocs(input.docs),
        question: input.question,
      }),
      ragPrompt,
      model,
      new StringOutputParser(),
    ]),
    sources: (input) => extractSources(input.docs),
  },
]);
