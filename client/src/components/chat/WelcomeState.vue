<template>
  <div class="welcome-state">
    <div class="welcome-icon">👋</div>
    <h2>您好，我是极速购智能客服小购</h2>
    <p class="welcome-sub">有任何购物、订单、物流、售后问题都可以问我</p>
    <div class="quick-grid">
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

defineEmits(['card-click'])

const cards = [
  {
    icon: '📦',
    iconBg: 'var(--blue-l)',
    iconColor: 'var(--blue)',
    title: '订单查询',
    desc: '查物流、查状态、查详情',
    route: '/agent',
  },
  {
    icon: '📖',
    iconBg: 'var(--teal-l)',
    iconColor: 'var(--teal)',
    title: '商品咨询',
    desc: '规格、参数、使用方法',
    route: '/rag',
  },
  {
    icon: '🔄',
    iconBg: 'var(--teal-l)',
    iconColor: 'var(--teal)',
    title: '售后政策',
    desc: '退换货、保修、退款',
    route: '/rag',
  },
  {
    icon: '⚡',
    iconBg: 'var(--purple-l)',
    iconColor: 'var(--purple)',
    title: '智能中枢',
    desc: '自动路由最优回答',
    route: '/graph',
  },
]
</script>

<style scoped>
.welcome-state {
  text-align: center;
  padding: 48px 20px;
  max-width: 520px;
  margin: 0 auto;
}
.welcome-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: linear-gradient(135deg, var(--blue), var(--indigo));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin: 0 auto 16px;
  box-shadow: var(--shadow-md);
}
.welcome-state h2 {
  font-size: 20px;
  font-weight: 600;
  color: var(--slate-800);
  margin-bottom: 6px;
}
.welcome-sub {
  font-size: 14px;
  color: var(--slate-500);
  margin-bottom: 24px;
}
.quick-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
</style>
