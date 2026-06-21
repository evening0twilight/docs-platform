<template>
  <div class="online-users-panel">
    <div class="panel-header">
      <h3>在线用户 ({{ users.length }})</h3>
      <div class="connection-status">
        <span :class="['status-dot', isConnected ? 'connected' : 'disconnected']"></span>
        <span class="status-text">{{ isConnected ? '已连接' : '未连接' }}</span>
      </div>
    </div>

    <div class="users-list">
      <div v-for="user in users" :key="user.userId" class="user-item" :title="`${user.username} (${user.userId})`">
        <div class="user-avatar" :style="{ backgroundColor: user.color || '#999' }">
          <img v-if="user.avatar" :src="user.avatar" :alt="user.username" />
          <span v-else class="avatar-text">{{ getInitial(user.username) }}</span>
        </div>
        <div class="user-info">
          <div class="user-name">{{ user.username }}</div>
          <div class="user-status">在线</div>
        </div>
      </div>

      <div v-if="users.length === 0" class="empty-state">
        <span>暂无其他在线用户</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { UserInfo } from '@/services/socket'

interface Props {
  users: UserInfo[]
  isConnected: boolean
}

const props = defineProps<Props>()

// 获取用户名首字母
const getInitial = (name: string): string => {
  return name ? name.charAt(0).toUpperCase() : '?'
}
</script>

<style scoped>
.online-users-panel {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--c-surface);
  border-left: 1px solid var(--c-border);
}

.panel-header {
  padding: 16px;
  border-bottom: 1px solid var(--c-border);
}

.panel-header h3 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--c-text);
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--c-text-2);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  transition: background-color 0.3s;
}

.status-dot.connected {
  background-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
}

.status-dot.disconnected {
  background-color: #ef4444;
}

.users-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.user-item:hover {
  background-color: var(--c-bg);
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
  color: var(--c-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-status {
  font-size: 12px;
  color: #10b981;
}

.empty-state {
  padding: 32px 16px;
  text-align: center;
  color: var(--c-text-3);
  font-size: 13px;
}
</style>
