import express from "express";
import multer from "multer";
import { kbDocumentDB } from "../db/postgres.js";
import { processDocument } from "../services/doc-processor.js";

const router = express.Router();

// multer 配置：内存存储，限制 20MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [".md", ".txt", ".pdf", ".docx"];
    const ext = "." + file.originalname.split(".").pop().toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error(`不支持的文件类型: ${ext}`));
  },
});

// 上传文档
router.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "请选择文件" });

  try {
    const ext = req.file.originalname.split(".").pop().toLowerCase();
    const doc = await kbDocumentDB.add(req.file.originalname, ext);

    // 异步处理文档（不阻塞响应）
    processDocument(req.file, doc.id)
      .then(async ({ chunkCount }) => {
        await kbDocumentDB.updateStatus(doc.id, "ready", chunkCount);
      })
      .catch(async (err) => {
        console.error("[Doc Process Error]", err.message);
        await kbDocumentDB.updateStatus(doc.id, "failed");
      });

    res.json({
      documentId: doc.id,
      filename: doc.filename,
      chunkCount: 0,
      status: "processing",
    });
  } catch (err) {
    res.status(500).json({ error: "上传失败: " + err.message });
  }
});

// 文档列表
router.get("/documents", async (req, res) => {
  try {
    const list = await kbDocumentDB.list();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: "获取列表失败" });
  }
});

// 删除文档
router.delete("/documents/:id", async (req, res) => {
  try {
    await kbDocumentDB.delete(req.params.id);
    // TODO: 同时删除向量库中该文档的 chunks
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "删除失败" });
  }
});

// 统计信息
router.get("/stats", async (req, res) => {
  try {
    const stats = await kbDocumentDB.getStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: "获取统计失败" });
  }
});

export default router;
