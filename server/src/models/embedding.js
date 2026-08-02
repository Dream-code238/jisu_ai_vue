// 方式一（推荐）：智谱 AI — 注册地址 https://open.bigmodel.cn
// 方式二：阿里云百炼 — 注册地址 https://bailian.console.aliyun.com
//
// 注意：@langchain/openai v1.5.5 依赖 openai SDK v6.x，与智谱/百炼 API 不兼容
// （embedQuery 返回全零向量），因此改用自定义 Embeddings 实现，直接用 fetch 调用 API
import { Embeddings } from "@langchain/core/embeddings";
import "dotenv/config";

/**
 * 自定义智谱 AI Embeddings（绕过 openai SDK 兼容性问题）
 *
 * 智谱 embedding-3 模型：默认 2048 维，支持 dimensions 参数（512/1024/2048）
 */
class ZhipuEmbeddings extends Embeddings {
  constructor(fields = {}) {
    super(fields);
    this.model = fields.model || "embedding-3";
    this.apiKey = fields.apiKey || process.env.ZHIPU_API_KEY;
    this.baseURL = fields.baseURL || "https://open.bigmodel.cn/api/paas/v4";
    this.dimensions = fields.dimensions || 1024; // 默认 1024 维，平衡精度和存储
  }

  async _embed(texts) {
    if (!this.apiKey) throw new Error("ZHIPU_API_KEY 未配置");

    const body = {
      model: this.model,
      input: texts,
    };
    if (this.dimensions) body.dimensions = this.dimensions;

    const res = await fetch(`${this.baseURL}/embeddings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`智谱 Embedding API 错误 (${res.status}): ${err}`);
    }

    const data = await res.json();
    // 智谱返回格式与 OpenAI 一致：{ data: [{ embedding: [...] }] }
    return data.data.map((item) => item.embedding);
  }

  async embedQuery(text) {
    const [embedding] = await this._embed([text]);
    return embedding;
  }

  async embedDocuments(texts) {
    return this._embed(texts);
  }
}

// 方式一：智谱 AI（默认）
export const embeddings = new ZhipuEmbeddings({
  model: "embedding-3",
  apiKey: process.env.ZHIPU_API_KEY,
  baseURL: "https://open.bigmodel.cn/api/paas/v4",
  dimensions: 1024,
});

// 方式二：阿里云百炼（注释掉方式一，取消注释此段）
// class DashScopeEmbeddings extends Embeddings {
//   constructor(fields = {}) {
//     super(fields);
//     this.model = fields.model || 'text-embedding-v3';
//     this.apiKey = fields.apiKey || process.env.DASHSCOPE_API_KEY;
//     this.baseURL = fields.baseURL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
//     this.dimensions = fields.dimensions || 1024;
//   }
//
//   async _embed(texts) {
//     if (!this.apiKey) throw new Error('DASHSCOPE_API_KEY 未配置');
//     const body = { model: this.model, input: texts };
//     if (this.dimensions) body.dimensions = this.dimensions;
//     const res = await fetch(`${this.baseURL}/embeddings`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${this.apiKey}`,
//       },
//       body: JSON.stringify(body),
//     });
//     if (!res.ok) {
//       const err = await res.text();
//       throw new Error(`百炼 Embedding API 错误 (${res.status}): ${err}`);
//     }
//     const data = await res.json();
//     return data.data.map((item) => item.embedding);
//   }
//
//   async embedQuery(text) {
//     const [embedding] = await this._embed([text]);
//     return embedding;
//   }
//
//   async embedDocuments(texts) {
//     return this._embed(texts);
//   }
// }
//
// export const embeddings = new DashScopeEmbeddings({
//   model: 'text-embedding-v3',
//   apiKey: process.env.DASHSCOPE_API_KEY,
//   baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
//   dimensions: 1024,
// });
