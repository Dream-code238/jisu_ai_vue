<template>
  <div class="chat-input-area">
    <div class="chat-input-wrap" :class="{ focused: isFocused }">
      <textarea
        ref="textareaRef"
        v-model="text"
        class="chat-input"
        :placeholder="placeholder"
        rows="1"
        @keydown="handleKeydown"
        @input="autoResize"
        @focus="isFocused = true"
        @blur="isFocused = false"
      ></textarea>
      <div class="input-tools">
        <button class="input-tool-btn" title="附件">📎</button>
        <button class="input-tool-btn" title="图片">🖼️</button>
      </div>
      <button
        class="send-btn"
        :disabled="!text.trim() || disabled"
        @click="handleSend"
        :title="disabled ? '回复中...' : '发送'"
      >
        <span v-if="disabled" class="stop-icon" @click.stop="$emit('stop')">■</span>
        <span v-else>➤</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'

const props = defineProps({
  disabled: { type: Boolean, default: false },
  placeholder: { type: String, default: '输入消息，Enter 发送，Shift+Enter 换行' },
})
const emit = defineEmits(['send', 'stop'])

const text = ref('')
const textareaRef = ref(null)
const isFocused = ref(false)

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

<style scoped>
.chat-input-area {
  padding: 16px 32px;
  background: #fff;
  border-top: 1px solid var(--slate-200);
  flex-shrink: 0;
}
.chat-input-wrap {
  display: flex;
  gap: 10px;
  align-items: flex-end;
  background: var(--slate-50);
  border: 1px solid var(--slate-200);
  border-radius: 14px;
  padding: 6px 6px 6px 14px;
  transition:
    border-color 0.15s,
    background 0.15s,
    box-shadow 0.15s;
}
.chat-input-wrap.focused {
  border-color: var(--blue);
  background: #fff;
  box-shadow: 0 0 0 3px var(--blue-l);
}
.chat-input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 14px;
  line-height: 1.6;
  resize: none;
  max-height: 120px;
  min-height: 24px;
  padding: 6px 0;
  font-family: inherit;
  color: var(--slate-800);
}
.chat-input::placeholder {
  color: var(--slate-400);
}
.input-tools {
  display: flex;
  align-items: center;
  gap: 4px;
}
.input-tool-btn {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--slate-400);
  font-size: 14px;
  transition: all 0.12s;
}
.input-tool-btn:hover {
  background: var(--slate-100);
  color: var(--slate-600);
}
.send-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--blue);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  font-size: 14px;
  flex-shrink: 0;
}
.send-btn:hover:not(:disabled) {
  background: var(--blue-d);
}
.send-btn:disabled {
  background: var(--slate-200);
  color: var(--slate-400);
}
.stop-icon {
  cursor: pointer;
  font-size: 12px;
}
</style>
