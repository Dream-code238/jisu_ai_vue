"""
RAG 检索节点
对照 JS: ragNode
"""
from chains.rag_chain import rag_chain


async def rag_node(state):
    user_input = state["userInput"]
    try:
        result = await rag_chain.ainvoke({"question": user_input})
        return {"ragResult": result}
    except Exception as e:
        print(f"[ragNode] {e}")
        return {"ragResult": "查询知识库时出错"}