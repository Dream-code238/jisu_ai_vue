/**
 * routes/chat.js（改造版）
 * 改造点：流式接口在发送/接收消息时写入 messages 表
 * 原有 health 和 POST / 端点保持不变
 */

import express from "express";
import {
  customerServiceChain,
  customerServiceStreamChain,
  formatHistory,
} from "../chains/basic-chat.js";
import { messageDB } from "../db/postgres.js";
import { queryCache, writeCache } from "../cache/semantic-cache.js";

const router = express.Router();

/**
 * @description 健康检查
 */

router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "chat",
    timestamp: new Date().toISOString(),
  });
});

/**
 * @description 普通对话接口
 */
router.post("/", async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message) return res.status(400).json({ error: "message 不能为空" });
    const response = await customerServiceChain.invoke({
      message,
      history: formatHistory(history),
    });
    res.json({ reply: response });
  } catch (error) {
    console.error("[Chat Error]", error.message);
    res.status(500).json({ error: "服务暂时不可用，请稍后重试" });
  }
});

/**
 * @description 流式对话接口（SSE）
 */
router.post("/stream", async (req, res) => {
  const { message, history = [], sessionId } = req.body;
  if (!message) return res.status(400).json({ error: "message 不能为空" });

  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  // ① 缓存检查
  const cached = await queryCache(message);
  if (cached.hit) {
    send({ type: "cache_hit", cached: true });
    // 逐字发送缓存答案（模拟流式）
    const words = cached.answer.split("");
    for (const word of words) {
      send({ content: word });
      await new Promise((r) => setTimeout(r, 10)); // 10ms 间隔
    }
    if (sessionId) {
      await messageDB.add(sessionId, "user", message);
      await messageDB.add(sessionId, "assistant", cached.answer);
    }
    send({ done: true });
    return res.end();
  }

  // ② 未命中，正常流式生成
  if (sessionId) {
    await messageDB.add(sessionId, "user", message);
  }

  try {
    const stream = await customerServiceStreamChain.stream({
      message,
      history: formatHistory(history),
    });

    let fullResponse = "";
    for await (const chunk of stream) {
      if (chunk) {
        fullResponse += chunk;
        send({ content: chunk });
      }
    }

    // ③ 写入缓存
    if (fullResponse) {
      await writeCache(message, fullResponse);
      if (sessionId) {
        await messageDB.add(sessionId, "assistant", fullResponse);
      }
    }

    send({ done: true });
    res.end();
  } catch (err) {
    send({ error: "回复失败，请重试" });
    res.end();
  }
});

export default router;
