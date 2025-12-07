/**
 * 版本信息
 */
export interface DocumentVersion {
  id: number;
  documentId: number;
  versionNumber: number;
  contentSize: number;
  author: {
    id: number;
    username: string;
    avatar?: string;
  };
  changeDescription?: string;
  isAutoSave: boolean;
  isRestore: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * 版本详情(包含内容)
 */
export interface DocumentVersionDetail extends DocumentVersion {
  content: string; // JSON字符串
}

/**
 * 版本列表响应
 */
export interface VersionListResponse {
  versions: DocumentVersion[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * 保存版本请求
 */
export interface SaveVersionRequest {
  content: string;
  changeDescription?: string;
  isAutoSave?: boolean;
}

/**
 * 恢复版本请求
 */
export interface RestoreVersionRequest {
  versionId: number;
}

/**
 * 版本对比请求
 */
export interface CompareVersionRequest {
  sourceVersionId: number;
  targetVersionId: number;
}

/**
 * 差异项
 */
export interface DiffItem {
  type: 'equal' | 'insert' | 'delete';
  text: string;
}

/**
 * 版本对比结果
 */
export interface VersionCompareResult {
  sourceVersion: {
    id: number;
    versionNumber: number;
    createdAt: string;
  };
  targetVersion: {
    id: number;
    versionNumber: number;
    createdAt: string;
  };
  diffs: DiffItem[];
  stats: {
    additions: number;
    deletions: number;
    unchanged: number;
  };
}

/**
 * 冲突信息
 */
export interface ConflictInfo {
  hasConflict: boolean;
  latestVersion: DocumentVersion;
  yourVersion: number;
  message: string;
}
