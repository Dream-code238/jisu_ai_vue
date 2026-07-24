<template>
  <header class="main-header">
    <div class="breadcrumb">
      <span>极速购 AI</span> / <strong>{{ currentTitle }}</strong>
    </div>
    <div class="header-actions">
      <button class="icon-btn" title="搜索">🔍</button>
      <button class="icon-btn" title="设置">⚙️</button>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
const route = useRoute()
const currentTitle = computed(() => route.meta.title || '智能对话')
</script>

<style lang="less" scoped>
.main-header {
  height: 52px;
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 10;

  .breadcrumb {
    font-size: 13px;
    color: #94a3b8;
  }

  .breadcrumb strong {
    color: #1e293b;
    font-weight: 600;
  }

  .icon-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 16px;
    padding: 4px;
    border-radius: 6px;
  }

  .icon-btn:hover {
    background: #f1f5f9;
  }
}
</style>
