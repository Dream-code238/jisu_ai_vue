/**
 *
 * 图结构：
 *   START → guardrail → (安全: intentRouter) → (单意图: orderAgent|ragNode|generalChat) → (多意图: Send fan-out) → 所有分支 → answerSynthesizer → END → (拦截: END，跳过后续所有节点)
 */
import { StateGraph, START, END } from "@langchain/langgraph";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { GraphState } from "./state.js";
import { guardrailNode, routeAfterGuardrail } from "./nodes/guardrail-node.js";
import { intentRouterNode, routeByIntent } from "./nodes/intent-router.js";
import { orderAgentNode } from "./nodes/order-agent.js";
import { ragNode } from "./nodes/rag-node.js";
import { generalChatNode } from "./nodes/general-chat.js";
import { answerSynthesizerNode } from "./nodes/answer-synthesizer.js";
import "dotenv/config";

export const buildCustomerGraph = async () => {
  const connString = `postgresql://${process.env.PG_USER}:${process.env.PG_PASSWORD}@${process.env.PG_HOST}:${process.env.PG_PORT}/${process.env.PG_DATABASE}`;
  const checkpointer = await PostgresSaver.fromConnString(connString);
  await checkpointer.setup();

  const graph = new StateGraph(GraphState)
    .addNode("guardrail", guardrailNode)
    .addNode("intentRouter", intentRouterNode)
    .addNode("orderAgent", orderAgentNode)
    .addNode("ragNode", ragNode)
    .addNode("generalChat", generalChatNode)
    .addNode("answerSynthesizer", answerSynthesizerNode)

    // START → guardrail（安全检查是第一道关卡）
    .addEdge(START, "guardrail")

    // guardrail → (拦截: END) / (放行: intentRouter)
    .addConditionalEdges("guardrail", routeAfterGuardrail, {
      intentRouter: "intentRouter",
      __end__: END,
    })

    // routeByIntent 返回字符串时使用 path map，
    // 返回 Send 数组时绕过 path map 直接 fan-out
    .addConditionalEdges("intentRouter", routeByIntent, {
      orderAgent: "orderAgent",
      ragNode: "ragNode",
      generalChat: "generalChat",
    })

    // 所有分支汇聚到 answerSynthesizer（fan-in）
    .addEdge("orderAgent", "answerSynthesizer")
    .addEdge("ragNode", "answerSynthesizer")
    .addEdge("generalChat", "answerSynthesizer")
    .addEdge("answerSynthesizer", END);

  return graph.compile({ checkpointer });
};
