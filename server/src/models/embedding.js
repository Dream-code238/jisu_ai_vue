import { OpenAIEmbeddings } from "@langchain/openai";
import "dotenv/config";

export const embeddings = new OpenAIEmbeddings({
  modelName: "embedding-3",
  openAIApiKey: process.env.ZHIPU_API_KEY,
  configuration: {
    baseURL: "https://open.bigmodel.cn/api/paas/v4",
  },
});
