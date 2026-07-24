<template>
  <div class="session-panel">
    <button class="new-chat-btn" @click="$emit('new-chat')">+ 新建对话</button>
    <div class="session-list">
      <SessionItem
        v-for="s in sessions"
        :key="s.id"
        :session="s"
        :active="s.id === currentId"
        @click="$emit('select-session', s.id)"
      />
    </div>
  </div>
</template>

<script setup>
import SessionItem from './SessionItem.vue'
defineProps({
  sessions: { type: Array, default: () => [] },
  currentId: { type: String, default: '' },
})
defineEmits(['new-chat', 'select-session'])
</script>

<style lang="less" scoped>
.session-panel {
  width: 240px;
  background: #f8fafc;
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
}
.new-chat-btn {
  margin: 12px;
  padding: 8px 16px;
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
}
.new-chat-btn:hover {
  background: #1d4ed8;
}
.session-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 8px;
}
</style>
