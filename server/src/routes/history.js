import express from "express";
import { randomUUID } from "crypto";
import { conversationDB, messageDB, guardrailDB } from "../db/postgres.js";

const router = express.Router();

// ─── 创建新会话 ──────────────────────────────────────────────────
router.post("/session", async (req, res) => {
  try {
    const sessionId = randomUUID();
    const userId = req.body.userId || "anonymous";
    const conv = await conversationDB.create(sessionId, "新对话", userId);
    res.json({
      sessionId: conv.session_id,
      title: conv.title,
      createdAt: conv.created_at,
    });
  } catch (err) {
    console.error("[Create Session Error]", err.message);
    res.status(500).json({ error: "创建会话失败" });
  }
});

// ─── 会话列表 ────────────────────────────────────────────────────
router.get("/session/list", async (req, res) => {
  try {
    const userId = req.query.userId || "anonymous";
    const list = await conversationDB.list(userId);
    res.json(list);
  } catch (err) {
    console.error("[List Sessions Error]", err.message);
    res.status(500).json({ error: "获取会话列表失败" });
  }
});

// ─── 历史消息 ────────────────────────────────────────────────────
router.get("/history/:sessionId", async (req, res) => {
  try {
    const messages = await messageDB.getBySession(req.params.sessionId);
    res.json(messages);
  } catch (err) {
    console.error("[Get History Error]", err.message);
    res.status(500).json({ error: "获取历史消息失败" });
  }
});

// ─── 删除会话 ────────────────────────────────────────────────────
router.delete("/session/:id", async (req, res) => {
  try {
    await conversationDB.delete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error("[Delete Session Error]", err.message);
    res.status(500).json({ error: "删除会话失败" });
  }
});

// ─── 更新会话标题 ────────────────────────────────────────────────
router.patch("/session/:id", async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: "title 不能为空" });
    await conversationDB.updateTitle(req.params.id, title);
    res.json({ success: true });
  } catch (err) {
    console.error("[Update Session Error]", err.message);
    res.status(500).json({ error: "更新会话失败" });
  }
});

// ─── 安全护栏拦截日志 ────────────────────────────────────────
router.get("/guardrail/logs", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const logs = await guardrailDB.getRecent(limit);
    res.json(logs);
  } catch (err) {
    console.error("[Guardrail Logs Error]", err.message);
    res.status(500).json({ error: "获取拦截日志失败" });
  }
});

export default router;
