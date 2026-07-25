import express from "express";
import { conversationDB, messageDB } from "../db/postgres.js";
import { randomUUID } from "crypto";

const router = express.Router();

// 创建新会话
router.post("/session", async (req, res) => {
  try {
    const sessionId = randomUUID();
    const conv = await conversationDB.create(
      sessionId,
      "新对话",
      req.body.userId || "anonymous",
    );
    res.json({
      sessionId: conv.session_id,
      title: conv.title,
      createdAt: conv.created_at,
    });
  } catch (err) {
    res.status(500).json({ error: "创建会话失败" });
  }
});

// 会话列表
router.get("/session/list", async (req, res) => {
  try {
    const list = await conversationDB.list(req.query.userId || "anonymous");
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: "获取会话列表失败" });
  }
});

// 历史消息
router.get("/history/:sessionId", async (req, res) => {
  try {
    const messages = await messageDB.getBySession(req.params.sessionId);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "获取历史消息失败" });
  }
});

// 删除会话
router.delete("/session/:id", async (req, res) => {
  try {
    await conversationDB.delete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "删除会话失败" });
  }
});

export default router;
