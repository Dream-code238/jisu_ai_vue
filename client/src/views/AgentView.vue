<template>
  <div class="agent-layout">
    <div class="agent-main">
      <div class="message-list" ref="messageListRef">
        <template v-for="(msg, i) in messages" :key="i">
          <MessageRow :message="msg" />
          <ToolStepBar v-if="msg.meta?.steps" :steps="msg.meta.steps" />
        </template>
        <div v-if="streaming">
          <MessageRow :message="{ role: 'assistant', content: streamText }" :streaming="true" />
        </div>
      </div>
      <ChatInput :disabled="streaming" @send="handleSend" @stop="stopStream" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAgent } from '../composables/useAgent.js'
import MessageRow from '../components/chat/MessageRow.vue'
import ChatInput from '../components/chat/ChatInput.vue'
import ToolStepBar from '../components/agent/ToolStepBar.vue'

const { messages, streaming, streamText, steps, error, sendMessage, clearMessages, stopStream } =
  useAgent()

const messageListRef = ref(null)

const scrollToBottom = () => {
  if (messageListRef.value) messageListRef.value.scrollTop = messageListRef.value.scrollHeight
}

const handleSend = (text) => sendMessage(text, scrollToBottom)
</script>

<style lang="less" scoped>
.agent-layout {
  display: flex;
  height: 100%;
  overflow: hidden;
}
.agent-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px 0;
}
</style>
