import { createRouter, createWebHashHistory } from 'vue-router';
import index from '@/views/Index.vue';
import login from '@/views/Login.vue';

const routes = [
  {
    path: '/',
    name: 'index',
    component: index,
  },
  {
    path: '/login',
    name: 'login',
    component: login,
  }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const isAuthenticated = !!localStorage.getItem('user-token');
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);

  if (requiresAuth && !isAuthenticated) {
    next('/login'); // 如果需要认证但未登录，则重定向到登录页面
  } else {
    next(); // 否则继续到下一个路由
  }
});

export default router;
