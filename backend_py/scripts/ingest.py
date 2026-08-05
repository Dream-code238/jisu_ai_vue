"""
文档入库脚本，执行一次即可，知识库更新时重新执行
运行：python -m scripts.ingest  （在 server/ 目录下执行）

对照 JS: node src/scripts/ingest.js
"""
import os
from pathlib import Path
from dotenv import load_dotenv
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import PGVector
from langchain_core.documents import Document
from models.embedding import embeddings

load_dotenv()

# 数据库连接
PG_USER = os.getenv("PG_USER", "postgres")
PG_PASSWORD = os.getenv("PG_PASSWORD", "123456")
PG_HOST = os.getenv("PG_HOST", "localhost")
PG_PORT = os.getenv("PG_PORT", "5432")
PG_DATABASE = os.getenv("PG_DATABASE", "jisu_ai")
CONNECTION_STRING = f"postgresql://{PG_USER}:{PG_PASSWORD}@{PG_HOST}:{PG_PORT}/{PG_DATABASE}"


def load_docs():
    """1. 加载文档 —— 动态读取 knowledge 目录下所有 .md 文件"""
    knowledge_dir = Path(__file__).parent.parent / "data" / "knowledge"
    docs = []
    for file_path in knowledge_dir.glob("*.md"):
        content = file_path.read_text(encoding="utf-8")
        docs.append(Document(page_content=content, metadata={"source": file_path.name}))
    return docs


def main():
    print("开始处理文档...")

    # 2. 切分文档
    # chunk_size: 每个切片的最大字符数
    # chunk_overlap: 相邻切片的重叠字符数，保证语义不在切割处断裂
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50,
    )

    docs = load_docs()
    print(f"找到 {len(docs)} 个文档文件: {[d.metadata['source'] for d in docs]}")

    chunks = splitter.split_documents(docs)
    print(f"文档切分完成，共 {len(chunks)} 个片段")

    # 3. 向量化并存入 pgvector
    # PGVector.from_documents 会自动创建表（如果不存在）
    PGVector.from_documents(
        documents=chunks,
        embedding=embeddings,
        connection_string=CONNECTION_STRING,
        collection_name="knowledge",
    )

    print("文档入库完成")


if __name__ == "__main__":
    main()