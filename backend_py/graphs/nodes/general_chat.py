"""
通用对话节点
对照 JS: generalChatNode
"""
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.output_parsers import StrOutputParser
from langchain_core.messages import HumanMessage, AIMessage
from models.deepseek import create_model

prompt = ChatPromptTemplate.from_messages([
    ("system", '你是极速购电商平台的客服助手小购。语气友好，称呼用户为"亲"，回复简洁。'),
    MessagesPlaceholder("chat_history"),
    ("human", "{userInput}"),
])

chain = prompt | create_model(temperature=0.7) | StrOutputParser()


async def general_chat_node(state):
    user_input = state["userInput"]
    messages = state.get("messages", [])

    # 从 messages 里取历史
    chat_history = []
    for m in messages[-8:]:
        if isinstance(m, HumanMessage):
            chat_history.append(m)
        elif isinstance(m, AIMessage):
            chat_history.append(m)

    result = await chain.ainvoke({"userInput": user_input, "chat_history": chat_history})
    return {"finalAnswer": result}