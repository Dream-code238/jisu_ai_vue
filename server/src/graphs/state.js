import { Annotation, MessagesAnnotation } from "@langchain/langgraph";

export const GraphState = Annotation.Root({
  // 继承内置的消息列表管理
  ...MessagesAnnotation.spec,

  // 当前用户输入
  userInput: Annotation({
    reducer: (_, next) => next,
    default: () => "",
  }),

  // 意图识别结果：order | knowledge | general
  intent: Annotation({
    reducer: (_, next) => next,
    default: () => "",
  }),

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
});
