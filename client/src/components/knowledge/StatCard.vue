<template>
  <div class="stat-card" :class="color">
    <div class="stat-icon">{{ icon }}</div>
    <div class="stat-body">
      <div class="stat-value">{{ value }}</div>
      <div class="stat-label">{{ label }}</div>
    </div>
  </div>
</template>

<script setup>
defineProps({ label: String, value: [Number, String], icon: String, color: String })
</script>

<style lang="less" scoped>
.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}
.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}
.stat-card.blue .stat-icon {
  background: #eff6ff;
}
.stat-card.teal .stat-icon {
  background: #f0fdfa;
}
.stat-card.purple .stat-icon {
  background: #f5f3ff;
}
.stat-card.amber .stat-icon {
  background: #fffbeb;
}
.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
}
.stat-label {
  font-size: 12px;
  color: #64748b;
}
</style>
