/**
 * routes/rag.js（改造版）
 * 新增 /stream 端点：双阶段 SSE（sources 先行 + answer 逐字）
 * 原有 /query 端点保留不变
 */

import express from "express";
import { ragChainWithSources } from "../chains/rag-chain.js";
import { streamingModel } from "../models/deepseek.js";
import { ragPrompt, formatDocs, getRetriever } from "../chains/rag-chain.js";

const router = express.Router();

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

    // 先推送引用来源
    if (result.sources?.length) {
      send("sources", { sources: result.sources });
    }

    // 再推送回答
    send("answer", { content: result.answer });
    send("done", {});
    res.end();
  } catch (err) {
    console.error("[RAG Error]", err.message);
    send("error", { content: "查询出错，请重试" });
    res.end();
  }
});

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
    const retriever = await getRetriever();

    // 阶段 1：同步检索，立即发送 sources
    const docs = await retriever.invoke(question);
    const sources = docs.map((doc, i) => ({
      index: i + 1,
      content: doc.pageContent.slice(0, 100) + "...",
      source: doc.metadata.source,
      score: doc.metadata.score || null,
    }));
    send("sources", { sources });

    // 阶段 2：流式生成回答
    const context = formatDocs(docs);
    const stream = await ragPrompt
      .pipe(streamingModel)
      .stream({ context, question });

    for await (const chunk of stream) {
      if (chunk) send("chunk", { content: chunk });
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
