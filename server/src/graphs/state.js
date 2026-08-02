import { Annotation, MessagesAnnotation } from "@langchain/langgraph";

export const GraphState = Annotation.Root({
  ...MessagesAnnotation.spec,

  userInput: Annotation({
    reducer: (_, next) => next,
    default: () => "",
  }),

  // T16: 安全护栏拦截标记
  guardrailBlocked: Annotation({
    reducer: (_, next) => next,
    default: () => false,
  }),

  // 单意图（保留兼容：取 intents[0]）
  intent: Annotation({
    reducer: (_, next) => next,
    default: () => "",
  }),

  // 多意图数组 — 支持 fan-out 并行执行
  // reducer 使用追加模式，避免并行分支覆盖
  intents: Annotation({
    reducer: (a, b) => [...a, ...b],
    default: () => [],
  }),

  orderResult: Annotation({
    reducer: (_, next) => next,
    default: () => null,
  }),

  ragResult: Annotation({
    reducer: (_, next) => next,
    default: () => "",
  }),

  // 知识库检索来源（供前端参考来源卡片展示）
  ragSources: Annotation({
    reducer: (_, next) => next,
    default: () => [],
  }),

  finalAnswer: Annotation({
    reducer: (_, next) => next,
    default: () => "",
  }),
});
