"""
基础对话路由
对照 JS: express.Router() + router.post("/stream", ...)
Python:  FastAPI APIRouter + StreamingResponse
"""
import json
from datetime import datetime
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from chains.basic_chat import customer_service_chain, customer_service_stream_chain, format_history

router = APIRouter(prefix="/api/chat", tags=["chat"])


class ChatRequest(BaseModel):
    message: str
    history: list = []


@router.get("/health")
async def health():
    """健康检查"""
    return {"status": "ok", "timestamp": datetime.now().isoformat()}


@router.post("")
async def chat(req: ChatRequest):
    """普通对话接口（一次性返回）"""
    if not req.message:
        return {"error": "message 字段不能为空"}

    try:
        response = await customer_service_chain.ainvoke({
            "user_input": req.message,
            "chat_history": format_history(req.history),
            "current_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        })
        return {"content": response}
    except Exception as e:
        print(f"[Chat Error] {e}")
        return {"error": "服务暂时不可用，请稍后重试"}


@router.post("/stream")
async def chat_stream(req: ChatRequest):
    """
    流式对话接口（SSE）

    对照 JS:
      res.setHeader("Content-Type", "text/event-stream")
      res.setHeader("Cache-Control", "no-cache")
      ...
      for await (const chunk of stream) { sendData({ content: chunk }) }

    Python 差异：
      - 用 StreamingResponse 替代 res.write()
      - 用 async generator 替代 for await
      - SSE 格式手动拼接：f"data: {json}\\n\\n"
    """
    if not req.message:
        return {"error": "message 字段不能为空"}

    async def generate():
        try:
            # 使用 astream 异步流式获取
            async for chunk in customer_service_stream_chain.astream({
                "user_input": req.message,
                "chat_history": format_history(req.history),
                "current_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            }):
                if chunk:
                    yield f"data: {json.dumps({'content': chunk}, ensure_ascii=False)}\n\n"

            # 发送结束标记
            yield f"data: {json.dumps({'done': True})}\n\n"
        except Exception as e:
            print(f"[Stream Error] {e}")
            yield f"data: {json.dumps({'error': '生成回复时出错，请重试'}, ensure_ascii=False)}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )