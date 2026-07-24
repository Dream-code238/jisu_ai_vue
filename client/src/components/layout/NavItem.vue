<template>
  <router-link :to="to" class="nav-item" active-class="active">
    <span class="nav-icon">{{ icon }}</span>
    <span class="nav-label">{{ label }}</span>
  </router-link>
</template>

<script setup>
defineProps({
  to: { type: String, required: true },
  icon: { type: String, default: '📄' },
  label: { type: String, required: true },
})
</script>

<style lang="less" scoped>
.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 13px;
  color: #94a3b8;
  text-decoration: none;
  transition: all 0.15s;
  margin-bottom: 2px;
}
.nav-item:hover {
  color: #fff;
  background: #1e293b;
}
.nav-item.active {
  color: #fff;
  background: #2563eb;
}
.nav-icon {
  width: 18px;
  text-align: center;
}
</style>
