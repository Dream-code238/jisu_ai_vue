"""
订单查询节点 - 在工作流中调用 ReAct Agent
对照 JS: orderAgentNode
"""
from langgraph.prebuilt import create_react_agent
from langchain_core.messages import HumanMessage
from models.deepseek import create_model
from tools.order_tools import all_tools

model = create_model(temperature=0)
agent_app = create_react_agent(
    model,
    tools=all_tools,
    prompt="""你是极速购的订单查询助手。
    根据用户的问题，调用相应工具查询订单或物流信息。
    只查询数据，不需要生成最终的客服回答。""",
)


async def order_agent_node(state):
    user_input = state["userInput"]
    try:
        result = await agent_app.ainvoke({
            "messages": [HumanMessage(content=user_input)],
        })

        # 从消息列表提取工具调用步骤
        msgs = result["messages"]
        steps = []
        for i, msg in enumerate(msgs):
            if hasattr(msg, "tool_calls") and msg.tool_calls:
                for tc in msg.tool_calls:
                    steps.append({
                        "tool": tc["name"],
                        "input": tc["args"],
                        "obs": msgs[i + 1].content if i + 1 < len(msgs) else "",
                    })

        final_msg = msgs[-1]
        return {"orderResult": {"answer": final_msg.content, "steps": steps}}
    except Exception as e:
        print(f"[orderAgentNode] {e}")
        return {"orderResult": {"answer": "查询订单信息时出错", "steps": []}}