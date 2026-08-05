"""
Agent 路由
对照 JS: router.post("/stream", ...) + agentApp.invoke()
"""
import json
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from langchain_core.messages import HumanMessage, AIMessage
from agents.customer_agent import create_customer_agent

router = APIRouter(prefix="/api/agent", tags=["agent"])


class AgentRequest(BaseModel):
    message: str
    history: list = []
    userId: str = "U-100"


@router.post("/stream")
async def agent_stream(req: AgentRequest):
    if not req.message:
        return {"error": "message 不能为空"}

    async def generate():
        try:
            agent_app = create_customer_agent()

            # 将历史记录转为消息对象（排除最后一条，避免重复）
            history_messages = []
            for m in req.history[:-1]:
                if m.get("role") == "user":
                    history_messages.append(HumanMessage(content=m["content"]))
                elif m.get("role") == "assistant":
                    history_messages.append(AIMessage(content=m["content"]))

            result = await agent_app.ainvoke({
                "messages": [*history_messages, HumanMessage(content=req.message)],
            })

            # 从消息列表提取工具调用步骤
            msgs = result["messages"]
            for i, msg in enumerate(msgs):
                if hasattr(msg, "tool_calls") and msg.tool_calls:
                    for tc in msg.tool_calls:
                        tool_result = msgs[i + 1].content if i + 1 < len(msgs) else ""
                        yield f"data: {json.dumps({'type': 'step', 'tool': tc['name'], 'toolInput': tc['args'], 'observation': tool_result}, ensure_ascii=False)}\n\n"

            final_msg = msgs[-1]
            yield f"data: {json.dumps({'type': 'answer', 'content': final_msg.content}, ensure_ascii=False)}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
        except Exception as e:
            print(f"[Agent Error] {e}")
            yield f"data: {json.dumps({'type': 'error', 'content': '处理请求时出错，请重试'}, ensure_ascii=False)}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )