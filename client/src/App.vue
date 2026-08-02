<template>
  <div class="app">
    <TheSidebar />
    <div class="main">
      <TheHeader />
      <div class="main-body">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup>
import TheSidebar from './components/layout/TheSidebar.vue'
import TheHeader from './components/layout/TheHeader.vue'
</script>

<style>
.app {
  display: flex;
  height: 100vh;
  overflow: hidden;
}
.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--slate-50);
}
.main-body {
  flex: 1;
  overflow: hidden;
  display: flex;
  position: relative;
}
</style>
