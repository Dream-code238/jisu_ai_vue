<template>
  <span class="cursor"></span>
</template>

<style scoped>
.cursor {
  display: inline-block;
  width: 8px;
  height: 16px;
  background: #2563eb;
  border-radius: 2px;
  animation: blink 1s steps(2, start) infinite;
  vertical-align: text-bottom;
  margin-left: 2px;
}
@keyframes blink {
  to {
    visibility: hidden;
  }
}
</style>
