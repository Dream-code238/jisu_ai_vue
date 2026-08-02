<template>
  <header class="main-header">
    <div class="main-header-left">
      <div class="breadcrumb">{{ currentTitle }}</div>
    </div>
    <div class="header-actions">
      <button class="icon-btn" title="搜索">🔍</button>
      <button class="icon-btn" title="通知">🔔</button>
      <button class="icon-btn" title="设置">⚙️</button>
      <button class="btn btn-ghost btn-sm">导出</button>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const currentTitle = computed(() => route.meta.title || '智能对话')
</script>

<style scoped>
.main-header {
  height: 52px;
  background: #fff;
  border-bottom: 1px solid var(--slate-200);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  flex-shrink: 0;
}
.main-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.breadcrumb {
  font-size: 13px;
  color: var(--slate-800);
  font-weight: 600;
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.icon-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--slate-500);
  transition: all 0.15s;
  font-size: 15px;
}
.icon-btn:hover {
  background: var(--slate-100);
  color: var(--slate-700);
}
</style>
