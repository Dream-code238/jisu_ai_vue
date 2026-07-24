# 极速购 AI 客服系统

## 一、项目介绍

## 二、功能扩展

### 1. 依赖变更

#### (1) 前端依赖

- chart.js 图表库（KPI sparkline/柱状图/环形图）
- chartjs-adapter-date-fns 日期适配（sparkline时间轴，可选）

### (2) 后端依赖

- multer （multipart/form-data）文件上传中间件
- @langchain/community （PGVectorStore + 各种loader）
- @langchain/langgraph-checkpoint-postgres LangGraph 持久化（PostgresSaver checkpointer）
- pdf-parse 轻量 PDF 解析
- mammoth .docx -> 纯文本
