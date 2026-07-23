import express from "express";
import { createCustomerAgent } from "../agents/customer-agent.js";
import { formatHistory } from "../chains/basic-chat.js";

const router = express.Router();

router.post("/stream", async (req, res) => {
  const { message, history = [], userId = "U-100" } = req.body;

  if (!message) return res.status(400).json({ error: "message 不能为空" });

  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  const send = (type, data) =>
    res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);

  try {
    const executor = createCustomerAgent();

    const result = await executor.invoke({
      input: message,
      chat_history: formatHistory(history),
      current_time: new Date().toLocaleString("zh-CN"),
      userId,
    });

    // 推送中间步骤
    if (result.intermediateSteps?.length) {
      for (const step of result.intermediateSteps) {
        send("step", {
          tool: step.action.tool,
          toolInput: step.action.toolInput,
          observation: step.observation,
        });
      }
    }

    // 推送最终回答
    send("answer", { content: result.output });
    send("done", {});
    res.end();
  } catch (err) {
    console.error("[Agent Error]", err);
    send("error", { content: "处理请求时出错，请重试" });
    res.end();
  }
});

export default router;
