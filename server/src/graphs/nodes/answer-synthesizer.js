import { createModel } from "../../models/deepseek.js";

const model = createModel({ temperature: 0.3 });

/**
 * 答案综合节点（改造：支持合并多个分支结果）
 */
export async function answerSynthesizerNode(state) {
  const {
    intents = [],
    orderResult,
    ragResult,
    finalAnswer,
    parallelResults = [],
  } = state;

  // 单意图：直接返回
  if (intents.length <= 1) {
    if (finalAnswer) return { finalAnswer };
    if (orderResult?.answer) return { finalAnswer: orderResult.answer };
    if (ragResult) return { finalAnswer: ragResult };
    return { finalAnswer: "抱歉，我无法理解您的问题。" };
  }

  // 多意图：合并多个结果
  const parts = [];
  if (orderResult?.answer) parts.push(`【订单查询】${orderResult.answer}`);
  if (ragResult) parts.push(`【知识库】${ragResult}`);

  const mergePrompt = `用户问了多个问题，请将以下回答合并为一段连贯的回复（150字以内）：
${parts.join("\n\n")}`;

  const merged = await model.invoke(mergePrompt);
  return { finalAnswer: merged.content };
}
