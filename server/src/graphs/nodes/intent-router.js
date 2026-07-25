import { createModel } from "../../models/deepseek.js";
import { StringOutputParser } from "@langchain/core/output_parsers";

const model = createModel({ temperature: 0 });

const intentPrompt = `判断用户输入包含哪些意图，返回 JSON 数组。
  可选意图：order（订单查询）、knowledge（知识库问答）、general（通用对话）
  如果只有一个意图，返回单元素数组。

  用户输入：{input}
  返回格式：["order"] 或 ["order", "knowledge"]`;

/**
 * 意图路由节点（改造：返回 intents 数组）
 */
export async function intentRouterNode(state) {
  const response = await model.pipe(new StringOutputParser()).invoke({
    input: state.userInput,
  });

  let intents;
  try {
    intents = JSON.parse(response.trim());
    if (!Array.isArray(intents)) intents = [intents];
  } catch {
    intents = ["general"];
  }

  return { intents };
}

/**
 * 条件路由函数（改造：单意图直接路由，多意图走 fan-out）
 */
export function routeByIntent(state) {
  const intents = state.intents || ["general"];

  if (intents.length === 1) {
    // 单意图：直接路由
    const map = {
      order: "orderAgent",
      knowledge: "ragNode",
      general: "generalChat",
    };
    return map[intents[0]] || "generalChat";
  }

  // 多意图：返回所有目标节点（LangGraph 支持 Send API 并行）
  return "fanOut"; // 走 fanOut 节点
}
