<template>
  <div class="message-row" :class="message.role">
    <!-- AI 消息：左侧头像 -->
    <div v-if="message.role === 'assistant'" class="avatar ai-avatar">AI</div>
    <div class="bubble-wrapper">
      <MessageMeta v-if="message.role === 'assistant'" :meta="message.meta" />
      <!-- 用户气泡 -->
      <UserBubble v-if="message.role === 'user'" :content="message.content" />
      <!-- AI 气泡（支持流式追加） -->
      <AIBubble v-else :content="message.content" :streaming="streaming" />
    </div>
    <!-- 用户消息：右侧头像 -->
    <div v-if="message.role === 'user'" class="avatar user-avatar">我</div>
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
.message-row {
  display: flex;
  gap: 8px;
  padding: 8px 24px;
  align-items: flex-start;
}
.message-row.user {
  flex-direction: row-reverse;
}
.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}
.ai-avatar {
  background: #6366f1;
  color: #fff;
}
.user-avatar {
  background: #2563eb;
  color: #fff;
}
.bubble-wrapper {
  max-width: 70%;
}
</style>
