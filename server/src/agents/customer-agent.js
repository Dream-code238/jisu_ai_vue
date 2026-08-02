import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { createModel } from "../models/deepseek.js";
import { allTools } from "../tools/order-tools.js";
import "dotenv/config";

const model = createModel({ temperature: 0 });

const SYSTEM_PROMPT = `你是极速购电商平台的智能客服助手小购。

回答规则：
1. 需要查询数据时，先调用对应工具获取真实数据，不要猜测或编造
2. 语气友好，称呼用户为"亲"
3. 拿到数据后用自然语言组织回答，不要直接粘贴 JSON
4. 如果用户没有提供订单号但需要查询，先询问订单号
5. 当用户要求退款时，调用 processRefund 工具（需要人工审批）

当前时间：${new Date().toLocaleString("zh-CN")}`;

// 懒加载：checkpointer 需要异步初始化
let agentInstance = null;

export const createCustomerAgent = async () => {
  if (!agentInstance) {
    const connString = `postgresql://${process.env.PG_USER}:${process.env.PG_PASSWORD}@${process.env.PG_HOST}:${process.env.PG_PORT}/${process.env.PG_DATABASE}`;
    const checkpointer = await PostgresSaver.fromConnString(connString);
    await checkpointer.setup();

    agentInstance = createReactAgent({
      llm: model,
      tools: allTools,
      prompt: SYSTEM_PROMPT,
      checkpointer,
    });
  }
  return agentInstance;
};
