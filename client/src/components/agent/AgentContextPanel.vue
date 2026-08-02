<!--
  AgentContextPanel.vue — Agent 上下文面板
  展示 Agent 运行状态、可用工具列表、推理轮次
-->
<template>
  <div class="context-panel">
    <div class="ctx-section">
      <div class="ctx-head">Agent 状态</div>
      <div class="ctx-body">
        <div class="ctx-card">
          <div class="ctx-card-label">当前状态</div>
          <div class="ctx-card-value" :style="{ color: statusColor }">
            {{ statusLabels[status] }}
          </div>
        </div>
        <div class="ctx-stat-row">
          <span class="ctx-stat-label">已用工具</span>
          <span class="ctx-stat-value">{{ stepCount }}</span>
        </div>
        <div class="ctx-stat-row">
          <span class="ctx-stat-label">可用工具</span>
          <span class="ctx-stat-value">{{ tools.length }}</span>
        </div>
        <div class="ctx-stat-row">
          <span class="ctx-stat-label">待审批</span>
          <span class="ctx-stat-value" :style="hitlCount > 0 ? 'color: var(--amber)' : ''">{{
            hitlCount
          }}</span>
        </div>
      </div>
    </div>
    <div class="ctx-section">
      <div class="ctx-head">可用工具</div>
      <div class="ctx-body">
        <div v-for="tool in tools" :key="tool.name" class="ctx-card" style="font-size: 12px">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px">
            <span :style="{ color: currentTool === tool.name ? 'var(--amber)' : 'var(--green)' }"
              >●</span
            >
            <strong>{{ tool.name }}</strong>
          </div>
          <div style="color: var(--slate-400); font-size: 11px">{{ tool.description }}</div>
        </div>
      </div>
    </div>
    <div class="ctx-section">
      <div class="ctx-head">快捷操作</div>
      <div class="ctx-body">
        <button class="btn btn-ghost btn-sm ctx-action-btn danger" @click="$emit('clear')">
          🗑️ 清空对话
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: { type: String, default: 'idle' },
  stepCount: { type: Number, default: 0 },
  currentTool: { type: String, default: '' },
  hitlCount: { type: Number, default: 0 },
})

defineEmits(['clear'])

const statusLabels = {
  idle: '✅ 空闲',
  thinking: '💭 思考中',
  calling_tool: '🔧 调用工具',
  responding: '✍️ 回复中',
}

const statusColor = computed(() => {
  const map = {
    idle: 'var(--green)',
    thinking: 'var(--amber)',
    calling_tool: 'var(--blue)',
    responding: 'var(--green)',
  }
  return map[props.status] || 'var(--slate-600)'
})

const tools = [
  { name: 'getOrderInfo', description: '查询订单详情' },
  { name: 'getLogisticsInfo', description: '查询物流轨迹' },
  { name: 'getUserOrders', description: '查询用户所有订单' },
  { name: 'processRefund', description: '处理退款（需审批）' },
]
</script>

<style scoped>
.context-panel {
  width: 280px;
  background: #fff;
  border-left: 1px solid var(--slate-200);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow-y: auto;
}
.ctx-section {
  border-bottom: 1px solid var(--slate-100);
}
.ctx-head {
  padding: 12px 16px 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--slate-500);
}
.ctx-body {
  padding: 0 16px 14px;
}
.ctx-card {
  padding: 10px;
  border-radius: 10px;
  background: var(--slate-50);
  border: 1px solid var(--slate-200);
  margin-bottom: 8px;
}
.ctx-card-label {
  font-size: 11px;
  color: var(--slate-400);
  margin-bottom: 4px;
}
.ctx-card-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--slate-700);
}
.ctx-stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  font-size: 12px;
}
.ctx-stat-label {
  color: var(--slate-500);
}
.ctx-stat-value {
  font-weight: 600;
  color: var(--slate-700);
}
.ctx-action-btn {
  width: 100%;
  justify-content: center;
}
.ctx-action-btn.danger {
  color: var(--red);
}
.ctx-action-btn.danger:hover {
  background: var(--red-l);
  border-color: var(--red-b);
}
</style>
