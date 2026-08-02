import { createModel } from "../../models/deepseek.js";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { Send } from "@langchain/langgraph";

// 多意图检测 prompt
const intentPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `你是一个意图分类器。分析用户输入可能包含的所有意图，返回 JSON 数组。

可选意图：
- order：用户询问订单状态、物流信息、退款进度等需要查询订单数据的问题
- knowledge：用户询问商品介绍、规格参数、售后政策、退换货规则等可从知识库获取的问题
- general：其他类型的对话、闲聊、无法归类的问题

规则：
1. 如果只有一个意图，返回单元素数组，如 ["order"]
2. 如果有多个意图，返回多元素数组，如 ["order", "knowledge"]
3. general 意图不与其他意图共存
4. 只返回 JSON 数组，不要有任何其他内容

示例：
- "查一下订单 ORD-001 的物流" → ["order"]
- "退货政策是什么" → ["knowledge"]
- "查一下订单 ORD-001 的物流，顺便问下退货政策" → ["order", "knowledge"]
- "你好" → ["general"]`,
  ],
  ["human", "{userInput}"],
]);

const chain = intentPrompt
  .pipe(createModel({ temperature: 0 }))
  .pipe(new StringOutputParser());

const VALID_INTENTS = ["order", "knowledge", "general"];

/**
 * 意图路由节点 — 支持多意图检测
 * @returns {{ intent: string, intents: string[] }}
 */
export const intentRouterNode = async (state) => {
  const { userInput } = state;
  const raw = await chain.invoke({ userInput });

  let intents;
  try {
    const parsed = JSON.parse(raw.trim());
    if (Array.isArray(parsed)) {
      intents = parsed.filter((i) => VALID_INTENTS.includes(i));
    } else if (typeof parsed === "string" && VALID_INTENTS.includes(parsed)) {
      intents = [parsed];
    } else {
      intents = ["general"];
    }
  } catch {
    // JSON 解析失败，尝试从文本中提取
    const text = raw.trim().toLowerCase();
    if (VALID_INTENTS.includes(text)) {
      intents = [text];
    } else {
      intents = ["general"];
    }
  }

  // 确保至少有一个意图
  if (intents.length === 0) intents = ["general"];

  // general 不与其他意图共存
  if (intents.includes("general") && intents.length > 1) {
    intents = ["general"];
  }

  // 去重
  intents = [...new Set(intents)];

  // intent 字段保留兼容（取第一个意图）
  const intent = intents[0];
  console.log(
    `[intentRouter] "${userInput}" → intents: ${JSON.stringify(intents)}`,
  );

  return { intent, intents };
};

// 意图到节点的映射
const INTENT_TO_NODE = {
  order: "orderAgent",
  knowledge: "ragNode",
  general: "generalChat",
};

/**
 * 条件路由函数
 * - 单意图：返回节点名字符串（使用 path map）
 * - 多意图：返回 Send 数组（fan-out 并行执行，绕过 path map）
 */
export function routeByIntent(state) {
  const intents = state.intents || ["general"];

  // 单意图：直接路由
  if (intents.length <= 1) {
    const intent = intents[0] || "general";
    return INTENT_TO_NODE[intent] || "generalChat";
  }

  // 多意图：使用 Send API fan-out 到多个节点并行执行
  console.log(
    `[routeByIntent] Multi-intent fan-out: ${JSON.stringify(intents)}`,
  );
  return intents
    .map((intent) => INTENT_TO_NODE[intent])
    .filter(Boolean)
    .map((nodeName) => new Send(nodeName, state));
}
