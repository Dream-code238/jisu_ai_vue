"""
FastAPI 主入口
对照 JS:
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use("/api/chat", chatRouter);
  ...
  app.listen(PORT, () => { console.log(...) });

Python 差异：
  - express() → FastAPI()
  - app.use(cors()) → app.add_middleware(CORSMiddleware, ...)
  - app.use("/api/chat", router) → app.include_router(router)
  - app.listen() → uvicorn.run()
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.chat import router as chat_router
from routes.agent import router as agent_router
from routes.rag import router as rag_router
from routes.graph import router as graph_router

app = FastAPI(title="极速购 AI 智能客服系统", version="1.0.0")

# CORS 中间件（对照 app.use(cors())）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由（对照 app.use("/api/xxx", xxxRouter)）
app.include_router(chat_router)
app.include_router(agent_router)
app.include_router(rag_router)
app.include_router(graph_router)


@app.get("/")
async def root():
    return {"message": "极速购 AI 智能客服系统 API", "docs": "/docs"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=3000, reload=True)