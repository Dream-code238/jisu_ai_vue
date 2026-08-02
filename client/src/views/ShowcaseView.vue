<!--
  扩展功能演示
  3 个交互式演示卡片：
    1. 语义缓存演示 — 相同问题二次命中缓存
    2. RAG 流式演示 — 来源先出 + 答案逐字流式
    3. 对话记忆演示 — 跨轮次上下文记忆
-->
<template>
  <div class="showcase-page">
    <div class="showcase-header">
      <h2>扩展功能演示</h2>
      <p>点击卡片中的按钮，亲身体验三大核心能力的实际效果。</p>
    </div>

    <div class="showcase-grid">
      <!-- ─── 1. 语义缓存演示 ─────────────────────────────────── -->
      <div class="showcase-card">
        <div class="showcase-card-title">
          ⚡ 语义缓存演示
          <span class="showcase-card-tag">T14</span>
        </div>
        <div class="showcase-card-desc">
          向 AI 提问同一个问题两次。第一次走完整推理流程，第二次直接命中语义缓存（相似度 ≥
          92%），响应速度大幅提升。
        </div>
        <div class="showcase-demo">
          <button class="btn btn-primary btn-sm" :disabled="cacheStreaming" @click="runCacheDemo">
            {{
              cacheStep === 0
                ? '开始演示'
                : cacheStep === 1
                  ? '第二次提问（相同问题）'
                  : '演示完成 ✓'
            }}
          </button>
          <div v-if="cacheStep >= 1" class="demo-result">
            <div class="demo-label">第一次提问 <span class="miss-tag">未命中</span></div>
            <div class="demo-text">{{ cacheFirstText || '...' }}</div>
          </div>
          <div v-if="cacheStep >= 2" class="demo-result highlight">
            <div class="demo-label">
              第二次提问 <span class="msg-cache-badge">⚡ 缓存命中</span>
            </div>
            <div class="demo-text">{{ cacheSecondText || '...' }}</div>
          </div>
        </div>
      </div>

      <!-- ─── 2. RAG 流式演示 ─────────────────────────────────── -->
      <div class="showcase-card">
        <div class="showcase-card-title">
          📚 RAG 流式演示
          <span class="showcase-card-tag">T18</span>
        </div>
        <div class="showcase-card-desc">
          两阶段流式输出：先展示检索到的知识库来源，再逐字流式生成回答。两阶段检索确保最相关文档被使用。
        </div>
        <div class="showcase-demo">
          <button class="btn btn-primary btn-sm" :disabled="ragStreaming" @click="runRagDemo">
            {{ ragStreaming ? '检索中...' : '开始检索' }}
          </button>
          <div v-if="ragSources.length > 0" class="source-block">
            <div class="source-block-title">📎 检索来源（{{ ragSources.length }}）</div>
            <div class="source-list">
              <div v-for="(src, i) in ragSources" :key="i" class="source-item">
                <span class="source-num">{{ i + 1 }}</span>
                <span>{{ src.source || src.metadata?.source || '文档' }}</span>
              </div>
            </div>
          </div>
          <div v-if="ragText" class="demo-result">
            <div class="demo-label">AI 回答</div>
            <div class="demo-text">
              {{ ragText }}<span v-if="ragStreaming" class="cursor-blink"></span>
            </div>
          </div>
        </div>
      </div>

      <!-- ─── 3. 对话记忆演示 ─────────────────────────────────── -->
      <div class="showcase-card">
        <div class="showcase-card-title">
          🧠 对话记忆演示
          <span class="showcase-card-tag">T06</span>
        </div>
        <div class="showcase-card-desc">
          基于 PostgresSaver checkpointer 的跨轮次记忆。第一轮告诉 AI 你的名字，第二轮询问名字，AI
          能正确回忆。
        </div>
        <div class="showcase-demo">
          <button class="btn btn-primary btn-sm" :disabled="memoryStreaming" @click="runMemoryDemo">
            {{ memoryStep === 0 ? '开始演示' : memoryStep === 1 ? '第二轮：问名字' : '演示完成 ✓' }}
          </button>
          <div v-if="memoryStep >= 1" class="demo-result">
            <div class="demo-label">第一轮：用户</div>
            <div class="demo-text user-text">我叫张三，请记住我的名字</div>
            <div class="demo-label" style="margin-top: 8px">第一轮：AI</div>
            <div class="demo-text">{{ memoryFirstText || '...' }}</div>
          </div>
          <div v-if="memoryStep >= 2" class="demo-result highlight">
            <div class="demo-label">第二轮：用户</div>
            <div class="demo-text user-text">我叫什么名字？</div>
            <div class="demo-label" style="margin-top: 8px">第二轮：AI</div>
            <div class="demo-text">{{ memorySecondText || '...' }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useSSEStream } from '../composables/useSSEStream.js'

// ─── 1. 语义缓存演示 ────────────────────────────────────────────
const cacheStep = ref(0)
const cacheFirstText = ref('')
const cacheSecondText = ref('')
const cacheFirstHit = ref(false)
const cacheSecondHit = ref(false)
const cacheStreaming = ref(false)
const cacheHitFlag = ref(false)

