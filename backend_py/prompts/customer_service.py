"""
Prompt 模板管理
对照 JS: ChatPromptTemplate.fromMessages([["system", "..."], ["placeholder", "{chat_history}"], ["human", "..."]])
Python:  ChatPromptTemplate.from_messages([("system", "..."), MessagesPlaceholder("chat_history"), ("human", "...")])
"""
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

# 极速购客服 Prompt
customer_service_prompt = ChatPromptTemplate.from_messages([
    ("system", """你是极速购电商平台的专业客服助手小购。

    规则：
    1. 只回答与购物、订单、物流、商品、售后相关的问题
    2. 语气友好、专业，称呼用户为"亲"
    3. 回复简洁，不超过 150 字
    4. 遇到需要人工处理的复杂问题，引导用户拨打 400-888-8888
    5. 不要编造订单信息，没有工具查询时如实告知用户

    当前时间：{current_time}"""),
    MessagesPlaceholder("chat_history"),
    ("human", "{user_input}"),
])

# 通用对话 Prompt（演示用）
general_chat_prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一个有帮助的 AI 助手，用中文回答问题。"),
    MessagesPlaceholder("chat_history"),
    ("human", "{user_input}"),
])