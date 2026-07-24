import { createRouter, createWebHistory } from 'vue-router'
import ChatView from '../views/ChatView.vue'
import AgentView from '../views/AgentView.vue'
import RagView from '../views/RagView.vue'
import GraphView from '../views/GraphView.vue'
import KnowledgeView from '../views/KnowledgeView.vue'
import DashboardView from '../views/DashboardView.vue'
import ShowcaseView from '../views/ShowcaseView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: ChatView, meta: { title: '智能对话' } },
    { path: '/agent', component: AgentView, meta: { title: '订单查询' } },
    { path: '/rag', component: RagView, meta: { title: '知识库问答' } },
    { path: '/graph', component: GraphView, meta: { title: '智能中枢' } },
    { path: '/knowledge', component: KnowledgeView, meta: { title: '知识库管理' } },
    { path: '/dashboard', component: DashboardView, meta: { title: '数据看板' } },
    { path: '/showcase', component: ShowcaseView, meta: { title: '扩展功能演示' } },
  ],
})

export default router
