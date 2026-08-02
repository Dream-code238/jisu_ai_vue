<!--右侧面板：当前节点、节点统计、节点耗时、State 快照-->
<template>
  <div class="workflow-panel">
    <div class="wf-section">
      <div class="wf-head">工作流状态</div>
      <div class="wf-body">
        <div class="wf-card current-node">
          <div class="wf-card-label">当前节点</div>
          <div class="wf-card-value" :style="{ color: currentColor }">
            {{ currentNodeDisplay }}
          </div>
        </div>

        <div class="wf-stat-row">
          <span class="wf-stat-label">总节点数</span>
          <span class="wf-stat-value">{{ totalNodes }}</span>
        </div>
        <div class="wf-stat-row">
          <span class="wf-stat-label">已执行</span>
          <span class="wf-stat-value">{{ executedCount }}</span>
        </div>
        <div class="wf-stat-row">
          <span class="wf-stat-label">并行分支</span>
          <span class="wf-stat-value">{{ parallelBranches }}</span>
        </div>
      </div>
    </div>

    <div class="wf-section">
      <div class="wf-head">节点耗时</div>
      <div class="wf-body">
        <div v-if="mergedTimings.length === 0" class="wf-empty">等待执行...</div>
        <div v-else class="timing-list">
          <div
            v-for="(t, i) in mergedTimings"
            :key="i"
            class="timing-item"
            :class="{ active: t.duration === 0 && currentNode === t.name }"
          >
            <div class="timing-header">
              <span class="timing-label">{{ t.name }}</span>
              <span class="timing-duration">
                {{ t.duration > 0 ? `${t.duration}ms` : '执行中...' }}
              </span>
            </div>
            <div v-if="t.duration > 0" class="timing-bar">
              <div
                class="timing-fill"
                :style="{
                  width: getPercent(t.duration) + '%',
                  background: NODE_COLORS[t.name] || '#6366f1',
                }"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="wf-section">
      <div
        class="wf-head"
        @click="showState = !showState"
        style="cursor: pointer; display: flex; justify-content: space-between; align-items: center"
      >
        <span>State</span>
        <span class="wf-toggle">{{ showState ? '收起' : '展开' }}</span>
      </div>
      <div v-if="showState" class="wf-body">
        <pre class="wf-state">{{ statePreview }}</pre>
      </div>
    </div>

    <div class="wf-section">
      <div class="wf-head">快捷操作</div>
      <div class="wf-body">
        <button class="btn btn-ghost btn-sm wf-action-btn danger" @click="$emit('clear')">
          🗑️ 清空对话
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  currentNode: { type: String, default: '' },
  traversedNodes: { type: Array, default: () => [] },
  nodeTimings: { type: Array, default: () => [] },
  totalDuration: { type: Number, default: 0 },
  steps: { type: Array, default: () => [] },
})

const showState = ref(false)

defineEmits(['clear'])

const NODE_COLORS = {
  guardrail: '#dc2626',
  intentRouter: '#6366f1',
  intent_router: '#6366f1',
  orderAgent: '#2563eb',
  order_agent: '#2563eb',
  ragNode: '#0f766e',
  rag_node: '#0f766e',
  generalChat: '#7c3aed',
  general_chat: '#7c3aed',
  answerSynthesizer: '#6366f1',
  answer_synthesizer: '#6366f1',
}

const NODE_LABELS = {
  guardrail: 'guardrail',
  intentRouter: 'intent_router',
  orderAgent: 'order_agent',
  ragNode: 'rag_node',
  generalChat: 'general_chat',
  answerSynthesizer: 'answer_synthesizer',
}

const currentColor = computed(() =>
  props.currentNode ? NODE_COLORS[props.currentNode] || '#6366f1' : '#22c55e',
)

const currentNodeDisplay = computed(() =>
  props.currentNode ? NODE_LABELS[props.currentNode] || props.currentNode : '已完成',
)

const totalNodes = computed(() => {
  const names = new Set(props.traversedNodes.map((n) => n.name))
  if (props.currentNode) names.add(props.currentNode)
  // 过滤掉 guardrail（原型不展示）
  names.delete('guardrail')
  // 至少包含输入、意图识别、答案合成
  return Math.max(names.size, 3)
})

