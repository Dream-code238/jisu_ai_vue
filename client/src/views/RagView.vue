<!--知识库问答页-->
<template>
  <div class="chat-layout">
    <div class="chat-center" style="flex: 1">
      <!-- 消息列表 -->
      <div class="chat-messages" ref="messagesRef">
        <!-- 欢迎页 -->
        <div v-if="messages.length === 0" class="welcome-state">
          <div class="welcome-icon">📚</div>
          <h2>知识库问答</h2>
          <p class="welcome-sub">我可以回答关于商品规格、价格、售后政策等问题</p>
          <div class="quick-grid">
            <div class="quick-card" v-for="q in quickQuestions" :key="q" @click="handleQuick(q)">
              <div class="quick-card-icon" style="background: var(--teal-l); color: var(--teal)">
                📖
              </div>
              <div class="quick-card-title">{{ q }}</div>
            </div>
          </div>
        </div>

        <!-- 历史消息 -->
        <MessageRow v-for="(msg, i) in messages" :key="i" :message="msg">
          <template v-if="msg.meta?.sources?.length" #extra>
            <div class="source-block">
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
                      >—
                      {{
                        src.page || src.metadata?.page
                          ? `第${src.page || src.metadata?.page}页`
                          : src.section || src.metadata?.section
                      }}</span
                    >
                  </span>
                  <span class="source-score">{{ (src.score ?? 0).toFixed(2) }}</span>
                </div>
              </div>
            </div>
          </template>
        </MessageRow>

        <!-- 流式输出中 -->
        <div v-if="streaming" class="msg-row ai">
          <div class="msg-avatar ai">购</div>
          <div class="msg-content">
            <!-- 实时来源 -->
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
                      >—
                      {{
                        src.page || src.metadata?.page
                          ? `第${src.page || src.metadata?.page}页`
                          : src.section || src.metadata?.section
                      }}</span
                    >
                  </span>
                  <span class="source-score">{{ (src.score ?? 0).toFixed(2) }}</span>
                </div>
              </div>
            </div>
            <!-- 思考中 / 答案 -->
            <ThinkingBubble v-if="!streamText" />
            <AIBubble v-else :content="streamText" :streaming="true" />
          </div>
        </div>

        <div v-if="error" class="error-tip">⚠️ {{ error }}</div>
      </div>

      <!-- 输入栏 -->
      <ChatInput
        :disabled="streaming"
        placeholder="输入问题，Enter 发送"
        @send="handleSend"
        @stop="stopStream"
      />
    </div>

    <!-- 右栏：RAG 上下文面板 -->
    <div class="context-panel">
      <div class="ctx-section">
        <div class="ctx-head">知识库状态</div>
        <div class="ctx-body">
          <div class="ctx-stat-row">
            <span class="ctx-stat-label">检索模式</span>
            <span class="ctx-badge teal">RAG 向量检索</span>
          </div>
          <div class="ctx-stat-row">
            <span class="ctx-stat-label">文档总数</span>
            <span class="ctx-stat-value">{{ kbStats.total }}</span>
          </div>
          <div class="ctx-stat-row">
            <span class="ctx-stat-label">向量切片</span>
            <span class="ctx-stat-value">{{ kbStats.chunks }}</span>
          </div>
          <div class="ctx-stat-row">
            <span class="ctx-stat-label">Top-K</span>
            <span class="ctx-stat-value">3</span>
          </div>
        </div>
      </div>
      <div class="ctx-section">
        <div class="ctx-head">检索结果</div>
        <div class="ctx-body">
          <div class="ctx-stat-row">
            <span class="ctx-stat-label">召回文档</span>
            <span class="ctx-stat-value">{{ recallText }}</span>
          </div>
          <div class="ctx-stat-row">
            <span class="ctx-stat-label">平均相关度</span>
            <span class="ctx-stat-value" style="color: var(--teal)">{{ avgScore }}</span>
          </div>
          <div class="ctx-stat-row">
            <span class="ctx-stat-label">检索耗时</span>
            <span class="ctx-stat-value">{{ lastSearchTime || '—' }}</span>
          </div>
        </div>
      </div>
      <div class="ctx-section">
        <div class="ctx-head">Embedding</div>
        <div class="ctx-body">
          <div class="ctx-stat-row">
            <span class="ctx-stat-label">模型</span>
            <span class="ctx-stat-value">embedding-3</span>
          </div>
          <div class="ctx-stat-row">
            <span class="ctx-stat-label">维度</span>
            <span class="ctx-stat-value">1024</span>
          </div>
          <div class="ctx-stat-row">
            <span class="ctx-stat-label">向量库</span>
            <span class="ctx-stat-value">PGVector</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRag } from '../composables/useRag.js'
