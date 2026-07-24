<!--
  第一章：Vue3 对话视图
  功能：
  - 展示完整对话历史
  - 流式输出实时展示（逐字出现效果）
  - 发送按钮 + Enter 键发送
  - 自动滚动到底部
  - 错误提示
-->
<template>
  <div class="chat-layout">
    <!-- 左栏：会话列表 -->
    <SessionPanel
      :sessions="sessions"
      :current-id="currentSessionId"
      @new-chat="handleNewChat"
      @select-session="handleSelectSession"
    />
    <!-- 中栏：对话区 -->
    <div class="chat-main">
      <template v-if="messages.length === 0">
        <WelcomeState @card-click="handleCardClick" />
      </template>
      <template v-else>
        <!-- T03 实现消息列表 -->
        <div class="message-list">
          <div v-for="msg in messages" :key="msg.id" :class="['msg-row', msg.role]">
            {{ msg.content }}
          </div>
        </div>
        <!-- T03 实现输入栏 -->
      </template>
    </div>
    <!-- 右栏：上下文面板 -->
    <ContextPanel :session-info="currentSessionInfo" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import SessionPanel from '@/components/chat/SessionPanel.vue'
import WelcomeState from '@/components/chat/WelcomeState.vue'
import ContextPanel from '@/components/common/ContextPanel.vue'

const router = useRouter()

const sessions = ref([
  { id: 's1', title: '退款咨询', color: 'blue', time: '10分钟前' },
  { id: 's2', title: '订单状态查询', color: 'teal', time: '1小时前' },
])

const currentSessionId = ref('s1')
const messages = ref([])
const currentSessionInfo = ref({ model: 'deepseek-chat', mode: '基础对话' })
const handleNewChat = () => {
  messages.value = []
}
const handleSelectSession = (id) => {
  currentSessionId.value = id
}
const handleCardClick = (route) => {
  router.push(route)
}
</script>

<style lang="less" scoped>
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
  padding: 16px 24px;
}
.msg-row {
  padding: 8px 12px;
  margin-bottom: 8px;
  border-radius: 8px;
}
.msg-row.user {
  background: #eff6ff;
  margin-left: 40px;
}
.msg-row.assistant {
  background: #fff;
  border: 1px solid #e2e8f0;
  margin-right: 40px;
}
</style>
