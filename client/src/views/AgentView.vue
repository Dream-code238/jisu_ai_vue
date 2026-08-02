<!--订单查询页-->
<template>
  <div class="chat-layout">
    <div class="chat-center">
      <!-- 消息列表 -->
      <div class="chat-messages" ref="messagesRef">
        <!-- 欢迎页 -->
        <div v-if="messages.length === 0" class="welcome-state">
          <div class="welcome-icon">🔧</div>
          <h2>订单查询助手</h2>
          <p class="welcome-sub">我可以帮您查询订单状态、物流信息、申请退款等</p>
          <div class="quick-grid">
            <div class="quick-card" v-for="q in quickQuestions" :key="q" @click="handleQuick(q)">
              <div class="quick-card-icon" style="background: var(--blue-l); color: var(--blue)">
                📦
              </div>
              <div class="quick-card-title">{{ q }}</div>
            </div>
          </div>
        </div>

        <!-- 历史消息 -->
        <MessageRow v-for="(msg, i) in messages" :key="i" :message="msg">
          <template v-if="msg.meta?.steps?.length || msg.meta?.interrupts?.length" #extra>
            <!-- HITL 审批卡片（历史） -->
            <HITLCard
              v-for="hitl in msg.meta?.interrupts || []"
              :key="hitl.id"
              :interrupt="hitl"
              @approve="approveInterrupt"
              @reject="rejectInterrupt"
            />
            <!-- 工具步骤 -->
            <div v-if="msg.meta?.steps?.length" class="steps-block">
              <div v-for="(step, si) in msg.meta.steps" :key="si" class="step-card">
                <div class="step-icon done">✓</div>
                <span class="step-label">Thought</span>
                <span class="step-tool">{{ step.tool }}</span>
                <span class="step-input">{{ formatInput(step.toolInput) }}</span>
              </div>
            </div>
          </template>
        </MessageRow>

        <!-- 流式输出中 / HITL 审批等待中 -->
        <div v-if="streaming || interrupts.length" class="msg-row ai">
          <div class="msg-avatar ai">购</div>
          <div class="msg-content">
            <!-- 实时 HITL 审批卡片 -->
            <HITLCard
              v-for="hitl in interrupts"
              :key="hitl.id"
              :interrupt="hitl"
              @approve="approveInterrupt"
              @reject="rejectInterrupt"
            />
            <!-- 实时步骤 -->
            <div v-if="steps.length" class="steps-block">
              <div v-for="(step, si) in steps" :key="si" class="step-card">
                <div class="step-icon run">⋯</div>
                <span class="step-label">Thought</span>
                <span class="step-tool">{{ step.tool }}</span>
                <span class="step-input">{{ formatInput(step.toolInput) }}</span>
              </div>
            </div>
            <!-- 思考中 / 答案 -->
            <ThinkingBubble v-if="!streamText && !interrupts.length" />
            <AIBubble v-else-if="streamText" :content="streamText" :streaming="true" />
          </div>
        </div>

        <div v-if="error" class="error-tip">⚠️ {{ error }}</div>
      </div>

      <!-- 输入栏 -->
      <ChatInput :disabled="streaming" @send="handleSend" @stop="stopStream" />
    </div>

    <!-- 右栏：Agent 上下文面板 -->
    <AgentContextPanel
      :status="agentStatus"
      :step-count="steps.length"
      :current-tool="currentTool"
      :hitl-count="pendingHitlCount"
      @clear="clearMessages"
    />
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { useAgent } from '../composables/useAgent.js'
import MessageRow from '../components/chat/MessageRow.vue'
import AIBubble from '../components/chat/AIBubble.vue'
import ThinkingBubble from '../components/chat/ThinkingBubble.vue'
import ChatInput from '../components/chat/ChatInput.vue'
import HITLCard from '../components/agent/HITLCard.vue'
import AgentContextPanel from '../components/agent/AgentContextPanel.vue'

const {
  messages,
  streaming,
  streamText,
  steps,
  interrupts,
  error,
  sendMessage,
  clearMessages,
  stopStream,
  approveInterrupt,
  rejectInterrupt,
} = useAgent()

const messagesRef = ref(null)

const quickQuestions = [
  '查一下订单 ORD-001 的状态',
  '订单 ORD-001 的快递到哪了？',
  '我有哪些订单？',
  '帮我退款 ORD-001',
]

const agentStatus = computed(() => {
  if (!streaming.value) return 'idle'
  if (streamText.value) return 'responding'
  if (steps.value.length > 0) return 'calling_tool'
  return 'thinking'
})

const currentTool = computed(() => {
  if (steps.value.length === 0) return ''
  return steps.value[steps.value.length - 1].tool || ''
})

const pendingHitlCount = computed(
  () => interrupts.value.filter((i) => i.status === 'pending').length,
)

const scrollToBottom = async () => {
  await nextTick()
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  }
}

const handleSend = async (text) => {
  await sendMessage(text, scrollToBottom)
}

const handleQuick = (q) => {
  handleSend(q)
}

const formatInput = (input) => {
  if (!input) return ''
  return Object.values(input).join(' · ')
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
.welcome-state {
  text-align: center;
  padding: 48px 20px;
  max-width: 520px;
  margin: 0 auto;
}
.welcome-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: linear-gradient(135deg, var(--blue), var(--indigo));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin: 0 auto 16px;
  box-shadow: var(--shadow-md);
}
.welcome-state h2 {
  font-size: 20px;
  font-weight: 600;
  color: var(--slate-800);
  margin-bottom: 6px;
}
.welcome-sub {
  font-size: 14px;
  color: var(--slate-500);
  margin-bottom: 24px;
}
.quick-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.quick-card {
  padding: 14px;
  border-radius: 12px;
  border: 1px solid var(--slate-200);
  background: #fff;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s;
}
.quick-card:hover {
  border-color: var(--blue-b);
  background: var(--blue-l);
  box-shadow: var(--shadow-sm);
}
.quick-card-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  margin-bottom: 8px;
}
.quick-card-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--slate-700);
}
.msg-row {
  display: flex;
  gap: 12px;
  max-width: 80%;
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
.steps-block {
  margin-top: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.step-card {
  padding: 8px 12px;
  border-radius: 8px;
  background: var(--slate-50);
  border: 1px solid var(--slate-200);
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.step-icon {
  width: 20px;
  height: 20px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  flex-shrink: 0;
}
.step-icon.done {
  background: var(--green-l);
  color: var(--green);
}
.step-icon.run {
  background: var(--blue-l);
  color: var(--blue);
}
.step-label {
  color: var(--slate-400);
  font-size: 11px;
}
.step-tool {
  font-weight: 600;
  color: var(--slate-700);
}
.step-input {
  color: var(--slate-500);
  margin-left: auto;
  font-size: 11px;
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
