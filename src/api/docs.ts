import { http } from '@/utils/request'
import type { TreeNode } from '@/api/type'

// 定义文档相关的类型
interface CreateDocumentRequest {
  title: string;
  content?: string;
  description?: string;
  type?: string;
  parentId?: number | null;
}

interface CreateFolderRequest {
  name: string;
  parentId?: number | null;
}

interface UpdateDocumentRequest {
  title?: string;
  content?: string;
}

interface DocumentResponse {
  id: number;
  name: string;
  description: string;
  itemType: 'document' | 'folder'; 
  author: string | null;
  content: string | null;
  thumb_url: string;
  documentType: string | null;
  parentId: number | null;
  sortOrder: number;
  creatorId: number;
  visibility: 'public' | 'private';
  isDeleted: boolean;
  isPinned?: boolean;
  permission?: 'owner' | 'editor' | 'viewer';
  children?: DocumentResponse[];
  created_time: string;
  updated_time: string;
}

interface TreeNodeResponse extends DocumentResponse {
}

interface FolderContentsResponse {
  folders: DocumentResponse[];
  documents: DocumentResponse[];
}

// 文件夹路径响应类型
interface FolderPathResponse {
  currentFolder: DocumentResponse;
  breadcrumbs: DocumentResponse[];
}

// 文档路径响应类型（与文件夹路径类似）
interface DocumentPathResponse {
  currentDocument: DocumentResponse;
  breadcrumbs: DocumentResponse[];
}


// 创建文档
export const createDocument = async (documentData: CreateDocumentRequest): Promise<DocumentResponse> => {
  try {
    const response = await http.post<DocumentResponse>('/documents', documentData);
    return response;
  } catch (error) {
    console.error('创建文档失败:', error);
    throw error;
  }
};

// 创建文件夹
export const createFolder = async (folderData: CreateFolderRequest): Promise<DocumentResponse> => {
  try {
    const response = await http.post<DocumentResponse>('/documents/folders', folderData);
    return response;
  } catch (error) {
    console.error('创建文件夹失败:', error);
    throw error;
  }
};

// 获取文档详情
export const getDocument = async (id: string | number): Promise<DocumentResponse> => {
  try {
    const response = await http.get<DocumentResponse>(`/documents/${id}`);
    return response;
  } catch (error) {
    console.error('获取文档详情失败:', error);
    throw error;
  }
};

// 更新文档（文件夹）
export const updateDocument = async (id: string | number, documentData: UpdateDocumentRequest): Promise<DocumentResponse> => {
  try {
    const response = await http.put<DocumentResponse>(`/documents/${id}`, documentData);
    return response;
  } catch (error) {
    console.error('更新文档失败:', error);
    throw error;
  }
};

// 删除文档
export const deleteDocument = async (id: string | number): Promise<{ message: string }> => {
  try {
    const response = await http.delete<{ message: string }>(`/documents/${id}`);
    return response;
  } catch (error) {
    console.error('删除文档失败:', error);
    throw error;
  }
};

// ====== 树形结构相关操作 ======

// 获取文件夹树结构
export const getDocumentTree = async (keyword?: string): Promise<TreeNodeResponse[]> => {
  try {
    const url = keyword ? `/documents/tree?keyword=${encodeURIComponent(keyword)}` : '/documents/tree';
    const response = await http.get<TreeNodeResponse[]>(url);
    return response;
  } catch (error) {
    console.error('获取文档树失败:', error);
    throw error;
  }
};

// 获取文件夹路径
export const getFolderPath = async (folderId: string | number): Promise<FolderPathResponse> => {
  try {
    const response = await http.get<FolderPathResponse>(`/documents/folders/${folderId}/path`);
    return response;
  } catch (error) {
    console.error('获取文件夹路径失败:', error);
    throw error;
  }
};

// 获取文档路径
export const getDocumentPath = async (documentId: string | number): Promise<DocumentPathResponse> => {
  try {
    const response = await http.get<DocumentPathResponse>(`/documents/documents/${documentId}/path`);
    return response;
  } catch (error) {
    console.error('获取文档路径失败:', error);
    throw error;
  }
};

// 获取文件夹内容（动态加载）
export const getFolderContents = async (parentId: string | number): Promise<FolderContentsResponse> => {
  try {
    const response = await http.get<any>(`/documents/folders/${parentId}/contents`);
    console.log('[API] 获取文件夹内容响应:', response);
    
    // 处理后端返回的数据结构
    if (response.data && response.data.contents) {
      // 分离文件夹和文档
      const contents = response.data.contents;
      const folders = contents.filter((item: any) => item.itemType === 'folder');
      const documents = contents.filter((item: any) => item.itemType === 'document');
      
      return {
        folders,
        documents
      };
    }
    
    // 如果已经是正确格式，直接返回
    return response;
  } catch (error) {
    console.error('获取文件夹内容失败:', error);
    throw error;
  }
};

// ====== 树组件适配函数 ======

// 数据转换函数：将API响应数据格式转换为树组件需要的格式
export const transformToTreeData = (node: TreeNodeResponse): TreeNode => {
  return {
    key: node.id.toString(),
    title: node.name,
    type: node.itemType === 'folder' ? 'folder' : 'file', 
    isLeaf: node.itemType === 'document',
    isPinned: node.sortOrder < 0,  // sortOrder < 0 表示已置顶
    sortOrder: node.sortOrder,
    children: node.children?.map(transformToTreeData),
    lastModified: node.updated_time
  }
};

