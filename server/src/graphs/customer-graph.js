import { StateGraph, START, END } from "@langchain/langgraph";
import { GraphState } from "./state.js";
import { intentRouterNode, routeByIntent } from "./nodes/intent-router.js";
import { orderAgentNode } from "./nodes/order-agent.js";
import { ragNode } from "./nodes/rag-node.js";
import { generalChatNode } from "./nodes/general-chat.js";
import { answerSynthesizerNode } from "./nodes/answer-synthesizer.js";

export const buildCustomerGraph = () => {
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
      orderAgent: "orderAgent",
      ragNode: "ragNode",
      generalChat: "generalChat",
    })

    // 三条路径都汇入答案综合节点
    .addEdge("orderAgent", "answerSynthesizer")
    .addEdge("ragNode", "answerSynthesizer")
    .addEdge("generalChat", "answerSynthesizer")

    // 出口
    .addEdge("answerSynthesizer", END);

  return graph.compile();
};
