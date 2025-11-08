import { Mark, mergeAttributes } from '@tiptap/core'

export interface CommentMarkOptions {
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    commentMark: {
      /**
       * 设置评论标记
       */
      setCommentMark: (attributes: { commentId: string; userId?: string; timestamp?: number }) => ReturnType
      /**
       * 取消评论标记
       */
      unsetCommentMark: (commentId?: string) => ReturnType
      /**
       * 切换评论标记
       */
      toggleCommentMark: (attributes: { commentId: string; userId?: string; timestamp?: number }) => ReturnType
    }
  }
}

/**
 * 评论标记扩展
 * 用于在文档中标记评论位置
 */
export const CommentMark = Mark.create<CommentMarkOptions>({
  name: 'comment',

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      commentId: {
        default: null,
        parseHTML: element => element.getAttribute('data-comment-id'),
        renderHTML: attributes => {
          if (!attributes.commentId) {
            return {}
          }
          return {
            'data-comment-id': attributes.commentId,
          }
        },
      },
      userId: {
        default: null,
        parseHTML: element => element.getAttribute('data-user-id'),
        renderHTML: attributes => {
          if (!attributes.userId) {
            return {}
          }
          return {
            'data-user-id': attributes.userId,
          }
        },
      },
      timestamp: {
        default: null,
        parseHTML: element => {
          const timestamp = element.getAttribute('data-timestamp')
          return timestamp ? parseInt(timestamp, 10) : null
        },
        renderHTML: attributes => {
          if (!attributes.timestamp) {
            return {}
          }
          return {
            'data-timestamp': attributes.timestamp,
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-comment-id]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: 'comment-highlight',
      }),
      0,
    ]
  },

  addCommands() {
    return {
      setCommentMark:
        attributes =>
        ({ commands }) => {
          return commands.setMark(this.name, attributes)
        },
      unsetCommentMark:
        commentId =>
        ({ tr, state, dispatch }) => {
          if (!commentId) {
            // 如果没有指定 commentId，移除所有评论标记
            return ({ commands }: any) => commands.unsetMark(this.name)
          }

          // 移除特定 commentId 的标记
          const { selection } = state
          const { from, to } = selection

          if (dispatch) {
            tr.doc.nodesBetween(from, to, (node, pos) => {
              if (node.marks) {
                node.marks.forEach(mark => {
                  if (mark.type.name === this.name && mark.attrs.commentId === commentId) {
                    const markFrom = pos
                    const markTo = pos + node.nodeSize
                    tr.removeMark(markFrom, markTo, mark.type)
                  }
                })
              }
            })
          }

          return true
        },
      toggleCommentMark:
        attributes =>
        ({ commands }) => {
          return commands.toggleMark(this.name, attributes)
        },
    }
  },
})
