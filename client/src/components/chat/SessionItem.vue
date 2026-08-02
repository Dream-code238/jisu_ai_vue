<template>
  <div class="session-item" :class="{ active }" @click="$emit('click')">
    <div class="session-item-main">
      <div class="session-item-title">{{ session.title }}</div>
      <div class="session-item-meta">
        <span
          class="session-item-tag"
          :style="{ background: colorMap[session.color] || 'var(--slate-400)' }"
        ></span>
        <span>{{ session.time || session.created_at || '' }}</span>
      </div>
    </div>
    <button class="session-item-delete" title="删除会话" @click.stop="$emit('delete', session.id)">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <polyline points="3 6 5 6 21 6"></polyline>
        <path
          d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
        ></path>
      </svg>
    </button>
  </div>
</template>

<script setup>
defineProps({
  session: { type: Object, required: true },
  active: { type: Boolean, default: false },
})
defineEmits(['click', 'delete'])

const colorMap = {
  blue: 'var(--blue)',
  teal: 'var(--teal)',
  purple: 'var(--purple)',
  indigo: 'var(--indigo)',
  amber: 'var(--amber)',
}
</script>

<style scoped>
.session-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 10px 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.12s;
  margin-bottom: 2px;
}
.session-item:hover {
  background: var(--slate-50);
}
.session-item.active {
  background: var(--blue-l);
}
.session-item-main {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}
.session-item-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--slate-700);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
}
.session-item.active .session-item-title {
  color: var(--blue);
}
.session-item-meta {
  font-size: 11px;
  color: var(--slate-400);
  display: flex;
  align-items: center;
  gap: 6px;
}
.session-item-tag {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.session-item-delete {
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--slate-400);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.15s;
}
.session-item-delete svg {
  width: 14px;
  height: 14px;
}
.session-item:hover .session-item-delete {
  opacity: 1;
}
.session-item-delete:hover {
  background: var(--red-l);
  color: var(--red);
}
.session-item-delete:active {
  transform: scale(0.96);
}
</style>
