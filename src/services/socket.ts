/**
 * WebSocket 服务层 - 基于 socket.io-client
 * 实现文档协作、实时通信功能
 * 按照后端技术文档规范实现
 */
import { ref } from 'vue'
import { io, Socket } from 'socket.io-client'

// ============ 类型定义 ============

export interface UserInfo {
  userId: string
  username: string
  avatar?: string
  color?: string
  socketId?: string
}

export interface DocumentEdit {
  documentId: string
  type: 'insert' | 'delete' | 'replace'
  content: string
  position: { line: number; column: number }
  timestamp?: number
}

export interface CursorPosition {
  documentId: string
  position: { line: number; column: number }
}

export interface Selection {
  documentId: string
  selection: {
    start: { line: number; column: number }
    end: { line: number; column: number }
  }
}

export interface ChatMessage {
  documentId: string
  message: string
}

export interface TypingStatus {
  documentId: string
  isTyping: boolean
}

// ============ Socket 服务类 ============

class SocketService {
  private socket: Socket | null = null
  private currentDocumentId: string | null = null

  // 响应式状态
  public isConnected = ref(false)
  public isAuthenticated = ref(false)
  public onlineUsers = ref<UserInfo[]>([])
  public currentUser = ref<UserInfo | null>(null)

  /**
   * 初始化并连接到 WebSocket 服务器
   */
  connect(url: string, token?: string) {
    if (this.socket?.connected) {
      console.log('[Socket] 已经连接，跳过重复连接')
      return
    }

    console.log('[Socket] 正在连接到:', url)

    // 创建 socket 连接
    this.socket = io(url, {
      auth: token ? { token: `Bearer ${token}` } : undefined,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 10000,
    })

    this.setupEventListeners()
  }