import MessageRow from '../components/chat/MessageRow.vue'
import AIBubble from '../components/chat/AIBubble.vue'
import ThinkingBubble from '../components/chat/ThinkingBubble.vue'
import ChatInput from '../components/chat/ChatInput.vue'

const { messages, sources, streaming, streamText, error, askQuestion, clearMessages, stopStream } =
  useRag()

const messagesRef = ref(null)
const lastSearchTime = ref('')
const kbStats = ref({ total: 0, chunks: 0, ready: 0 })

const DEMO_TOTAL = 24
const DEMO_CHUNKS = 1836

const recallText = computed(() => {
  const recalled =
    sources.value.length || messages.value[messages.value.length - 1]?.meta?.sources?.length || 0
  const total = kbStats.value.chunks || DEMO_CHUNKS
  return recalled ? `${recalled} / ${total.toLocaleString()}` : '—'
})

const avgScore = computed(() => {
  const activeSources = sources.value.length
    ? sources.value
    : messages.value[messages.value.length - 1]?.meta?.sources || []
  if (!activeSources.length) return '—'
  const sum = activeSources.reduce((acc, s) => acc + (s.score ?? 0), 0)
  return (sum / activeSources.length).toFixed(2)
})

const quickQuestions = [
  '蓝牙耳机 X1 Pro 的续航怎么样？',
  '商品可以退货吗？',
  '机械键盘保修多久？',
  '退款需要多少天？',
]

const scrollToBottom = async () => {
  await nextTick()
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  }
}

const handleSend = async (text) => {
  const start = Date.now()
  await askQuestion(text, scrollToBottom)
  lastSearchTime.value = `${Date.now() - start}ms`
}

const handleQuick = (q) => {
  handleSend(q)
}

const formatSource = (src) => {
  const name = src.source || src.metadata?.source || '未知文档'
  const page = src.page || src.metadata?.page
  const section = src.section || src.metadata?.section

  if (page) return `${name} — 第${page}页`
  if (section) return `${name} — ${section}`
  return name
}

const fetchKbStats = async () => {
  try {
    const res = await fetch('http://localhost:3000/api/knowledge/stats')
    if (!res.ok) return
    const data = await res.json()
    kbStats.value = {
      total: Number(data.total) || DEMO_TOTAL,
      chunks: Number(data.chunks) || DEMO_CHUNKS,
      ready: Number(data.ready) || 0,
    }
  } catch (err) {
    console.error('[RagView] fetchKbStats failed:', err.message)
    kbStats.value = { total: DEMO_TOTAL, chunks: DEMO_CHUNKS, ready: 0 }
  }
}

onMounted(fetchKbStats)
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
  background: linear-gradient(135deg, var(--teal), var(--teal-d));
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
  border-color: var(--teal-b);
  background: var(--teal-l);
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
.source-block {
  margin-top: 8px;
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--teal-l);
  border: 1px solid var(--teal-b);
}
.source-block-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--teal);
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
  background: var(--teal-l);
}
.source-num {
  width: 20px;
  height: 20px;
  border-radius: 6px;
  background: var(--teal);
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
  color: var(--teal);
  font-weight: 600;
  flex-shrink: 0;
}
.context-panel {
  width: 280px;
  background: #fff;
  border-left: 1px solid var(--slate-200);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow-y: auto;
}
.ctx-section {
  border-bottom: 1px solid var(--slate-100);
}
.ctx-head {
  padding: 12px 16px 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--slate-500);
}
.ctx-body {
  padding: 0 16px 14px;
}
.ctx-stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 0;
  font-size: 13px;
}
.ctx-stat-label {
  color: var(--slate-500);
}
.ctx-stat-value {
  font-weight: 600;
  color: var(--slate-700);
}
.ctx-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
}
.ctx-badge.teal {
  background: var(--teal-l);
  color: var(--teal);
  border: 1px solid var(--teal-b);
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
