# 极速购 AI 客服系统

## 项目定位

这是一个面向电商场景的 AI 客服系统，旨在将“智能对话 + 业务工具调用 + 知识库问答 + 流程审批”融合为一体，展示 AI 在客服场景中的实际应用能力。

## 核心功能

- 智能客服对话：支持自然语言问答，具备上下文理解与多轮对话能力
- Agent 工作流：通过工具调用实现订单查询、物流查询、退款处理等业务动作
- HITL 人工审批：退款等高风险操作支持中断审批，增强系统安全性和业务可控性
- 知识库问答：支持文档上传、文本解析、向量化和知识检索，提高问答准确性
- 会话与状态管理：支持会话历史、语义缓存、任务状态跟踪和流程可视化展示

## 技术栈

- 前端：Vue 3、Vue Router、Vite、Chart.js
- 后端：Node.js、Express
- AI / Agent：LangChain、LangGraph
- 模型接入：DeepSeek/OpenAI 兼容模型
- 数据库：PostgreSQL、pgvector
- 其他：SSE 流式响应、Multer 文件上传、RAG 检索流程

## 项目亮点

- 完整打通了前端交互、后端服务、AI 模型调用和数据库持久化的全链路流程
- 将传统客服问答升级为“可调用工具的 AI Agent”，不仅能回答，还能执行业务动作
- 结合 RAG 技术实现知识库问答，提升复杂问题的回答质量和可解释性
- 引入 HITL 人工审批机制，体现了实际业务场景中的安全控制能力
- 采用模块化架构，前后端职责清晰，适合扩展为真实企业级客服系统

## 适合简历的技术关键词

- Vue 3 / Vite
- Node.js / Express
- LangChain / LangGraph
- RAG / 向量检索
- Agent / Tool Calling
- SSE 流式输出
- PostgreSQL / pgvector
- AI 聊天系统
- Prompt Engineering
- 人工审批流（HITL）

## 项目总结

基于 Vue 3 + Node.js + LangChain + LangGraph 构建的电商 AI 客服系统，集成智能对话、Agent 工具调用、RAG 知识库问答与 HITL 审批流程，具备完整的前后端交互与 AI 工作流能力。
