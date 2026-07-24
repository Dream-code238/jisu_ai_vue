<template>
  <div class="chat-input-area">
    <textarea
      ref="textareaRef"
      v-model="text"
      class="chat-textarea"
      placeholder="输入消息，Enter 发送，Shift+Enter 换行"
      rows="1"
      @keydown="handleKeydown"
      @input="autoResize"
    ></textarea>
    <button class="send-btn" :disabled="!text.trim() || disabled" @click="handleSend">发送</button>
    <button v-if="disabled" class="stop-btn" @click="$emit('stop')">停止</button>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'

const props = defineProps({ disabled: { type: Boolean, default: false } })
const emit = defineEmits(['send', 'stop'])

const text = ref('')
const textareaRef = ref(null)

const handleKeydown = (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

const handleSend = () => {
  const trimmed = text.value.trim()
  if (!trimmed || props.disabled) return
  emit('send', trimmed)
  text.value = ''
  nextTick(() => autoResize())
}

const autoResize = () => {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 120) + 'px'
}
</script>

<style lang="less" scoped>
.chat-input-area {
  display: flex;
  gap: 8px;
  padding: 12px 24px;
  border-top: 1px solid #e2e8f0;
  background: #fff;
}
.chat-textarea {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  resize: none;
  outline: none;
  line-height: 1.5;
  max-height: 120px;
}
.chat-textarea:focus {
  border-color: #2563eb;
}
.send-btn {
  padding: 0 20px;
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}
.send-btn:disabled {
  background: #cbd5e1;
  cursor: not-allowed;
}
.stop-btn {
  padding: 0 16px;
  background: #ef4444;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}
</style>
