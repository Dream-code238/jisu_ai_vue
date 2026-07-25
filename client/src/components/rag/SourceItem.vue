<template>
  <div class="source-item" @click="$emit('view-source')">
    <span class="source-num">{{ source.index }}</span>
    <div class="source-info">
      <span class="source-name">{{ source.source }}</span>
      <span v-if="source.score" class="source-score"
        >相关度 {{ (source.score * 100).toFixed(0) }}%</span
      >
    </div>
  </div>
</template>

<script setup>
defineProps({ source: { type: Object, required: true } })
defineEmits(['view-source'])
</script>

<style lang="less" scoped>
.source-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 6px;
  cursor: pointer;
}
.source-item:hover {
  background: #ccfbf1;
}
.source-num {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  background: #0f766e;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
}
.source-name {
  font-size: 12px;
  color: #334155;
}
.source-score {
  font-size: 11px;
  color: #0f766e;
  margin-left: 8px;
}
</style>
