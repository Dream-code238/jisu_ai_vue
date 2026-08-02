/**
 * 对话记忆管理
 *
 * 超过 20 条消息时自动调用 LLM 进行摘要压缩，
 * 将早期对话浓缩为一段摘要，减少 token 消耗。
 *
 * 使用场景：
 *   - chat 路由在发送前调用 buildHistoryContext() 构建上下文
 *   - graph 路由通过 PostgresSaver 自动持久化（不需要手动调用）
 */
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { createModel } from "../models/deepseek.js";
import { messageDB } from "../db/postgres.js";

const SUMMARY_THRESHOLD = 20;
const model = createModel({ temperature: 0 });

const summaryPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    "请将以下对话历史浓缩为一段摘要，保留关键信息（用户意图、已解决的问题、订单号等），不超过 200 字。",
  ],
  ["human", "{conversation}"],
]);

/**
 * 检查并压缩过长的对话历史
 * @param {string} sessionId - 会话 ID
 * @returns {Promise<{ compressed: boolean, summary?: string }>}
 */
export async function maybeCompressHistory(sessionId) {
  const count = await messageDB.countBySession(sessionId);

  if (count <= SUMMARY_THRESHOLD) {
    return { compressed: false };
  }

  const allMessages = await messageDB.getBySession(sessionId, 1000);
  const conversation = allMessages
    .map((m) => `${m.role === "user" ? "用户" : "AI"}: ${m.content}`)
    .join("\n");

  const summary = await summaryPrompt.pipe(model).invoke({ conversation });

  return { compressed: true, summary };
}

/**
 * 构建发送给 LLM 的历史上下文
 * - 超 20 条时自动摘要早期对话
 * - 始终保留最近 10 条原始消息
 *
 * @param {string} sessionId
 * @returns {Promise<Array<{ role: string, content: string }>>}
 */
export async function buildHistoryContext(sessionId) {
  const { compressed, summary } = await maybeCompressHistory(sessionId);
  const recent = await messageDB.getBySession(sessionId, 10);

  const history = [];
  if (compressed && summary) {
    history.push({ role: "system", content: `[历史摘要] ${summary}` });
  }
  history.push(...recent.map((m) => ({ role: m.role, content: m.content })));

  return history;
}
