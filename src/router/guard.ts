// 路由守卫
// router/guard.ts
import { getDocumentTree } from '@/api/document'

export const setupDocumentRoutes = async (router: Router) => {
  const treeData = await getDocumentTree()
  const routes = generateRoutesFromTree(treeData)
  
  routes.forEach(route => {
    router.addRoute('home', route)
  })
}

const generateRoutesFromTree = (treeData: any[]): RouteRecordRaw[] => {
  const routes: RouteRecordRaw[] = []
  
  const traverse = (nodes: any[]) => {
    nodes.forEach(node => {
      if (node.type === 'file') {
        routes.push({
          path: node.path,
          name: `document-${node.id}`,
          component: () => import('@/views/editor/index.vue'),
          meta: {
            title: node.name,
            keepAlive: true
          }
        })
      }
      
      if (node.children) {
        traverse(node.children)
      }
    })
  }
  
  traverse(treeData)
  return routes
}