const cacheStream = useSSEStream({
  onCacheHit: () => {
    cacheHitFlag.value = true
  },
  onDone: () => {
    if (cacheStream.streamText.value) {
      if (cacheStep.value === 0) {
        cacheFirstText.value = cacheStream.streamText.value
        cacheFirstHit.value = cacheHitFlag.value
        cacheStep.value = 1
      } else if (cacheStep.value === 1) {
        cacheSecondText.value = cacheStream.streamText.value
        cacheSecondHit.value = cacheHitFlag.value
        cacheStep.value = 2
      }
    }
    cacheStream.streamText.value = ''
    cacheHitFlag.value = false
    cacheStreaming.value = false
  },
})

const runCacheDemo = async () => {
  if (cacheStep.value >= 2) {
    cacheStep.value = 0
    cacheFirstText.value = ''
    cacheSecondText.value = ''
    cacheFirstHit.value = false
    cacheSecondHit.value = false
    return
  }
  cacheStreaming.value = true
  cacheHitFlag.value = false
  await cacheStream.startStream('/chat/stream', {
    message: '退货政策是什么？',
    history: [],
  })
}

// ─── 2. RAG 流式演示 ────────────────────────────────────────────
const ragSources = ref([])
const ragText = ref('')
const ragStreaming = ref(false)

const ragStream = useSSEStream({
  onSources: (sources) => {
    ragSources.value = sources
  },
  onDone: () => {
    if (ragStream.streamText.value) {
      ragText.value = ragStream.streamText.value
    }
    ragStream.streamText.value = ''
    ragStreaming.value = false
  },
})

const runRagDemo = async () => {
  ragSources.value = []
  ragText.value = ''
  ragStreaming.value = true
  await ragStream.startStream('/rag/stream', {
    question: '蓝牙耳机怎么保修？',
  })
}

// ─── 3. 对话记忆演示 ────────────────────────────────────────────
const memoryStep = ref(0)
const memoryFirstText = ref('')
const memorySecondText = ref('')
const memoryStreaming = ref(false)
const memorySessionId = ref('demo-memory-' + Date.now())

const memoryStream = useSSEStream({
  onDone: () => {
    if (memoryStream.streamText.value) {
      if (memoryStep.value === 0) {
        memoryFirstText.value = memoryStream.streamText.value
        memoryStep.value = 1
      } else if (memoryStep.value === 1) {
        memorySecondText.value = memoryStream.streamText.value
        memoryStep.value = 2
      }
    }
    memoryStream.streamText.value = ''
    memoryStreaming.value = false
  },
})

const runMemoryDemo = async () => {
  if (memoryStep.value >= 2) {
    memoryStep.value = 0
    memoryFirstText.value = ''
    memorySecondText.value = ''
    memorySessionId.value = 'demo-memory-' + Date.now()
    return
  }
  memoryStreaming.value = true
  if (memoryStep.value === 0) {
    await memoryStream.startStream('/graph/stream', {
      message: '我叫张三，请记住我的名字',
      history: [],
      sessionId: memorySessionId.value,
    })
  } else if (memoryStep.value === 1) {
    const history = [
      { role: 'user', content: '我叫张三，请记住我的名字' },
      { role: 'assistant', content: memoryFirstText.value },
    ]
    await memoryStream.startStream('/graph/stream', {
      message: '我叫什么名字？',
      history,
      sessionId: memorySessionId.value,
    })
  }
}
</script>

<style scoped>
.showcase-page {
  flex: 1;
  overflow-y: auto;
  padding: 24px 32px;
}
.showcase-header {
  margin-bottom: 20px;
}
.showcase-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: var(--slate-800);
  margin-bottom: 4px;
}
.showcase-header p {
  font-size: 13px;
  color: var(--slate-500);
}
.showcase-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16px;
}
.showcase-card {
  background: #fff;
  border: 1px solid var(--slate-200);
  border-radius: 12px;
  padding: 20px;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
}
.showcase-card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--slate-700);
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.showcase-card-tag {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--slate-100);
  color: var(--slate-500);
  font-weight: 500;
}
.showcase-card-desc {
  font-size: 12px;
  color: var(--slate-400);
  margin-bottom: 14px;
  line-height: 1.6;
}
.showcase-demo {
  padding: 16px;
  border-radius: 10px;
  background: var(--slate-50);
  border: 1px solid var(--slate-200);
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
}
.demo-result {
  padding: 10px 12px;
  border-radius: 8px;
  background: #fff;
  border: 1px solid var(--slate-200);
}
.demo-result.highlight {
  background: var(--amber-l);
  border-color: var(--amber-b);
}
.demo-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--slate-500);
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.demo-text {
  font-size: 12px;
  color: var(--slate-700);
  line-height: 1.6;
}
.demo-text.user-text {
  color: var(--blue);
  font-weight: 500;
}
.miss-tag {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 4px;
  background: var(--slate-100);
  color: var(--slate-400);
}
.msg-cache-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 10px;
  background: var(--amber-l);
  color: var(--amber);
  font-size: 11px;
  font-weight: 500;
  border: 1px solid var(--amber-b);
}
.source-block {
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--teal-l);
  border: 1px solid var(--teal-b);
}
.source-block-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--teal);
  margin-bottom: 6px;
}
.source-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.source-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 6px;
  background: #fff;
  font-size: 12px;
  color: var(--slate-600);
}
.source-num {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  background: var(--teal);
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.cursor-blink {
  display: inline-block;
  width: 8px;
  height: 16px;
  background: var(--blue);
  border-radius: 1px;
  animation: blink 0.8s step-end infinite;
  vertical-align: text-bottom;
  margin-left: 2px;
}
@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}
@media (max-width: 900px) {
  .showcase-grid {
    grid-template-columns: 1fr;
  }
}
</style>
