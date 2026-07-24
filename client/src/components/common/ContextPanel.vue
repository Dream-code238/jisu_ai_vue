<template>
  <div class="context-panel">
    <div class="panel-section">
      <div class="section-title">会话信息</div>
      <div class="info-row">
        <span>模型</span><strong>{{ sessionInfo.model || 'deepseek-chat' }}</strong>
      </div>
      <div class="info-row">
        <span>模式</span><strong>{{ sessionInfo.mode || '基础对话' }} </strong>
      </div>
      <div class="info-row">
        <span>消息数</span><strong>{{ sessionInfo.msgCount || 0 }} </strong>
      </div>
    </div>
    <div class="panel-section">
      <div class="section-title">快捷操作</div>
      <button class="action-btn">导出对话</button>
      <button class="action-btn">清空上下文</button>
    </div>
  </div>
</template>

<script setup>
defineProps({ sessionInfo: { type: Object, default: () => ({}) } })
</script>

<style scoped>
.context-panel {
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
.info-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 13px;
}
.info-row span {
  color: #64748b;
}
.info-row strong {
  color: #1e293b;
}
.action-btn {
  display: block;
  width: 100%;
  padding: 8px;
  margin-bottom: 6px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
}
.action-btn:hover {
  background: #f1f5f9;
}
</style>
