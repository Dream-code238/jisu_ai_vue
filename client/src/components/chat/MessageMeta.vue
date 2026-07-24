<template>
  <div class="meta-row">
    <span class="role-name">小购</span>
    <span v-if="meta?.mode" class="mode-tag">{{ meta.mode }}</span>
    <span v-if="meta?.cached" class="cache-badge">⚡缓存命中</span>
    <span class="time">{{ meta?.time || '' }}</span>
  </div>
</template>

<script setup>
defineProps({ meta: { type: Object, default: () => ({}) } })
</script>

<style lang="less" scoped>
.meta-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
  padding-left: 4px;
}
.role-name {
  font-size: 12px;
  font-weight: 600;
  color: #475569;
}
.mode-tag {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 4px;
  background: #eef2ff;
  color: #6366f1;
}
.cache-badge {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 4px;
  background: #fffbeb;
  color: #d97706;
}
.time {
  font-size: 11px;
  color: #94a3b8;
  margin-left: auto;
}
</style>
