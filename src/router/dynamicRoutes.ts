// 动态路由配置
import type { RouteRecordRaw } from 'vue-router'
import type { Router } from 'vue-router'
import { getDocumentTree } from '@/api/document'

export const setupDynamicRoutes = async (router: Router) => {
  try {
    const documents = await getDocumentTree()
    const routes = generateRoutesFromDocuments(documents)
    
    routes.forEach(route => {
      router.addRoute('home', route)
    })
  } catch (error) {
    console.error('Failed to setup dynamic routes:', error)
  }
}

const generateRoutesFromDocuments = (documents: any[]): RouteRecordRaw[] => {
  return documents.map(doc => ({
    path: `/document/${doc.id}`,
    name: `document-${doc.id}`,
    component: () => import('@/views/editor/index.vue'),
    meta: {
      title: doc.name,
      keepAlive: true,
      requiresAuth: true
    }
  }))
}