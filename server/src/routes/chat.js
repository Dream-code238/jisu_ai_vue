import express from "express";
import {
  customerServiceChain,
  customerServiceStreamChain,
  formatHistory,
} from "../chains/basic-chat.js";
import { messageDB } from "../db/postgres.js";
import { queryCache, writeCache } from "../cache/semantic-cache.js"; // T14 新增

const router = express.Router();

// ─── 健康检查 ────────────────────────────────────────────────────
router.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── 普通对话接口 ────────────────────────────────────────────────
router.post("/", async (req, res) => {
  const { message, history = [] } = req.body;

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "message 字段不能为空" });
  }

  try {
    const response = await customerServiceChain.invoke({
      user_input: message,
      chat_history: formatHistory(history),
      current_time: new Date().toLocaleString("zh-CN"),
    });

    res.json({ content: response });
  } catch (error) {
    console.error("[Chat Error]", error.message);
    res.status(500).json({ error: "服务暂时不可用，请稍后重试" });
  }
});

// ─── 流式对话接口（SSE）─────────────────────────────────────────
router.post("/stream", async (req, res) => {
  const { message, history = [], sessionId } = req.body;

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "message 字段不能为空" });
  }

  // 用户消息入库（如果有 sessionId）
  if (sessionId) {
    try {
      await messageDB.add(sessionId, "user", message);
    } catch (err) {
      console.error("[Message Persist Error]", err.message);
      // 入库失败不阻塞对话流程
    }
  }

  // 设置 SSE 响应头
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  const sendData = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // 语义缓存检查 — 命中则直接返回缓存答案（模拟流式逐字）
  const cached = await queryCache(message);
  if (cached.hit) {
    // 发送缓存命中标记
    sendData({ type: "cache_hit", cached: true });

    // 逐字发送缓存答案（模拟流式效果）
    const chars = cached.answer.split("");
    for (const char of chars) {
      sendData({ content: char });
      await new Promise((r) => setTimeout(r, 10)); // 10ms 间隔
    }

    // AI 回复入库（用户消息已在 SSE 头之前入库）
    if (sessionId) {
      try {
        await messageDB.add(sessionId, "assistant", cached.answer);
      } catch (err) {
        console.error("[Message Persist Error]", err.message);
      }
    }

    sendData({ done: true });
    return res.end();
  }

  // 未命中缓存 — 正常流式生成
  try {
    const stream = await customerServiceStreamChain.stream({
      user_input: message,
      chat_history: formatHistory(history),
      current_time: new Date().toLocaleString("zh-CN"),
    });

    let fullResponse = "";

    // 逐块发送给前端
    for await (const chunk of stream) {
      if (chunk) {
        fullResponse += chunk;
        sendData({ content: chunk });
      }
    }

    // 写入语义缓存
    if (fullResponse) {
      await writeCache(message, fullResponse);
    }

    //  AI 回复入库
    if (sessionId && fullResponse) {
      try {
        await messageDB.add(sessionId, "assistant", fullResponse);
      } catch (err) {
        console.error("[Message Persist Error]", err.message);
      }
    }

    // 发送结束标记
    sendData({ done: true });
    res.end();
  } catch (error) {
    console.error("[Stream Error]", error.message);
    sendData({ error: "生成回复时出错，请重试" });
    res.end();
  }
});

export default router;
