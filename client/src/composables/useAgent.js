/**
 * useAgent — Agent 订单查询（改造版）
 * 改造说明：使用 useSSEStream 替代内联 fetch+SSE 逻辑
 * 保留原有 step 事件处理
 */
import { ref } from 'vue'
import { useSSEStream } from './useSSEStream.js'

export function useAgent() {
  const messages = ref([])
  const steps = ref([])

  const { streaming, streamText, error, startStream, stopStream } = useSSEStream({
    onStep: (stepData) => {
      steps.value.push(stepData)
    },
    onDone: () => {
      if (streamText.value) {
        messages.value.push({
          role: 'assistant',
          content: streamText.value,
          meta: { mode: 'Agent', steps: [...steps.value] },
        })
      }
      streamText.value = ''
    },
  })

  const sendMessage = async (userInput, scrollCallback) => {
    if (!userInput.trim() || streaming.value) return

    messages.value.push({ role: 'user', content: userInput })
    steps.value = []

    const history = messages.value
      .filter((m) => m.content)
      .slice(-10)
      .map(({ role, content }) => ({ role, content }))

    await startStream(
      '/agent/stream',
      { message: userInput, history },
      {
        onScroll: scrollCallback,
      },
    )
  }

  const clearMessages = () => {
    messages.value = []
    steps.value = []
    error.value = ''
  }

  return { messages, streaming, streamText, steps, error, sendMessage, clearMessages, stopStream }
}
