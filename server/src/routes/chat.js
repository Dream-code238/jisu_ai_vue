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

  // 用户消息入库
  if (sessionId) {
    await messageDB.add(sessionId, "user", message);
  }

  // 设置 SSE 响应头
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  // 禁用 Nginx 缓冲
  res.setHeader("X-Accel-Buffering", "no");

  // 发送 SSE 数据的工具函数
  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  try {
    const stream = await customerServiceStreamChain.stream({
      message,
      history: formatHistory(history),
    });

    // 逐块发送给前端
    let fullResponse = "";
    for await (const chunk of stream) {
      if (chunk) {
        fullResponse += chunk;
        send({ content: chunk });
      }
    }

    // AI 回复入库
    if (sessionId && fullResponse) {
      await messageDB.add(sessionId, "assistant", fullResponse);
    }

    // 发送结束标记
    send({ done: true });
    res.end();
  } catch (error) {
    console.error("[Stream Error]", error.message);
    send({ error: "生成回复时出错，请重试" });
    res.end();
  }
});

export default router;
