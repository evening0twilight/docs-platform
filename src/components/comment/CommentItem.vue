<template>
  <div class="comment-item" :class="{ resolved: comment.resolved }">
    <!-- 评论头部 -->
    <div class="comment-header">
      <div class="user-info">
        <a-avatar :size="32">
          <img v-if="comment.avatar" :src="comment.avatar" :alt="comment.username" />
          <span v-else>{{ getInitial(comment.username) }}</span>
        </a-avatar>
        <div class="user-meta">
          <span class="username">{{ comment.username }}</span>
          <span class="timestamp">{{ formatTime(comment.createdAt) }}</span>
        </div>
      </div>

      <a-dropdown v-if="canManage" trigger="click">
        <icon-more />
        <template #content>
          <a-doption v-if="!comment.resolved" @click="$emit('resolve', comment.id)">
            <icon-check /> 标记已解决
          </a-doption>
          <a-doption @click="$emit('delete', comment.id)" style="color: var(--color-danger)">
            <icon-delete /> 删除
          </a-doption>
        </template>
      </a-dropdown>
    </div>

    <!-- 引用的文本 -->
    <div v-if="comment.quotedText" class="quoted-text">
      <icon-quote />
      <span>{{ comment.quotedText }}</span>
    </div>

    <!-- 评论内容 -->
    <div class="comment-content">
      {{ comment.content }}
    </div>

    <!-- 评论操作 -->
    <div class="comment-actions">
      <a-button type="text" size="small" @click="handleLocate">
        <icon-location /> 定位
      </a-button>
      <a-button type="text" size="small" @click="showReplyInput = !showReplyInput">
        <icon-message /> 回复 ({{ comment.replies?.length || 0 }})
      </a-button>
    </div>

    <!-- 回复列表 -->
    <div v-if="comment.replies && comment.replies.length > 0" class="replies-list">
      <div v-for="reply in comment.replies" :key="reply.id" class="reply-item">
        <a-avatar :size="24">
          <img v-if="reply.avatar" :src="reply.avatar" :alt="reply.username" />
          <span v-else>{{ getInitial(reply.username) }}</span>
        </a-avatar>
        <div class="reply-content">
          <div class="reply-meta">
            <span class="username">{{ reply.username }}</span>
            <span class="timestamp">{{ formatTime(reply.createdAt) }}</span>
          </div>
          <div class="reply-text">{{ reply.content }}</div>
        </div>
      </div>
    </div>

    <!-- 回复输入框 -->
    <div v-if="showReplyInput" class="reply-input">
      <a-textarea v-model="replyContent" placeholder="输入回复..." :auto-size="{ minRows: 2, maxRows: 4 }" :max-length="500"
        show-word-limit />
      <div class="reply-actions">
        <a-button size="small" @click="showReplyInput = false">取消</a-button>
        <a-button type="primary" size="small" @click="handleReply" :loading="replying" :disabled="!replyContent.trim()">
          回复
        </a-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useUserStore } from '@/store/user'
import type { Comment } from '@/types/comment'
import {
  IconMore,
  IconCheck,
  IconDelete,
  IconQuote,
  IconLocation,
  IconMessage
} from '@arco-design/web-vue/es/icon'

interface Props {
  comment: Comment
}

interface Emits {
  (e: 'reply', commentId: string, content: string): void
  (e: 'resolve', commentId: string): void
  (e: 'delete', commentId: string): void
  (e: 'locate', comment: Comment): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const userStore = useUserStore()
const showReplyInput = ref(false)
const replyContent = ref('')
const replying = ref(false)

// 是否可以管理评论（所有者或评论创建者）
const canManage = computed(() => {
  return props.comment.userId === userStore.userInfo?.id
})

// 获取用户名首字母
const getInitial = (name: string): string => {
  return name ? name.charAt(0).toUpperCase() : '?'
}

// 格式化时间
const formatTime = (time: string): string => {
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`

  return date.toLocaleDateString('zh-CN')
}

// 定位到评论位置
const handleLocate = () => {
  emit('locate', props.comment)
}

// 回复评论
const handleReply = async () => {
  if (!replyContent.value.trim()) return

  replying.value = true
  try {
    emit('reply', props.comment.id, replyContent.value)
    replyContent.value = ''
    showReplyInput.value = false
  } finally {
    replying.value = false
  }
}
</script>

<style scoped>
.comment-item {
  padding: 16px;
  background: var(--color-fill-2);
  border-radius: 8px;
  margin-bottom: 12px;
  transition: all 0.2s;
}

.comment-item:hover {
  background: var(--color-fill-3);
}

.comment-item.resolved {
  opacity: 0.6;
}

.comment-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 12px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.username {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-1);
}

.timestamp {
  font-size: 12px;
  color: var(--color-text-3);
}

.quoted-text {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 12px;
  background: var(--color-fill-1);
  border-left: 3px solid var(--color-primary);
  border-radius: 4px;
  margin-bottom: 12px;
  font-size: 13px;
  color: var(--color-text-2);
  font-style: italic;
}

.comment-content {
  font-size: 14px;
  color: var(--color-text-1);
  line-height: 1.6;
  margin-bottom: 12px;
  word-break: break-word;
}

.comment-actions {
  display: flex;
  gap: 8px;
}

.replies-list {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--color-border-2);
}

.reply-item {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.reply-item:last-child {
  margin-bottom: 0;
}

.reply-content {
  flex: 1;
  min-width: 0;
}

.reply-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.reply-meta .username {
  font-size: 13px;
  font-weight: 500;
}

.reply-meta .timestamp {
  font-size: 11px;
}

.reply-text {
  font-size: 13px;
  color: var(--color-text-2);
  line-height: 1.5;
  word-break: break-word;
}

.reply-input {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--color-border-2);
}

.reply-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}
</style>
