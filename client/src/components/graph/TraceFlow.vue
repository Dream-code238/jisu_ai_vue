<template>
  <div class="trace-flow">
    <div class="trace-start">START</div>
    <template v-for="(node, i) in nodes" :key="i">
      <div class="trace-arrow">→</div>
      <div class="trace-node" :class="{ active: node.name === currentNode }">
        <div class="node-dot" :style="{ background: colorMap[node.name] || '#6366f1' }"></div>
        <div class="node-info">
          <div class="node-label">{{ node.label }}</div>
          <div v-if="node.intent" class="node-intent">
            {{ intentLabels[node.intent] || node.intent }}
          </div>
        </div>
      </div>
    </template>
    <div v-if="nodes.length > 0" class="trace-arrow">→</div>
    <div v-if="nodes.length > 0" class="trace-end">END</div>
  </div>
</template>

<script setup>
import { INTENT_LABELS } from '../../composables/useGraph.js'

defineProps({
  nodes: { type: Array, default: () => [] },
  currentNode: { type: String, default: '' },
})

const colorMap = {
  intentRouter: '#7c3aed',
  orderAgent: '#2563eb',
  ragNode: '#0f766e',
  generalChat: '#6366f1',
  answerSynthesizer: '#f59e0b',
}
const intentLabels = INTENT_LABELS
</script>

<style lang="less" scoped>
.trace-flow {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 12px 24px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow-x: auto;
}
.trace-start,
.trace-end {
  font-size: 11px;
  font-weight: 700;
  color: #94a3b8;
  padding: 4px 8px;
  border-radius: 4px;
  background: #f1f5f9;
}
.trace-arrow {
  font-size: 14px;
  color: #cbd5e1;
}
.trace-node {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 6px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}
.trace-node.active {
  border-color: #2563eb;
  background: #eff6ff;
}
.node-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.node-label {
  font-size: 12px;
  font-weight: 600;
  color: #334155;
}
.node-intent {
  font-size: 10px;
  color: #7c3aed;
}
</style>
