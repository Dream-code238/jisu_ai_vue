import { createReactAgent } from "langchain/agents";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { AgentExecutor } from "langchain/agents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { createModel } from "../models/deepseek.js";
import { allTools } from "../tools/order-tools.js";

// Agent 专用 Prompt
// 必须包含 {tools}、{tool_names}、{agent_scratchpad} 三个占位符
// {agent_scratchpad} 是 LangChain 存放中间推理步骤的地方
const agentPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `你是极速购电商平台的智能客服助手小购。

    你可以使用以下工具查询信息：
    {tools}

    回答规则：
    1. 需要查询数据时，先调用对应工具获取真实数据，不要猜测或编造
    2. 语气友好，称呼用户为"亲"
    3. 拿到数据后用自然语言组织回答，不要直接粘贴 JSON
    4. 如果用户没有提供订单号但需要查询，先询问订单号

    工具名称：{tool_names}
    当前时间：{current_time}`,
  ],
  ["placeholder", "{chat_history}"],
  ["human", "{input}"],
  ["placeholder", "{agent_scratchpad}"],
]);

const model = createModel({ temperature: 0 }); // Agent 场景用 0，保证工具调用准确

export const createCustomerAgent = () => {
  const agent = createReactAgent({
    llm: model,
    tools: allTools,
    prompt: agentPrompt,
  });

  return new AgentExecutor({
    agent,
    tools: allTools,
    maxIterations: 5, // 最多循环 5 次，防止死循环
    returnIntermediateSteps: true, // 返回中间推理步骤，前端可以展示
    verbose: true, // 开发阶段打开，可以在终端看到完整推理过程
  });
};
