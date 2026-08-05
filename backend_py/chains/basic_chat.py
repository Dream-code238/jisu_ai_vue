"""
基础对话 Chain
使用 LCEL 管道语法：Prompt | Model | Parser

对照 JS: customerServicePrompt.pipe(model).pipe(parser)
Python:  customer_service_prompt | model | parser
"""
from langchain_core.output_parsers import StrOutputParser
from langchain_core.messages import HumanMessage, AIMessage
from models.deepseek import create_model
from prompts.customer_service import customer_service_prompt, general_chat_prompt

# 注意：Python 中是 StrOutputParser，不是 StringOutputParser
parser = StrOutputParser()

# 非流式 Chain
model = create_model(temperature=0.5)
customer_service_chain = customer_service_prompt | model | parser

# 流式 Chain
streaming_model = create_model(temperature=0.5, streaming=True)
customer_service_stream_chain = customer_service_prompt | streaming_model | parser

# 通用对话 Chain
general_chat_chain = general_chat_prompt | model | parser


def format_history(history=None):
    """
    工具函数：格式化历史消息

    对照 JS:
      export const formatHistory = (history = []) => {
        return history.map(msg => {
          if (msg.role === "user") return ["human", msg.content]
          if (msg.role === "assistant") return ["assistant", msg.content]
          return null
        }).filter(Boolean)
      }

    Python 差异：返回 Message 对象列表，而不是元组
    """
    if history is None:
        history = []

    messages = []
    for msg in history:
        if msg.get("role") == "user":
            messages.append(HumanMessage(content=msg["content"]))
        elif msg.get("role") == "assistant":
            messages.append(AIMessage(content=msg["content"]))
    return messages