<template>
  <div class="approval-card" :class="status">
    <div class="card-header">
      <span class="card-icon">{{ iconMap[status] }}</span>
      <span class="card-title">{{ titleMap[status] }}</span>
    </div>
    <div class="card-body">
      <div class="detail-row">
        <span class="label">操作：</span>
        <strong>{{ detail.action }}</strong>
      </div>
      <div class="detail-row">
        <span class="label">目标：</span>
        <strong>{{ detail.target }}</strong>
      </div>
      <div v-if="detail.reason" class="detail-row">
        <span class="label">原因：</span>
        <span>{{ detail.reason }}</span>
      </div>
    </div>
    <div v-if="status === 'pending'" class="card-actions">
      <button class="approve-btn" @click="$emit('approve')">✓ 批准执行</button>
      <button class="reject-btn" @click="$emit('reject')">✗ 拒绝</button>
    </div>
    <div v-if="status === 'approved'" class="card-result">已批准，正在执行...</div>
    <div v-if="status === 'rejected'" class="card-result">已拒绝</div>
    <div v-if="status === 'processing'" class="card-result">执行中...</div>
  </div>
</template>

<script setup>
defineProps({
  status: { type: String, default: 'pending' }, // pending | approved | rejected | processing
  detail: { type: Object, default: () => ({}) },
})
defineEmits(['approve', 'reject'])

const iconMap = { pending: '⏸️', approved: '✅', rejected: '❌', processing: '⏳' }
const titleMap = {
  pending: '需要审批',
  approved: '已批准',
  rejected: '已拒绝',
  processing: '执行中',
}
</script>

<style lang="less" scoped>
.approval-card {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  margin: 8px 0;
  background: #fff;
}
.approval-card.pending {
  border-color: #f59e0b;
  background: #fffbeb;
}
.approval-card.approved {
  border-color: #22c55e;
}
.approval-card.rejected {
  border-color: #ef4444;
}
.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.card-icon {
  font-size: 18px;
}
.card-title {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}
.card-body {
  margin-bottom: 12px;
}
.detail-row {
  display: flex;
  gap: 6px;
  padding: 4px 0;
  font-size: 13px;
}
.label {
  color: #64748b;
}
.card-actions {
  display: flex;
  gap: 8px;
}
.approve-btn,
.reject-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
}
.approve-btn {
  background: #22c55e;
  color: #fff;
}
.reject-btn {
  background: #ef4444;
  color: #fff;
}
.card-result {
  font-size: 13px;
  color: #64748b;
  padding: 4px 0;
}
</style>
