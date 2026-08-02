<template>
  <div class="msg-row" :class="message.role">
    <div v-if="message.role === 'assistant'" class="msg-avatar ai">购</div>
    <div class="msg-content">
      <MessageMeta v-if="message.role === 'assistant'" :meta="message.meta" />
      <UserBubble v-if="message.role === 'user'" :content="message.content" />
      <AIBubble v-else :content="message.content" :streaming="streaming" />
      <slot name="extra"></slot>
    </div>
    <div v-if="message.role === 'user'" class="msg-avatar user">我</div>
  </div>
</template>

<script setup>
import UserBubble from './UserBubble.vue'
import AIBubble from './AIBubble.vue'
import MessageMeta from './MessageMeta.vue'

defineProps({
  message: { type: Object, required: true },
  streaming: { type: Boolean, default: false },
})
</script>

<style scoped>
.msg-row {
  display: flex;
  gap: 12px;
  max-width: 80%;
}
.msg-row.user {
  flex-direction: row-reverse;
  margin-left: auto;
}
.msg-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
}
.msg-avatar.ai {
  background: var(--blue-l);
  color: var(--blue);
}
.msg-avatar.user {
  background: var(--blue);
  color: #fff;
}
.msg-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.msg-row.user .msg-content {
  align-items: flex-end;
}
</style>
