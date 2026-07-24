<template>
  <div id="app_root_container">
    <TheSidebar />
    <div class="main">
      <TheHeader />
      <main class="content-area">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { RouterLink, RouterView } from 'vue-router'
import TheSidebar from './components/layout/TheSidebar.vue'
import TheHeader from './components/layout/TheHeader.vue'
</script>

<style lang="less" scoped>
#app_root_container {
  display: flex;
  width: 100%;
  height: 100%;
  max-width: 100vw;
  max-height: 100vh;
}
.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.content-area {
  flex: 1;
  overflow-y: auto;
}
</style>
