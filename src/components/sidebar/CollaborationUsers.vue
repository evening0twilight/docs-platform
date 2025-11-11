<template>
  <div class="collaboration-users-sidebar">
    <div class="sidebar-header">
      <h3>👥 协作用户</h3>
      <div class="connection-status">
        <span :class="['status-dot', isConnected ? 'connected' : 'disconnected']"></span>
        <span class="status-text">{{ isConnected ? '协作中' : '已断开' }}</span>
      </div>
    </div>

    <div class="sidebar-content">
      <!-- 当前文档所有者 -->
      <div v-if="owner" class="section">
        <div class="section-title">文档所有者</div>
        <div class="user-item owner">
          <div class="user-avatar" :style="{ backgroundColor: owner.color || '#999' }">
            <img v-if="owner.avatar" :src="owner.avatar" :alt="owner.username" />
            <span v-else class="avatar-text">{{ getInitial(owner.username) }}</span>
          </div>
          <div class="user-info">
            <div class="user-name">{{ owner.username }}</div>
            <div class="user-role">所有者</div>
          </div>
          <a-tag color="gold" size="small">👑</a-tag>
        </div>
      </div>

      <!-- 在线协作者 -->
      <div class="section">
        <div class="section-title">
          在线协作者 ({{ onlineCollaborators.length }})
        </div>
        <div v-if="onlineCollaborators.length > 0" class="users-list">
          <div v-for="user in onlineCollaborators" :key="user.userId" class="user-item"
            :title="`${user.username} (${user.userId})`">
            <div class="user-avatar" :style="{ backgroundColor: user.color || '#999' }">
              <img v-if="user.avatar" :src="user.avatar" :alt="user.username" />
              <span v-else class="avatar-text">{{ getInitial(user.username) }}</span>
            </div>
            <div class="user-info">
              <div class="user-name">{{ user.username }}</div>
              <div class="user-status">
                <span class="status-indicator"></span>
                正在编辑
              </div>
              <!-- 光标颜色指示器 -->
              <div class="cursor-indicator" :style="{ backgroundColor: user.color || '#999' }"
                :title="`光标颜色: ${user.color || '#999'}`">
              </div>
            </div>
            <!-- 权限控制 - 仅owner可见 -->
            <div v-if="isOwner" class="user-actions">
              <a-select v-model="user.permission" size="small" @change="handlePermissionChange(user)">
                <a-option value="editor">可编辑</a-option>
                <a-option value="viewer">只读</a-option>
              </a-select>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <icon-user-group :size="32" />
          <p>暂无其他协作者</p>
        </div>
      </div>

      <!-- 协作控制 -->
      <div class="section">
        <div class="section-title">协作设置</div>
        
        <!-- 仅所有者可见协同开关 -->
        <div v-if="isOwner" class="collaboration-control">
          <div class="control-header">
            <span class="control-label">📡 协同编辑</span>
            <a-switch 
              v-model="isCollaborationEnabled" 
              @change="handleCollaborationToggle"
              :loading="toggleLoading"
            />
          </div>
          <div class="control-hint">
            <p v-if="isCollaborationEnabled" class="hint-text success">
              ✅ 协同编辑已启用,其他用户可以编辑文档
            </p>
            <p v-else class="hint-text warning">
              ⚠️ 协同编辑已关闭,所有用户只能查看
            </p>
          </div>
        </div>
        
        <!-- 非所有者显示协同状态 -->
        <div v-else class="collaboration-status">
          <a-alert 
            :type="isCollaborationEnabled ? 'success' : 'warning'" 
            banner
          >
            <template v-if="isCollaborationEnabled">
              实时协同编辑已启用
            </template>
            <template v-else>
              当前文档未开启协同,您只能查看
            </template>
          </a-alert>
        </div>
        
        <!-- 协作信息 -->
        <div class="collaboration-info">
          <a-space direction="vertical" fill>
            <div class="info-item">
              <span class="info-label">📡 连接状态</span>
              <a-tag :color="isConnected ? 'green' : 'red'" size="small">
                {{ isConnected ? '已连接' : '未连接' }}
              </a-tag>
            </div>
            <div class="info-item">
              <span class="info-label">👥 在线人数</span>
              <a-tag color="blue" size="small">{{ onlineCollaborators.length }} 人</a-tag>
            </div>
          </a-space>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { UserInfo } from '@/services/socket'
import { IconUserGroup } from '@arco-design/web-vue/es/icon'
import { Message } from '@arco-design/web-vue'
import { updateDocumentPermission, getDocumentPermissions, toggleCollaboration } from '@/api/docs'

interface Props {
  users: UserInfo[]
  isConnected: boolean
  currentUserId?: string
  ownerId?: string
  documentId?: string | number
  collaborationEnabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  currentUserId: '',
  ownerId: '',
  documentId: '',
  collaborationEnabled: false
})

const emit = defineEmits<{
  'collaboration-toggled': [enabled: boolean]
}>()

