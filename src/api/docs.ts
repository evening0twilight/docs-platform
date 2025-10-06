import { http } from '@/utils/request'
import type { TreeNode } from '@/api/type'

// 定义文档相关的类型
interface CreateDocumentRequest {
  title: string; // 文档使用 title 字段
  content?: string;
  description?: string;
  type?: string;
  parentId?: number | null;
}

interface CreateFolderRequest {
  name: string; // 文件夹使用 name 字段
  parentId?: number | null;
}

interface UpdateDocumentRequest {
  title?: string;
  content?: string; // 改为string类型
}

interface DocumentResponse {
  id: number; // 后端返回的是数字ID
  name: string; // 后端使用name而不是title
  description: string;
  itemType: 'document' | 'folder'; // 后端使用itemType
  author: string | null;
  content: string | null;
  thumb_url: string;
  documentType: string | null;
  parentId: number | null;
  sortOrder: number;
  creatorId: number;
  visibility: 'public' | 'private';
  isDeleted: boolean;
  children?: DocumentResponse[]; // 递归包含子节点
  created_time: string;
  updated_time: string;
}

interface TreeNodeResponse extends DocumentResponse {
  // TreeNodeResponse就是DocumentResponse，因为后端返回的就是完整的树结构
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

// ====== 基础CRUD操作 ======

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
export const getDocumentTree = async (): Promise<TreeNodeResponse[]> => {
  try {
    const response = await http.get<TreeNodeResponse[]>('/documents/tree');
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
    const response = await http.get<FolderContentsResponse>(`/documents/folders/${parentId}/contents`);
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
    key: node.id.toString(), // 转换为字符串
    title: node.name, // 使用name而不是title
    type: node.itemType === 'folder' ? 'folder' : 'file', // 使用itemType
    isLeaf: node.itemType === 'document',
    children: node.children?.map(transformToTreeData),
    lastModified: node.updated_time // 使用updated_time
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

// ====== 其他功能函数 ======

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
        if (node.name.includes(keyword)) { // 使用name而不是title
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
