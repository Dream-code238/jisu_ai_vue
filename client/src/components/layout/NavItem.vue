<template>
  <router-link :to="to" class="nav-item" active-class="active">
    <span class="nav-dot" :style="{ background: dotColor }"></span>
    <span class="nav-icon">{{ icon }}</span>
    <span class="nav-label">{{ label }}</span>
    <span v-if="badge" class="nav-badge">{{ badge }}</span>
  </router-link>
</template>

<script setup>
defineProps({
  to: { type: String, required: true },
  icon: { type: String, default: '📄' },
  label: { type: String, required: true },
  dotColor: { type: String, default: 'var(--slate-400)' },
  badge: { type: [String, Number], default: '' },
})
</script>

<style scoped>
.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 13px;
  color: var(--slate-400);
  text-decoration: none;
  transition: all 0.15s;
  margin-bottom: 2px;
  position: relative;
}
.nav-item:hover {
  color: #fff;
  background: var(--slate-800);
}
.nav-item.active {
  color: #fff;
  background: var(--blue);
}
.nav-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
.nav-icon {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  opacity: 0.8;
  font-size: 15px;
}
.nav-badge {
  margin-left: auto;
  font-size: 10px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 10px;
  background: var(--slate-700);
  color: var(--slate-400);
}
.nav-item.active .nav-badge {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}
</style>
