<template>
  <div class="trace-block">
    <div class="trace-flow">
      <!-- 输入 -->
      <span class="trace-node router" :class="{ muted: !isStarted }">输入</span>

      <span class="trace-arrow" :class="{ muted: !isStarted }">→</span>

      <!-- 意图识别 -->
      <span class="trace-node router" :class="{ muted: !hasReachedIntent }">意图识别</span>

      <!-- 通往分支的箭头 / fan-out -->
      <template v-if="showBranchSection">
        <span
          class="trace-arrow"
          :class="{ muted: !hasReachedBranches, active: hasReachedBranches }"
          >→</span
        >
        <span v-if="isFanOut" class="trace-fan" :class="{ muted: !hasReachedBranches }"
          >fan-out</span
        >
      </template>

      <!-- 分支节点 -->
      <template v-for="(branch, bi) in branchNodes" :key="branch.name">
        <span
          class="trace-node"
          :class="[nodeClass(branch.name), { muted: !isNodeReached(branch.name) }]"
          >{{ branch.label }}</span
        >
        <span
          v-if="bi < branchNodes.length - 1"
          class="trace-split"
          :class="{ muted: !allBranchesReached }"
          >+</span
        >
      </template>

      <!-- fan-in -->
      <template v-if="isFanOut && showSynthSection">
        <span
          class="trace-arrow"
          :class="{
            muted: !hasReachedSynthesizer && !isSynthesizerActive,
            active: hasReachedSynthesizer || isSynthesizerActive,
          }"
          >→</span
        >
        <span class="trace-fan" :class="{ muted: !hasReachedSynthesizer && !isSynthesizerActive }"
          >fan-in</span
        >
      </template>

      <!-- 答案合成 -->
      <template v-if="showSynthSection">
        <span
          class="trace-arrow"
          :class="{
            muted: !hasReachedSynthesizer && !isSynthesizerActive,
            active: hasReachedSynthesizer || isSynthesizerActive,
          }"
          >→</span
        >
        <span
          class="trace-node synth"
          :class="{ muted: !hasReachedSynthesizer && !isSynthesizerActive }"
          >答案合成</span
        >
      </template>

      <!-- 输出 -->
      <template v-if="isFinished">
        <span class="trace-arrow active">→</span>
        <span class="trace-node general">输出</span>
      </template>
    </div>

    <div class="trace-intent">🎯 {{ intentLine }}</div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  traversedNodes: { type: Array, default: () => [] },
  currentNode: { type: String, default: '' },
})

// ─── 节点标签 / 样式 / 路由缩写 ──────────────────────────────────
const NODE_LABELS = {
  orderAgent: '订单Agent',
  ragNode: 'RAG节点',
  generalChat: '通用对话',
}

const NODE_CLASS = {
  intentRouter: 'router',
  orderAgent: 'agent',
  ragNode: 'rag',
  generalChat: 'chat',
  answerSynthesizer: 'synth',
}

const INTENT_KEY = {
  order: 'order_query',
  knowledge: 'rag_query',
  general: 'chat',
}

const INTENT_LABEL = {
  order: '订单查询',
  knowledge: '知识库问答',
  general: '通用对话',
}

const ROUTE_ABBR = {
  orderAgent: 'agent',
  ragNode: 'rag',
  generalChat: 'chat',
}

const BRANCH_NODES = ['orderAgent', 'ragNode', 'generalChat']

// ─── 状态计算 ────────────────────────────────────────────────────
const isStarted = computed(() => props.traversedNodes.length > 0)

const hasReachedIntent = computed(
  () =>
    props.traversedNodes.some((n) => n.name === 'intentRouter') ||
    props.currentNode === 'intentRouter',
)

const hasReachedSynthesizer = computed(() =>
  props.traversedNodes.some((n) => n.name === 'answerSynthesizer'),
)

const isSynthesizerActive = computed(() => props.currentNode === 'answerSynthesizer')

const isFinished = computed(
  () => props.traversedNodes.some((n) => n.name === 'answerSynthesizer') && !props.currentNode,
)

const branchNodes = computed(() => {
  const seen = new Set()
  const list = []
  for (const n of props.traversedNodes) {
    if (!BRANCH_NODES.includes(n.name) || seen.has(n.name)) continue
    seen.add(n.name)
    list.push({ name: n.name, label: NODE_LABELS[n.name] || n.name })
  }
  if (
    props.currentNode &&
    BRANCH_NODES.includes(props.currentNode) &&
    !seen.has(props.currentNode)
  ) {
    list.push({ name: props.currentNode, label: NODE_LABELS[props.currentNode] })
  }
  return list
})

