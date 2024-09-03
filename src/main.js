import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import axios from 'axios';
import './assets/main.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@/utils/store.js';
// 创建 Vue 应用实例
const app = createApp(App);

// 设置全局 axios 实例
app.config.globalProperties.$axios = axios;

// 配置请求拦截器
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('user-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// 使用路由
app.use(router);

// 挂载应用
app.mount('#app');