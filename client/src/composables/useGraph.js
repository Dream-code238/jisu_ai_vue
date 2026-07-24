/**
 * useGraph — 智能中枢（改造版）
 * 改造说明：使用 useSSEStream 替代内联 fetch+SSE 逻辑
 * 保留 node/steps 事件处理
 */
import { ref } from 'vue'
import { useSSEStream } from './useSSEStream.js'

export const NODE_LABELS = {
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

export function useGraph() {
  const messages = ref([])
  const nodes = ref([])
  const steps = ref([])
  const currentNode = ref('')

  const { streaming, streamText, error, startStream, stopStream } = useSSEStream({
    onTrace: (data) => {
      const nodeName = data.node || data.name
      currentNode.value = nodeName
      nodes.value.push({
        name: nodeName,
        label: NODE_LABELS[nodeName] || nodeName,
        intent: data.intent || '',
      })
    },
    onStep: (stepData) => {
      steps.value.push(stepData)
    },
    onDone: () => {
      if (streamText.value) {
        messages.value.push({
          role: 'assistant',
          content: streamText.value,
          meta: {
            mode: 'Graph',
            nodes: [...nodes.value],
            steps: [...steps.value],
          },
        })
      }
      streamText.value = ''
      nodes.value = []
      steps.value = []
    },
  })

  const sendMessage = async (userInput, scrollCallback) => {
    if (!userInput.trim() || streaming.value) return

    messages.value.push({ role: 'user', content: userInput })
    nodes.value = []
    steps.value = []

    const history = messages.value
      .filter((m) => m.content)
      .slice(-10)
      .map(({ role, content }) => ({ role, content }))

    await startStream(
      '/graph/stream',
      { message: userInput, history },
      {
        onScroll: scrollCallback,
      },
    )
  }

  const clearMessages = () => {
    messages.value = []
    nodes.value = []
    steps.value = []
    currentNode.value = ''
    error.value = ''
  }

  return {
    messages,
    streaming,
    streamText,
    nodes,
    steps,
    currentNode,
    error,
    sendMessage,
    clearMessages,
    stopStream,
  }
}
