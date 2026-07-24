/**
 * useChat — 基础对话（改造版）
 * 改造说明：使用 useSSEStream 替代内联 fetch+SSE 逻辑
 * 后续 T07 在此基础上追加 sessionId 参数
 */
import { ref } from 'vue'
import { useSSEStream } from './useSSEStream.js'

export function useChat() {
  const messages = ref([])

  const { streaming, streamText, error, startStream, stopStream } = useSSEStream({
    onDone: () => {
      if (streamText.value) {
        messages.value.push({ role: 'assistant', content: streamText.value })
      }
      streamText.value = ''
    },
  })

  const sendMessage = async (userInput, scrollCallback) => {
    if (!userInput.trim() || streaming.value) return

    messages.value.push({ role: 'user', content: userInput })
    const history = messages.value.slice(-10).map(({ role, content }) => ({ role, content }))

    await startStream(
      '/chat/stream',
      { message: userInput, history },
      {
        onScroll: scrollCallback,
      },
    )
  }

  const clearMessages = () => {
    messages.value = []
    error.value = ''
  }

  return { messages, streaming, streamText, error, sendMessage, clearMessages, stopStream }
}
