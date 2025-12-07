import { http } from '@/utils/request';
import type {
  DocumentVersion,
  DocumentVersionDetail,
  VersionListResponse,
  SaveVersionRequest,
  RestoreVersionRequest,
  VersionCompareResult,
} from '@/types/version';

/**
 * 保存文档版本
 */
export async function saveDocumentVersion(
  documentId: number,
  data: SaveVersionRequest
): Promise<DocumentVersion> {
  return http.post(`/api/documents/${documentId}/versions`, data);
}

/**
 * 获取版本列表
 */
export async function getDocumentVersions(
  documentId: number,
  page: number = 1,
  pageSize: number = 20
): Promise<VersionListResponse> {
  return http.get(`/api/documents/${documentId}/versions?page=${page}&pageSize=${pageSize}`);
}

/**
 * 获取版本详情
 */
export async function getVersionDetail(
  documentId: number,
  versionId: number
): Promise<DocumentVersionDetail> {
  return http.get(`/api/documents/${documentId}/versions/${versionId}`);
}

/**
 * 恢复到指定版本
 */
export async function restoreDocumentVersion(
  documentId: number,
  data: RestoreVersionRequest
): Promise<DocumentVersion> {
  return http.post(`/api/documents/${documentId}/restore`, data);
}

/**
 * 清理旧版本
 */
export async function cleanOldVersions(
  documentId: number,
  keepDays: number = 30
): Promise<{ deleted: number }> {
  return http.post(`/api/documents/${documentId}/versions/clean?keepDays=${keepDays}`);
}

/**
 * 对比两个版本
 */
export async function compareVersions(
  documentId: number,
  sourceVersionId: number,
  targetVersionId: number
): Promise<VersionCompareResult> {
  return http.get(`/api/documents/${documentId}/versions/compare?sourceVersionId=${sourceVersionId}&targetVersionId=${targetVersionId}`);
}

/**
 * 删除版本
 */
export async function deleteDocumentVersion(
  documentId: number,
  versionId: number
): Promise<{ message: string }> {
  return http.delete(`/api/documents/${documentId}/versions/${versionId}`);
}
