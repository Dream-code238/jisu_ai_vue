/**
 * 端点：
 * POST /api/agent/stream  — Agent 流式对话（可能触发 interrupt 等待审批）
 * POST /api/agent/resume  — 恢复被中断的 Agent 执行（审批结果）
 */
import express from "express";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { Command } from "@langchain/langgraph";
import { createCustomerAgent } from "../agents/customer-agent.js";
import { randomUUID } from "crypto";

const router = express.Router();

// SSE 响应头设置
const setSSEHeaders = (res) => {
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
};

// 懒加载 Agent 实例（checkpointer 需要异步初始化）
let agentApp = null;

const getAgent = async () => {
  if (!agentApp) {
    agentApp = await createCustomerAgent();
  }
  return agentApp;
};

// ─── Agent 流式对话 ──────────────────────────────────────────────
router.post("/stream", async (req, res) => {
  const { message, history = [] } = req.body;

  if (!message) return res.status(400).json({ error: "message 不能为空" });

  setSSEHeaders(res);

  const send = (type, data) =>
    res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);

  try {
    const agent = await getAgent();

    // 生成 thread_id 用于 checkpointer 状态追踪
    const threadId = randomUUID();

    // 将历史记录转为消息对象（排除最后一条，避免重复）
    const historyMessages = history
      .slice(0, -1)
      .map((m) =>
        m.role === "user"
          ? new HumanMessage(m.content)
          : new AIMessage(m.content),
      );

    // 使用 stream() 替代 invoke()，支持 interrupt 暂停
    const stream = await agent.stream(
      {
        messages: [...historyMessages, new HumanMessage(message)],
      },
      {
        streamMode: "updates",
        configurable: { thread_id: threadId },
      },
    );

    let finalAnswer = "";

    for await (const update of stream) {
      const [nodeName, nodeState] = Object.entries(update)[0];

      if (nodeName === "agent" && nodeState.messages?.length) {
        const lastMsg = nodeState.messages[nodeState.messages.length - 1];

        if (lastMsg.tool_calls?.length) {
          // LLM 决定调用工具 — 发送 step 事件（含工具名和参数）
          for (const tc of lastMsg.tool_calls) {
            send("step", {
              tool: tc.name,
              toolInput: tc.args,
            });
          }
        }

        // 提取最终答案（没有 tool_calls 的 AI 消息）
        if (!lastMsg.tool_calls?.length && lastMsg.content) {
          finalAnswer = lastMsg.content;
        }
      }
    }

    // T17: 检查 Agent 是否被中断（HITL 等待审批）
    const state = await agent.getState({
      configurable: { thread_id: threadId },
    });
    const tasks = state?.tasks || [];
    const hasInterrupt = tasks.some((t) => t.interrupts?.length > 0);

    if (hasInterrupt) {
      // Agent 被中断 — 发送 interrupt 事件，不发送 done
      const interruptTask = tasks.find((t) => t.interrupts?.length > 0);
      const interruptInfo = interruptTask.interrupts[0].value;

      send("interrupt", {
        threadId,
        ...interruptInfo,
      });
      res.end();
      return; // 等待 /resume
    }

    // 正常完成 — 发送答案
    if (finalAnswer) {
      send("answer", { content: finalAnswer });
    }
    send("done", {});
    res.end();
  } catch (err) {
    console.error("[Agent Error]", err.message);
    send("error", { content: "处理请求时出错，请重试" });
    res.end();
  }
});

// ─── T17: 恢复被中断的 Agent 执行 ─────────────────────────────────
router.post("/resume", async (req, res) => {
  const { threadId, decision } = req.body;

  if (!threadId) return res.status(400).json({ error: "threadId 不能为空" });
  if (!decision) return res.status(400).json({ error: "decision 不能为空" });

  setSSEHeaders(res);

  const send = (type, data) =>
    res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);

  try {
    const agent = await getAgent();

    // T17: 使用 Command.resume 恢复 Agent 执行
    const stream = await agent.stream(new Command({ resume: decision }), {
      streamMode: "updates",
      configurable: { thread_id: threadId },
    });

    let finalAnswer = "";

    for await (const update of stream) {
      const [nodeName, nodeState] = Object.entries(update)[0];

      if (nodeName === "tools" && nodeState.messages?.length) {
        // 退款工具执行完成 — 发送 observation
        for (const msg of nodeState.messages) {
          if (
            msg._getType?.() === "tool" ||
            msg.constructor.name === "ToolMessage"
          ) {
            send("step", {
              tool: msg.name || msg.tool_name || "processRefund",
              observation:
                typeof msg.content === "string"
                  ? msg.content
                  : JSON.stringify(msg.content),
            });
          }
        }
      }

      // 提取最终答案
      if (nodeName === "agent" && nodeState.messages?.length) {
        const lastMsg = nodeState.messages[nodeState.messages.length - 1];
        if (!lastMsg.tool_calls?.length && lastMsg.content) {
          finalAnswer = lastMsg.content;
        }
      }
    }

    // 发送最终答案
    if (finalAnswer) {
      send("answer", { content: finalAnswer });
    }
    send("done", {});
    res.end();
  } catch (err) {
    console.error("[Agent Resume Error]", err.message);
    send("error", { content: "恢复执行时出错，请重试" });
    res.end();
  }
});

export default router;
