/**
 * useRag — 知识库问答（改造版）
 * 改造说明：使用 useSSEStream 替代内联 fetch+SSE 逻辑
 * 保留 sources 事件处理，T10 将改为双阶段流式（/rag/stream）
 */
import { ref } from 'vue'
import { useSSEStream } from './useSSEStream.js'

export function useRag() {
  const messages = ref([])
  const sources = ref([])

  const { streaming, streamText, error, startStream, stopStream } = useSSEStream({
    onSources: (sourceList) => {
      sources.value = sourceList
    },
    onDone: () => {
      if (streamText.value) {
        messages.value.push({
          role: 'assistant',
          content: streamText.value,
          meta: { mode: 'RAG', sources: [...sources.value] },
        })
      }
      streamText.value = ''
      sources.value = []
    },
  })

  const askQuestion = async (question, scrollCallback) => {
    if (!question.trim() || streaming.value) return

    messages.value.push({ role: 'user', content: question })
    sources.value = []

    // T10 将改为 /rag/stream（双阶段流式）
    await startStream(
      '/rag/query',
      { question },
      {
        onScroll: scrollCallback,
      },
    )
  }

  const clearMessages = () => {
    messages.value = []
    sources.value = []
    error.value = ''
  }

  return { messages, sources, streaming, streamText, error, askQuestion, clearMessages, stopStream }
}
