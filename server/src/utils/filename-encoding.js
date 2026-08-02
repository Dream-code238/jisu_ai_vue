/**
 * 文件名编码归一化工具
 *
 * 背景：中文 Windows 环境或旧版浏览器上传 multipart 时，filename 可能以 GBK/UTF-8
 * 字节串被服务端按 latin1 解析，导致数据库存储为乱码（如 "ÉÌÆ·Ä¿Â¼Óë¹æ¸ñËµÃ÷.md"）。
 *
 * 本工具对 filename 进行启发式检测与修复：
 * 1. 若字符串已是合法中文文件名，直接返回。
 * 2. 否则尝试将其按 latin1 还原为字节后，分别用 UTF-8 / GBK 解码，
 *    选择能得到最多中文字符且不包含乱码控制字符的结果。
 */
import iconv from 'iconv-lite';

const CJK_RE = /[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]/;

function hasPrintableCjk(s) {
  return CJK_RE.test(s);
}

function looksLikeGarbage(s) {
  // 若解码后仍包含大量非打印字符或孤立 surrogate，视为失败
  const bad = /[\x00-\x08\x0b\x0c\x0e-\x1f\ufffd\ud800-\udfff]/;
  return bad.test(s);
}

function decodeCandidate(s, encoding) {
  try {
    const buf = Buffer.from(s, 'latin1');
    return iconv.decode(buf, encoding);
  } catch {
    return s;
  }
}

function scoreDecoded(s) {
  if (looksLikeGarbage(s)) return -1;
  let cjkCount = 0;
  for (const ch of s) {
    if (CJK_RE.test(ch)) cjkCount++;
  }
  return cjkCount;
}

export function normalizeFilename(s) {
  if (!s || typeof s !== 'string') return s;
  if (s.split('').every((c) => c.charCodeAt(0) < 128)) return s;
  if (hasPrintableCjk(s)) return s;

  const candidates = [
    s,
    decodeCandidate(s, 'utf8'),
    decodeCandidate(s, 'gbk'),
    decodeCandidate(s, 'gb18030'),
  ];

  let best = s;
  let bestScore = scoreDecoded(s);

  for (const cand of candidates) {
    const score = scoreDecoded(cand);
    if (score > bestScore) {
      bestScore = score;
      best = cand;
    }
  }

  return best;
}
