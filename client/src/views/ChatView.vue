<template>
  <div class="chat-layout">
    <SessionPanel
      :sessions="sessions"
      :current-id="currentSessionId"
      @new-chat="handleNewChat"
      @select-session="handleSelectSession"
    />
    <div class="chat-main">
      <template v-if="messages.length === 0 && !streaming">
        <WelcomeState @card-click="handleCardClick" />
      </template>
      <template v-else>
        <div class="message-list" ref="messageListRef">
          <MessageRow v-for="(msg, i) in messages" :key="i" :message="msg" />
          <div v-if="streaming">
            <MessageRow :message="{ role: 'assistant', content: streamText }" :streaming="true" />
          </div>
        </div>
      </template>
      <ChatInput :disabled="streaming" @send="handleSend" @stop="stopStream" />
    </div>
    <ContextPanel :session-info="sessionInfo" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSession } from '../composables/useSession.js'
import { useChat } from '../composables/useChat.js'
import SessionPanel from '../components/chat/SessionPanel.vue'
import WelcomeState from '../components/chat/WelcomeState.vue'
import ContextPanel from '../components/common/ContextPanel.vue'
import MessageRow from '../components/chat/MessageRow.vue'
import ChatInput from '../components/chat/ChatInput.vue'

const router = useRouter()

const { sessions, currentSessionId, loadSessions, selectSession, createSession } = useSession()
// 传入 sessionId 的 ref，useChat 内部读取
const { messages, streaming, streamText, error, sendMessage, loadHistory, stopStream } =
  useChat(currentSessionId)

const messageListRef = ref(null)

onMounted(() => loadSessions())

const scrollToBottom = () => {
  if (messageListRef.value) {
    messageListRef.value.scrollTop = messageListRef.value.scrollHeight
  }
}

const handleNewChat = async () => {
  await createSession()
  messages.value = []
}

const handleSelectSession = async (id) => {
  await selectSession(id)
  await loadHistory(id)
}

const handleSend = (text) => sendMessage(text, scrollToBottom)
const handleCardClick = (route) => {
  router.push(route)
}

const sessionInfo = ref({ model: 'deepseek-chat', mode: '基础对话', msgCount: 0 })
</script>

<style scoped>
.chat-layout {
  display: flex;
  height: 100%;
  overflow: hidden;
}
.chat-main {
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
