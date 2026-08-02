/**
 * RAG 两阶段检索
 *
 * 工作原理：
 *   1. 第一阶段（粗检索）：向量相似度检索 top-N 文档（在 rag-chain.js 中完成）
 *   2. 第二阶段（精排序）：LLM 对每个文档评分，按分数排序取 top-K
 *
 * 重排序比纯向量检索更准确，因为 LLM 能理解语义关联性，
 * 而向量相似度可能匹配到关键词相似但语义不同的文档。
 */
import { createModel } from "../models/deepseek.js";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

// 重排序 prompt — LLM 对每个候选文档打分
const rerankPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `你是文档相关性评分员。给定用户问题和候选文档列表，为每个文档的相关性打分（0-10 分）。
10 分表示完全相关，能直接回答用户问题；0 分表示完全不相关。

返回 JSON 数组，格式如下（按分数从高到低排序）：
[{"index": 1, "score": 9}, {"index": 2, "score": 5}, ...]

只返回 JSON 数组，不要有任何其他内容。`,
  ],
  [
    "human",
    `用户问题：{question}

候选文档：
{documents}`,
  ],
]);

const rerankChain = rerankPrompt
  .pipe(createModel({ temperature: 0 }))
  .pipe(new StringOutputParser());

/**
 * LLM 重排序
 * @param {string} question       - 用户问题
 * @param {Array}  docs           - 粗检索返回的文档数组
 * @param {number} topK           - 最终返回的文档数量
 * @returns {Promise<Array>}      - 重排序后的 top-K 文档数组
 */
export async function rerankDocuments(question, docs, topK = 4) {
  // 如果文档数量不大于 topK，无需重排序
  if (!docs || docs.length <= topK) {
    return (docs || []).map((doc, idx) => {
      doc.metadata = { ...doc.metadata, score: 0.9 - idx * 0.05 };
      return doc;
    });
  }

  // 构建候选文档列表（截取前 200 字避免 prompt 过长）
  const docText = docs
    .map((doc, i) => `[${i + 1}] ${doc.pageContent.slice(0, 200)}`)
    .join("\n\n");

  try {
    const raw = await rerankChain.invoke({ question, documents: docText });
    const scores = JSON.parse(raw.trim());

    if (!Array.isArray(scores)) {
      throw new Error("Invalid rerank response format");
    }

    // 按分数降序排序，取 topK
    const sorted = scores
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, topK);

    // 映射回原始文档（index 是 1-based），并附加重排序分数
    const reranked = sorted
      .map((s) => {
        const doc = docs[s.index - 1];
        if (!doc) return null;
        doc.metadata = {
          ...doc.metadata,
          score: (s.score ?? 0) / 10, // 归一化到 0-1
        };
        return doc;
      })
      .filter(Boolean);

    console.log(
      `[reranker] Reranked ${docs.length} → ${reranked.length} docs for "${question.slice(0, 30)}..."`,
    );

    // 如果重排序结果为空（解析异常），回退到原始前 topK
    return reranked.length > 0 ? reranked : docs.slice(0, topK);
  } catch (err) {
    console.error(
      "[reranker] Failed, falling back to original order:",
      err.message,
    );
    // LLM 评分失败 — 回退到原始向量检索顺序的前 topK，并附默认分数
    return docs.slice(0, topK).map((doc, idx) => {
      doc.metadata = { ...doc.metadata, score: 0.85 - idx * 0.05 };
      return doc;
    });
  }
}
