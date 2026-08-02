<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <div class="sidebar-logo">购</div>
      <div class="sidebar-brand">
        极速购 AI
        <span>智能客服系统</span>
      </div>
    </div>

    <nav class="sidebar-nav">
      <div class="nav-group-title">对话</div>
      <NavItem to="/" icon="💬" label="智能对话" dotColor="var(--blue)" badge="4" />
      <NavItem to="/agent" icon="🔧" label="订单查询" dotColor="var(--blue)" />
      <NavItem to="/rag" icon="📚" label="知识库问答" dotColor="var(--teal)" />
      <NavItem to="/graph" icon="⚡" label="智能中枢" dotColor="var(--purple)" />

      <div class="nav-group-title">管理</div>
      <NavItem to="/knowledge" icon="📁" label="知识库管理" dotColor="var(--teal)" />
      <NavItem to="/dashboard" icon="📊" label="数据看板" dotColor="var(--indigo)" />

      <div class="nav-group-title">扩展功能</div>
      <NavItem to="/showcase" icon="✨" label="功能演示" dotColor="var(--amber)" />
    </nav>

    <div class="sidebar-footer">
      <div class="sidebar-avatar">管</div>
      <div class="sidebar-user">
        <strong>管理员</strong><br />
        极速购客服中心
      </div>
    </div>
  </aside>
</template>

<script setup>
import NavItem from './NavItem.vue'
</script>

<style scoped>
.sidebar {
  width: 224px;
  background: var(--slate-900);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  transition: width 0.2s;
  overflow: hidden;
}
.sidebar-header {
  padding: 18px 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.sidebar-logo {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: linear-gradient(135deg, var(--blue), var(--indigo));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}
.sidebar-brand {
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  line-height: 1.3;
}
.sidebar-brand span {
  display: block;
  font-size: 11px;
  font-weight: 400;
  color: var(--slate-400);
  margin-top: 2px;
}
.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 8px 12px;
}
.nav-group-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--slate-500);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 12px 8px 6px;
}
.sidebar-footer {
  padding: 12px 16px;
  border-top: 1px solid var(--slate-800);
  display: flex;
  align-items: center;
  gap: 10px;
}
.sidebar-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--teal);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}
.sidebar-user {
  font-size: 12px;
  color: var(--slate-400);
  line-height: 1.3;
}
.sidebar-user strong {
  color: var(--slate-200);
  font-weight: 500;
}
</style>
