<template>
  <div class="socket-test">
    <h2>🧪 WebSocket 测试面板</h2>
    
    <div class="test-section">
      <h3>1. Socket.io-client 库检测</h3>
      <div class="result" :class="{ success: hasSocketIO, error: !hasSocketIO }">
        {{ hasSocketIO ? '✅ socket.io-client 已正确导入' : '❌ socket.io-client 未导入' }}
      </div>
    </div>

    <div class="test-section">
      <h3>2. WebSocket 连接状态</h3>
      <div class="result" :class="{ success: isConnected, error: !isConnected }">
        {{ isConnected ? '✅ 已连接' : '❌ 未连接' }}
      </div>
      <div class="result" :class="{ success: isAuthenticated, error: !isAuthenticated }">
        {{ isAuthenticated ? '✅ 已认证' : '❌ 未认证' }}
      </div>
    </div>

    <div class="test-section">
      <h3>3. 在线用户</h3>
      <div class="result">
        在线用户数: {{ onlineUsers.length }}
      </div>
      <div v-for="user in onlineUsers" :key="user.userId" class="user-item">
        👤 {{ user.username }} (ID: {{ user.userId }})
      </div>
    </div>

    <div class="test-section">
      <h3>4. 连接信息</h3>
      <div class="info">Socket ID: {{ socketId || '未连接' }}</div>
      <div class="info">WS URL: {{ wsUrl }}</div>
    </div>

    <div class="test-section">
      <h3>5. 操作</h3>
      <button @click="reconnect" :disabled="isConnected">重新连接</button>
      <button @click="testAuth" :disabled="!isConnected || isAuthenticated">测试认证</button>
      <button @click="clearLogs">清除日志</button>
    </div>

    <div class="test-section">
      <h3>6. 控制台日志</h3>
      <div class="logs">
        <div v-for="(log, i) in logs" :key="i" class="log-item" :class="log.type">
          [{{ log.time }}] {{ log.message }}
        </div>
        <div v-if="logs.length === 0" class="empty">暂无日志</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { io, Socket } from 'socket.io-client'
import { socketService } from '@/services/socket'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()

// 检测 socket.io-client 是否可用
const hasSocketIO = computed(() => typeof io === 'function')

// WebSocket 状态
const isConnected = computed(() => socketService.isConnected.value)
const isAuthenticated = computed(() => socketService.isAuthenticated.value)
const onlineUsers = computed(() => socketService.onlineUsers.value)
const socketId = computed(() => socketService.socket?.id || '')

// WebSocket URL
const wsUrl = computed(() => {
  const url = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000/ws'
  return url
})

// 日志
const logs = ref<Array<{ time: string; message: string; type: string }>>([])

const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
  const time = new Date().toLocaleTimeString()
  logs.value.unshift({ time, message, type })
  if (logs.value.length > 50) {
    logs.value = logs.value.slice(0, 50)
  }
}

const clearLogs = () => {
  logs.value = []
}

const reconnect = () => {
  addLog('尝试重新连接...', 'info')
  const url = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000/ws'
  const token = localStorage.getItem('token')
  socketService.connect(url, token || undefined)
}

const testAuth = () => {
  addLog('测试身份认证...', 'info')
  const userId = userStore.id?.toString() || '123'
  const username = userStore.name || '测试用户'
  const avatar = userStore.avatar || ''
  
  if (socketService.socket) {
    socketService.socket.emit('authenticate', { userId, username, avatar })
    addLog(`发送认证: userId=${userId}, username=${username}`, 'info')
  }
}

onMounted(() => {
  addLog('测试面板已加载', 'success')
  addLog(`Socket.io-client 状态: ${hasSocketIO.value ? '已导入' : '未导入'}`, hasSocketIO.value ? 'success' : 'error')
  addLog(`WebSocket URL: ${wsUrl.value}`, 'info')
  
  // 监听 socketService 的事件
  if (socketService.socket) {
    addLog('检测到已存在的 socket 连接', 'success')
  }
  
  // 监听连接状态变化
  const timer = setInterval(() => {
    if (isConnected.value) {
      addLog(`✅ WebSocket 已连接 (Socket ID: ${socketId.value})`, 'success')
      clearInterval(timer)
    }
  }, 1000)
})
</script>

<style scoped>
.socket-test {
  max-width: 800px;
  margin: 40px auto;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 8px;
}

h2 {
  margin-bottom: 24px;
  color: #333;
}

h3 {
  font-size: 16px;
  margin-bottom: 12px;
  color: #666;
}

.test-section {
  background: white;
  padding: 16px;
  margin-bottom: 16px;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.result {
  padding: 8px 12px;
  margin: 8px 0;
  border-radius: 4px;
  font-weight: 500;
}

.result.success {
  background: #e8f5e9;
  color: #2e7d32;
}

.result.error {
  background: #ffebee;
  color: #c62828;
}

.info {
  padding: 8px 12px;
  margin: 8px 0;
  background: #f5f5f5;
  border-radius: 4px;
  font-family: monospace;
  font-size: 14px;
}

.user-item {
  padding: 8px 12px;
  margin: 4px 0;
  background: #e3f2fd;
  border-radius: 4px;
}

button {
  padding: 8px 16px;
  margin: 4px 8px 4px 0;
  border: none;
  border-radius: 4px;
  background: #1890ff;
  color: white;
  cursor: pointer;
  font-size: 14px;
}

button:hover:not(:disabled) {
  background: #40a9ff;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.logs {
  max-height: 300px;
  overflow-y: auto;
  background: #263238;
  padding: 12px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
}

.log-item {
  padding: 4px 0;
  color: #b0bec5;
}

.log-item.success {
  color: #66bb6a;
}

.log-item.error {
  color: #ef5350;
}

.log-item.info {
  color: #42a5f5;
}

.empty {
  color: #666;
  text-align: center;
  padding: 20px;
}
</style>