// 协同开关状态
const isCollaborationEnabled = ref(props.collaborationEnabled)
const toggleLoading = ref(false)

// 监听props变化
watch(() => props.collaborationEnabled, (newVal) => {
  isCollaborationEnabled.value = newVal
})

// 判断当前用户是否是owner
const isOwner = computed(() => {
  return props.currentUserId === props.ownerId
})

// 获取所有者信息
const owner = computed(() => {
  if (!props.ownerId) return null
  return props.users.find(u => u.userId === props.ownerId)
})

// 获取在线协作者(排除所有者)
const onlineCollaborators = computed(() => {
  return props.users.filter(u => u.userId !== props.ownerId)
})

// 获取用户名首字母
const getInitial = (name: string): string => {
  return name ? name.charAt(0).toUpperCase() : '?'
}

// 处理协同开关切换
const handleCollaborationToggle = async (enabled: boolean) => {
  if (!props.documentId) {
    Message.error('无法获取文档ID')
    isCollaborationEnabled.value = !enabled // 恢复原状态
    return
  }
  
  toggleLoading.value = true
  try {
    const result = await toggleCollaboration(Number(props.documentId), enabled)
    
    if (enabled) {
      Message.success('协同编辑已开启')
    } else {
      Message.warning(`协同编辑已关闭,${result.affectedPermissions}位编辑者权限已降为只读`)
    }
    
    emit('collaboration-toggled', enabled)
  } catch (error) {
    console.error('切换协同开关失败:', error)
    Message.error('操作失败,请重试')
    isCollaborationEnabled.value = !enabled // 恢复原状态
  } finally {
    toggleLoading.value = false
  }
}

// 处理权限变更
const handlePermissionChange = async (user: UserInfo) => {
  if (!props.documentId) {
    Message.error('无法获取文档ID')
    return
  }
  
  try {
    Message.info(`正在更新 ${user.username} 的权限...`)
    
    // 首先获取权限列表,找到该用户的permissionId
    const permissions = await getDocumentPermissions(Number(props.documentId))
    const userPermission = permissions.find((p: any) => p.userId === Number(user.userId))
    
    if (!userPermission) {
      Message.error('未找到该用户的权限记录')
      return
    }
    
    // 更新权限
    await updateDocumentPermission(
      Number(props.documentId),
      userPermission.id,
      user.permission as 'editor' | 'viewer'
    )
    
    Message.success(`已更新 ${user.username} 的权限为${user.permission === 'editor' ? '可编辑' : '只读'}`)
    
    // TODO: 通过WebSocket通知被修改的用户
  } catch (error) {
    console.error('更新权限失败:', error)
    Message.error('更新权限失败')
  }
}
</script>

<style scoped>
.collaboration-users-sidebar {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid var(--color-border);
}

.sidebar-header h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 500;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--color-text-3);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  transition: background-color 0.3s;
}

.status-dot.connected {
  background-color: rgb(var(--success-6));
  box-shadow: 0 0 0 3px rgba(var(--success-6), 0.2);
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.status-dot.disconnected {
  background-color: rgb(var(--danger-6));
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

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.section {
  margin-bottom: 24px;
}

.section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-2);
  margin-bottom: 12px;
  padding-left: 4px;
}

.users-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  background: var(--color-fill-2);
  border-radius: 8px;
  transition: all 0.2s;
}

.user-item:hover {
  background: var(--color-fill-3);
}

.user-item.owner {
  background: var(--color-primary-light-1);
  border: 1px solid var(--color-primary-light-3);
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-text {
  color: #fff;
  font-size: 16px;
  font-weight: 600;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-size: 12px;
  color: var(--color-text-3);
}

.user-status {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: rgb(var(--success-6));
}

.status-indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: rgb(var(--success-6));
}

.cursor-indicator {
  width: 16px;
  height: 16px;
  border-radius: 3px;
  margin-top: 4px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.user-actions {
  flex-shrink: 0;
  margin-left: 8px;
}

.empty-state {
  padding: 32px 16px;
  text-align: center;
  color: var(--color-text-3);
}

.empty-state p {
  margin: 8px 0 0 0;
  font-size: 13px;
}

.collaboration-control {
  padding: 12px;
  background: var(--color-fill-1);
  border-radius: 8px;
  margin-bottom: 12px;
}

.control-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.control-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-1);
}

.control-hint {
  margin-top: 8px;
}

.hint-text {
  font-size: 12px;
  margin: 0;
  padding: 8px;
  border-radius: 4px;
}

.hint-text.success {
  color: rgb(var(--success-6));
  background: rgb(var(--success-1));
}

.hint-text.warning {
  color: rgb(var(--warning-6));
  background: rgb(var(--warning-1));
}

.collaboration-status {
  margin-bottom: 12px;
}

.collaboration-info {
  padding: 12px;
  background: var(--color-fill-1);
  border-radius: 6px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.info-label {
  font-size: 13px;
  color: var(--color-text-2);
}
</style>
