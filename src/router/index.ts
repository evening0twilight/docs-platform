import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

// 路由配置
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/workspace'
  },
  {
    path: '/workspace',
    name: 'Workspace',
    component: () => import('@/components/MainLayout.vue'),
    meta: {
      title: '文档工作台',
      requiresAuth: false
    },
    children: [
      {
        path: '',
        name: 'Editor',
        component: () => import('@/components/EditorArea.vue'),
        meta: {
          title: '编辑器',
          keepAlive: true
        }
      },
      {
        path: 'document/:id',
        name: 'Document',
        component: () => import('@/components/EditorArea.vue'),
        props: true,
        meta: {
          title: '文档详情',
          keepAlive: true
        }
      }
    ]
  },
  // 登录页面
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login.vue'),
    meta: {
      title: '登录',
      hideInMenu: true
    }
  },
  // 用户设置页面
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/Settings.vue'),
    meta: {
      title: '设置',
      requiresAuth: true
    }
  },
  // 404页面
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/404.vue'),
    meta: {
      title: '页面未找到',
      hideInMenu: true
    }
  }
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  // 滚动行为
  scrollBehavior(to, from, savedPosition) {
    // 避免参数未使用的警告
    console.log('路由滚动:', { to: to.path, from: from.path })
    
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// 全局前置守卫
router.beforeEach((to, _from, next) => {
  // 设置页面标题
  if (to.meta?.title) {
    document.title = `${to.meta.title} - 文档平台`
  }

  // 权限检查
  if (to.meta?.requiresAuth) {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    if (!token) {
      next('/login')
      return
    }
  }

  next()
})

// 全局后置钩子
router.afterEach((to, from) => {
  // 可以在这里添加页面访问统计
  console.log(`路由跳转: ${from.path} -> ${to.path}`)
})

export default router