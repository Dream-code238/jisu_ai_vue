"""
LangGraph 工作流定义
对照 JS: buildCustomerGraph()
"""
from langgraph.graph import StateGraph, START, END
from graphs.state import GraphState
from graphs.nodes.intent_router import intent_router_node, route_by_intent
from graphs.nodes.order_agent import order_agent_node
from graphs.nodes.rag_node import rag_node
from graphs.nodes.general_chat import general_chat_node
from graphs.nodes.answer_synthesizer import answer_synthesizer_node


def build_customer_graph():
    """
    对照 JS:
      const graph = new StateGraph(GraphState)
        .addNode("intentRouter", intentRouterNode)
        .addNode("orderAgent", orderAgentNode)
        ...
        .addEdge(START, "intentRouter")
        .addConditionalEdges("intentRouter", routeByIntent, {...})
        .addEdge("orderAgent", "answerSynthesizer")
        ...
        .compile()

    Python 差异：方法名从驼峰改为下划线
    """
    graph_builder = StateGraph(GraphState)

    # 注册节点
    graph_builder.add_node("intentRouter", intent_router_node)
    graph_builder.add_node("orderAgent", order_agent_node)
    graph_builder.add_node("ragNode", rag_node)
    graph_builder.add_node("generalChat", general_chat_node)
    graph_builder.add_node("answerSynthesizer", answer_synthesizer_node)

    # 入口：START → 意图识别
    graph_builder.add_edge(START, "intentRouter")

    # 条件路由：意图识别完成后，根据 intent 分流
    graph_builder.add_conditional_edges(
        "intentRouter",
        route_by_intent,
        {
            "orderAgent": "orderAgent",
            "ragNode": "ragNode",
            "generalChat": "generalChat",
        },
    )

    # 三条路径都汇入答案综合节点
    graph_builder.add_edge("orderAgent", "answerSynthesizer")
    graph_builder.add_edge("ragNode", "answerSynthesizer")
    graph_builder.add_edge("generalChat", "answerSynthesizer")

    # 出口
    graph_builder.add_edge("answerSynthesizer", END)

    return graph_builder.compile()