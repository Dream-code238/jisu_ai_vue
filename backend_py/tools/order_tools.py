"""
Agent 工具定义
对照 JS: tool(async ({orderId}) => {...}, { name, description, schema: z.object({...}) })
Python:  @tool 装饰器 + Pydantic BaseModel 定义 Schema
"""
import json
from langchain_core.tools import tool
from pydantic import BaseModel, Field
from data.mock import orders, logistics


# === Schema 定义（对照 JS 的 z.object） ===

class GetOrderInfoInput(BaseModel):
    orderId: str = Field(description="订单号，格式为 ORD-xxx，例如 ORD-001")


class GetLogisticsInput(BaseModel):
    trackingNo: str = Field(description="快递单号，例如 SF1234567890")


class GetUserOrdersInput(BaseModel):
    userId: str = Field(description="用户 ID，格式为 U-xxx，例如 U-100")


# === 工具实现 ===

@tool(args_schema=GetOrderInfoInput)
def get_order_info(orderId: str) -> str:
    """根据订单号查询订单详情，包括订单状态、商品列表、金额、快递信息。当用户询问订单状态、订单内容时调用。"""
    order = orders.get(orderId)
    if not order:
        return json.dumps({"error": f"订单 {orderId} 不存在"}, ensure_ascii=False)
    return json.dumps(order, ensure_ascii=False)


@tool(args_schema=GetLogisticsInput)
def get_logistics_info(trackingNo: str) -> str:
    """根据快递单号查询物流轨迹，包括各节点时间、地点、状态。当用户询问快递到哪了、物流状态时调用。"""
    records = logistics.get(trackingNo)
    if not records:
        return json.dumps({"error": f"快递单号 {trackingNo} 暂无物流信息"}, ensure_ascii=False)
    return json.dumps({"trackingNo": trackingNo, "records": records}, ensure_ascii=False)


@tool(args_schema=GetUserOrdersInput)
def get_user_orders(userId: str) -> str:
    """根据用户 ID 查询该用户的所有订单列表。当用户询问"我有哪些订单"、"最近的订单"时调用。"""
    user_orders = [o for o in orders.values() if o["userId"] == userId]
    if not user_orders:
        return json.dumps({"error": f"用户 {userId} 暂无订单"}, ensure_ascii=False)
    # 只返回摘要，避免 token 过多
    summary = [
        {"orderId": o["orderId"], "status": o["status"], "amount": o["amount"], "createTime": o["createTime"]}
        for o in user_orders
    ]
    return json.dumps(summary, ensure_ascii=False)


# 所有工具列表
all_tools = [get_order_info, get_logistics_info, get_user_orders]