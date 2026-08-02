import { ref } from 'vue'
import { useSSEStream } from './useSSEStream.js'

const API_BASE = 'http://localhost:3000/api'

export function useChat(sessionIdRef) {
  const messages = ref([])
  const cacheHit = ref(false) // 缓存命中标记
  const blocked = ref(false) // 安全拦截标记

  const { streaming, streamText, error, startStream, stopStream } = useSSEStream({
    // 语义缓存命中回调
    onCacheHit: () => {
      cacheHit.value = true
    },
    // 安全护栏拦截回调
    onBlock: () => {
      blocked.value = true
    },
    onDone: () => {
      if (streamText.value) {
        messages.value.push({
          role: 'assistant',
          content: streamText.value,
          meta: {
            cached: cacheHit.value, // 缓存命中标记（前端显示⚡徽章）
            blocked: blocked.value, // 安全拦截标记（前端显示🛡️徽章）
            time: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
          },
        })
        // 首条消息后更新会话标题
        if (sessionIdRef?.value && messages.value.length === 1) {
          updateSessionTitle(sessionIdRef.value, messages.value[0].content.slice(0, 30))
        }
      }
      streamText.value = ''
      cacheHit.value = false // 重置缓存标记
      blocked.value = false // 重置拦截标记
    },
  })

  /**
   * 加载会话历史消息
   * @param {string} sessionId
   */
  const loadHistory = async (sessionId) => {
    if (!sessionId) return
    try {
      const res = await fetch(`${API_BASE}/chat/history/${sessionId}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      messages.value = data.map((m) => ({
        role: m.role,
        content: m.content,
      }))
    } catch (err) {
      console.error('加载历史失败:', err.message)
    }
  }

  const sendMessage = async (userInput, scrollCallback) => {
    if (!userInput.trim() || streaming.value) return

    messages.value.push({ role: 'user', content: userInput })

    const history = messages.value
      .filter((m) => m.content)
      .slice(-10)
      .map(({ role, content }) => ({ role, content }))

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
    cacheHit.value = false
    blocked.value = false
    error.value = ''
  }

  return {
    messages,
    streaming,
    streamText,
    cacheHit,
    blocked,
    error,
    sendMessage,
    clearMessages,
    loadHistory,
    stopStream,
  }
}

/**
 * 更新会话标题（静默调用，失败不影响对话）
 */
async function updateSessionTitle(sessionId, title) {
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
