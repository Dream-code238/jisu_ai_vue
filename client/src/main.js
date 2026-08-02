// client/src/main.js
import { createApp } from 'vue';
import App    from './App.vue';
import router from './router/index.js';
import './assets/styles.css';

createApp(App).use(router).mount('#app');
