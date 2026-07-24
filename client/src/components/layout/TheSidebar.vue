<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <div class="sidebar-logo">购</div>
      <div class="sidebar-brand">极速购 AI<span>智能客服系统</span></div>
    </div>
    <nav class="sidebar-nav">
      <!-- 对话分组 -->
      <div class="nav-group-title">对话</div>
      <NavItem to="/" icon="💬" label="智能对话" />
      <NavItem to="/agent" icon="🔧" label="订单查询" />
      <NavItem to="/rag" icon="📚" label="知识库问答" />
      <NavItem to="/graph" icon="⚡" label="智能中枢" />
      <!-- 管理分组 -->
      <div class="nav-group-title">管理</div>
      <NavItem to="/knowledge" icon="📁" label="知识库管理" />
      <NavItem to="/dashboard" icon="📊" label="数据看板" />
      <!-- 扩展功能分组 -->
      <div class="nav-group-title">扩展功能</div>
      <NavItem to="/showcase" icon="✨" label="功能演示" />
    </nav>
    <div class="sidebar-footer">
      <div class="user-info">
        <div class="user-avatar">U</div>
        <span class="user-name">开发者</span>
      </div>
    </div>
  </aside>
</template>

<script setup>
import NavItem from './NavItem.vue'
</script>

<style lang="less" scoped>
.sidebar {
  width: 224px;
  background: #0f172a;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow-y: auto;

  .sidebar-header {
    padding: 18px 20px;
    display: flex;
    align-items: center;
    gap: 10px;

    .sidebar-logo {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: linear-gradient(135deg, #2563eb, #6366f1);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      font-weight: 700;
      color: #fff;
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
      color: #94a3b8;
      margin-top: 2px;
    }
  }

  .sidebar-nav {
    flex: 1;
    padding: 8px 12px;

    .nav-group-title {
      font-size: 11px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 12px 8px 6px;
    }
  }

  .sidebar-footer {
    padding: 12px 16px;
    border-top: 1px solid #1e293b;

    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .user-avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #334155;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
    }
    .user-name {
      font-size: 13px;
      color: #94a3b8;
    }
  }
}
</style>
