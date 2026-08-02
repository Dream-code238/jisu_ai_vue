<template>
  <div class="msg-bubble user-bubble">{{ content }}</div>
</template>

<script setup>
defineProps({ content: { type: String, required: true } })
</script>

<style scoped>
.user-bubble {
  padding: 12px 16px;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.7;
  background: var(--blue);
  color: #fff;
  border-bottom-right-radius: 4px;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
