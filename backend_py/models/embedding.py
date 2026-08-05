"""
Embedding 模型封装 - 智谱 AI embedding-3
"""
import os
from dotenv import load_dotenv
from langchain_openai import OpenAIEmbeddings

load_dotenv()

# 智谱 AI（兼容 OpenAI 协议，替换 base_url 即可）
embeddings = OpenAIEmbeddings(
    model="embedding-3",
    api_key=os.getenv("ZHIPU_API_KEY"),
    base_url="https://open.bigmodel.cn/api/paas/v4",
)
