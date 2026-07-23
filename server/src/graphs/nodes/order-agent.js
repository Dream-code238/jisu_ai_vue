import { createReactAgent } from "langchain/agents";
import { AgentExecutor } from "langchain/agents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { createModel } from "../../models/deepseek.js";
import { allTools } from "../../tools/order-tools.js";

const agentPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `你是极速购的订单查询助手。
根据用户的问题，调用相应工具查询订单或物流信息。
只查询数据，不需要生成最终的客服回答，查到什么返回什么，保持数据的完整性。

工具列表：{tools}
工具名称：{tool_names}`,
  ],
  ["human", "{input}"],
  ["placeholder", "{agent_scratchpad}"],
]);

const model = createModel({ temperature: 0 });

const createOrderExecutor = () => {
  const agent = createReactAgent({
    llm: model,
    tools: allTools,
    prompt: agentPrompt,
  });
  return new AgentExecutor({
    agent,
    tools: allTools,
    maxIterations: 4,
    returnIntermediateSteps: true,
    verbose: false,
  });
};

export const orderAgentNode = async (state) => {
  const { userInput } = state;
  try {
    const executor = createOrderExecutor();
    const result = await executor.invoke({ input: userInput });
    return {
      orderResult: {
        answer: result.output,
        steps:
          result.intermediateSteps?.map((s) => ({
            tool: s.action.tool,
            input: s.action.toolInput,
            obs: s.observation,
          })) || [],
      },
    };
  } catch (err) {
    console.error("[orderAgentNode]", err.message);
    return { orderResult: { answer: "查询订单信息时出错", steps: [] } };
  }
};
