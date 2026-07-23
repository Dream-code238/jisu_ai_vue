import { createRouter, createWebHistory } from 'vue-router'
import ChatView from '../views/ChatView.vue'
import AgentView from '../views/AgentView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      meta: {
        title: '基础对话',
      },
      component: ChatView,
    },
    { path: '/agent', component: AgentView, meta: { title: 'Agent 订单查询' } },
  ],
})

export default router
