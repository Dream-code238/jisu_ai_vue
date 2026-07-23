import express from "express";
import cors from "cors";
import "dotenv/config";

import chatRouter from "./routes/chat.js";
import agentRouter from "./routes/agent.js";
import ragRouter from "./routes/rag.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use("/api/chat", chatRouter);
app.use("/api/agent", agentRouter);
app.use("/api/rag", ragRouter);

app.listen(PORT, () => {
  console.log(`server running on http://localhost:${PORT}`);
});
