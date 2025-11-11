/**
 * 评论接口定义
 */

export interface Comment {
  id: string
  documentId: string
  userId: string
  username: string
  avatar?: string
  content: string
  startPos: number
  endPos: number
  quotedText?: string  // 改为可选
  resolved: boolean
  createdAt: string
  updatedAt: string
  replies: CommentReply[]
}

export interface CommentReply {
  id: string
  commentId: string
  userId: string
  username: string
  avatar?: string
  content: string
  createdAt: string
}

export interface CreateCommentDto {
  documentId: string
  content: string
  startPos: number
  endPos: number
  quotedText?: string  // 改为可选
}

export interface CreateReplyDto {
  commentId: string
  content: string
}