const executedCount = computed(() => {
  const names = new Set(props.traversedNodes.map((n) => n.name))
  names.delete('guardrail')
  return names.size
})

const parallelBranches = computed(() => {
  const branchNodes = ['orderAgent', 'ragNode', 'generalChat']
  return new Set(
    props.traversedNodes.filter((n) => branchNodes.includes(n.name)).map((n) => n.name),
  ).size
})

// 合并同名节点的计时（取最后一次）
const mergedTimings = computed(() => {
  const map = new Map()
  for (const t of props.nodeTimings) {
    const key = NODE_LABELS[t.name] || t.name
    map.set(key, { ...t, name: key })
  }
  // 用 snake_case 统一输出
  return Array.from(map.values())
})

const getPercent = (duration) => {
  if (props.totalDuration === 0) return 0
  return Math.min(100, Math.round((duration / props.totalDuration) * 100))
}

const statePreview = computed(() => {
  const branchNodes = ['orderAgent', 'ragNode', 'generalChat']
  const intents = (() => {
    const router = props.traversedNodes.find((n) => n.name === 'intentRouter')
    return router?.intents || (router?.intent ? [router.intent] : [])
  })()

  const payload = {
    messages: 1,
    intents,
    nodes: props.traversedNodes
      .filter((n) => n.name !== 'guardrail')
      .map((n) => ({
        name: NODE_LABELS[n.name] || n.name,
        intent: n.intent || undefined,
        intents: n.intents || undefined,
      })),
    steps: props.steps.map((s) => ({
      tool: s.tool,
      input: s.toolInput,
      observation: s.observation || undefined,
    })),
  }
  return JSON.stringify(payload, null, 2)
})
</script>

<style scoped>
.workflow-panel {
  width: 280px;
  background: #fff;
  border-left: 1px solid var(--slate-200);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow-y: auto;
}
.wf-section {
  border-bottom: 1px solid var(--slate-100);
}
.wf-head {
  padding: 12px 16px 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--slate-500);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.wf-toggle {
  font-size: 11px;
  color: var(--slate-400);
  font-weight: 500;
  text-transform: none;
  letter-spacing: 0;
}
.wf-body {
  padding: 0 16px 14px;
}
.wf-card {
  padding: 10px;
  border-radius: 10px;
  background: var(--slate-50);
  border: 1px solid var(--slate-200);
  margin-bottom: 10px;
}
.wf-card.current-node {
  background: var(--purple-l);
  border-color: var(--purple-b);
}
.wf-card-label {
  font-size: 11px;
  color: var(--slate-400);
  margin-bottom: 4px;
}
.wf-card-value {
  font-size: 14px;
  font-weight: 600;
  font-family: 'Fira Code', 'Consolas', monospace;
}
.wf-stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  font-size: 12px;
}
.wf-stat-label {
  color: var(--slate-500);
}
.wf-stat-value {
  font-weight: 600;
  color: var(--slate-700);
}
.wf-empty {
  font-size: 12px;
  color: var(--slate-400);
  text-align: center;
  padding: 8px 0;
}

/* 节点耗时 */
.timing-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.timing-item {
}
.timing-item.active .timing-label {
  color: var(--purple);
}
.timing-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 3px;
}
.timing-label {
  font-size: 12px;
  color: var(--slate-700);
  font-weight: 500;
  font-family: 'Fira Code', 'Consolas', monospace;
}
.timing-duration {
  font-size: 11px;
  color: var(--slate-500);
  font-variant-numeric: tabular-nums;
}
.timing-bar {
  width: 100%;
  height: 4px;
  background: var(--slate-100);
  border-radius: 2px;
  overflow: hidden;
}
.timing-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s ease;
}
.wf-state {
  background: var(--slate-50);
  border: 1px solid var(--slate-200);
  border-radius: 8px;
  padding: 10px;
  font-size: 11px;
  color: var(--slate-600);
  overflow-x: auto;
  max-height: 220px;
  font-family: 'Fira Code', 'Consolas', monospace;
}
.wf-action-btn {
  width: 100%;
  justify-content: center;
}
.wf-action-btn.danger {
  color: var(--red);
}
.wf-action-btn.danger:hover {
  background: var(--red-l);
  border-color: var(--red-b);
}
</style>
