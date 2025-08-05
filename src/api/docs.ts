import { userFolders } from '@/mock/data'
// import { http } from '@/utils/request' // 暂时注释，后续启用真实API时使用
import type { TreeNode, DocumentContent, ApiResponse } from '@/api/type'



// 数据转换函数：将mock数据格式转换为树组件需要的格式
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
    // 真实API调用（后续启用）
    // return await http.get<TreeNode[]>('/documents/tree')
    
    // 当前使用mock数据模拟
    return new Promise((resolve) => {
      setTimeout(() => {
        const treeData = transformToTreeData(userFolders)
        resolve(treeData.children || [])
      }, 300)
    })
  } catch (error) {
    console.error('获取文档树失败:', error)
    throw error
  }
}

// 搜索文档
export const searchDocuments = async (keyword: string): Promise<TreeNode[]> => {
  try {
    // 真实API调用（后续启用）
    // return await http.get<TreeNode[]>('/documents/search', { params: { keyword } })
    
    // 当前使用mock数据模拟
    return new Promise((resolve) => {
      setTimeout(() => {
        const allNodes = flattenTree(userFolders)
        const matchedNodes = allNodes.filter(node => 
          node.name.includes(keyword) || 
          (node.type === 'file' && searchInContent(node.content, keyword))
        )
        const treeData = matchedNodes.map(transformToTreeData)
        resolve(treeData)
      }, 200)
    })
  } catch (error) {
    console.error('搜索文档失败:', error)
    throw error
  }
}

// 懒加载子节点
export const loadChildNodes = async (parentKey: string): Promise<TreeNode[]> => {
  try {
    // 真实API调用（后续启用）
    // return await http.get<TreeNode[]>(`/documents/${parentKey}/children`)
    
    // 当前使用mock数据模拟
    return new Promise((resolve) => {
      setTimeout(() => {
        const parentNode = findNodeById(userFolders, parentKey)
        if (parentNode && parentNode.children) {
          const childNodes = parentNode.children.map(transformToTreeData)
          resolve(childNodes)
        } else {
          resolve([])
        }
      }, 500)
    })
  } catch (error) {
    console.error('加载子节点失败:', error)
    throw error
  }
}

// 获取文档内容
export const getDocumentContent = async (docId: string): Promise<DocumentContent | null> => {
  try {
    // 真实API调用（后续启用）
    // return await http.get<DocumentContent>(`/documents/${docId}/content`)
    
    // 当前使用mock数据模拟
    return new Promise((resolve) => {
      setTimeout(() => {
        const docNode = findNodeById(userFolders, docId)
        if (docNode && docNode.type === 'file' && docNode.content) {
          resolve(docNode.content)
        } else {
          resolve(null)
        }
      }, 200)
    })
  } catch (error) {
    console.error('获取文档内容失败:', error)
    throw error
  }
}

// 创建新文档
export const createDocument = async (parentId: string, name: string, type: 'folder' | 'file'): Promise<TreeNode> => {
  try {
    // 真实API调用（后续启用）
    // return await http.post<TreeNode>('/documents', { parentId, name, type })
    
    // 当前使用mock数据模拟
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('模拟创建文档:', { parentId, name, type }) // 使用参数避免警告
        const newNode: TreeNode = {
          key: `new-${Date.now()}`,
          title: name,
          type: type,
          isLeaf: type === 'file',
          lastModified: new Date().toISOString()
        }
        resolve(newNode)
      }, 300)
    })
  } catch (error) {
    console.error('创建文档失败:', error)
    throw error
  }
}

// 更新文档
export const updateDocument = async (docId: string, data: Partial<TreeNode>): Promise<TreeNode> => {
  try {
    // 真实API调用（后续启用）
    // return await http.put<TreeNode>(`/documents/${docId}`, data)
    
    // 当前使用mock数据模拟
    return new Promise((resolve) => {
      setTimeout(() => {
        const updatedNode: TreeNode = {
          key: docId,
          title: data.title || '未命名文档',
          type: data.type || 'file',
          isLeaf: data.type === 'file',
          lastModified: new Date().toISOString()
        }
        resolve(updatedNode)
      }, 300)
    })
  } catch (error) {
    console.error('更新文档失败:', error)
    throw error
  }
}

// 删除文档
export const deleteDocument = async (docId: string): Promise<boolean> => {
  try {
    // 真实API调用（后续启用）
    // await http.delete(`/documents/${docId}`)
    // return true
    
    // 当前使用mock数据模拟
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('模拟删除文档:', docId) // 使用参数避免警告
        resolve(true)
      }, 300)
    })
  } catch (error) {
    console.error('删除文档失败:', error)
    throw error
  }
}

// 保存文档内容
export const saveDocumentContent = async (docId: string, content: DocumentContent): Promise<boolean> => {
  try {
    // 真实API调用（后续启用）
    // await http.put(`/documents/${docId}/content`, content)
    // return true
    
    // 当前使用mock数据模拟
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('模拟保存文档内容:', { docId, contentType: content.type }) // 使用参数避免警告
        resolve(true)
      }, 500)
    })
  } catch (error) {
    console.error('保存文档内容失败:', error)
    throw error
  }
}

// 获取匹配节点的路径（用于自动展开）
export const getMatchedNodePaths = async (keyword: string): Promise<string[]> => {
  try {
    // 真实API调用（后续启用）
    // return await http.get<string[]>('/documents/search/paths', { params: { keyword } })
    
    // 当前使用mock数据模拟
    return new Promise((resolve) => {
      setTimeout(() => {
        const paths: string[] = []
        
        const findPaths = (node: any, currentPath: string[] = []): void => {
          const nodePath = [...currentPath, node.id]
          
          if (node.name.includes(keyword) || 
              (node.type === 'file' && searchInContent(node.content, keyword))) {
            paths.push(...nodePath.slice(0, -1)) // 添加父路径，不包括自己
          }
          
          if (node.children) {
            node.children.forEach((child: any) => {
              findPaths(child, nodePath)
            })
          }
        }
        
        findPaths(userFolders)
        resolve([...new Set(paths)]) // 去重
      }, 200)
    })
  } catch (error) {
    console.error('获取匹配路径失败:', error)
    throw error
  }
}

// 辅助函数：扁平化树结构
const flattenTree = (node: any): any[] => {
  let result = [node]
  if (node.children) {
    node.children.forEach((child: any) => {
      result.push(...flattenTree(child))
    })
  }
  return result
}

// 辅助函数：根据ID查找节点
const findNodeById = (tree: any, id: string): any => {
  if (tree.id === id) {
    return tree
  }
  if (tree.children) {
    for (const child of tree.children) {
      const found = findNodeById(child, id)
      if (found) return found
    }
  }
  return null
}

// 辅助函数：在文档内容中搜索关键词
const searchInContent = (content: any, keyword: string): boolean => {
  if (!content || !content.content) return false
  
  const searchInNode = (node: any): boolean => {
    if (node.type === 'text' && node.text?.includes(keyword)) {
      return true
    }
    if (node.content && Array.isArray(node.content)) {
      return node.content.some(searchInNode)
    }
    return false
  }
  
  return content.content.some(searchInNode)
}