  /**
   * 设置所有事件监听器
   */
  private setupEventListeners() {
    if (!this.socket) return

    // ====== 连接事件 ======
    this.socket.on('connected', (data) => {
      console.log('[Socket] 连接成功:', data)
      this.isConnected.value = true
    })

    this.socket.on('connect_error', (error) => {
      console.error('[Socket] 连接失败:', error.message)
      this.isConnected.value = false
      
      // 检查是否是认证错误
      if (error.message.includes('unauthorized') || error.message.includes('401')) {
        console.warn('[Socket] Token 无效，可能需要重新登录')
        // 可以触发跳转到登录页
        // window.location.href = '/login'
      }
    })

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] 断开连接:', reason)
      this.isConnected.value = false
      this.isAuthenticated.value = false
    })

    // ====== 认证事件 ======
    this.socket.on('authenticated', (data) => {
      console.log('[Socket] 认证成功:', data)
      this.isAuthenticated.value = true
      this.currentUser.value = {
        userId: data.userId,
        username: data.username,
        socketId: data.socketId,
        color: data.color,
      }
    })

    // ====== 文档房间事件 ======
    this.socket.on('joined-document', (data) => {
      console.log('[Socket] 成功加入文档:', data)
      this.onlineUsers.value = data.users || []
    })

    this.socket.on('left-document', (data) => {
      console.log('[Socket] 已离开文档:', data)
      this.onlineUsers.value = []
    })

    this.socket.on('user-joined', (data) => {
      console.log('[Socket] 用户加入:', data)
      // 添加新用户到在线列表
      const exists = this.onlineUsers.value.find(u => u.userId === data.userId)
      if (!exists) {
        this.onlineUsers.value.push({
          userId: data.userId,
          username: data.username,
          avatar: data.avatar,
          color: data.color,
          socketId: data.socketId,
        })
      }
    })

    this.socket.on('user-left', (data) => {
      console.log('[Socket] 用户离开:', data)
      // 从在线列表中移除用户
      this.onlineUsers.value = this.onlineUsers.value.filter(
        u => u.userId !== data.userId
      )
    })

    // ====== 重连事件 ======
    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`[Socket] 重连成功 (尝试 ${attemptNumber} 次)`)
      
      // 重新认证
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      const userStr = localStorage.getItem('userInfo')
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr)
          this.authenticate(user.id || user.userId, user.username || user.name, user.avatar)
        } catch (e) {
          console.error('[Socket] 重连认证失败:', e)
        }
      }

      // 重新加入文档房间
      if (this.currentDocumentId) {
        this.joinDocument(this.currentDocumentId)
      }
    })

    this.socket.on('reconnect_failed', () => {
      console.error('[Socket] 重连失败，请刷新页面')
    })

    // ====== 错误事件 ======
    this.socket.on('error', (error) => {
      console.error('[Socket] 错误:', error)
    })
  }

  /**
   * 用户认证
   */
  authenticate(userId: string, username: string, avatar?: string) {
    if (!this.socket?.connected) {
      console.warn('[Socket] 未连接，无法认证')
      return
    }

    console.log('[Socket] 发送认证:', { userId, username, avatar })
    this.socket.emit('authenticate', { userId, username, avatar })
  }

  /**
   * 加入文档房间
   */
  joinDocument(documentId: string) {
    if (!this.socket?.connected) {
      console.warn('[Socket] 未连接，无法加入文档')
      return
    }

    console.log('[Socket] 加入文档:', documentId)
    this.currentDocumentId = documentId
    this.socket.emit('join-document', { documentId })
  }

  /**
   * 离开文档房间
   */
  leaveDocument(documentId: string) {
    if (!this.socket?.connected) return

    console.log('[Socket] 离开文档:', documentId)
    this.socket.emit('leave-document', { documentId })
    
    if (this.currentDocumentId === documentId) {
      this.currentDocumentId = null
      this.onlineUsers.value = []
    }
  }

  /**
   * 发送文档编辑
   */
  sendDocumentEdit(edit: DocumentEdit) {
    if (!this.socket?.connected) {
      console.warn('[Socket] 未连接，无法发送编辑')
      return
    }

    this.socket.emit('document-edit', {
      ...edit,
      timestamp: edit.timestamp || Date.now(),
    })
  }

  /**
   * 监听文档编辑
   */
  onDocumentEdit(callback: (data: any) => void): (() => void) {
    this.socket?.on('document-edit', callback)
    return () => this.socket?.off('document-edit', callback)
  }

  /**
   * 发送光标位置
   */
  sendCursorPosition(cursor: CursorPosition) {
    if (!this.socket?.connected) return
    this.socket.emit('cursor-position', cursor)
  }

  /**
   * 监听光标位置
   */
  onCursorPosition(callback: (data: any) => void): (() => void) {
    this.socket?.on('cursor-position', callback)
    return () => this.socket?.off('cursor-position', callback)
  }

  /**
   * 发送选区变化
   */
  sendSelectionChange(selection: Selection) {
    if (!this.socket?.connected) return
    this.socket.emit('selection-change', selection)
  }

  /**
   * 监听选区变化
   */
  onSelectionChange(callback: (data: any) => void): (() => void) {
    this.socket?.on('selection-change', callback)
    return () => this.socket?.off('selection-change', callback)
  }

  /**
   * 发送输入状态
   */
  sendTypingStatus(status: TypingStatus) {
    if (!this.socket?.connected) return
    this.socket.emit('typing', status)
  }

  /**
   * 监听输入状态
   */
  onUserTyping(callback: (data: any) => void): (() => void) {
    this.socket?.on('user-typing', callback)
    return () => this.socket?.off('user-typing', callback)
  }

  /**
   * 发送聊天消息
   */
  sendChatMessage(msg: ChatMessage) {
    if (!this.socket?.connected) return
    this.socket.emit('chat-message', msg)
  }

  /**
   * 监听聊天消息
   */
  onChatMessage(callback: (data: any) => void): (() => void) {
    this.socket?.on('chat-message', callback)
    return () => this.socket?.off('chat-message', callback)
  }

  /**
   * 通用事件监听
   */
  on(event: string, callback: (...args: any[]) => void): (() => void) {
    this.socket?.on(event, callback)
    return () => this.socket?.off(event, callback)
  }

  /**
   * 通用事件发送
   */
  emit(event: string, data: any) {
    if (!this.socket?.connected) {
      console.warn(`[Socket] 未连接，无法发送事件: ${event}`)
      return
    }
    this.socket.emit(event, data)
  }

  /**
   * 断开连接
   */
  disconnect() {
    if (this.socket) {
      console.log('[Socket] 断开连接')
      this.socket.disconnect()
      this.socket = null
      this.isConnected.value = false
      this.isAuthenticated.value = false
      this.onlineUsers.value = []
      this.currentUser.value = null
      this.currentDocumentId = null
    }
  }

  /**
   * 获取当前 socket 实例（用于特殊场景）
   */
  getSocket(): Socket | null {
    return this.socket
  }
}

// ============ 导出单例 ============

export const socketService = new SocketService()

// 导出响应式状态（便于在组件中使用）
export const {
  isConnected,
  isAuthenticated,
  onlineUsers,
  currentUser,
} = socketService
