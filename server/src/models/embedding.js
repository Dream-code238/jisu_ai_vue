import { OpenAIEmbeddings } from "@langchain/openai";
import "dotenv/config";

// 方式一：智谱 AI（默认）
export const embeddings = new OpenAIEmbeddings({
  // modelName: "embedding-3",
  model: "embedding-3",
  // openAIApiKey: process.env.ZHIPU_API_KEY,
  apiKey: process.env.ZHIPU_API_KEY,
  configuration: {
    baseURL: "https://open.bigmodel.cn/api/paas/v4",
  },
});
