/**
 * 后端 SSE 事件：
 *   { type: 'node', node, intent? } → 节点轨迹（记录时间戳）
 *   { type: 'steps', steps } → 工具步骤
 *   { type: 'answer', content } → 完整答案
 *   { type: 'block', reason } → 安全拦截（T16）
 *   { type: 'interrupt', threadId, action, ... } → HITL 中断（T17）
 *   { done: true } / { type: 'done' } → 流结束
 *   { error: "..." } → 错误
 */
import { ref, computed } from 'vue'
import { useSSEStream } from './useSSEStream.js'

export const NODE_LABELS = {
  guardrail: '安全护栏',
  intentRouter: '意图路由',
  orderAgent: '订单查询',
  ragNode: '知识库检索',
  generalChat: '通用对话',
  answerSynthesizer: '答案综合',
}

export const INTENT_LABELS = {
  order: '订单查询',
  knowledge: '知识库问答',
  general: '通用对话',
}

// 图结构定义（用于 FlowTrace 可视化）
// 坐标调整以容纳 guardrail 节点，支持 fan-out/fan-in 可视化
export const GRAPH_STRUCTURE = {
  nodes: [
    { name: 'guardrail', label: '安全护栏', x: 20, y: 60, color: '#dc2626' },
    { name: 'intentRouter', label: '意图路由', x: 160, y: 60, color: '#6366f1' },
    { name: 'orderAgent', label: '订单查询', x: 300, y: 0, color: '#2563eb' },
    { name: 'ragNode', label: '知识库检索', x: 300, y: 60, color: '#0f766e' },
    { name: 'generalChat', label: '通用对话', x: 300, y: 120, color: '#7c3aed' },
    { name: 'answerSynthesizer', label: '答案综合', x: 440, y: 60, color: '#6366f1' },
  ],
  edges: [
    { from: 'guardrail', to: 'intentRouter' },
    { from: 'intentRouter', to: 'orderAgent' },
    { from: 'intentRouter', to: 'ragNode' },
    { from: 'intentRouter', to: 'generalChat' },
    { from: 'orderAgent', to: 'answerSynthesizer' },
    { from: 'ragNode', to: 'answerSynthesizer' },
    { from: 'generalChat', to: 'answerSynthesizer' },
  ],
}

export function useGraph() {
  const messages = ref([])
  const nodes = ref([])
  const steps = ref([])
  const sources = ref([]) // RAG 参考来源
  const currentNode = ref('')
  const nodeTimings = ref([])
  const interruptInfo = ref(null) // HITL 中断信息
  let lastNodeTime = null

  const totalDuration = computed(() =>
    nodeTimings.value.reduce((sum, t) => sum + (t.duration || 0), 0),
  )

  const { streaming, streamText, error, startStream, stopStream } = useSSEStream({
    onTrace: (data) => {
      const nodeName = data.node || data.name
      const now = Date.now()

      // 计算上一个节点的耗时
      if (lastNodeTime && nodeTimings.value.length > 0) {
        const lastTiming = nodeTimings.value[nodeTimings.value.length - 1]
        lastTiming.duration = now - lastNodeTime
      }

      currentNode.value = nodeName
      lastNodeTime = now

      nodes.value.push({
        name: nodeName,
        label: NODE_LABELS[nodeName] || nodeName,
        intent: data.intent || '',
        intents: data.intents || null, // 多意图数组
      })

      // 记录节点计时
      nodeTimings.value.push({
        name: nodeName,
        label: NODE_LABELS[nodeName] || nodeName,
        startTime: now,
        duration: 0,
      })
    },
    onStep: (stepData) => {
      if (Array.isArray(stepData)) {
        steps.value = stepData
      } else {
        steps.value.push(stepData)
      }
    },
    // RAG 参考来源回调
    onSources: (srcList) => {
      sources.value = srcList || []
    },
    // HITL 中断回调
    onInterrupt: (data) => {
      interruptInfo.value = {
        id: data.threadId,
        threadId: data.threadId,
        action: data.action || '操作审批',
        description: data.description || '',
        details: data.details || {},
        status: 'pending',
      }
    },
    onDone: () => {
      // 最后一个节点的耗时
      if (lastNodeTime && nodeTimings.value.length > 0) {
        const lastTiming = nodeTimings.value[nodeTimings.value.length - 1]
        lastTiming.duration = Date.now() - lastNodeTime
      }

      if (streamText.value) {
        // 消息头对齐原型 — 单意图「智能中枢 (LangGraph)」/ 多意图「智能中枢 · 多意图并行」
        const intentRouterNode = nodes.value.find((n) => n.name === 'intentRouter')
        const detectedIntents =
          intentRouterNode?.intents || (intentRouterNode?.intent ? [intentRouterNode.intent] : [])
        const isMultiIntent = detectedIntents.length > 1

        messages.value.push({
          role: 'assistant',
          content: streamText.value,
          meta: {
            mode: isMultiIntent ? '智能中枢 · 多意图并行' : '智能中枢 (LangGraph)',
            nodes: [...nodes.value],
            steps: [...steps.value],
            timings: [...nodeTimings.value],
            sources: [...sources.value],
            interrupt: interruptInfo.value ? { ...interruptInfo.value } : null,
          },
        })
      }
      streamText.value = ''
      nodes.value = []
      steps.value = []
      sources.value = []
      currentNode.value = ''
      nodeTimings.value = []
      interruptInfo.value = null
      lastNodeTime = null
    },
  })

  const sendMessage = async (userInput, scrollCallback) => {
    if (!userInput.trim() || streaming.value) return

    messages.value.push({ role: 'user', content: userInput })
    nodes.value = []
    steps.value = []
    sources.value = []
    currentNode.value = ''
    nodeTimings.value = []
    interruptInfo.value = null
    lastNodeTime = null

    const history = messages.value
      .filter((m) => m.content)
      .slice(-8)
      .map(({ role, content }) => ({ role, content }))

    await startStream(
      '/graph/stream',
      { message: userInput, history },
      {
        onScroll: scrollCallback,
      },
    )
  }

  /**
   * 恢复被中断的图执行
   * @param {string} threadId - 中断时返回的线程 ID
   * @param {string} decision - 'approved' 或 'rejected'
   * @param {Function} scrollCallback
   */
  const resumeStream = async (threadId, decision, scrollCallback) => {
    if (streaming.value || !interruptInfo.value) return

    // 更新中断状态
    interruptInfo.value.status = decision

    await startStream(
      '/graph/resume',
      {
        threadId,
        decision,
      },
      {
        onScroll: scrollCallback,
      },
    )
  }

  const clearMessages = () => {
    messages.value = []
    nodes.value = []
    steps.value = []
    sources.value = []
    currentNode.value = ''
    nodeTimings.value = []
    interruptInfo.value = null
    lastNodeTime = null
    error.value = ''
  }

  return {
    messages,
    streaming,
    streamText,
    nodes,
    steps,
    sources,
    currentNode,
    nodeTimings,
    totalDuration,
    interruptInfo,
    error,
    sendMessage,
    resumeStream,
    clearMessages,
    stopStream,
  }
}
