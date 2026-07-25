import { Annotation, MessagesAnnotation } from "@langchain/langgraph";

export const GraphState = Annotation.Root({
  // 当前用户输入
  userInput: Annotation({
    reducer: (_, next) => next,
    default: () => "",
  }),

  // 支持多意图
  intents: Annotation({ reducer: (a, b) => [...a, ...b], default: () => [] }),

  // 订单 Agent 结果
  orderResult: Annotation({
    reducer: (_, next) => next,
    default: () => null,
  }),

  // RAG 检索结果
  ragResult: Annotation({
    reducer: (_, next) => next,
    default: () => "",
  }),

  // 最终回答
  finalAnswer: Annotation({
    reducer: (_, next) => next,
    default: () => "",
  }),
  // 并行结果收集
  parallelResults: Annotation({
    reducer: (a, b) => [...a, ...b],
    default: () => [],
  }),
  // 继承内置的消息列表管理
  ...MessagesAnnotation.spec,
});
