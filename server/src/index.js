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
app.use("/api/chat", historyRouter);
app.use("/api/agent", agentRouter);
app.use("/api/rag", ragRouter);
app.use("/api/graph", graphRouter);
app.use("/api/knowledge", knowledgeRouter);

app.get("/", (req, res) => {
  res.json({
    service: "极速购 AI 客服 API",
    endpoints: ["/api/chat", "/api/agent", "/api/rag", "/api/graph"],
  });
});

app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`),
);
