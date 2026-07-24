<template>
  <div class="welcome">
    <div class="logo">购</div>
    <h2>极速购 AI 客服</h2>
    <p>我是小购，有什么可以帮您的？</p>
    <div class="card-grid">
      <QuickCard
        v-for="c in cards"
        :key="c.route"
        v-bind="c"
        @click="$emit('card-click', c.route)"
      />
    </div>
  </div>
</template>

<script setup>
import QuickCard from './QuickCard.vue'

const cards = [
  { icon: '🔧', title: '查询订单', desc: '输入订单号查看物流状态', route: '/agent' },
  { icon: '📚', title: '知识库问答', desc: '退换货政策、售后指南', route: '/rag' },
  { icon: '⚡', title: '智能中枢', desc: '查看工作流执行轨迹', route: '/graph' },
  { icon: '📁', title: '知识库管理', desc: '上传文档管理知识库', route: '/knowledge' },
]

defineEmits(['card-click'])
</script>

<style scoped>
.welcome {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.logo {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: linear-gradient(135deg, #2563eb, #6366f1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 16px;
}
h2 {
  font-size: 20px;
  color: #1e293b;
  margin-bottom: 4px;
}
p {
  font-size: 14px;
  color: #64748b;
  margin-bottom: 24px;
}
.card-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  max-width: 480px;
}
</style>
