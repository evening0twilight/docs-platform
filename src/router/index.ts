import { createRouter, createWebHistory } from 'vue-router'
import { setupDynamicRoutes } from './dynamicRoutes'
import HomeView from '../views/home/index.vue'
import LoginView from '../views/login/index.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: {
        requiresAuth: true
      }
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView
    }
  ]
})

// 设置动态路由
setupDynamicRoutes(router)

export default router