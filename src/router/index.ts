import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/store/user'

import Login from '@/views/login/index.vue'

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
      requiresAuth: true
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
    component: Login,
    meta: {
      title: '登录',
      hideInMenu: true,
      requiresAuth: false
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

  // 获取用户store
  const userStore = useUserStore()
  
  // 获取token
  const token = localStorage.getItem('token') || sessionStorage.getItem('token')
  
  // 权限检查
  if (to.meta?.requiresAuth !== false) {
    // 默认需要认证，除非明确设置为false
    
    if (!token && !userStore.hasToken) {
      // 没有token，跳转到登录页，并保存原始目标路径
      console.warn('未找到token，跳转到登录页')
      if (to.path !== '/login') {
        // 保存重定向路径到query参数
        next({
          path: '/login',
          query: { redirect: to.fullPath }
        })
        return
      }
    } else if (token && !userStore.hasToken) {
      // 有token但store中没有，需要初始化
      console.log('检测到token，初始化用户状态')
      userStore.initUserState()
    }
  }

  // 如果已登录且访问登录页，重定向到工作台或原始目标页面
  if (to.path === '/login' && (userStore.hasToken || token)) {
    console.log('已登录，从登录页重定向')
    // 检查是否有重定向目标
    const redirectPath = (to.query.redirect as string) || '/workspace'
    next(redirectPath)
    return
  }

  next()
})

// 全局后置钩子
router.afterEach((to, from) => {
  // 可以在这里添加页面访问统计
  console.log(`路由跳转: ${from.path} -> ${to.path}`)
})

export default router