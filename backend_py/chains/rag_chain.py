"""
RAG 检索增强链路
对照 JS: RunnableSequence.from([...])
Python:  使用 | 管道符连接，配合 RunnableParallel 并行执行
"""
import os
from dotenv import load_dotenv
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_community.vectorstores import PGVector
from models.deepseek import create_model
from models.embedding import embeddings

load_dotenv()

# 构建连接字符串
PG_USER = os.getenv("PG_USER", "postgres")
PG_PASSWORD = os.getenv("PG_PASSWORD", "postgres")
PG_HOST = os.getenv("PG_HOST", "localhost")
PG_PORT = os.getenv("PG_PORT", "5432")
PG_DATABASE = os.getenv("PG_DATABASE", "langchain_course")
CONNECTION_STRING = f"postgresql://{PG_USER}:{PG_PASSWORD}@{PG_HOST}:{PG_PORT}/{PG_DATABASE}"

# 1. 初始化向量存储（模块加载时执行一次）
vector_store = PGVector(
    connection_string=CONNECTION_STRING,
    embedding_function=embeddings,
    collection_name="knowledge",
)

# 每次检索返回最相似的 4 个片段
retriever = vector_store.as_retriever(search_kwargs={"k": 4})

# 2. RAG Prompt
rag_prompt = ChatPromptTemplate.from_messages([
    ("system", """你是极速购电商平台的专业客服助手小购。

    请根据以下知识库内容回答用户的问题。
    如果知识库中没有相关内容，请如实告知用户，不要编造信息。
    回答语气友好，称呼用户为"亲"，回复简洁清晰。

    知识库内容：
    {context}"""),
    ("human", "{question}"),
])


# 3. 格式化检索文档
def format_docs(docs):
    """把检索到的文档列表格式化成字符串"""
    return "\n\n---\n\n".join(doc.page_content for doc in docs)


# 4. 组装 RAG Chain
# 对照 JS:
#   RunnableSequence.from([{
#     context: (input) => retriever.pipe(formatDocs).invoke(input.question),
#     question: (input) => input.question,
#   }, ragPrompt, model, parser])
#
# Python 用字典 + 管道符实现同样的并行分支：
model = create_model(temperature=0)

rag_chain = (
    {
        "context": (lambda x: x["question"]) | retriever | format_docs,
        "question": (lambda x: x["question"]),
    }
    | rag_prompt
    | model
    | StrOutputParser()
)


# 5. 带来源信息的版本
# 对照 JS: ragChainWithSources
async def rag_chain_with_sources_invoke(question: str) -> dict:
    """
    返回 { answer, sources } 的字典
    对照 JS 的 ragChainWithSources

    关键改进：sources 按文件名去重
        - PGVector 检索时，长文档被切分成多个 chunks 入库
        - 向量空间相近的多个 chunk 会被 retriever 一起召回
        - 在 sources 列表中按文件名去重，每个文件只保留最相关的那条
        - 前端 <span class="source-tag"> 也就不会再显示重复文件名了
    """
    docs = await retriever.ainvoke(question)
    context = format_docs(docs)
    answer = await (rag_prompt | model | StrOutputParser()).ainvoke({
        "context": context,
        "question": question,
    })

    # 按文件名去重（保留第一条 = 相似度最高的片段）
    sources = []
    seen = set()
    for doc in docs:
        src = doc.metadata.get("source", "unknown")
        if src not in seen:
            sources.append({
                "content": doc.page_content[:100] + "...",
                "source": src,
            })
            seen.add(src)

    return {"answer": answer, "sources": sources}
