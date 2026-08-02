/**
 * 后端 SSE 事件：
 *   { type: 'step', tool, toolInput, observation } → 工具调用步骤
 *   { type: 'interrupt', threadId, action, description, details } → HITL 审批请求
 *   { type: 'answer', content } → 完整答案
 *   { type: 'done' } → 结束
 */
import { ref } from 'vue'
import { useSSEStream } from './useSSEStream.js'

const API_BASE = 'http://localhost:3000/api'

export function useAgent() {
  const messages = ref([])
  const steps = ref([])
  const interrupts = ref([]) // HITL 审批请求列表
  const currentThreadId = ref('') // 保存 interrupt 返回的 threadId
  let scrollCb = null // 保存滚动回调，供 resume 使用

  const { streaming, streamText, error, startStream, stopStream } = useSSEStream({
    onStep: (stepData) => {
      steps.value.push(stepData)
    },
    onInterrupt: (data) => {
      // 收到 HITL 中断请求 — 保存 threadId 用于后续 resume
      currentThreadId.value = data.threadId || ''
      interrupts.value.push({
        id: data.id || `interrupt_${Date.now()}`,
        threadId: data.threadId || '',
        action: data.action || 'unknown',
        description: data.description || '',
        details: data.details || {},
        status: 'pending', // pending / approved / rejected / auto
        timestamp: Date.now(),
      })
    },
    onDone: () => {
      if (streamText.value) {
        messages.value.push({
          role: 'assistant',
          content: streamText.value,
          meta: {
            mode: 'Agent',
            steps: [...steps.value],
            interrupts: [...interrupts.value],
          },
        })
      }
      streamText.value = ''
      steps.value = []
      interrupts.value = []
      currentThreadId.value = ''
    },
  })

  const sendMessage = async (userInput, scrollCallback) => {
    if (!userInput.trim() || streaming.value) return

    messages.value.push({ role: 'user', content: userInput })
    steps.value = []
    interrupts.value = []
    scrollCb = scrollCallback || null

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

  /**
   * 批准 HITL 请求 — 调用后端 /api/agent/resume
   * @param {string} interruptId
   */
  const approveInterrupt = async (interruptId) => {
    const item = interrupts.value.find((i) => i.id === interruptId)
    if (!item) return

    item.status = 'approved'

    // 清空步骤（保留 interrupt 状态用于展示）
    steps.value = []

    // 调用后端恢复执行
    await startStream(
      '/agent/resume',
      {
        threadId: item.threadId || currentThreadId.value,
        decision: 'approved',
      },
      {
        onScroll: scrollCb,
      },
    )
  }

  /**
   * 拒绝 HITL 请求 — 调用后端 /api/agent/resume
   * @param {string} interruptId
   */
  const rejectInterrupt = async (interruptId) => {
    const item = interrupts.value.find((i) => i.id === interruptId)
    if (!item) return

    item.status = 'rejected'

    // 清空步骤（保留 interrupt 状态用于展示）
    steps.value = []

    // 调用后端恢复执行
    await startStream(
      '/agent/resume',
      {
        threadId: item.threadId || currentThreadId.value,
        decision: 'rejected',
      },
      {
        onScroll: scrollCb,
      },
    )
  }

  const clearMessages = () => {
    messages.value = []
    steps.value = []
    interrupts.value = []
    currentThreadId.value = ''
    error.value = ''
  }

  return {
    messages,
    streaming,
    streamText,
    steps,
    interrupts,
    error,
    sendMessage,
    clearMessages,
    stopStream,
    approveInterrupt,
    rejectInterrupt,
  }
}
