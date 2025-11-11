import request from '@/utils/request'
import type { Comment, CreateCommentDto, CreateReplyDto } from '@/types/comment'

/**
 * 获取文档的所有评论
 */
export const getComments = (documentId: string, params?: { resolved?: boolean; includeReplies?: boolean }) => {
  return request.get<Comment[]>(`/documents/${documentId}/comments`, { params })
}

/**
 * 创建评论（顶级评论或回复）
 */
export const createComment = (data: CreateCommentDto) => {
  // 从 data 中提取 documentId，其余字段发送给后端
  const { documentId, ...commentData } = data
  return request.post<Comment>(`/documents/${documentId}/comments`, commentData)
}

/**
 * 回复评论（使用相同的创建接口，通过 parentId 区分）
 * @deprecated 使用 createComment 并传入 parentId
 */
export const replyComment = (documentId: string, data: CreateReplyDto) => {
  return request.post(`/documents/${documentId}/comments`, {
    content: data.content,
    parentId: data.commentId,
    startPos: 0, // 回复不需要位置信息
    endPos: 0
  })
}

/**
 * 获取评论统计
 */
export const getCommentStats = (documentId: string) => {
  return request.get(`/documents/${documentId}/comments/stats`)
}

/**
 * 获取单个评论详情
 */
export const getCommentDetail = (documentId: string, commentId: string) => {
  return request.get<Comment>(`/documents/${documentId}/comments/${commentId}`)
}

/**
 * 更新评论内容
 */
export const updateComment = (documentId: string, commentId: string, content: string) => {
  return request.put(`/documents/${documentId}/comments/${commentId}`, { content })
}

/**
 * 标记评论为已解决
 */
export const resolveComment = (documentId: string, commentId: string) => {
  return request.put(`/documents/${documentId}/comments/${commentId}/resolve`)
}

/**
 * 重新打开评论
 */
export const reopenComment = (documentId: string, commentId: string) => {
  return request.put(`/documents/${documentId}/comments/${commentId}/reopen`)
}

/**
 * 删除评论
 */
export const deleteComment = (documentId: string, commentId: string) => {
  return request.delete(`/documents/${documentId}/comments/${commentId}`)
}

