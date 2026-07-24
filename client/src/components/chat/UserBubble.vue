<template>
  <div class="user-bubble">{{ content }}</div>
</template>

<script setup>
defineProps({ content: { type: String, required: true } })
</script>

<style lang="less" scoped>
.user-bubble {
  background: #2563eb;
  color: #fff;
  padding: 10px 14px;
  border-radius: 12px 12px 4px 12px;
  font-size: 14px;
  line-height: 1.6;
}
</style>
