import express from "express";
import cors from "cors";
import "dotenv/config";
import chatRouter from "./routes/chat.js";
import agentRouter from "./routes/agent.js";
import ragRouter from "./routes/rag.js";
import graphRouter from "./routes/graph.js";
import historyRouter from "./routes/history.js";
import knowledgeRouter from "./routes/knowledge.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json({ limit: "50mb" }));

app.use("/api/chat", chatRouter);
app.use("/api/agent", agentRouter);
app.use("/api/rag", ragRouter);
app.use("/api/graph", graphRouter);

// 会话历史路由（挂载到 /api/chat 下，与 chat 路由共享前缀）
app.use("/api/chat", historyRouter);

// 知识库管理路由
app.use("/api/knowledge", knowledgeRouter);

app.get("/", (req, res) => {
  res.json({
    service: "极速购 AI 客服系统",
    version: "1.0.0",
    routes: {
      chat: "POST /api/chat/stream",
      agent: "POST /api/agent/stream",
      rag: "POST /api/rag/query",
      graph: "POST /api/graph/stream",
      session:
        "POST /api/chat/session | GET /api/chat/session/list | GET /api/chat/history/:id",
      knowledge:
        "POST /api/knowledge/upload | GET /api/knowledge/documents | GET /api/knowledge/stats",
    },
  });
});

app.listen(PORT, () => {
  console.log(`\n极速购 AI 客服服务已启动：http://localhost:${PORT}\n`);
});
