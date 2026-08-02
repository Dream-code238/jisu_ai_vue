/**
 * 通用 SSE 流式通信 composable
 * 封装 fetch + ReadableStream + 事件分发，统一处理 4 个后端接口的 SSE 事件
 *
 * 兼容的 SSE 事件格式：
 *   { content: "chunk" }              → 流式文本片段（chat 接口）
 *   { type: 'answer', content: "..." } → 完整答案（agent/rag/graph 接口）
 *   { type: 'sources', sources: [] }   → RAG 来源列表
 *   { type: 'step', tool, toolInput, observation } → Agent 工具步骤
 *   { type: 'steps', steps: [] }       → Graph 步骤列表
 *   { type: 'node', node, intent? }    → Graph 节点轨迹
 *   { type: 'interrupt', ... }         → HITL 审批中断
 *   { type: 'cache_hit' }            → 语义缓存命中（T14）
 *   { type: 'block', reason }        → 安全护栏拦截（T16）
 *   { done: true } / { type: 'done' }  → 流结束
 *   { error: "..." } / { type: 'error', content: "..." } → 错误
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
        buffer = lines.pop() // 保留最后不完整的行，等下次拼接

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

  /**
   * 事件分发 — 统一处理所有后端的 SSE 事件格式
   */
  const dispatchEvent = (data, onScroll) => {
    // 错误处理（兼容两种格式）
    if (data.error) {
      error.value = data.error
      callbacks.onError?.(data.error)
      return
    }
    if (data.type === 'error') {
      error.value = data.content || '未知错误'
      callbacks.onError?.(error.value)
      return
    }

    // 结束标记（兼容两种格式）
    if (data.done === true || data.type === 'done') {
      callbacks.onDone?.()
      return
    }

    // 按类型分发
    switch (data.type) {
      case 'answer':
        // Agent/RAG/Graph 的完整答案 → 设置 streamText
        streamText.value = data.content || ''
        onScroll?.()
        break

      case 'sources':
        callbacks.onSources?.(data.sources || [])
        break

      case 'step':
        callbacks.onStep?.({
          tool: data.tool,
          toolInput: data.toolInput,
          observation: data.observation,
        })
        onScroll?.()
        break

      case 'steps':
        callbacks.onStep?.(data.steps || data)
        onScroll?.()
        break

      case 'node':
      case 'trace':
        callbacks.onTrace?.(data)
        onScroll?.()
        break

      case 'interrupt':
        callbacks.onInterrupt?.(data)
        break

      case 'cache_hit':
        callbacks.onCacheHit?.(data)
        break

      case 'block':
        callbacks.onBlock?.(data)
        break

      case 'handoff':
        callbacks.onHandoff?.(data)
        break

      case 'agent_switch':
        callbacks.onAgentSwitch?.(data)
        break

      default:
        // 无 type 字段 → chat 接口的流式 chunk
        if (data.content) {
          streamText.value += data.content
          onScroll?.()
        }
        break
    }
  }

  const stopStream = () => {
    controller?.abort()
    streaming.value = false
  }

  return { streaming, streamText, error, startStream, stopStream }
}
