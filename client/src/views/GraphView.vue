<!--智能中枢页-->
<template>
  <div class="chat-layout">
    <div class="chat-center" style="flex: 1">
      <!-- 消息列表 -->
      <div class="chat-messages" ref="messagesRef">
        <!-- 欢迎页 -->
        <div v-if="messages.length === 0" class="welcome-state">
          <div class="welcome-icon">⚡</div>
          <h2>智能中枢 (LangGraph)</h2>
          <p class="welcome-sub">自动判断问题类型，调用最合适的模块为您服务</p>
          <div class="quick-grid">
            <div class="quick-card" v-for="q in quickQuestions" :key="q" @click="handleQuick(q)">
              <div
                class="quick-card-icon"
                style="background: var(--purple-l); color: var(--purple)"
              >
                ⚡
              </div>
              <div class="quick-card-title">{{ q }}</div>
            </div>
          </div>
        </div>

        <!-- 历史消息 -->
        <MessageRow v-for="(msg, i) in messages" :key="i" :message="msg">
          <template
            v-if="
              msg.meta?.nodes?.length ||
              msg.meta?.steps?.length ||
              msg.meta?.interrupt ||
              msg.meta?.sources?.length
            "
            #extra
          >
            <FlowTrace
              v-if="msg.meta?.nodes?.length"
              :traversed-nodes="msg.meta.nodes"
              current-node=""
            />
            <div v-if="msg.meta?.steps?.length" class="steps-block">
              <div v-for="(step, si) in msg.meta.steps" :key="si" class="step-card">
                <div class="step-icon done">✓</div>
                <span class="step-tool">{{ step.tool }}</span>
                <span class="step-input">{{ formatInput(step.toolInput) }}</span>
              </div>
            </div>

            <!-- 参考来源卡片 -->
            <div v-if="msg.meta?.sources?.length" class="source-block">
              <div class="source-block-title">
                <svg
                  class="source-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                </svg>
                <span>参考来源 ({{ msg.meta.sources.length }})</span>
              </div>
              <div class="source-list">
                <div v-for="(src, si) in msg.meta.sources" :key="si" class="source-item">
                  <span class="source-num">{{ si + 1 }}</span>
                  <span class="source-name">
                    <span class="source-file">{{
                      src.source || src.metadata?.source || '未知文档'
                    }}</span>
                    <span
                      v-if="src.section || src.page || src.metadata?.section || src.metadata?.page"
                      class="source-section"
                    >
                      —
                      {{
                        src.page || src.metadata?.page
                          ? `第${src.page || src.metadata?.page}页`
                          : src.section || src.metadata?.section
                      }}
                    </span>
                  </span>
                  <span class="source-score">{{ (src.score ?? 0).toFixed(2) }}</span>
                </div>
              </div>
            </div>

            <HITLCard v-if="msg.meta?.interrupt" :interrupt="msg.meta.interrupt" />
          </template>
        </MessageRow>

        <!-- 流式输出中 -->
        <div v-if="streaming" class="msg-row ai">
          <div class="msg-avatar ai">购</div>
          <div class="msg-content">
            <MessageMeta :meta="{ mode: streamingMode }" />
            <FlowTrace
              v-if="nodes.length > 0"
              :traversed-nodes="nodes"
              :current-node="currentNode"
            />
            <div v-if="steps.length" class="steps-block">
              <div v-for="(step, si) in steps" :key="si" class="step-card">
                <div class="step-icon run">⋯</div>
                <span class="step-tool">{{ step.tool }}</span>
                <span class="step-input">{{ formatInput(step.toolInput) }}</span>
              </div>
            </div>

            <!-- 实时参考来源 -->
            <div v-if="sources.length" class="source-block">
              <div class="source-block-title">
                <svg
                  class="source-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                </svg>
                <span>参考来源 ({{ sources.length }})</span>
              </div>
              <div class="source-list">
                <div v-for="(src, si) in sources" :key="si" class="source-item">
                  <span class="source-num">{{ si + 1 }}</span>
                  <span class="source-name">
                    <span class="source-file">{{
                      src.source || src.metadata?.source || '未知文档'
                    }}</span>
                    <span
                      v-if="src.section || src.page || src.metadata?.section || src.metadata?.page"
                      class="source-section"
                    >
                      —
                      {{
                        src.page || src.metadata?.page
                          ? `第${src.page || src.metadata?.page}页`
                          : src.section || src.metadata?.section
                      }}
                    </span>
                  </span>
                  <span class="source-score">{{ (src.score ?? 0).toFixed(2) }}</span>
                </div>
              </div>
            </div>

            <ThinkingBubble v-if="!streamText" />
            <AIBubble v-else :content="streamText" :streaming="true" />
          </div>
        </div>

        <!-- HITL 中断等待审批 -->
        <div v-if="interruptInfo && !streaming" class="msg-row ai">
          <div class="msg-avatar ai">购</div>
          <div class="msg-content">
            <MessageMeta :meta="{ mode: streamingMode }" />
            <FlowTrace v-if="nodes.length > 0" :traversed-nodes="nodes" current-node="" />
            <HITLCard :interrupt="interruptInfo" @approve="handleApprove" @reject="handleReject" />
          </div>
        </div>

        <div v-if="error" class="error-tip">⚠️ {{ error }}</div>
      </div>

      <!-- 输入栏 -->
      <ChatInput
        :disabled="streaming || !!interruptInfo"
        placeholder="输入问题，Enter 发送"
        @send="handleSend"
        @stop="stopStream"
      />
    </div>

    <!-- 右栏：工作流状态面板 -->
    <WorkflowStatusPanel
      :current-node="currentNode"
      :traversed-nodes="nodes"
      :node-timings="nodeTimings"
      :total-duration="totalDuration"
      :steps="steps"
      @clear="clearMessages"
    />
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { useGraph } from '../composables/useGraph.js'
import MessageRow from '../components/chat/MessageRow.vue'
import AIBubble from '../components/chat/AIBubble.vue'
import ThinkingBubble from '../components/chat/ThinkingBubble.vue'
import ChatInput from '../components/chat/ChatInput.vue'
import MessageMeta from '../components/chat/MessageMeta.vue'
import FlowTrace from '../components/graph/FlowTrace.vue'
import HITLCard from '../components/agent/HITLCard.vue'
import WorkflowStatusPanel from '../components/graph/WorkflowStatusPanel.vue'

