// 定义树节点类型
export interface TreeNode {
  key: string
  title: string
  type: 'folder' | 'file'
  children?: TreeNode[]
  isLeaf?: boolean
  lastModified?: string
  isPinned?: boolean
  sortOrder?: number  // 添加 sortOrder 字段
}

// 定义文档内容类型
export interface DocumentContent {
  type: string
  content: any[]
}

// 定义API响应类型
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
  success: boolean
}