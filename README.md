# 极速购 AI 客服系统

## 项目介绍

这是一个面向电商客服场景的全栈 AI Demo，重点展示大模型在客服场景中的落地方式。当前项目实现了基础对话、Agent 工具调用、LangGraph 工作流编排以及 RAG 知识库问答四种交互模式，适合作为 AI Agent 与 LLM 应用工程化实践的展示项目。

## 项目定位

该项目定位为“AI 客服 Demo”，重点验证意图理解、工具调用、工作流分发和知识库增强等能力，而不是一个完整的生产级订单审批平台。它更适合用于展示 AI Agent、RAG、工作流编排与前后端协同开发的实践思路。

## 核心功能

- 基础聊天：支持多轮对话、流式输出和上下文交互
- Agent 模式：通过 LangChain React Agent 调用订单查询、物流查询和用户订单查询工具
- Graph 模式：通过 LangGraph 实现意图识别、节点分流和最终答案汇总
- RAG 模式：基于商品手册和售后政策构建知识库问答，并展示参考来源
- 交互展示：提供 Chat、Agent、Graph、RAG 四种页面视图，便于对比不同 AI 应用模式

## 技术栈

- 前端：Vue 3、Vue Router、Vite、Pinia
- 后端：Node.js、Express
- AI / Agent：LangChain、LangGraph
- 模型接入：DeepSeek / OpenAI 兼容模型
- 数据库：PostgreSQL、pgvector
- 其他能力：SSE 流式响应、RAG 检索、Mock 数据

## 项目亮点

- 实现了完整的前后端协同闭环，能够直接运行并演示 AI 客服流程
- 展示了从基础对话到 Agent 工具调用，再到工作流编排和 RAG 检索的完整演进路径
- 通过节点执行轨迹和工具调用步骤，直观展示 Agent 的推理过程
- 具备较好的模块化结构，便于继续扩展为更复杂的企业级客服系统

## 技术亮点

- 使用 LangGraph 的 StateGraph 构建多节点工作流，实现意图识别与任务分发
- 通过工具封装将大模型推理与业务逻辑解耦，提高系统可控性
- 结合 RAG 与向量数据库提升知识问答的可靠性与可解释性
- 使用 SSE 实现流式输出，提升对话体验
- 采用前后端分离架构，便于接口扩展与功能演进

## 适合简历的技术关键词

- Vue 3 / Vite
- Node.js / Express
- LangChain / LangGraph
- AI Agent
- RAG / 向量检索
- PostgreSQL / pgvector
- SSE 流式输出
- Prompt Engineering
- Tool Calling / 工具调用
- 前后端协同开发
- LLM 应用 Demo

## 项目总结

这是一个以电商客服场景为背景、聚焦 AI Agent、工作流编排和 RAG 的全栈 Demo 项目，体现了在大模型应用、工具调用、知识库增强和前后端协同开发方面的实践能力。

## 当前说明

- 以 Demo 为主，订单与物流数据使用 Mock 数据，不直接接入真实 ERP / 订单系统
