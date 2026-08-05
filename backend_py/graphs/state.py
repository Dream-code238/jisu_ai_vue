"""
工作流状态定义
对照 JS: Annotation.Root({ ...MessagesAnnotation.spec, userInput: Annotation({...}), ... })
Python:  TypedDict + Annotated[类型, reducer函数]
"""
from typing import TypedDict, Annotated, Optional
from langgraph.graph.message import add_messages


class GraphState(TypedDict):
    # 继承内置的消息列表管理（add_messages reducer 会自动追加消息）
    messages: Annotated[list, add_messages]

    # 当前用户输入
    userInput: str

    # 意图识别结果：order | knowledge | general
    intent: str

    # 订单 Agent 结果
    orderResult: Optional[dict]

    # RAG 检索结果
    ragResult: str

    # 最终回答
    finalAnswer: str