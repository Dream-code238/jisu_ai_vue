"""
RAG 知识库路由
对照 JS: router.post("/query", ...) + ragChainWithSources.invoke()
"""
import json
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from chains.rag_chain import rag_chain_with_sources_invoke

router = APIRouter(prefix="/api/rag", tags=["rag"])


class RagRequest(BaseModel):
    question: str


@router.post("/query")
async def rag_query(req: RagRequest):
    if not req.question:
        return {"error": "question 不能为空"}

    async def generate():
        try:
            result = await rag_chain_with_sources_invoke(req.question)

            # 先推送引用来源
            if result.get("sources"):
                yield f"data: {json.dumps({'type': 'sources', 'sources': result['sources']}, ensure_ascii=False)}\n\n"

            # 再推送回答
            yield f"data: {json.dumps({'type': 'answer', 'content': result['answer']}, ensure_ascii=False)}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
        except Exception as e:
            print(f"[RAG Error] {e}")
            yield f"data: {json.dumps({'type': 'error', 'content': '查询出错，请重试'}, ensure_ascii=False)}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )