/**
 * 通用 SSE 流式通信 composable
 * 封装 fetch + ReadableStream + 事件分发
 *
 * @param {Object} callbacks - 事件回调
 * @param {Function} [callbacks.onChunk]     - 逐字输出回调 (content: string)
 * @param {Function} [callbacks.onSources]   - 来源信息回调 (sources: Array)
 * @param {Function} [callbacks.onInterrupt] - HITL中断回调 (detail: Object)
 * @param {Function} [callbacks.onTrace]     - 工作流轨迹回调 (node: Object)
 * @param {Function} [callbacks.onStep]      - Agent步骤回调 (step: Object)
 * @param {Function} [callbacks.onDone]      - 流结束回调 ()
 * @param {Function} [callbacks.onError]     - 错误回调 (error: string)
 *
 * @returns {{ streaming, streamText, error, startStream, stopStream }}
 */
import { ref } from 'vue'

const API_BASE = 'http://localhost:3000/api'

export function useSSEStream(callbacks = {}) {
  const streaming = ref(false)
  const streamText = ref('')
  const error = ref('')
  let controller = null

  /**
   * 发起 SSE 流式请求
   * @param {string} url       - API 路径（如 '/chat/stream'）
   * @param {Object} body      - 请求体
   * @param {Object} [options] - 可选配置
   * @param {Function} [options.onScroll] - 每次收到数据后的滚动回调
   */
  const startStream = async (url, body = {}, options = {}) => {
    if (streaming.value) return

    streaming.value = true
    streamText.value = ''
    error.value = ''
    controller = new AbortController()

    try {
      const response = await fetch(`${API_BASE}${url}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const reader = response.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() // 保留最后不完整的行

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()
          if (!raw) continue
          try {
            const parsed = JSON.parse(raw)
            dispatchEvent(parsed, options.onScroll)
          } catch {
            /* 忽略解析失败的片段 */
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        error.value = `请求失败：${err.message}`
        callbacks.onError?.(error.value)
      }
    } finally {
      streaming.value = false
      controller = null
    }
  }

  const dispatchEvent = (data, onScroll) => {
    if (data.error) {
      error.value = data.error
      callbacks.onError?.(data.error)
      return
    }
    if (data.done) {
      callbacks.onDone?.()
      return
    }

    switch (data.type) {
      case 'chunk':
      case 'answer':
        streamText.value += data.content
        onScroll?.()
        break
      case 'sources':
        callbacks.onSources?.(data.sources)
        break
      case 'interrupt':
        callbacks.onInterrupt?.(data)
        break
      case 'trace':
      case 'node':
        callbacks.onTrace?.(data)
        break
      case 'step':
      case 'steps':
        callbacks.onStep?.(data.steps || data)
        break
      case 'cache_hit':
        callbacks.onCacheHit?.(data)
        break
      case 'handoff':
        callbacks.onHandoff?.(data)
        break
      case 'agent_switch':
        callbacks.onAgentSwitch?.(data)
        break
    }
  }

  const stopStream = () => {
    controller?.abort()
    streaming.value = false
  }

  return { streaming, streamText, error, startStream, stopStream }
}
