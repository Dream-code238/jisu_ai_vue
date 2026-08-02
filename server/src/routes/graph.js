import express from "express";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { Command } from "@langchain/langgraph";
import { buildCustomerGraph } from "../graphs/customer-graph.js";
import { messageDB } from "../db/postgres.js";
import { randomUUID } from "crypto";

const router = express.Router();

// 懒加载图实例（checkpointer 需要异步初始化）
let graphInstance = null;

const getGraph = async () => {
  if (!graphInstance) {
    graphInstance = await buildCustomerGraph();
  }
  return graphInstance;
};

// SSE 响应头设置
const setSSEHeaders = (res) => {
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
};

// ─── 图流式对话 ──────────────────────────────────────────────────
router.post("/stream", async (req, res) => {
  const { message, history = [], sessionId } = req.body;

  if (!message) return res.status(400).json({ error: "message 不能为空" });

  setSSEHeaders(res);

  const send = (type, data) =>
    res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);

  try {
    const g = await getGraph();

    // 构建 thread_id（= session_id），用于 checkpoint 标识
    const threadId = sessionId || randomUUID();

    const historyMessages = history.map((m) =>
      m.role === "user"
        ? new HumanMessage(m.content)
        : new AIMessage(m.content),
    );

    // 用户消息入库
    if (sessionId) {
      try {
        await messageDB.add(sessionId, "user", message);
      } catch (err) {
        console.error("[Graph Message Persist Error]", err.message);
      }
    }

    const stream = await g.stream(
      {
        userInput: message,
        messages: [...historyMessages, new HumanMessage(message)],
      },
      {
        streamMode: "updates",
        configurable: { thread_id: threadId },
      },
    );

    let assistantResponse = "";

    for await (const update of stream) {
      const [nodeName, nodeState] = Object.entries(update)[0];

      send("node", {
        node: nodeName,
        intent: nodeState.intent || null,
        intents: nodeState.intents || null, // 多意图数组
      });

      // 安全护栏拦截事件
      if (nodeState.guardrailBlocked) {
        send("block", { reason: "内容安全检查未通过" });
      }

      if (nodeState.orderResult?.steps?.length) {
        send("steps", { steps: nodeState.orderResult.steps });
      }

      // 转发 RAG 参考来源
      if (nodeState.ragSources?.length) {
        send("sources", { sources: nodeState.ragSources });
      }

      if (nodeState.finalAnswer) {
        assistantResponse = nodeState.finalAnswer;
        send("answer", { content: nodeState.finalAnswer });
      } else if (nodeState.orderResult?.answer) {
        assistantResponse = nodeState.orderResult.answer;
        send("answer", { content: nodeState.orderResult.answer });
      } else if (nodeState.ragResult) {
        assistantResponse = nodeState.ragResult;
        send("answer", { content: nodeState.ragResult });
      }
    }

    // 检查图是否被中断（HITL 等待审批）
    const state = await g.getState({ configurable: { thread_id: threadId } });
    const tasks = state?.tasks || [];
    const hasInterrupt = tasks.some((t) => t.interrupts?.length > 0);

    if (hasInterrupt) {
      // 图被中断 — 发送 interrupt 事件，不发送 done
      const interruptTask = tasks.find((t) => t.interrupts?.length > 0);
      const interruptInfo = interruptTask.interrupts[0].value;

      send("interrupt", {
        threadId,
        ...interruptInfo,
      });
      res.end();
      return; // 不入库，等待 resume
    }

    // AI 回复入库
    if (sessionId && assistantResponse) {
      try {
        await messageDB.add(sessionId, "assistant", assistantResponse, {
          mode: "Graph",
          threadId,
        });
      } catch (err) {
        console.error("[Graph Message Persist Error]", err.message);
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

// ─── 恢复被中断的图执行 ─────────────────────────────────────
router.post("/resume", async (req, res) => {
  const { threadId, decision, sessionId } = req.body;

  if (!threadId) return res.status(400).json({ error: "threadId 不能为空" });
  if (!decision) return res.status(400).json({ error: "decision 不能为空" });

  setSSEHeaders(res);

  const send = (type, data) =>
    res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);

  try {
    const g = await getGraph();

    // 使用 Command.resume 恢复图执行
    const stream = await g.stream(new Command({ resume: decision }), {
      streamMode: "updates",
      configurable: { thread_id: threadId },
    });

    let assistantResponse = "";

    for await (const update of stream) {
      const [nodeName, nodeState] = Object.entries(update)[0];

      send("node", { node: nodeName, intent: nodeState.intent || null });

      if (nodeState.orderResult?.steps?.length) {
        send("steps", { steps: nodeState.orderResult.steps });
      }

      // 转发 RAG 参考来源
      if (nodeState.ragSources?.length) {
        send("sources", { sources: nodeState.ragSources });
      }

      if (nodeState.finalAnswer) {
        assistantResponse = nodeState.finalAnswer;
        send("answer", { content: nodeState.finalAnswer });
      } else if (nodeState.orderResult?.answer) {
        assistantResponse = nodeState.orderResult.answer;
        send("answer", { content: nodeState.orderResult.answer });
      } else if (nodeState.ragResult) {
        assistantResponse = nodeState.ragResult;
        send("answer", { content: nodeState.ragResult });
      }
    }

    // AI 回复入库
    if (sessionId && assistantResponse) {
      try {
        await messageDB.add(sessionId, "assistant", assistantResponse, {
          mode: "Graph",
          threadId,
          hitl: decision,
        });
      } catch (err) {
        console.error("[Graph Resume Persist Error]", err.message);
      }
    }

    send("done", {});
    res.end();
  } catch (err) {
    console.error("[Graph Resume Error]", err.message);
    send("error", { content: "恢复执行时出错，请重试" });
    res.end();
  }
});

export default router;
