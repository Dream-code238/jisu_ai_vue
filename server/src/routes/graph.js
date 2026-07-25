/**
 * routes/graph.js（改造版）
 * 改造点：stream 调用时传入 configurable.thread_id
 */

import express from "express";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { buildCustomerGraph } from "../graphs/customer-graph.js";
import { messageDB } from "../db/postgres.js";
import { randomUUID } from "crypto";

const router = express.Router();

// 单例：避免每次请求都重新编译图
let graphInstance = null;

router.post("/stream", async (req, res) => {
  const { message, history = [], sessionId } = req.body;

  if (!message) return res.status(400).json({ error: "message 不能为空" });

  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  const send = (type, data) =>
    res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);

  try {
    // 懒加载图（checkpointer 需要异步初始化）
    if (!graphInstance) {
      graphInstance = await buildCustomerGraph();
    }

    // 构建 thread_id（= session_id），用于 checkpoint 标识
    const threadId = sessionId || randomUUID();

    // 把历史消息转成 LangChain Message 格式
    const historyMessages = history.map((m) =>
      m.role === "user"
        ? new HumanMessage(m.content)
        : new HumanMessage(m.content),
    );

    // 流式执行图，每个节点执行完毕后触发一次事件
    const stream = await graphInstance.stream(
      {
        userInput: message,
        messages: [...historyMessages, new HumanMessage(message)],
      },
      {
        streamMode: "updates",
        // 关键：checkpoint 标识
        configurable: { thread_id: threadId },
      },
    );

    // 消息入库
    if (sessionId) {
      await messageDB.add(sessionId, "user", message);
    }

    for await (const chunk of stream) {
      const nodeName = Object.keys(chunk)[0];
      const nodeOutput = chunk[nodeName];

      // 推送节点执行事件
      if (nodeName === "intentRouter" && nodeOutput?.intent) {
        send("node", { node: nodeName, intent: nodeOutput.intent });
      }

      // 推送订单步骤
      else if (nodeOutput?.orderResult?.steps) {
        send("steps", { steps: nodeOutput.orderResult.steps });
      }

      // 推送最终答案
      else if (nodeOutput?.finalAnswer) {
        send("answer", { content: nodeOutput.finalAnswer });
        if (sessionId) {
          await messageDB.add(sessionId, "assistant", nodeOutput.finalAnswer);
        }
      } else if (nodeOutput?.orderResult?.answer) {
        send("answer", { content: nodeOutput.orderResult.answer });
        if (sessionId) {
          await messageDB.add(
            sessionId,
            "assistant",
            nodeOutput.orderResult.answer,
          );
        }
      } else if (nodeOutput?.ragResult) {
        send("answer", { content: nodeOutput.ragResult });
        if (sessionId) {
          await messageDB.add(sessionId, "assistant", nodeOutput.ragResult);
        }
      }
    }

    send("done", {});
    res.end();
  } catch (err) {
    console.error("[Graph Error]", err.message);
    send("error", { content: "处理请求时出错，请重试" });
    res.end();
  }
});

export default router;
