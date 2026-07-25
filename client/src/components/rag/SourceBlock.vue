<template>
  <div class="source-block">
    <div class="source-header">
      <span class="source-title">📚 参考来源 ({{ sources.length }})</span>
    </div>
    <div class="source-list">
      <SourceItem v-for="(s, i) in sources" :key="i" :source="s" @click="$emit('view-source', s)" />
    </div>
  </div>
</template>

<script setup>
import SourceItem from './SourceItem.vue'
defineProps({ sources: { type: Array, default: () => [] } })
defineEmits(['view-source'])
</script>

<style lang="less" scoped>
.source-block {
  background: #f0fdfa;
  border: 1px solid #99f6e4;
  border-radius: 8px;
  padding: 12px;
  margin: 8px 0;
}
.source-title {
  font-size: 13px;
  font-weight: 600;
  color: #0f766e;
}
.source-list {
  margin-top: 8px;
}
</style>
