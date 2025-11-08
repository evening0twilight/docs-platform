<template>
  <div class="mode-switcher">
    <!-- AI 助手 -->
    <a-tooltip content="AI 助手">
      <a-button size="small" :type="currentMode === EditorMode.AI_ASSISTANT ? 'primary' : 'secondary'"
        :disabled="!features.aiEnabled && !isDocumentOwner" @click="handleModeSwitch(EditorMode.AI_ASSISTANT)">
        🤖 AI
        <span v-if="features.aiEnabled" class="feature-badge">●</span>
      </a-button>
    </a-tooltip>

    <!-- 评论 -->
    <a-tooltip content="评论">
      <a-badge :count="unreadCommentsCount" :offset="[5, 0]">
        <a-button size="small" :type="currentMode === EditorMode.COMMENT ? 'primary' : 'secondary'"
          :disabled="!features.commentEnabled" @click="handleModeSwitch(EditorMode.COMMENT)">
          💬 评论
        </a-button>
      </a-badge>
    </a-tooltip>

    <!-- 协同编辑 -->
    <a-dropdown @select="handleCollaborationAction">
      <a-tooltip content="协同编辑">
        <a-button size="small" :type="currentMode === EditorMode.COLLABORATION ? 'primary' : 'secondary'">
          👥 协同
          <span v-if="features.collaborationEnabled" class="status-badge online">
            <span class="pulse-dot"></span>
            {{ onlineUsersCount }}人
          </span>
          <icon-down />
        </a-button>
      </a-tooltip>
      <template #content>
        <a-doption v-if="!features.collaborationEnabled && isDocumentOwner" value="enable">
          <icon-play-circle /> 启动协同编辑
        </a-doption>
        <a-doption v-else-if="features.collaborationEnabled" value="view">
          <icon-user-group /> 查看在线用户
        </a-doption>
        <a-doption v-if="features.collaborationEnabled && isDocumentOwner" value="disable" class="danger">
          <icon-poweroff /> 关闭协同编辑
        </a-doption>
        <a-doption v-if="!isDocumentOwner && !features.collaborationEnabled" disabled>
          <icon-lock /> 仅所有者可启动
        </a-doption>
      </template>
    </a-dropdown>

    <!-- 历史版本 -->
    <a-tooltip content="历史版本">
      <a-button size="small" :type="currentMode === EditorMode.HISTORY ? 'primary' : 'secondary'"
        @click="handleModeSwitch(EditorMode.HISTORY)">
        🕐 历史
      </a-button>
    </a-tooltip>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { EditorMode, type DocumentFeatures } from '@/store/editorMode'
import {
  IconDown,
  IconPlayCircle,
  IconUserGroup,
  IconPoweroff,
  IconLock
} from '@arco-design/web-vue/es/icon'

interface Props {
  currentMode: EditorMode
  features: DocumentFeatures
  onlineUsersCount?: number
  unreadCommentsCount?: number
  isDocumentOwner?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  onlineUsersCount: 0,
  unreadCommentsCount: 0,
  isDocumentOwner: false
})

const emit = defineEmits<{
  switchMode: [mode: EditorMode]
  enableCollaboration: []
  disableCollaboration: []
}>()

/**
 * 处理模式切换
 */
const handleModeSwitch = (mode: EditorMode) => {
  emit('switchMode', mode)
}

/**
 * 处理协同编辑操作
 */
const handleCollaborationAction = (value: string | number | Record<string, any> | undefined) => {
  switch (value) {
    case 'enable':
      emit('enableCollaboration')
      break
    case 'disable':
      emit('disableCollaboration')
      break
    case 'view':
      emit('switchMode', EditorMode.COLLABORATION)
      break
  }
}
</script>

<style scoped>
.mode-switcher {
  display: flex;
  gap: 8px;
  align-items: center;
}

.feature-badge {
  margin-left: 4px;
  font-size: 10px;
  color: #52c41a;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: 4px;
  font-size: 12px;
}

.status-badge.online {
  color: #52c41a;
}

.pulse-dot {
  width: 6px;
  height: 6px;
  background-color: #52c41a;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }
}

:deep(.danger) {
  color: #ff4d4f;
}
</style>
