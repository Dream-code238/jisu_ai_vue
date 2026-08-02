<!--智能对话页-->
<template>
  <div class="chat-layout">
    <!-- 左栏：会话列表 -->
    <SessionPanel
      :sessions="sessions"
      :current-id="currentSessionId"
      @new-chat="handleNewChat"
      @select-session="handleSelectSession"
      @delete-session="handleDeleteSession"
    />

    <!-- 中栏：对话区 -->
    <div class="chat-center">
      <!-- 消息列表 -->
      <div class="chat-messages" ref="messagesRef">
        <!-- 欢迎页 -->
        <template v-if="messages.length === 0 && !streaming">
          <WelcomeState @card-click="handleCardClick" />
        </template>

        <!-- 历史消息 -->
        <template v-else>
          <MessageRow v-for="(msg, i) in messages" :key="i" :message="msg" />

          <!-- 流式输出中 -->
          <div v-if="streaming" class="msg-row ai">
            <div class="msg-avatar ai">购</div>
            <div class="msg-content">
              <MessageMeta v-if="streamText" :meta="{ mode: '基础对话' }" />
              <ThinkingBubble v-if="!streamText" />
              <AIBubble v-else :content="streamText" :streaming="true" />
            </div>
          </div>

          <!-- 错误提示 -->
          <div v-if="error" class="error-tip">⚠️ {{ error }}</div>
        </template>
      </div>

      <!-- 输入栏 -->
      <ChatInput :disabled="streaming" @send="handleSend" @stop="stopStream" />
    </div>

    <!-- 右栏：上下文面板 -->
    <ContextPanel :session-info="sessionInfo" @clear="clearMessages" />
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSession } from '../composables/useSession.js'
import { useChat } from '../composables/useChat.js'
import SessionPanel from '../components/chat/SessionPanel.vue'
import WelcomeState from '../components/chat/WelcomeState.vue'
import MessageRow from '../components/chat/MessageRow.vue'
import MessageMeta from '../components/chat/MessageMeta.vue'
import AIBubble from '../components/chat/AIBubble.vue'
import ThinkingBubble from '../components/chat/ThinkingBubble.vue'
import ChatInput from '../components/chat/ChatInput.vue'
import ContextPanel from '../components/common/ContextPanel.vue'

const router = useRouter()

const { sessions, currentSessionId, loadSessions, selectSession, createSession, deleteSession } =
  useSession()
const {
  messages,
  streaming,
  streamText,
  error,
  sendMessage,
  clearMessages,
  loadHistory,
  stopStream,
} = useChat(currentSessionId)

const messagesRef = ref(null)

onMounted(() => {
  loadSessions()
})

const sessionInfo = computed(() => ({
  model: 'DeepSeek-V4',
  mode: '基础对话',
  msgCount: messages.value.length,
}))

const scrollToBottom = async () => {
  await nextTick()
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  }
}

const handleSend = async (text) => {
  if (!currentSessionId.value) {
    await createSession()
  }
  await sendMessage(text, scrollToBottom)
}

const handleNewChat = async () => {
  await createSession()
  clearMessages()
}

const handleSelectSession = async (id) => {
  await selectSession(id)
  await loadHistory(id)
  await scrollToBottom()
}

const handleDeleteSession = async (id) => {
  const wasCurrent = currentSessionId.value === id
  try {
    await deleteSession(id)
  } catch {
    return
  }
  if (wasCurrent) {
    if (currentSessionId.value) {
      await loadHistory(currentSessionId.value)
    } else {
      clearMessages()
    }
    await scrollToBottom()
  }
}

const handleCardClick = (route) => {
  router.push(route)
}
</script>

<style scoped>
.chat-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
}
.chat-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 24px 32px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
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
.msg-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.msg-row.user .msg-content {
  align-items: flex-end;
}
.error-tip {
  text-align: center;
  padding: 10px 16px;
  margin: 0 auto;
  border-radius: 8px;
  background: var(--red-l);
  color: var(--red);
  font-size: 13px;
}
</style>
