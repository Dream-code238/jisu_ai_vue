<template>
  <div class="stat-card">
    <div class="stat-card-icon" :style="{ background: iconBg, color: iconColor }">{{ icon }}</div>
    <div class="stat-card-label">{{ label }}</div>
    <div class="stat-card-value">{{ value }}</div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: { type: String, required: true },
  value: { type: [Number, String], default: 0 },
  icon: { type: String, default: '📊' },
  color: { type: String, default: 'blue' },
})

const colorMap = {
  blue: { bg: 'var(--blue-l)', color: 'var(--blue)' },
  teal: { bg: 'var(--teal-l)', color: 'var(--teal)' },
  purple: { bg: 'var(--purple-l)', color: 'var(--purple)' },
  amber: { bg: 'var(--amber-l)', color: 'var(--amber)' },
  indigo: { bg: 'var(--indigo-l)', color: 'var(--indigo)' },
}

const iconBg = computed(() => (colorMap[props.color] || colorMap.blue).bg)
const iconColor = computed(() => (colorMap[props.color] || colorMap.blue).color)
</script>

<style scoped>
.stat-card {
  background: #fff;
  border: 1px solid var(--slate-200);
  border-radius: 12px;
  padding: 16px;
  box-shadow: var(--shadow-sm);
}
.stat-card-label {
  font-size: 12px;
  color: var(--slate-400);
  margin-bottom: 6px;
}
.stat-card-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--slate-800);
}
.stat-card-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  float: right;
  margin-top: -6px;
}
</style>
