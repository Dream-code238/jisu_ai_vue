import express from "express";
import multer from "multer";
import { kbDocumentDB } from "../db/postgres.js";
import {
  processDocument,
  deleteDocumentVectors,
} from "../services/doc-processor.js";
import { normalizeFilename } from "../utils/filename-encoding.js";

const router = express.Router();

// multer 配置：内存存储，限制 20MB，过滤文件类型
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  defParamCharset: "utf8", // 关键：确保中文 filename 按 UTF-8 解码，避免 latin1 乱码
  fileFilter: (req, file, cb) => {
    const allowed = [".md", ".txt", ".pdf", ".docx"];
    const ext = "." + file.originalname.split(".").pop().toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`不支持的文件类型: ${ext}，仅支持 .md/.txt/.pdf/.docx`));
    }
  },
});

// ─── 上传文档 ────────────────────────────────────────────────────
router.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "请选择文件" });
  }

  try {
    // 归一化文件名：防御中文被按 latin1/GBK 误解析导致的乱码
    const originalName = normalizeFilename(req.file.originalname);
    const ext = originalName.split(".").pop().toLowerCase();

    // 创建 kb_documents 记录
    const doc = await kbDocumentDB.add(originalName, ext);

    // 异步处理文档（不阻塞响应）
    processDocument({ ...req.file, originalname: originalName }, doc.id)
      .then(async ({ chunkCount }) => {
        await kbDocumentDB.updateStatus(doc.id, "ready", chunkCount);
        console.log(
          `[Knowledge] 文档处理完成: ${originalName} (${chunkCount} chunks)`,
        );
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

// ─── 文档列表 ────────────────────────────────────────────────────
router.get("/documents", async (req, res) => {
  try {
    const list = await kbDocumentDB.list();
    res.json(list);
  } catch (err) {
    console.error("[Knowledge List Error]", err.message);
    res.status(500).json({ error: "获取文档列表失败" });
  }
});

// ─── 删除文档 ────────────────────────────────────────────────────
router.delete("/documents/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // 删除向量库中该文档的所有 chunks
    await deleteDocumentVectors(id);

    // 删除 kb_documents 记录
    await kbDocumentDB.delete(id);

    res.json({ success: true });
  } catch (err) {
    console.error("[Knowledge Delete Error]", err.message);
    res.status(500).json({ error: "删除失败" });
  }
});

// ─── 统计信息 ────────────────────────────────────────────────────
router.get("/stats", async (req, res) => {
  try {
    const stats = await kbDocumentDB.getStats();
    res.json(stats);
  } catch (err) {
    console.error("[Knowledge Stats Error]", err.message);
    res.status(500).json({ error: "获取统计失败" });
  }
});

export default router;
