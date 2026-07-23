import express from "express";
import cors from "cors";
import "dotenv/config";
import chatRouter from "./routes/chat.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use("/api/chat", chatRouter);

app.listen(PORT, () => {
  console.log(`server running on http://localhost:${PORT}`);
});
