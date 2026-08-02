<!--
  HITLCard.vue — Human-in-the-Loop 审批卡片
  4 种状态：pending / approved / rejected / auto
-->
<template>
  <div class="hitl-card">
    <div class="hitl-head">
      <span class="hitl-badge" :class="interrupt.status">
        <span v-if="interrupt.status === 'pending'">⏸ 待审批</span>
        <span v-if="interrupt.status === 'approved'">✅ 已批准</span>
        <span v-if="interrupt.status === 'rejected'">❌ 已拒绝</span>
        <span v-if="interrupt.status === 'auto'">⚡ 自动批准</span>
      </span>
      <span class="hitl-title">{{ interrupt.action || '操作审批' }}</span>
    </div>
    <div class="hitl-desc">
      {{ interrupt.description || 'Agent 请求执行操作，需要人工确认后继续执行。' }}
    </div>
    <div v-if="hasDetails" class="hitl-detail">
      <div v-for="(value, key) in interrupt.details" :key="key">
        <strong>{{ detailLabels[key] || key }}：</strong>{{ value }}
      </div>
    </div>
    <div v-if="interrupt.status === 'pending'" class="hitl-actions">
      <button class="hitl-btn hitl-approve" @click="$emit('approve', interrupt.id)">✓ 批准</button>
      <button class="hitl-btn hitl-reject" @click="$emit('reject', interrupt.id)">✕ 拒绝</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  interrupt: { type: Object, required: true },
})

defineEmits(['approve', 'reject'])

const detailLabels = {
  orderId: '订单号',
  amount: '退款金额',
  reason: '退款原因',
  item: '商品',
  quantity: '数量',
}

const hasDetails = computed(
  () => props.interrupt.details && Object.keys(props.interrupt.details).length > 0,
)
</script>

<style scoped>
.hitl-card {
  margin-top: 8px;
  padding: 14px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid var(--amber-b);
  box-shadow: var(--shadow-sm);
}
.hitl-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.hitl-badge {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
}
.hitl-badge.pending {
  background: var(--amber-l);
  color: var(--amber);
}
.hitl-badge.approved {
  background: var(--green-l);
  color: var(--green);
}
.hitl-badge.rejected {
  background: var(--red-l);
  color: var(--red);
}
.hitl-badge.auto {
  background: var(--blue-l);
  color: var(--blue);
}
.hitl-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--slate-700);
}
.hitl-desc {
  font-size: 12px;
  color: var(--slate-500);
  line-height: 1.6;
  margin-bottom: 10px;
}
.hitl-detail {
  padding: 8px 10px;
  border-radius: 6px;
  background: var(--slate-50);
  font-size: 12px;
  color: var(--slate-600);
  margin-bottom: 12px;
  line-height: 1.8;
}
.hitl-detail strong {
  color: var(--slate-700);
}
.hitl-actions {
  display: flex;
  gap: 8px;
}
.hitl-btn {
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.15s;
}
.hitl-approve {
  background: var(--green);
  color: #fff;
}
.hitl-approve:hover {
  filter: brightness(1.1);
}
.hitl-reject {
  background: #fff;
  color: var(--slate-600);
  border: 1px solid var(--slate-200);
}
.hitl-reject:hover {
  background: var(--red-l);
  color: var(--red);
  border-color: var(--red-b);
}
</style>
