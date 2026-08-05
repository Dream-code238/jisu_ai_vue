"""
答案综合节点
对照 JS: answerSynthesizerNode
"""
import json
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from models.deepseek import create_model

prompt = ChatPromptTemplate.from_messages([
    ("system", """你是极速购电商平台的客服助手小购。

    根据以下查询结果，为用户生成一个清晰、友好的回答。
    称呼用户为"亲"，回复语气专业，内容简洁准确。

    订单查询结果（如有）：{orderResult}
    知识库查询结果（如有）：{ragResult}"""),
    ("human", "{userInput}"),
])

chain = prompt | create_model(temperature=0.5) | StrOutputParser()


async def answer_synthesizer_node(state):
    user_input = state["userInput"]
    order_result = state.get("orderResult")
    rag_result = state.get("ragResult", "")
    final_answer = state.get("finalAnswer", "")
    intent = state.get("intent", "")

    # general 意图已经在 generalChatNode 生成了 finalAnswer，直接透传
    if intent == "general" and final_answer:
        return {"finalAnswer": final_answer}

    result = await chain.ainvoke({
        "userInput": user_input,
        "orderResult": json.dumps(order_result["answer"], ensure_ascii=False) if order_result else "无",
        "ragResult": rag_result or "无",
    })

    return {"finalAnswer": result}