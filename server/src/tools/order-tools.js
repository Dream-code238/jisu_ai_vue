// server/src/tools/order-tools.js（T17 改造版）
// 改造点：新增 processRefund 工具，使用 interrupt() 实现 HITL 人工审批
import { tool }      from '@langchain/core/tools';
import { z }         from 'zod';
import { interrupt } from '@langchain/langgraph';
import { orders, logistics } from '../data/mock.js';

export const getOrderInfoTool = tool(
  async ({ orderId }) => {
    const order = orders[orderId];
    if (!order) return JSON.stringify({ error: `订单 ${orderId} 不存在` });
    return JSON.stringify(order);
  },
  {
    name: 'getOrderInfo',
    description:
      '根据订单号查询订单详情，包括订单状态、商品列表、金额、快递信息。当用户询问订单状态、订单内容时调用。',
    schema: z.object({
      orderId: z.string().describe('订单号，格式为 ORD-xxx，例如 ORD-001'),
    }),
  }
);

export const getLogisticsTool = tool(
  async ({ trackingNo }) => {
    const records = logistics[trackingNo];
    if (!records)
      return JSON.stringify({ error: `快递单号 ${trackingNo} 暂无物流信息` });
    return JSON.stringify({ trackingNo, records });
  },
  {
    name: 'getLogisticsInfo',
    description:
      '根据快递单号查询物流轨迹，包括各节点时间、地点、状态。当用户询问快递到哪了、物流状态时调用。',
    schema: z.object({
      trackingNo: z.string().describe('快递单号，例如 SF1234567890'),
    }),
  }
);

export const getUserOrdersTool = tool(
  async ({ userId }) => {
    const userOrders = Object.values(orders).filter((o) => o.userId === userId);
    if (userOrders.length === 0)
      return JSON.stringify({ error: `用户 ${userId} 暂无订单` });
    const summary = userOrders.map((o) => ({
      orderId:    o.orderId,
      status:     o.status,
      amount:     o.amount,
      createTime: o.createTime,
    }));
    return JSON.stringify(summary);
  },
  {
    name: 'getUserOrders',
    description:
      '根据用户 ID 查询该用户的所有订单列表摘要。当用户询问"我有哪些订单"、"最近的订单"时调用。',
    schema: z.object({
      userId: z.string().describe('用户 ID，格式为 U-xxx，例如 U-100'),
    }),
  }
);

/**
 * T17: 退款处理工具 — 需要 HITL 人工审批
 * 调用 interrupt() 暂停图执行，等待用户审批后继续
 */
export const processRefundTool = tool(
  async ({ orderId, reason }) => {
    const order = orders[orderId];
    if (!order) return JSON.stringify({ error: `订单 ${orderId} 不存在` });

    // T17: 触发人工审批中断 — interrupt 的参数会传递给前端 HITLCard
    const decision = interrupt({
      action:      '退款处理',
      description: `用户请求对订单 ${orderId} 进行退款`,
      details: {
        orderId:  orderId,
        amount:   `¥${order.amount}`,
        reason:   reason || '用户未提供原因',
        item:     order.items?.map(i => i.name).join(', ') || '—',
      },
    });

    // interrupt() 返回后，decision 是用户的审批结果
    if (decision === 'approved') {
      return JSON.stringify({
        success: true,
        message: `退款已批准并处理，订单 ${orderId} 退款金额 ¥${order.amount}`,
      });
    } else {
      return JSON.stringify({
        success: false,
        message: `退款请求已被拒绝`,
      });
    }
  },
  {
    name: 'processRefund',
    description:
      '处理订单退款请求。当用户要求退款、退货退款时调用此工具。此操作需要人工审批后才能执行。',
    schema: z.object({
      orderId: z.string().describe('订单号，格式为 ORD-xxx，例如 ORD-001'),
      reason:  z.string().optional().describe('退款原因'),
    }),
  }
);

export const allTools = [getOrderInfoTool, getLogisticsTool, getUserOrdersTool, processRefundTool];
