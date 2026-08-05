"""
模型封装层 - DeepSeek 对话模型
将 DeepSeek 封装为 LangChain ChatModel
DeepSeek 兼容 OpenAI 协议，使用 ChatOpenAI 并替换 base_url 即可
"""
import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI

load_dotenv()


def create_model(**options):
    """
    创建 DeepSeek 模型实例

    对照 JS:
      export const createModel = (options = {}) => {
        return new ChatOpenAI({ model, apiKey, configuration: { baseURL }, temperature, streaming, ...options })
      }

    Python 差异:
      - configuration.baseURL → 直接传 base_url 参数
      - JS 的 { streaming: false, ...options } 展开会覆盖前面的值
        Python 不允许重复传同一个参数，所以用 dict.update() 实现同样的覆盖效果
    """
    defaults = {
        "model": os.getenv("MODEL_NAME", "deepseek-chat"),
        "api_key": os.getenv("DEEPSEEK_API_KEY"),
        "base_url": os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com/v1"),
        "temperature": 0.7,
        "streaming": False,
    }
    # options 覆盖 defaults（等价于 JS 的 ...options 展开覆盖）
    defaults.update(options)
    return ChatOpenAI(**defaults)


# 默认实例（非流式）
model = create_model()

# 流式实例
streaming_model = create_model(streaming=True)