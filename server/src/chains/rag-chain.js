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

// 1. 初始化向量检索器
const vectorStore = await PGVectorStore.initialize(embeddings, {
  pool,
  tableName: "knowledge_embeddings",
  columns: {
    idColumnName: "id",
    vectorColumnName: "embedding",
    contentColumnName: "content",
    metadataColumnName: "metadata",
  },
});

// 每次检索返回最相似的 4 个片段
const retriever = vectorStore.asRetriever({ k: 4 });

// 2. RAG Prompt
// {context} 是检索到的相关文档内容
// {question} 是用户问题
const ragPrompt = ChatPromptTemplate.fromMessages([
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

// 3. 把检索到的文档列表格式化成字符串
const formatDocs = (docs) =>
  docs.map((doc) => doc.pageContent).join("\n\n---\n\n");

// 4. 组装 RAG Chain
// RunnablePassthrough 把输入原封不动传递给下一步
// question 字段直接传给 Prompt，同时也传给 retriever
export const ragChain = RunnableSequence.from([
  {
    context: retriever.pipe(formatDocs),
    question: new RunnablePassthrough(),
  },
  ragPrompt,
  createModel({ temperature: 0 }),
  new StringOutputParser(),
]);

// 带来源信息的版本，返回检索到的文档片段，便于前端展示引用来源
export const ragChainWithSources = RunnableSequence.from([
  RunnablePassthrough.assign({
    docs: retriever,
  }),
  {
    answer: RunnableSequence.from([
      (input) => ({
        context: formatDocs(input.docs),
        question: input.question,
      }),
      ragPrompt,
      createModel({ temperature: 0 }),
      new StringOutputParser(),
    ]),
    sources: (input) =>
      input.docs.map((doc) => ({
        content: doc.pageContent.slice(0, 100) + "...",
        source: doc.metadata.source,
      })),
  },
]);
