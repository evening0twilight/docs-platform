// 路由相关的类型定义
export interface RouteConfig {
  path: string
  name: string
  title: string
  icon?: string
  requiresAuth?: boolean
  hideInMenu?: boolean
}

// 菜单项类型
export interface MenuItem {
  key: string
  title: string
  icon?: string
  path: string
}

// 面包屑项类型
export interface BreadcrumbItem {
  title: string
  path?: string
}
