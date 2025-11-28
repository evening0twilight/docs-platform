<template>
  <div class="comment-list-sidebar">
    <div class="sidebar-header">
      <h3>💬 评论</h3>
      <a-badge :count="unreadCount" :offset="[10, 0]" />
    </div>

    <div class="sidebar-content">
      <!-- Loading 状态 -->
      <div v-if="loading" class="loading-container">
        <a-spin tip="加载评论中..." />
      </div>

      <!-- 新增评论区域 -->
      <div v-else-if="hasSelection" class="new-comment-section">
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
  deleteComment,
  getCommentStats
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
const stats = ref({ total: 0, resolved: 0, unresolved: 0 })
const loading = ref(false)

// 计算属性
const unresolvedComments = computed(() =>
  comments.value.filter(c => !c.resolved)
)

const resolvedComments = computed(() =>
  comments.value.filter(c => c.resolved)
)

const unreadCount = computed(() => stats.value.unresolved)

const truncatedSelection = computed(() => {
  if (selectedText.value.length > 50) {
    return selectedText.value.slice(0, 50) + '...'
  }
  return selectedText.value
})

// 加载评论统计
const loadStats = async () => {
  if (!props.documentId) return

  try {
    const res = await getCommentStats(props.documentId) as any
    if (res && typeof res === 'object') {
      stats.value = {
        total: res.total || 0,
        resolved: res.resolved || 0,
        unresolved: res.unresolved || 0
      }
    }
  } catch (error) {
    console.warn('[CommentList] 加载统计失败', error)
  }
}

// 加载评论列表
const loadComments = async () => {
  if (!props.documentId) return

  loading.value = true
  try {
    const res = await getComments(props.documentId, { includeReplies: true }) as any
    // 响应拦截器已经解包,直接使用 res
    const commentsData = Array.isArray(res) ? res : []
    comments.value = commentsData.map((c: any) => ({
      id: String(c.id),
      documentId: String(c.documentId),
      userId: String(c.userId),
      username: c.user?.username || '未知用户',
      avatar: c.user?.avatar,
      content: c.content,
      startPos: c.startPos,
      endPos: c.endPos,
      quotedText: c.quotedText,
      resolved: c.resolved,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      replies: (c.replies || []).map((r: any) => ({
        id: String(r.id),
        commentId: String(r.parentId || c.id),
        userId: String(r.userId),
        username: r.user?.username || '未知用户',
        avatar: r.user?.avatar,
        content: r.content,
        createdAt: r.createdAt
      }))
    }))

    // 同时加载统计
    await loadStats()
  } catch (error) {
    console.error('[CommentList] 加载评论失败:', error)
    Message.error('加载评论失败，请刷新重试')
  } finally {
    loading.value = false
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
    const commentData: any = {
      documentId: props.documentId,
      content: newCommentContent.value,
      startPos: selectionRange.value.from,
      endPos: selectionRange.value.to
    }

    // 只有当有选中文本时才添加 quotedText
    if (selectedText.value && selectedText.value.trim()) {
      commentData.quotedText = selectedText.value
    }

    const res = await createComment(commentData) as any

    // 转换后端数据格式为前端格式
    const comment: Comment = {
      id: String(res.id),
      documentId: String(res.documentId),
      userId: String(res.userId),
      username: res.user?.username || '未知用户',
      avatar: res.user?.avatar,
      content: res.content,
      startPos: res.startPos,
      endPos: res.endPos,
      quotedText: res.quotedText,
      resolved: res.resolved,
      createdAt: res.createdAt,
      updatedAt: res.updatedAt,
      replies: []
    }

    comments.value.unshift(comment)

    // 更新统计
    stats.value.total++
    stats.value.unresolved++

    // 在编辑器中添加高亮标记
    if (props.editor) {
      props.editor.chain()
        .focus()
        .setTextSelection({
          from: selectionRange.value.from,
          to: selectionRange.value.to
        })
        .setCommentMark({
          commentId: comment.id,
          userId: String(userStore.userInfo?.id),
          timestamp: Date.now()
        })
        .run()
    }

    Message.success('评论已添加')
    newCommentContent.value = ''
    hasSelection.value = false
    selectedText.value = ''
  } catch (error: any) {
    console.error('[CommentList] 创建评论失败:', error)
    const errorMsg = error?.response?.data?.message || error?.message || '创建评论失败'
    Message.error(errorMsg)
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
    // 重新加载评论列表以获取最新回复
    await loadComments()
  } catch (error: any) {
    console.error('[CommentList] 回复失败:', error)
    const errorMsg = error?.response?.data?.message || error?.message || '回复失败'
    Message.error(errorMsg)
  }
}

// 标记已解决
const handleResolve = async (commentId: string) => {
  if (!props.documentId) return

  try {
    await resolveComment(props.documentId, commentId)

    // 实时更新评论状态（避免重新加载整个列表）
    const comment = comments.value.find(c => c.id === commentId)
    if (comment) {
      comment.resolved = true
      // 更新统计
      stats.value.resolved++
      stats.value.unresolved--
    }

    Message.success('评论已标记为已解决')
  } catch (error: any) {
    console.error('[CommentList] 标记失败:', error)
    const errorMsg = error?.response?.data?.message || error?.message || '标记失败'
    Message.error(errorMsg)
  }
}

// 删除评论
const handleDelete = async (commentId: string) => {
  if (!props.documentId) return

  try {
    await deleteComment(props.documentId, commentId)

    // 从本地列表中移除
    const index = comments.value.findIndex(c => c.id === commentId)
    if (index > -1) {
      const comment = comments.value[index]
      comments.value.splice(index, 1)

      // 更新统计
      stats.value.total--
      if (comment.resolved) {
        stats.value.resolved--
      } else {
        stats.value.unresolved--
      }
    }

    // 从编辑器中移除评论标记
    if (props.editor) {
      props.editor.commands.unsetCommentMark(commentId)
    }

    Message.success('评论已删除')
  } catch (error: any) {
    console.error('[CommentList] 删除失败:', error)
    const errorMsg = error?.response?.data?.message || error?.message || '删除失败'
    Message.error(errorMsg)
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

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
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
