<!--展示每个节点的执行时间，帮助理解工作流性能瓶颈-->
<template>
  <div class="timing-panel">
    <div class="panel-title">
      <span>节点耗时</span>
      <span v-if="totalDuration > 0" class="total-time">{{ formatMs(totalDuration) }}</span>
    </div>
    <div v-if="timings.length === 0" class="empty-hint">等待执行...</div>
    <div v-else class="timing-list">
      <div
        v-for="(timing, i) in timings"
        :key="i"
        class="timing-item"
        :class="{ active: timing.duration === 0 }"
      >
        <div class="timing-header">
          <span class="timing-label">{{ timing.label }}</span>
          <span class="timing-duration">
            {{ timing.duration > 0 ? formatMs(timing.duration) : '执行中...' }}
          </span>
        </div>
        <div class="timing-bar" v-if="timing.duration > 0">
          <div
            class="timing-fill"
            :style="{
              width: getPercent(timing.duration) + '%',
              background: getColor(timing.name),
            }"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  timings: { type: Array, default: () => [] },
  totalDuration: { type: Number, default: 0 },
})

const NODE_COLORS = {
  intentRouter: '#6366f1',
  orderAgent: '#2563eb',
  ragNode: '#0f766e',
  generalChat: '#7c3aed',
  answerSynthesizer: '#6366f1',
}

const formatMs = (ms) => {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

const getColor = (name) => NODE_COLORS[name] || '#6366f1'

const getPercent = (duration) => {
  if (props.totalDuration === 0) return 0
  return Math.round((duration / props.totalDuration) * 100)
}
</script>

<style scoped>
.timing-panel {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 8px;
}
.panel-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.total-time {
  color: #6366f1;
  font-size: 13px;
}
.empty-hint {
  font-size: 12px;
  color: #94a3b8;
  text-align: center;
  padding: 8px 0;
}
.timing-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.timing-item {
  padding: 4px 0;
}
.timing-item.active .timing-label {
  color: #6366f1;
}
.timing-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 3px;
}
.timing-label {
  font-size: 12px;
  color: #334155;
  font-weight: 500;
}
.timing-duration {
  font-size: 11px;
  color: #64748b;
  font-variant-numeric: tabular-nums;
}
.timing-bar {
  width: 100%;
  height: 4px;
  background: #f1f5f9;
  border-radius: 2px;
  overflow: hidden;
}
.timing-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s ease;
}
</style>
