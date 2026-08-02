<template>
  <div class="msg-bubble thinking-bubble">
    <span class="dot"></span>
    <span class="dot"></span>
    <span class="dot"></span>
  </div>
</template>

<style scoped>
.thinking-bubble {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  padding: 12px 16px;
  background: #fff;
  border: 1px solid var(--slate-200);
  border-radius: 16px;
  border-bottom-left-radius: 4px;
  box-shadow: var(--shadow-sm);
  min-width: 60px;
}
.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--slate-400);
  animation: bounce 1.2s infinite;
}
.dot:nth-child(2) {
  animation-delay: 0.2s;
}
.dot:nth-child(3) {
  animation-delay: 0.4s;
}
@keyframes bounce {
  0%,
  80%,
  100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  40% {
    transform: translateY(-5px);
    opacity: 1;
  }
}
</style>
