<template>
  <div class="msg-meta">
    <span>小购</span>
    <span v-if="meta?.mode">·</span>
    <span v-if="meta?.mode">{{ meta.mode }}</span>
    <span v-if="meta?.cached" class="msg-cache-badge">⚡ 缓存命中</span>
    <span
      v-if="meta?.blocked"
      class="msg-cache-badge"
      style="background: var(--red-l); color: var(--red); border-color: var(--red-b)"
      >🛡️ 安全拦截</span
    >
    <span v-if="meta?.time" class="meta-time">{{ meta.time }}</span>
  </div>
</template>

<script setup>
defineProps({ meta: { type: Object, default: () => ({}) } })
</script>

<style scoped>
.msg-meta {
  font-size: 11px;
  color: var(--slate-400);
  display: flex;
  align-items: center;
  gap: 8px;
  padding-left: 4px;
}
.msg-cache-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 10px;
  background: var(--amber-l);
  color: var(--amber);
  font-size: 11px;
  font-weight: 500;
  border: 1px solid var(--amber-b);
}
.meta-time {
  margin-left: auto;
  font-size: 11px;
  color: var(--slate-400);
}
</style>
