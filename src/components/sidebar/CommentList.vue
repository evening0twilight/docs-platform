<template>
  <div class="comment-list-sidebar">
    <div class="sidebar-header">
      <h3>💬 评论</h3>
      <a-badge :count="unreadCount" :offset="[10, 0]" />
    </div>

    <div class="sidebar-content">
      <!-- 新增评论区域 -->
      <div v-if="hasSelection" class="new-comment-section">
        <a-alert type="info" banner closable>
          已选中: "{{ truncatedSelection }}"
        </a-alert>
        <a-textarea v-model="newCommentContent" placeholder="添加评论..." :auto-size="{ minRows: 3, maxRows: 6 }"
          :max-length="500" show-word-limit style="margin-top: 12px" />
        <div class="comment-actions">
          <a-button size="small" @click="handleCancelComment">取消</a-button>
          <a-button type="primary" size="small" @click="handleCreateComment" :loading="creating"
            :disabled="!newCommentContent.trim()">
            发表评论
          </a-button>
        </div>
      </div>

      <!-- 选择文本提示 -->
      <a-alert v-else-if="comments.length === 0" type="info" banner style="margin-bottom: 16px">
        选中文本后可添加评论
      </a-alert>

      <!-- 评论列表标签页 -->
      <a-tabs v-model:active-key="activeTab" v-if="comments.length > 0">
        <a-tab-pane key="unresolved" :title="`未解决 (${unresolvedComments.length})`">
          <div class="comments-list">
            <comment-item v-for="comment in unresolvedComments" :key="comment.id" :comment="comment"
              @reply="handleReply" @resolve="handleResolve" @delete="handleDelete" @locate="handleLocate" />
            <a-empty v-if="unresolvedComments.length === 0" description="暂无未解决的评论" />
          </div>
        </a-tab-pane>

        <a-tab-pane key="resolved" :title="`已解决 (${resolvedComments.length})`">
          <div class="comments-list">
            <comment-item v-for="comment in resolvedComments" :key="comment.id" :comment="comment" @reply="handleReply"
              @delete="handleDelete" @locate="handleLocate" />
            <a-empty v-if="resolvedComments.length === 0" description="暂无已解决的评论" />
          </div>
        </a-tab-pane>
      </a-tabs>

      <!-- 空状态 -->
      <a-empty v-else description="暂无评论" style="margin-top: 60px">
        <template #image>
          <icon-message :size="60" />
        </template>
      </a-empty>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconMessage } from '@arco-design/web-vue/es/icon'
import { useUserStore } from '@/store/user'
import CommentItem from '@/components/comment/CommentItem.vue'
import type { Comment } from '@/types/comment'
import {
  getComments,
  createComment,
  replyComment,
  resolveComment,
  deleteComment
} from '@/api/comments'

interface Props {
  documentId?: string
  editor?: any
}

const props = defineProps<Props>()

const userStore = useUserStore()
const comments = ref<Comment[]>([])
const newCommentContent = ref('')
const creating = ref(false)
const activeTab = ref('unresolved')
const hasSelection = ref(false)
const selectedText = ref('')
const selectionRange = ref({ from: 0, to: 0 })

// 计算属性
const unresolvedComments = computed(() =>
  comments.value.filter(c => !c.resolved)
)

const resolvedComments = computed(() =>
  comments.value.filter(c => c.resolved)
)

const unreadCount = computed(() =>
  unresolvedComments.value.length
)

const truncatedSelection = computed(() => {
  if (selectedText.value.length > 50) {
    return selectedText.value.slice(0, 50) + '...'
  }
  return selectedText.value
})

// Mock 数据（后端 API 就绪前使用）
const loadMockComments = () => {
  comments.value = [
    {
      id: '1',
      documentId: props.documentId || '',
      userId: '1',
      username: '张三',
      avatar: '',
      content: '这段内容需要补充更多细节',
      startPos: 100,
      endPos: 150,
      quotedText: '示例文本内容',
      resolved: false,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date().toISOString(),
      replies: [
        {
          id: 'r1',
          commentId: '1',
          userId: '2',
          username: '李四',
          avatar: '',
          content: '好的，我会补充',
          createdAt: new Date(Date.now() - 1800000).toISOString()
        }
      ]
    },
    {
      id: '2',
      documentId: props.documentId || '',
      userId: '2',
      username: '李四',
      avatar: '',
      content: '这里的逻辑已经处理完成',
      startPos: 200,
      endPos: 250,
      quotedText: '另一段示例文本',
      resolved: true,
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      updatedAt: new Date().toISOString(),
      replies: []
    }
  ]
}

// 加载评论列表
const loadComments = async () => {
  if (!props.documentId) return

  try {
    const res = await getComments(props.documentId)
    comments.value = res.data || []
  } catch (error) {
    console.warn('[CommentList] 后端 API 未就绪，使用 Mock 数据', error)
    loadMockComments()
  }
}

// 监听编辑器选择变化
const setupSelectionListener = () => {
  if (!props.editor) return

  props.editor.on('selectionUpdate', ({ editor }: any) => {
    const { from, to, empty } = editor.state.selection

    if (!empty && to - from > 0) {
      hasSelection.value = true
      selectedText.value = editor.state.doc.textBetween(from, to)
      selectionRange.value = { from, to }
    }
  })
}

