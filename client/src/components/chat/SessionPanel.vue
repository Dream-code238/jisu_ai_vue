<template>
  <div class="session-panel">
    <div class="session-panel-head">
      <button class="new-chat-btn" @click="$emit('new-chat')">＋ 新建对话</button>
    </div>
    <div class="session-list">
      <SessionItem
        v-for="s in sessions"
        :key="s.id"
        :session="s"
        :active="s.id === currentId"
        @click="$emit('select-session', s.id)"
        @delete="$emit('delete-session', s.id)"
      />
      <div v-if="sessions.length === 0" class="empty-tip">暂无历史会话</div>
    </div>
  </div>
</template>

<script setup>
import SessionItem from './SessionItem.vue'

defineProps({
  sessions: { type: Array, default: () => [] },
  currentId: { type: String, default: '' },
})
defineEmits(['new-chat', 'select-session', 'delete-session'])
</script>

<style scoped>
.session-panel {
  width: 240px;
  background: #fff;
  border-right: 1px solid var(--slate-200);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}
.session-panel-head {
  padding: 14px 16px 10px;
  border-bottom: 1px solid var(--slate-100);
}
.new-chat-btn {
  width: 100%;
  padding: 8px;
  border-radius: 8px;
  background: var(--blue);
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.15s;
}
.new-chat-btn:hover {
  background: var(--blue-d);
}
.session-list {
  flex: 1;
  overflow-y: auto;
  padding: 6px;
}
.empty-tip {
  text-align: center;
  font-size: 12px;
  color: var(--slate-400);
  padding: 20px;
}
</style>
