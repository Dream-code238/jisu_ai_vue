import express from "express";
import {
  ragChainWithSources,
  retrieveWithRerank,
  formatDocs,
  extractSources,
  ragStreamChain,
} from "../chains/rag-chain.js";
import { queryCache, writeCache } from "../cache/semantic-cache.js";

const router = express.Router();

// ─── 原有端点：一次性返回完整答案 ────────────────────────────────
router.post("/query", async (req, res) => {
  const { question } = req.body;

  if (!question) return res.status(400).json({ error: "question 不能为空" });

  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  const send = (type, data) =>
    res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);

  try {
    const result = await ragChainWithSources.invoke({ question });

    if (result.sources?.length) {
      send("sources", { sources: result.sources });
    }

    send("answer", { content: result.answer });
    send("done", {});
    res.end();
  } catch (err) {
    console.error("[RAG Error]", err.message);
    send("error", { content: "查询出错，请重试" });
    res.end();
  }
});

// ─── 双阶段流式端点 ────────────────────────────────────────
// 阶段 1: 检索 → 立即发送 sources
// 阶段 2: 流式生成 → 逐块发送 answer chunk
router.post("/stream", async (req, res) => {
  const { question } = req.body;

  if (!question) return res.status(400).json({ error: "question 不能为空" });

  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  const send = (type, data) =>
    res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);

  try {
    // T14: 语义缓存检查（缓存答案 + 来源）
    const cached = await queryCache(question);
    if (cached.hit) {
      let cachedData;
      try {
        cachedData = JSON.parse(cached.answer);
      } catch {
        cachedData = { answer: cached.answer, sources: [] };
      }

      send("cache_hit", { cached: true });

      if (cachedData.sources?.length) {
        send("sources", { sources: cachedData.sources });
      }

      // 模拟流式输出缓存答案
      const chars = cachedData.answer.split("");
      for (const char of chars) {
        res.write(`data: ${JSON.stringify({ content: char })}\n\n`);
        await new Promise((r) => setTimeout(r, 10));
      }

      send("done", {});
      res.end();
      return;
    }

    // 两阶段检索 — 粗检索 top-10 → LLM 重排序 → top-3
    const docs = await retrieveWithRerank(question, 3);

    // 立即发送来源信息（前端可先展示来源卡片）
    if (docs.length > 0) {
      send("sources", { sources: extractSources(docs) });
    }

    // 阶段 2: 流式生成回答
    const context = formatDocs(docs);
    const stream = await ragStreamChain.stream({ context, question });

    let fullAnswer = "";
    for await (const chunk of stream) {
      if (chunk) {
        fullAnswer += chunk;
        // 注意：使用 { content: chunk } 格式（无 type 字段）
        // useSSEStream 的 default 分支会追加到 streamText
        res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
      }
    }

    // 写入缓存（答案 + 来源）
    if (fullAnswer) {
      await writeCache(
        question,
        JSON.stringify({
          answer: fullAnswer,
          sources: extractSources(docs),
        }),
      );
    }

    send("done", {});
    res.end();
  } catch (err) {
    console.error("[RAG Stream Error]", err.message);
    send("error", { content: "查询出错，请重试" });
    res.end();
  }
});

export default router;
