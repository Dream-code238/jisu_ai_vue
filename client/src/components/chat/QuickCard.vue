<template>
  <div class="quick-card" @click="$emit('click')">
    <span class="card-icon">{{ icon }}</span>
    <div>
      <div class="card-title">{{ title }}</div>
      <div class="card-desc">{{ desc }}</div>
    </div>
  </div>
</template>

<script setup>
defineProps({ icon: String, title: String, desc: String })
defineEmits(['click'])
</script>

<style scoped>
.quick-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}
.quick-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.08);
  border-color: #bfdbfe;
}
.card-icon {
  font-size: 20px;
}
.card-title {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}
.card-desc {
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
}
</style>