// 动态加载子节点（用于Tree组件的懒加载）
export const loadChildNodes = async (parentKey: string): Promise<TreeNode[]> => {
  try {
    const contents = await getFolderContents(parentKey);
    const children: TreeNode[] = [];
    
    // 添加子文件夹
    contents.folders.forEach(folder => {
      children.push({
        key: folder.id.toString(),
        title: folder.name,
        type: 'folder',
        isLeaf: false,
        lastModified: folder.updated_time
      });
    });
    
    // 添加文档
    contents.documents.forEach(doc => {
      children.push({
        key: doc.id.toString(),
        title: doc.name,
        type: 'file',
        isLeaf: true,
        lastModified: doc.updated_time
      });
    });
    
    return children;
  } catch (error) {
    console.error('加载子节点失败:', error);
    throw error;
  }
};


// 获取文档内容
export const getDocumentContent = async (docId: string | number): Promise<string | null> => {
  try {
    const document = await getDocument(docId);
    return document.content || null;
  } catch (error) {
    console.error('获取文档内容失败:', error);
    throw error;
  }
};

// 保存文档内容
export const saveDocumentContent = async (docId: string | number, content: string): Promise<boolean> => {
  try {
    await updateDocument(docId, { content });
    return true;
  } catch (error) {
    console.error('保存文档内容失败:', error);
    throw error;
  }
};

// 搜索文档（基于树结构搜索）
export const searchDocuments = async (keyword: string): Promise<TreeNode[]> => {
  try {
    // 获取完整的树结构
    const tree = await getDocumentTree();
    
    // 递归搜索匹配的节点
    const searchInTree = (nodes: TreeNodeResponse[]): TreeNode[] => {
      const results: TreeNode[] = [];
      
      nodes.forEach(node => {
        if (node.name.includes(keyword)) {
          results.push(transformToTreeData(node));
        }
        
        if (node.children) {
          results.push(...searchInTree(node.children));
        }
      });
      
      return results;
    };
    
    return searchInTree(tree);
  } catch (error) {
    console.error('搜索文档失败:', error);
    throw error;
  }
};

// 获取匹配节点的路径（用于自动展开）
export const getMatchedNodePaths = async (keyword: string): Promise<string[]> => {
  try {
    const matchedDocuments = await searchDocuments(keyword);
    return matchedDocuments.map(doc => doc.key);
  } catch (error) {
    console.error('获取匹配路径失败:', error);
    throw error;
  }
};

// 获取分享给我的文档列表
export const getSharedDocuments = async (params?: {
  page?: number
  limit?: number
  role?: 'editor' | 'viewer'
}): Promise<{
  documents: Array<DocumentResponse & {
    owner: {
      id: number
      username: string
      email?: string
    }
    sharedAt: string
  }>
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}> => {
  try {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.role) queryParams.append('role', params.role)
    
    const url = `/documents/shared-with-me${queryParams.toString() ? '?' + queryParams.toString() : ''}`
    const response = await http.get(url)
    return response
  } catch (error) {
    console.error('获取分享文档失败:', error)
    throw error
  }
}

/**
 * 置顶/取消置顶文档
 * @param documentId 文档ID
 * @param isPinned true=置顶, false=取消置顶
 */
export const toggleDocumentPin = async (documentId: number, isPinned: boolean): Promise<DocumentResponse> => {
  try {
    console.log('[API] 置顶请求:', {
      documentId,
      isPinned
    });
    
    const response = await http.put<DocumentResponse>(`/documents/${documentId}`, { 
      isPinned: isPinned 
    });
    
    console.log('[API] 置顶响应:', response);
    
    return response;
  } catch (error) {
    console.error('[API] 切换置顶状态失败:', error);
    throw error;
  }
}

/**
 * 重命名文档
 */
export const renameDocument = async (
  documentId: number, 
  newTitle: string
): Promise<DocumentResponse> => {
  try {
    console.log('[API] 重命名文档:', { documentId, newTitle });
    
    const response = await http.put<DocumentResponse>(`/documents/${documentId}`, { 
      title: newTitle
    });
    
    console.log('[API] 重命名响应:', response);
    return response;
  } catch (error) {
    console.error('重命名文档失败:', error);
    throw error;
  }
}

/**
 * 重命名文件夹
 */
export const renameFolder = async (
  folderId: number, 
  newName: string
): Promise<DocumentResponse> => {
  try {
    console.log('[API] 重命名文件夹:', { folderId, newName });
    
    const response = await http.put<DocumentResponse>(`/documents/${folderId}`, { 
      name: newName
    });
    
    console.log('[API] 重命名响应:', response);
    return response;
  } catch (error) {
    console.error('重命名文件夹失败:', error);
    throw error;
  }
}

/**
 * 移动文档到其他文件夹
 */
export const moveDocument = async (
  documentId: number, 
  targetFolderId: number | null
): Promise<DocumentResponse> => {
  try {
    console.log('[API] 移动文档:', { documentId, targetFolderId });
    
    const response = await http.put<DocumentResponse>(`/documents/${documentId}`, { 
      parentId: targetFolderId 
    });
    
    console.log('[API] 移动响应:', response);
    return response;
  } catch (error) {
    console.error('移动文档失败:', error);
    throw error;
  }
}

/**
 * 移动文件夹到其他文件夹
 */
export const moveFolder = async (
  folderId: number, 
  targetFolderId: number | null
): Promise<DocumentResponse> => {
  try {
    console.log('[API] 移动文件夹:', { folderId, targetFolderId });
    
    const response = await http.put<DocumentResponse>(`/documents/${folderId}`, { 
      parentId: targetFolderId 
    });
    
    console.log('[API] 移动响应:', response);
    return response;
  } catch (error) {
    console.error('移动文件夹失败:', error);
    throw error;
  }
}
