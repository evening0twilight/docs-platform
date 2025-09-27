import { http } from '@/utils/request'
import type { TreeNode, DocumentContent } from '@/api/type'

// 数据转换函数：将API响应数据格式转换为树组件需要的格式
export const transformToTreeData = (node: any): TreeNode => {
  return {
    key: node.id,
    title: node.name,
    type: node.type,
    children: node.children ? node.children.map(transformToTreeData) : undefined,
    isLeaf: node.type === 'file',
    lastModified: node.lastModified
  }
}

// 获取文档树数据
export const getDocumentTree = async (): Promise<TreeNode[]> => {
  try {
    const response = await http.get<any>('/documents')
    const treeData = transformToTreeData(response)
    return treeData.children || []
  } catch (error) {
    console.error('获取文档树失败:', error)
    throw error
  }
}

// 搜索文档
export const searchDocuments = async (keyword: string): Promise<TreeNode[]> => {
  try {
    const response = await http.get<any[]>(`/documents/search?keyword=${encodeURIComponent(keyword)}`)
    return response.map(transformToTreeData)
  } catch (error) {
    console.error('搜索文档失败:', error)
    throw error
  }
}

// 懒加载子节点
export const loadChildNodes = async (parentKey: string): Promise<TreeNode[]> => {
  try {
    const response = await http.get<any[]>(`/documents/${parentKey}/children`)
    return response.map(transformToTreeData)
  } catch (error) {
    console.error('加载子节点失败:', error)
    throw error
  }
}

// 获取文档内容
export const getDocumentContent = async (docId: string): Promise<DocumentContent | null> => {
  try {
    const response = await http.get<DocumentContent>(`/documents/${docId}/content`)
    return response
  } catch (error) {
    console.error('获取文档内容失败:', error)
    throw error
  }
}

// 创建新文档
export const createDocument = async (parentId: string, name: string, type: 'folder' | 'file'): Promise<TreeNode> => {
  try {
    const response = await http.post<any>('/documents', { parentId, name, type })
    return transformToTreeData(response)
  } catch (error) {
    console.error('创建文档失败:', error)
    throw error
  }
}

// 更新文档
export const updateDocument = async (docId: string, data: Partial<TreeNode>): Promise<TreeNode> => {
  try {
    const response = await http.put<any>(`/documents/${docId}`, data)
    return transformToTreeData(response)
  } catch (error) {
    console.error('更新文档失败:', error)
    throw error
  }
}

// 删除文档
export const deleteDocument = async (docId: string): Promise<boolean> => {
  try {
    await http.delete(`/documents/${docId}`)
    return true
  } catch (error) {
    console.error('删除文档失败:', error)
    throw error
  }
}

// 保存文档内容
export const saveDocumentContent = async (docId: string, content: DocumentContent): Promise<boolean> => {
  try {
    await http.put(`/documents/${docId}/content`, content)
    return true
  } catch (error) {
    console.error('保存文档内容失败:', error)
    throw error
  }
}

// 获取匹配节点的路径（用于自动展开）
export const getMatchedNodePaths = async (keyword: string): Promise<string[]> => {
  try {
    const response = await http.get<string[]>(`/documents/search/paths?keyword=${encodeURIComponent(keyword)}`)
    return response
  } catch (error) {
    console.error('获取匹配路径失败:', error)
    throw error
  }
}
