import { createModel } from "../../models/deepseek.js";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

const intentPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `你是一个意图分类器。
    
    根据用户的问题，返回以下三个分类之一，只返回分类词，不要有任何其他内容：

    - order：用户询问订单状态、物流信息、退款进度等需要查询订单数据的问题
    - knowledge：用户询问商品介绍、规格参数、售后政策、退换货规则等可从知识库获取的问题
    - general：其他类型的对话、闲聊、无法归类的问题

    只输出一个词：order 或 knowledge 或 general`,
  ],
  ["human", "{userInput}"],
]);

const chain = intentPrompt
  .pipe(createModel({ temperature: 0 }))
  .pipe(new StringOutputParser());

export const intentRouterNode = async (state) => {
  const { userInput } = state;

  const raw = await chain.invoke({ userInput });
  const intent = raw.trim().toLowerCase();

  // 容错处理：如果模型返回了不在预期内的值，默认走 general
  const VALID_INTENTS = ["order", "knowledge", "general"];
  const finalIntent = VALID_INTENTS.includes(intent) ? intent : "general";

  console.log(`[intentRouter] "${userInput}" → ${finalIntent}`);
  return { intent: finalIntent };
};

// 条件边函数：根据 intent 决定下一个节点
export const routeByIntent = (state) => {
  const map = {
    order: "orderAgent",
    knowledge: "ragNode",
    general: "generalChat",
  };
  return map[state.intent] || "generalChat";
};
