/**
 * useChat — 基础对话（T07 版本）
 * 基于 T04 改造版，增量添加：
 * 1. sessionIdRef 参数 — 关联当前会话
 * 2. loadHistory() — 加载历史消息
 * 3. sendMessage 传 sessionId 给后端
 * 4. onDone 时更新会话标题
 */
import { ref } from 'vue'
import { useSSEStream } from './useSSEStream.js'

const API_BASE = 'http://localhost:3000/api'

export function useChat(sessionIdRef) {
  const messages = ref([])
  const historyLoaded = ref(false)

  const { streaming, streamText, error, startStream, stopStream } = useSSEStream({
    onDone: () => {
      if (streamText.value) {
        messages.value.push({ role: 'assistant', content: streamText.value })
      }
      streamText.value = ''
      // 首条消息后更新会话标题
      if (sessionIdRef?.value && messages.value.length === 1) {
        updateSessionTitle(sessionIdRef.value, messages.value[0].content.slice(0, 30))
      }
    },
  })

  /**
   * 加载会话历史消息
   * @param {string} sessionId
   */
  const loadHistory = async (sessionId) => {
    try {
      const res = await fetch(`${API_BASE}/chat/history/${sessionId}`)
      const data = await res.json()
      messages.value = data.map((m) => ({ role: m.role, content: m.content }))
      historyLoaded.value = true
    } catch (err) {
      console.error('加载历史失败:', err)
    }
  }

  const sendMessage = async (userInput, scrollCallback) => {
    if (!userInput.trim() || streaming.value) return

    messages.value.push({ role: 'user', content: userInput })
    const history = messages.value.slice(-10).map(({ role, content }) => ({ role, content }))

    await startStream(
      '/chat/stream',
      {
        message: userInput,
        history,
        sessionId: sessionIdRef?.value, // 传给后端用于入库
      },
      {
        onScroll: scrollCallback,
      },
    )
  }

  const clearMessages = () => {
    messages.value = []
    error.value = ''
  }

  return {
    messages,
    streaming,
    streamText,
    error,
    sendMessage,
    clearMessages,
    loadHistory,
    stopStream,
  }
}

async function updateSessionTitle(sessionId, title) {
  // 可选：调用 API 更新会话标题
  try {
    await fetch(`${API_BASE}/chat/session/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    })
  } catch {
    /* 静默失败 */
  }
}
