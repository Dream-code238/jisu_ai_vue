<template>
  <div class="quick-card" @click="$emit('click')">
    <div class="quick-card-icon" :style="{ background: iconBg, color: iconColor }">{{ icon }}</div>
    <div class="quick-card-title">{{ title }}</div>
    <div class="quick-card-desc">{{ desc }}</div>
  </div>
</template>

<script setup>
defineProps({
  icon: { type: String, default: '📄' },
  iconBg: { type: String, default: 'var(--slate-100)' },
  iconColor: { type: String, default: 'var(--slate-600)' },
  title: { type: String, required: true },
  desc: { type: String, default: '' },
})
defineEmits(['click'])
</script>

<style scoped>
.quick-card {
  padding: 14px;
  border-radius: 12px;
  border: 1px solid var(--slate-200);
  background: #fff;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s;
}
.quick-card:hover {
  border-color: var(--blue-b);
  background: var(--blue-l);
  box-shadow: var(--shadow-sm);
}
.quick-card-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  margin-bottom: 10px;
}
.quick-card-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--slate-700);
  margin-bottom: 2px;
}
.quick-card-desc {
  font-size: 12px;
  color: var(--slate-400);
}
</style>
