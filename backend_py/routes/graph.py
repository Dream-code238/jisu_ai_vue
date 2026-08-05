"""
LangGraph 工作流路由
对照 JS: router.post("/stream", ...) + g.stream({...}, { streamMode: "updates" })
"""
import json
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from langchain_core.messages import HumanMessage, AIMessage
from graphs.customer_graph import build_customer_graph

router = APIRouter(prefix="/api/graph", tags=["graph"])

# 单例：避免每次请求都重新编译图
_graph = None


def get_graph():
    """对照 JS: let graph = null; const getGraph = () => { if (!graph) graph = buildCustomerGraph(); return graph; }"""
    global _graph
    if _graph is None:
        _graph = build_customer_graph()
    return _graph


class GraphRequest(BaseModel):
    message: str
    history: list = []


@router.post("/stream")
async def graph_stream(req: GraphRequest):
    if not req.message:
        return {"error": "message 不能为空"}

    async def generate():
        try:
            g = get_graph()

            # 把历史消息转成 LangChain Message 格式
            history_messages = []
            for m in req.history:
                if m.get("role") == "user":
                    history_messages.append(HumanMessage(content=m["content"]))
                elif m.get("role") == "assistant":
                    history_messages.append(AIMessage(content=m["content"]))

            # 流式执行图，每个节点执行完毕后触发一次事件
            # 对照 JS: const stream = await g.stream({...}, { streamMode: "updates" })
            # Python:  async for update in g.astream({...}, stream_mode="updates")
            async for update in g.astream(
                {
                    "userInput": req.message,
                    "messages": [*history_messages, HumanMessage(content=req.message)],
                },
                stream_mode="updates",
            ):
                # update 是一个字典 {nodeName: nodeState}
                for node_name, node_state in update.items():
                    # 推送节点执行事件
                    yield f"data: {json.dumps({'type': 'node', 'node': node_name, 'intent': node_state.get('intent')}, ensure_ascii=False)}\n\n"

                    # 推送订单步骤
                    order_result = node_state.get("orderResult")
                    if order_result and isinstance(order_result, dict) and order_result.get("steps"):
                        yield f"data: {json.dumps({'type': 'steps', 'steps': order_result['steps']}, ensure_ascii=False)}\n\n"

                    # 推送最终答案
                    final_answer = node_state.get("finalAnswer")
                    if final_answer:
                        yield f"data: {json.dumps({'type': 'answer', 'content': final_answer}, ensure_ascii=False)}\n\n"

            yield f"data: {json.dumps({'type': 'done'})}\n\n"
        except Exception as e:
            print(f"[Graph Error] {e}")
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