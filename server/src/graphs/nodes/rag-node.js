import { ragChainWithSourcesAndRerank } from "../../chains/rag-chain.js";

export const ragNode = async (state) => {
  const { userInput } = state;
  try {
    // T20: 使用重排序 + 来源 RAG Chain
    const { answer, sources } = await ragChainWithSourcesAndRerank.invoke({
      question: userInput,
    });
    return { ragResult: answer, ragSources: sources };
  } catch (err) {
    console.error("[ragNode]", err.message);
    return { ragResult: "查询知识库时出错", ragSources: [] };
  }
};
