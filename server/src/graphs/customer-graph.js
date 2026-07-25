/**
 * customer-graph.js（改造版）
 * 改造点：compile 时传入 PostgresSaver checkpointer
 * 其他节点和边定义不变，仅 compile 参数变化
 */

import { StateGraph, START, END } from "@langchain/langgraph";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { GraphState } from "./state.js";
import { intentRouterNode, routeByIntent } from "./nodes/intent-router.js";
import { orderAgentNode } from "./nodes/order-agent.js";
import { ragNode } from "./nodes/rag-node.js";
import { generalChatNode } from "./nodes/general-chat.js";
import { answerSynthesizerNode } from "./nodes/answer-synthesizer.js";

export const buildCustomerGraph = async () => {
  // 创建 PostgresSaver checkpointer
  const checkpointer = await PostgresSaver.fromConnString(
    `postgresql://${process.env.PG_USER}:${process.env.PG_PASSWORD}@${process.env.PG_HOST}:${process.env.PG_PORT}/${process.env.PG_DATABASE}`,
  );

  // 自动创建 checkpoint 表
  await checkpointer.setup();

  const graph = new StateGraph(GraphState)
    // 注册节点
    .addNode("intentRouter", intentRouterNode)
    .addNode("orderAgent", orderAgentNode)
    .addNode("ragNode", ragNode)
    .addNode("generalChat", generalChatNode)
    .addNode("answerSynthesizer", answerSynthesizerNode)

    // 入口：START → 意图识别
    .addEdge(START, "intentRouter")

    // 条件路由：意图识别完成后，根据 intent 分流
    .addConditionalEdges("intentRouter", routeByIntent, {
      order: "orderAgent",
      knowledge: "ragNode",
      general: "generalChat",
    })

    // 三条路径都汇入答案综合节点
    .addEdge("orderAgent", "answerSynthesizer")
    .addEdge("ragNode", "answerSynthesizer")
    .addEdge("generalChat", "answerSynthesizer")

    // 出口
    .addEdge("answerSynthesizer", END);

  // 关键：传入 checkpointer，实现状态持久化
  return graph.compile({ checkpointer });
};
