import { createModel } from "../../models/deepseek.js";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

// 单意图综合 prompt（原有）
const singlePrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `你是极速购电商平台的客服助手小购。

根据以下查询结果，为用户生成一个清晰、友好的回答。
称呼用户为"亲"，语气专业，内容简洁准确。

订单查询结果（如有）：{orderResult}
知识库查询结果（如有）：{ragResult}`,
  ],
  ["human", "{userInput}"],
]);

// 多意图合并 prompt
const mergePrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `你是极速购电商平台的客服助手小购。
用户问了多个问题，请将以下多个查询结果合并为一段连贯、友好的回复。
称呼用户为"亲"，语气专业。每个问题的回答要清晰分段，便于阅读。

各模块查询结果：
{parts}`,
  ],
  ["human", "{userInput}"],
]);

const model = createModel({ temperature: 0.5 });
const singleChain = singlePrompt.pipe(model).pipe(new StringOutputParser());
const mergeChain = mergePrompt.pipe(model).pipe(new StringOutputParser());

export const answerSynthesizerNode = async (state) => {
  const {
    userInput,
    intent,
    intents = [],
    orderResult,
    ragResult,
    finalAnswer,
  } = state;

  // 多意图合并 — 检查是否有多个意图产生了结果
  const hasOrderResult = orderResult && orderResult.answer;
  const hasRag = ragResult && ragResult.trim();

  if (intents.length > 1 && (hasOrderResult || hasRag)) {
    // 合并多个分支结果
    const parts = [];
    if (hasOrderResult) {
      parts.push(`【订单查询结果】\n${orderResult.answer}`);
    }
    if (hasRag) {
      parts.push(`【知识库查询结果】\n${ragResult}`);
    }

    const merged = await mergeChain.invoke({
      userInput,
      parts: parts.join("\n\n"),
    });
    return { finalAnswer: merged };
  }

  // general 意图已在 generalChatNode 生成答案，直接透传
  if (intent === "general" && finalAnswer) return { finalAnswer };

  // 单意图综合
  const result = await singleChain.invoke({
    userInput,
    orderResult: orderResult ? JSON.stringify(orderResult.answer) : "无",
    ragResult: ragResult || "无",
  });
  return { finalAnswer: result };
};
