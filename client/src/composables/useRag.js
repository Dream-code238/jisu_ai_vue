/**
 * SSE 事件格式：
 *   { type: 'sources', sources } → 来源列表（阶段 1）
 *   { type: 'cache_hit', cached: true } → 语义缓存命中
 *   { content: "chunk" }         → 流式文本片段（阶段 2，无 type 字段 → default 分支追加）
 *   { done: true }               → 流结束
 *   { type: 'error', content }   → 错误
 */
import { ref } from 'vue'
import { useSSEStream } from './useSSEStream.js'

export function useRag() {
  const messages = ref([])
  const sources = ref([])
  const cachedHit = ref(false)
  const searchTime = ref(0)

  const { streaming, streamText, error, startStream, stopStream } = useSSEStream({
    onSources: (sourceList) => {
      sources.value = sourceList
    },
    onCacheHit: () => {
      cachedHit.value = true
    },
    onDone: () => {
      if (streamText.value) {
        messages.value.push({
          role: 'assistant',
          content: streamText.value,
          meta: {
            mode: '知识库检索',
            sources: [...sources.value],
            cached: cachedHit.value,
            time: searchTime.value ? `${searchTime.value}ms` : '',
          },
        })
      }
      streamText.value = ''
      sources.value = []
      cachedHit.value = false
      searchTime.value = 0
    },
  })

  const askQuestion = async (question, scrollCallback) => {
    if (!question.trim() || streaming.value) return

    messages.value.push({ role: 'user', content: question })
    sources.value = []
    cachedHit.value = false

    // 使用 /rag/stream 双阶段流式端点
    const start = Date.now()
    await startStream(
      '/rag/stream',
      { question },
      {
        onScroll: scrollCallback,
      },
    )
    searchTime.value = Date.now() - start
  }

  const clearMessages = () => {
    messages.value = []
    sources.value = []
    streamText.value = ''
    error.value = ''
    cachedHit.value = false
    searchTime.value = 0
  }

  return { messages, sources, streaming, streamText, error, askQuestion, clearMessages, stopStream }
}
