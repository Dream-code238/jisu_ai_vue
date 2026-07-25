/**
 * useRag — 知识库问答（T10 双阶段流式版）
 * 改造点：从 /rag/query 切换到 /rag/stream
 * sources 事件先到 → 立即展示来源卡片
 * chunk 事件逐字到达 → 流式显示回答
 */
import { ref } from 'vue'
import { useSSEStream } from './useSSEStream.js'

export function useRag() {
  const messages = ref([])
  const sources = ref([])
  const ragStats = ref({ recallCount: 0, topK: 4, latency: 0 })

  const { streaming, streamText, error, startStream, stopStream } = useSSEStream({
    onSources: (sourceList) => {
      sources.value = sourceList
      ragStats.value.recallCount = sourceList.length
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

    // 使用双阶段流式端点
    await startStream('/rag/stream', { question }, { onScroll: scrollCallback })
  }

  const clearMessages = () => {
    messages.value = []
    sources.value = []
    error.value = ''
  }

  return {
    messages,
    sources,
    streaming,
    streamText,
    error,
    ragStats,
    askQuestion,
    clearMessages,
    stopStream,
  }
}