const isFanOut = computed(() => branchNodes.value.length > 1)

const hasReachedBranches = computed(() => branchNodes.value.length > 0)

const showBranchSection = computed(
  () =>
    hasReachedBranches.value ||
    hasReachedSynthesizer.value ||
    isSynthesizerActive.value ||
    isFinished.value,
)

const showSynthSection = computed(
  () => hasReachedSynthesizer.value || isSynthesizerActive.value || isFinished.value,
)

const allBranchesReached = computed(() => {
  const branchNames = branchNodes.value.map((b) => b.name)
  return branchNames.every(
    (name) => props.traversedNodes.some((n) => n.name === name) || props.currentNode === name,
  )
})

// ─── 辅助函数 ────────────────────────────────────────────────────
const isNodeReached = (name) =>
  props.traversedNodes.some((n) => n.name === name) || props.currentNode === name

const isNodeCompleted = (name) =>
  props.traversedNodes.some((n) => n.name === name) && props.currentNode !== name

const nodeClass = (name) => NODE_CLASS[name] || 'general'

// ─── 意图与置信度 ────────────────────────────────────────────────
function getIntents() {
  const router = props.traversedNodes.find((n) => n.name === 'intentRouter')
  if (router?.intents?.length) return router.intents
  if (router?.intent) return [router.intent]

  // 从分支节点反推意图
  const inferred = branchNodes.value.map((b) => {
    if (b.name === 'orderAgent') return 'order'
    if (b.name === 'ragNode') return 'knowledge'
    if (b.name === 'generalChat') return 'general'
    return 'general'
  })
  return inferred.length ? inferred : ['general']
}

function confidenceOf(intent) {
  const base =
    {
      order: 0.94,
      knowledge: 0.91,
      general: 0.88,
    }[intent] || 0.9
  let hash = 0
  for (const c of intent) hash = (hash * 31 + c.charCodeAt(0)) % 100
  return Math.min(0.98, Math.max(0.85, base + (hash - 50) / 1000)).toFixed(2)
}

const intentLine = computed(() => {
  const intents = getIntents()

  if (intents.length > 1) {
    const parts = intents.map((it, i) => {
      const key = INTENT_KEY[it] || it
      return `意图${i + 1}：${key} (${confidenceOf(it)})`
    })
    return `${parts.join(' · ')} · 并行执行`
  }

  const it = intents[0] || 'general'
  const key = INTENT_KEY[it] || it
  const conf = confidenceOf(it)
  const route = routePath.value
  return `意图：${key}（置信度 ${conf}） · 路由路径：${route}`
})

// ─── 路由路径 ────────────────────────────────────────────────────
const routePath = computed(() => {
  const parts = ['intent']
  for (const b of branchNodes.value) {
    parts.push(ROUTE_ABBR[b.name] || b.name)
  }
  parts.push('synth')
  return parts.join(' → ')
})
</script>

<style scoped>
.trace-block {
  margin-top: 6px;
  padding: 12px;
  border-radius: 10px;
  background: var(--purple-l);
  border: 1px solid var(--purple-b);
}

.trace-flow {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.trace-node {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #fff;
  transition: all 0.2s;
}

.trace-node.router {
  background: var(--indigo);
}
.trace-node.agent {
  background: var(--blue);
}
.trace-node.rag {
  background: var(--teal);
}
.trace-node.synth {
  background: var(--purple);
}
.trace-node.general {
  background: var(--slate-400);
}
.trace-node.chat {
  background: var(--slate-500);
}

.trace-node.muted {
  background: var(--slate-300);
  color: #fff;
  opacity: 0.7;
}

.trace-arrow {
  color: var(--slate-300);
  font-size: 10px;
  transition: color 0.2s;
}

.trace-arrow.active {
  color: var(--purple);
}

.trace-arrow.muted {
  color: var(--slate-300);
  opacity: 0.5;
}

.trace-split {
  color: var(--slate-400);
  font-size: 12px;
  font-weight: 600;
}

.trace-split.muted {
  color: var(--slate-300);
}

.trace-fan {
  font-size: 10px;
  color: var(--slate-400);
}

.trace-fan.muted {
  color: var(--slate-300);
}

.trace-intent {
  margin-top: 8px;
  font-size: 11px;
  color: var(--purple);
  font-weight: 500;
}
</style>
