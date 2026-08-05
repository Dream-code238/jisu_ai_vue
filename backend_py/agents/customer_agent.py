"""
Agent 创建 - ReAct 模式
对照 JS: createReactAgent({ llm, tools, prompt })
Python:  create_react_agent(model, tools=tools, prompt=prompt)
"""
from langgraph.prebuilt import create_react_agent
from models.deepseek import create_model
from tools.order_tools import all_tools

model = create_model(temperature=0)

SYSTEM_PROMPT = """你是极速购电商平台的智能客服助手小购。

回答规则：
1. 需要查询数据时，先调用对应工具获取真实数据，不要猜测或编造
2. 语气友好，称呼用户为"亲"
3. 拿到数据后用自然语言组织回答，不要直接粘贴 JSON
4. 如果用户没有提供订单号但需要查询，先询问订单号

当前时间：{time}""".format(time=__import__("datetime").datetime.now().strftime("%Y-%m-%d %H:%M:%S"))


def create_customer_agent():
    """
    对照 JS:
      export const createCustomerAgent = () =>
        createReactAgent({ llm: model, tools: allTools, prompt: SYSTEM_PROMPT })

    Python 差异：model 是第一个位置参数，不是 { llm } 对象
    """
    return create_react_agent(model, tools=all_tools, prompt=SYSTEM_PROMPT)