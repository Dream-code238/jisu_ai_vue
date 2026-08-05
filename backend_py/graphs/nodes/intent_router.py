"""
意图识别节点
对照 JS: intentRouterNode + routeByIntent
"""
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from models.deepseek import create_model

intent_prompt = ChatPromptTemplate.from_messages([
    ("system", """你是一个意图分类器。

    根据用户的问题，返回以下三个分类之一，只返回分类词，不要有任何其他内容：

    - order：用户询问订单状态、物流信息、退款进度等需要查询订单数据的问题
    - knowledge：用户询问商品介绍、规格参数、售后政策、退换货规则等可从知识库获取的问题
    - general：其他类型的对话、闲聊、无法归类的问题

    只输出一个词：order 或 knowledge 或 general"""),
    ("human", "{userInput}"),
])

chain = intent_prompt | create_model(temperature=0) | StrOutputParser()


async def intent_router_node(state):
    """意图识别节点函数"""
    user_input = state["userInput"]

    raw = await chain.ainvoke({"userInput": user_input})
    intent = raw.strip().lower()

    # 容错处理：如果模型返回了不在预期内的值，默认走 general
    VALID_INTENTS = ["order", "knowledge", "general"]
    final_intent = intent if intent in VALID_INTENTS else "general"

    print(f'[intentRouter] "{user_input}" -> {final_intent}')
    return {"intent": final_intent}


def route_by_intent(state):
    """条件边函数：根据 intent 决定下一个节点"""
    mapping = {
        "order": "orderAgent",
        "knowledge": "ragNode",
        "general": "generalChat",
    }
    return mapping.get(state["intent"], "generalChat")