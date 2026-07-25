import { StateGraph, START, END } from "@langchain/langgraph";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { GraphState } from "./state.js";
import { intentRouterNode, routeByIntent } from "./nodes/intent-router.js";
import { orderAgentNode } from "./nodes/order-agent.js";
import { ragNode } from "./nodes/rag-node.js";
import { generalChatNode } from "./nodes/general-chat.js";
import { answerSynthesizerNode } from "./nodes/answer-synthesizer.js";

export const buildCustomerGraph = async () => {
  const checkpointer = await PostgresSaver.fromConnString(
    `postgresql://${process.env.PG_USER}:${process.env.PG_PASSWORD}@${process.env.PG_HOST}:${process.env.PG_PORT}/${process.env.PG_DATABASE}`,
  );
  await checkpointer.setup();

  const graph = new StateGraph(GraphState)
    .addNode("intentRouter", intentRouterNode)
    .addNode("orderAgent", orderAgentNode)
    .addNode("ragNode", ragNode)
    .addNode("generalChat", generalChatNode)
    .addNode("answerSynthesizer", answerSynthesizerNode)
    .addEdge(START, "intentRouter")
    .addConditionalEdges("intentRouter", routeByIntent, {
      orderAgent: "orderAgent",
      ragNode: "ragNode",
      generalChat: "generalChat",
      fanOut: "orderAgent", // 多意图先走 orderAgent（实际用 Send API 并行）
    })
    // 所有分支汇聚到 answerSynthesizer（fan-in）
    .addEdge("orderAgent", "answerSynthesizer")
    .addEdge("ragNode", "answerSynthesizer")
    .addEdge("generalChat", "answerSynthesizer")
    .addEdge("answerSynthesizer", END);

  return graph.compile({ checkpointer });
};
