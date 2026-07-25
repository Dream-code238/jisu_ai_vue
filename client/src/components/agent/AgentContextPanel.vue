<template>
  <div class="agent-context-panel">
    <div class="panel-section">
      <div class="section-title">Agent 状态</div>
      <div class="status-row">
        <span class="status-dot" :class="status"></span>
        <span>{{ statusMap[status] || status }}</span>
      </div>
    </div>
    <div class="panel-section">
      <div class="section-title">可用工具</div>
      <div v-for="tool in tools" :key="tool.name" class="tool-item">
        <span class="tool-icon">🔧</span>
        <div>
          <div class="tool-name">{{ tool.name }}</div>
          <div class="tool-desc">{{ tool.desc }}</div>
        </div>
      </div>
    </div>
    <div class="panel-section">
      <div class="section-title">推理轮次</div>
      <div class="round-count">{{ roundCount }}</div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  status: { type: String, default: 'idle' }, // idle | thinking | calling_tool | done
  tools: { type: Array, default: () => [] },
  roundCount: { type: Number, default: 0 },
})

const statusMap = { idle: '空闲', thinking: '思考中...', calling_tool: '调用工具', done: '完成' }
</script>

<style lang="less" scoped>
.agent-context-panel {
  width: 280px;
  background: #f8fafc;
  border-left: 1px solid #e2e8f0;
  padding: 16px;
  overflow-y: auto;
}
.panel-section {
  margin-bottom: 20px;
}
.section-title {
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  margin-bottom: 8px;
}
.status-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #334155;
}
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.status-dot.idle {
  background: #cbd5e1;
}
.status-dot.thinking {
  background: #f59e0b;
  animation: pulse 1s infinite;
}
.status-dot.calling_tool {
  background: #2563eb;
}
.status-dot.done {
  background: #22c55e;
}
@keyframes pulse {
  50% {
    opacity: 0.4;
  }
}
.tool-item {
  display: flex;
  gap: 8px;
  padding: 6px 0;
}
.tool-icon {
  font-size: 14px;
}
.tool-name {
  font-size: 12px;
  font-weight: 600;
  color: #2563eb;
}
.tool-desc {
  font-size: 11px;
  color: #64748b;
}
.round-count {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
}
</style>
