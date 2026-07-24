<template>
  <div class="ai-bubble">
    <span class="content" v-html="content"></span>
    <StreamingCursor v-if="streaming" />
  </div>
</template>

<script setup>
import StreamingCursor from './StreamingCursor.vue'
defineProps({
  content: { type: String, default: '' },
  streaming: { type: Boolean, default: false },
})
</script>

<style lang="less" scoped>
.ai-bubble {
  background: #fff;
  color: #1e293b;
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 12px 12px 12px 4px;
  font-size: 14px;
  line-height: 1.6;
  display: inline-block;
}
.content :deep(code) {
  background: #f1f5f9;
  padding: 2px 4px;
  border-radius: 4px;
  font-size: 13px;
}
</style>
