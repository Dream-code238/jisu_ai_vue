<template>
  <div class="tool-step-bar">
    <div v-for="(step, i) in steps" :key="i" class="step-item">
      <div class="step-num">{{ i + 1 }}</div>
      <div class="step-content">
        <div class="step-tool">{{ step.tool }}</div>
        <div class="step-input">{{ JSON.stringify(step.toolInput) }}</div>
        <div v-if="step.observation" class="step-obs">{{ step.observation }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({ steps: { type: Array, default: () => [] } })
</script>

<style lang="less" scoped>
.tool-step-bar {
  padding: 12px 24px;
}
.step-item {
  display: flex;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid #f1f5f9;
}
.step-num {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #2563eb;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}
.step-content {
  flex: 1;
}
.step-tool {
  font-size: 13px;
  font-weight: 600;
  color: #2563eb;
}
.step-input {
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
}
.step-obs {
  font-size: 12px;
  color: #475569;
  margin-top: 4px;
  padding: 4px 8px;
  background: #f8fafc;
  border-radius: 4px;
}
</style>