// 创建评论
const handleCreateComment = async () => {
  if (!newCommentContent.value.trim() || !props.documentId) return

  creating.value = true
  try {
    const commentData = {
      documentId: props.documentId,
      content: newCommentContent.value,
      startPos: selectionRange.value.from,
      endPos: selectionRange.value.to,
      quotedText: selectedText.value
    }

    try {
      const res = await createComment(commentData)
      comments.value.unshift(res.data)

      if (props.editor) {
        props.editor.chain()
          .focus()
          .setTextSelection({
            from: selectionRange.value.from,
            to: selectionRange.value.to
          })
          .setCommentMark({
            commentId: res.data.id,
            userId: userStore.userInfo?.id,
            timestamp: Date.now()
          })
          .run()
      }

      Message.success('评论已添加')
    } catch (error) {
      console.warn('[CommentList] 后端 API 未就绪，创建 Mock 评论', error)

      const mockComment: Comment = {
        id: `mock-${Date.now()}`,
        documentId: props.documentId,
        userId: String(userStore.userInfo?.id || 'mock-user'),
        username: userStore.userInfo?.name || '当前用户',
        avatar: userStore.userInfo?.avatar,
        content: newCommentContent.value,
        startPos: selectionRange.value.from,
        endPos: selectionRange.value.to,
        quotedText: selectedText.value,
        resolved: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        replies: []
      }

      comments.value.unshift(mockComment)

      if (props.editor) {
        props.editor.chain()
          .focus()
          .setTextSelection({
            from: selectionRange.value.from,
            to: selectionRange.value.to
          })
          .setCommentMark({
            commentId: mockComment.id,
            userId: mockComment.userId,
            timestamp: Date.now()
          })
          .run()
      }

      Message.success('评论已添加（Mock）')
    }

    newCommentContent.value = ''
    hasSelection.value = false
    selectedText.value = ''
  } finally {
    creating.value = false
  }
}

// 取消评论
const handleCancelComment = () => {
  newCommentContent.value = ''
  hasSelection.value = false
  selectedText.value = ''
}

// 回复评论
const handleReply = async (commentId: string, content: string) => {
  if (!props.documentId) return

  try {
    await replyComment(props.documentId, { commentId, content })
    Message.success('回复已发送')
    await loadComments()
  } catch (error) {
    console.warn('[CommentList] 回复失败，使用 Mock', error)

    const comment = comments.value.find(c => c.id === commentId)
    if (comment) {
      const mockReply = {
        id: `mock-reply-${Date.now()}`,
        commentId,
        userId: String(userStore.userInfo?.id || 'mock-user'),
        username: userStore.userInfo?.name || '当前用户',
        avatar: userStore.userInfo?.avatar,
        content,
        createdAt: new Date().toISOString()
      }
      comment.replies = comment.replies || []
      comment.replies.push(mockReply)
      Message.success('回复已发送（Mock）')
    }
  }
}

// 标记已解决
const handleResolve = async (commentId: string) => {
  if (!props.documentId) return

  try {
    await resolveComment(props.documentId, commentId)
    Message.success('评论已标记为已解决')
    await loadComments()
  } catch (error) {
    console.warn('[CommentList] 标记失败，使用 Mock', error)

    const comment = comments.value.find(c => c.id === commentId)
    if (comment) {
      comment.resolved = true
      Message.success('评论已标记为已解决（Mock）')
    }
  }
}

// 删除评论
const handleDelete = async (commentId: string) => {
  if (!props.documentId) return

  try {
    await deleteComment(props.documentId, commentId)
    Message.success('评论已删除')

    // 从编辑器中移除评论标记
    if (props.editor) {
      props.editor.commands.unsetCommentMark(commentId)
    }

    await loadComments()
  } catch (error) {
    console.warn('[CommentList] 删除失败，使用 Mock', error)

    const index = comments.value.findIndex(c => c.id === commentId)
    if (index > -1) {
      comments.value.splice(index, 1)

      // 从编辑器中移除评论标记
      if (props.editor) {
        props.editor.commands.unsetCommentMark(commentId)
      }

      Message.success('评论已删除（Mock）')
    }
  }
}

// 定位到评论位置
const handleLocate = (comment: Comment) => {
  if (!props.editor) return

  props.editor.chain()
    .focus()
    .setTextSelection({ from: comment.startPos, to: comment.endPos })
    .run()

  setTimeout(() => {
    const element = document.querySelector(`[data-comment-id="${comment.id}"]`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })

      element.classList.add('comment-highlight-flash')
      setTimeout(() => {
        element.classList.remove('comment-highlight-flash')
      }, 2000)
    }
  }, 100)
}

watch(() => props.documentId, (newId) => {
  if (newId) {
    loadComments()
  }
}, { immediate: true })

watch(() => props.editor, (editor) => {
  if (editor) {
    setupSelectionListener()
  }
}, { immediate: true })

onMounted(() => {
  if (props.editor) {
    setupSelectionListener()
  }
})
</script>

<style scoped>
.comment-list-sidebar {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.new-comment-section {
  margin-bottom: 16px;
  padding: 12px;
  background: var(--color-fill-1);
  border-radius: 8px;
}

.comment-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}

.comments-list {
  display: flex;
  flex-direction: column;
}
</style>
