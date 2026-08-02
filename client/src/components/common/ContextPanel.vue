<template>
  <div class="context-panel">
    <div class="ctx-section">
      <div class="ctx-head">当前会话</div>
      <div class="ctx-body">
        <div class="ctx-card">
          <div class="ctx-card-label">对话模式</div>
          <div class="ctx-card-value" style="color: var(--blue)">
            {{ sessionInfo.mode || '基础对话 (LCEL)' }}
          </div>
        </div>
        <div class="ctx-stat-row">
          <span class="ctx-stat-label">消息数</span>
          <span class="ctx-stat-value">{{ sessionInfo.msgCount || 0 }}</span>
        </div>
        <div class="ctx-stat-row">
          <span class="ctx-stat-label">Token 消耗</span>
          <span class="ctx-stat-value">{{ sessionInfo.tokenCount || 0 }}</span>
        </div>
        <div class="ctx-stat-row">
          <span class="ctx-stat-label">响应耗时</span>
          <span class="ctx-stat-value">{{ sessionInfo.responseTime || '—' }}</span>
        </div>
      </div>
    </div>
    <div class="ctx-section">
      <div class="ctx-head">模型配置</div>
      <div class="ctx-body">
        <div class="ctx-stat-row">
          <span class="ctx-stat-label">模型</span>
          <span class="ctx-stat-value">{{ sessionInfo.model || 'DeepSeek-V4' }}</span>
        </div>
        <div class="ctx-stat-row">
          <span class="ctx-stat-label">Temperature</span>
          <span class="ctx-stat-value">{{ sessionInfo.temperature || '0.7' }}</span>
        </div>
        <div class="ctx-stat-row">
          <span class="ctx-stat-label">上下文窗口</span>
          <span class="ctx-stat-value">{{ sessionInfo.contextWindow || '4096' }}</span>
        </div>
      </div>
    </div>
    <div class="ctx-section">
      <div class="ctx-head">快捷操作</div>
      <div class="ctx-body">
        <button class="btn btn-ghost btn-sm ctx-action-btn" @click="$emit('export')">
          📋 复制对话记录
        </button>
        <button class="btn btn-ghost btn-sm ctx-action-btn danger" @click="$emit('clear')">
          🗑️ 清空对话
        </button>
        <button class="btn btn-ghost btn-sm ctx-action-btn" @click="$emit('export')">
          📥 导出为文件
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  sessionInfo: { type: Object, default: () => ({}) },
})
defineEmits(['export', 'clear'])
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
  display: flex;
  align-items: center;
  justify-content: space-between;
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
  margin-bottom: 6px;
  justify-content: center;
}
.ctx-action-btn:last-child {
  margin-bottom: 0;
}
.ctx-action-btn.danger {
  color: var(--red);
}
.ctx-action-btn.danger:hover {
  background: var(--red-l);
  border-color: var(--red-b);
}
</style>