const {
  messages,
  streaming,
  streamText,
  nodes,
  steps,
  sources,
  currentNode,
  nodeTimings,
  totalDuration,
  interruptInfo,
  error,
  sendMessage,
  resumeStream,
  clearMessages,
  stopStream,
} = useGraph()

const messagesRef = ref(null)

// T20: 流式中的消息头对齐原型
const streamingMode = computed(() => {
  const router = nodes.value.find((n) => n.name === 'intentRouter')
  const intents = router?.intents || (router?.intent ? [router.intent] : [])
  return intents.length > 1 ? '智能中枢 · 多意图并行' : '智能中枢 (LangGraph)'
})

const quickQuestions = [
  '订单 ORD-001 发货了吗？',
  '蓝牙耳机怎么保修？同时查一下订单 ORD-002 到哪了',
  '帮我退款 ORD-001',
  '你好',
]

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

const handleApprove = async () => {
  if (interruptInfo.value) {
    await resumeStream(interruptInfo.value.threadId, 'approved', scrollToBottom)
  }
}

const handleReject = async () => {
  if (interruptInfo.value) {
    await resumeStream(interruptInfo.value.threadId, 'rejected', scrollToBottom)
  }
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
  background: linear-gradient(135deg, var(--purple), var(--purple-d));
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
  border-color: var(--purple-b);
  background: var(--purple-l);
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
  background: var(--purple-l);
  color: var(--purple);
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

/* 参考来源卡片（复用 RagView 风格，主题色为 purple） */
.source-block {
  margin-top: 8px;
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--purple-l);
  border: 1px solid var(--purple-b);
}
.source-block-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--purple);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.source-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}
.source-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.source-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  background: #fff;
  font-size: 12px;
  color: var(--slate-600);
  transition: all 0.12s;
}
.source-item:hover {
  background: var(--purple-l);
}
.source-num {
  width: 20px;
  height: 20px;
  border-radius: 6px;
  background: var(--purple);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.source-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 6px;
}
.source-file {
  color: var(--slate-700);
  font-weight: 500;
}
.source-section {
  color: var(--slate-400);
  font-weight: 400;
}
.source-score {
  font-size: 11px;
  color: var(--purple);
  font-weight: 600;
  flex-shrink: 0;
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
