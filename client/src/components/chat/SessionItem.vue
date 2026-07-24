<template>
  <div class="session-item" :class="{ active }" @click="$emit('click')">
    <span class="dot" :style="{ background: colorMap[session.color] }"></span>
    <div class="info">
      <div class="title">{{ session.title }}</div>
      <div class="time">{{ session.time }}</div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  session: { type: Object, required: true },
  active: { type: Boolean, default: false },
})
defineEmits(['click'])
const colorMap = {
  blue: '#2563eb',
  teal: '#0f766e',
  purple: '#7c3aed',
  indigo: '#6366f1',
}
</script>

<style lang="less" scoped>
.session-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 2px;
}
.session-item:hover {
  background: #e2e8f0;
}
.session-item.active {
  background: #dbeafe;
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.title {
  font-size: 13px;
  color: #334155;
}
.time {
  font-size: 11px;
  color: #94a3b8;
}
</style>
