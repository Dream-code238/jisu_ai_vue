<template>
  <div class="graph-layout">
    <div class="graph-main">
      <!-- 工作流轨迹图 -->
      <TraceFlow :nodes="nodes" :current-node="currentNode" />
      <!-- 消息列表 -->
      <div class="message-list" ref="messageListRef">
        <MessageRow v-for="(msg, i) in messages" :key="i" :message="msg" />
        <div v-if="streaming">
          <MessageRow :message="{ role: 'assistant', content: streamText }" :streaming="true" />
        </div>
      </div>
      <!-- 工具步骤列表 -->
      <div v-if="steps.length > 0" class="steps-panel">
        <div class="steps-title">工具调用步骤</div>
        <div v-for="(step, i) in steps" :key="i" class="step-item">
          <span class="step-tool">{{ step.tool }}</span>
          <span class="step-input">{{ JSON.stringify(step.toolInput) }}</span>
        </div>
      </div>
      <ChatInput :disabled="streaming" @send="handleSend" @stop="stopStream" />
    </div>
    <div class="graph-side">
      <NodeTimingPanel :timings="timings" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useGraph } from '../composables/useGraph.js'
import TraceFlow from '../components/graph/TraceFlow.vue'
import NodeTimingPanel from '../components/graph/NodeTimingPanel.vue'
import MessageRow from '../components/chat/MessageRow.vue'
import ChatInput from '../components/chat/ChatInput.vue'

const {
  messages,
  streaming,
  streamText,
  nodes,
  steps,
  currentNode,
  error,
  sendMessage,
  clearMessages,
  stopStream,
} = useGraph()

const messageListRef = ref(null)
const timings = ref([])

const scrollToBottom = () => {
  if (messageListRef.value) messageListRef.value.scrollTop = messageListRef.value.scrollHeight
}

const handleSend = (text) => sendMessage(text, scrollToBottom)
</script>

<style lang="less" scoped>
.graph-layout {
  display: flex;
  height: 100%;
  overflow: hidden;
}
.graph-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.graph-side {
  width: 280px;
  padding: 16px;
  background: #f8fafc;
  border-left: 1px solid #e2e8f0;
  overflow-y: auto;
}
.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px 0;
}
.steps-panel {
  padding: 12px 24px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
}
.steps-title {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 8px;
}
.step-item {
  display: flex;
  gap: 8px;
  padding: 4px 0;
  font-size: 12px;
}
.step-tool {
  color: #7c3aed;
  font-weight: 600;
}
.step-input {
  color: #64748b;
}
</style>
