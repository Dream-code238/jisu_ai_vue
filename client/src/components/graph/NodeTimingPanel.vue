<template>
  <div class="timing-panel">
    <div class="panel-title">节点耗时</div>
    <div v-for="(item, i) in timings" :key="i" class="timing-item">
      <span class="timing-label">{{ item.label }}</span>
      <div class="timing-bar">
        <div
          class="timing-fill"
          :style="{ width: item.percent + '%', background: item.color }"
        ></div>
      </div>
      <span class="timing-value">{{ item.ms }}ms</span>
    </div>
    <div v-if="timings.length === 0" class="empty">暂无数据</div>
  </div>
</template>

<script setup>
defineProps({ timings: { type: Array, default: () => [] } })
</script>

<style lang="less" scoped>
.timing-panel {
  padding: 16px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}
.panel-title {
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
  margin-bottom: 12px;
  text-transform: uppercase;
}
.timing-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.timing-label {
  font-size: 12px;
  color: #334155;
  width: 80px;
  flex-shrink: 0;
}
.timing-bar {
  flex: 1;
  height: 6px;
  background: #f1f5f9;
  border-radius: 3px;
  overflow: hidden;
}
.timing-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s;
}
.timing-value {
  font-size: 11px;
  color: #64748b;
  width: 50px;
  text-align: right;
}
.empty {
  font-size: 12px;
  color: #94a3b8;
  text-align: center;
  padding: 16px;
}
</style>
