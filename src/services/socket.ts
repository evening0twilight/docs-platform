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
  permission?: 'editor' | 'viewer' // 用户权限
}

export interface DocumentEdit {
  documentId: string
  type: 'insert' | 'delete' | 'replace'
  content?: string | any  // 可选，delete 操作不需要 content
  position?: { line: number; column: number }  // 兼容旧版
  from?: number  // 编辑起始位置
  to?: number    // 编辑结束位置
  openStart?: number  // ProseMirror Slice的openStart
  openEnd?: number    // ProseMirror Slice的openEnd
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
  public socket: Socket | null = null  // ⭐ 改为 public 以便外部访问
  private currentDocumentId: string | null = null

  // 响应式状态
  public isConnected = ref(false)
  public isAuthenticated = ref(false)
  public onlineUsers = ref<UserInfo[]>([])
  public currentUser = ref<UserInfo | null>(null)

  // 回调函数集合
  private permissionUpdateCallbacks: ((data: any) => void)[] = []
  private collaborationToggleCallbacks: ((data: any) => void)[] = []

  /**
   * 初始化并连接到 WebSocket 服务器
   */
  connect(url: string, token?: string) {
    if (this.socket?.connected) {
      console.log('[Socket] 已经连接，跳过重复连接')
      return
    }

    console.log('[Socket] 🔌 正在连接到:', url)
    console.log('[Socket] 🎫 Token:', token ? '存在' : '不存在')

    // 创建 socket 连接
    this.socket = io(url, {
      auth: token ? { token: `Bearer ${token}` } : undefined,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 10000,
    })

    console.log('[Socket] 📡 Socket实例已创建')
    this.setupEventListeners()
  }

  /**
   * 断开 WebSocket 连接
   */
  disconnect() {
    if (this.socket) {
      console.log('[Socket] 🔌 断开连接')
      this.socket.removeAllListeners() // 移除所有监听器,避免重连后重复绑定/内存泄漏
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
   * 设置所有事件监听器
   */
  private setupEventListeners() {
    if (!this.socket) return

    // ====== 1. Socket 原生连接事件 ======
    this.socket.on('connect', () => {
      console.log('[Socket] ✅ Socket 连接成功')
      console.log('[Socket] Socket ID:', this.socket?.id)
      this.isConnected.value = true
    })

    // ====== 2. 收到后端 connected 事件 ======
    this.socket.on('connected', (data) => {
      console.log('[Socket] ✅ 收到 connected 事件:', data)
      
      // ⭐ 连接成功后，立即进行身份认证
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      const userStoreStr = localStorage.getItem('user-store') || sessionStorage.getItem('user-store')
      
      if (token && userStoreStr) {
        try {
          const userStore = JSON.parse(userStoreStr)
          console.log('[Socket] 🔐 发送身份认证...')
          
          const userId = userStore.id?.toString() || 'guest-' + Date.now()
          const username = userStore.name || '访客'
          const avatar = userStore.avatar || ''
          
          console.log('[Socket] 认证参数:', { userId, username, avatar })
          this.authenticate(userId, username, avatar)
        } catch (e) {
          console.error('[Socket] ❌ 解析用户信息失败:', e)
        }
      } else {
        console.warn('[Socket] ⚠️ 未找到 token 或用户信息，跳过认证')
        console.log('[Socket] token:', token ? '存在' : '不存在')
        console.log('[Socket] user-store:', userStoreStr ? '存在' : '不存在')
      }
    })

    // ====== 3. 认证成功事件 ======
    this.socket.on('authenticated', (data) => {
      console.log('[Socket] ✅ 认证成功:', data)
      this.isAuthenticated.value = true
      this.currentUser.value = {
        userId: data.userId,
        username: data.username,
        socketId: data.socketId,
        avatar: data.avatar,
        color: data.color,
      }
      
      // ⭐ 认证成功后，如果有待加入的文档，立即加入
      if (this.currentDocumentId) {
        console.log('[Socket] 📄 认证成功，自动加入文档:', this.currentDocumentId)
        this.joinDocument(this.currentDocumentId)
      }
    })

    // ====== 4. 文档房间事件 ======
    this.socket.on('joined-document', (data) => {
      console.log('[Socket] ✅ 加入文档房间成功 - 原始数据:', JSON.stringify(data, null, 2))
      
      // ⭐ 兼容两种返回格式: { users: [...] } 或 { data: { users: [...] } }
      const users = data.data?.users || data.users
      console.log('[Socket] 解析后的在线用户:', users)
      console.log('[Socket] users类型:', typeof users, '是否数组:', Array.isArray(users))
      
      // ⭐ 关键: 设置初始在线用户列表
      if (users && Array.isArray(users)) {
        this.onlineUsers.value = users
        console.log('[Socket] 📋 在线用户列表已更新，共', users.length, '人')
        console.log('[Socket] 📋 详细用户列表:', users.map(u => `${u.username}(${u.userId})`).join(', '))
      } else {
        console.warn('[Socket] ⚠️ joined-document 事件未返回 users 数组')
        console.log('[Socket] ⚠️ data.data:', data.data)
        console.log('[Socket] ⚠️ data.users:', data.users)
        this.onlineUsers.value = []
      }
    })

    this.socket.on('left-document', (data) => {
      console.log('[Socket] 已离开文档:', data)
      this.onlineUsers.value = []
      this.currentDocumentId = null
    })

    this.socket.on('user-joined', (data) => {
      console.log('[Socket] 👤 新用户加入:', data)
      
      // 添加新用户到在线列表（避免重复）
      const exists = this.onlineUsers.value.find(u => u.userId === data.userId)
      if (!exists) {
        this.onlineUsers.value.push({
          userId: data.userId,
          username: data.username,
          avatar: data.avatar,
          color: data.color,
          socketId: data.socketId,
        })
        console.log('[Socket] 在线用户 +1，当前:', this.onlineUsers.value.length, '人')
      } else {
        console.log('[Socket] 用户已在列表中，跳过重复添加')
      }
    })

    this.socket.on('user-left', (data) => {
      console.log('[Socket] 👋 用户离开:', data)
      
      // 从在线列表中移除用户
      const beforeCount = this.onlineUsers.value.length
      this.onlineUsers.value = this.onlineUsers.value.filter(
        u => u.userId !== data.userId
      )
      const afterCount = this.onlineUsers.value.length
      
      if (beforeCount !== afterCount) {
        console.log('[Socket] 在线用户 -1，当前:', afterCount, '人')
      }
    })

    // 监听用户颜色更新
    this.socket.on('user-color-updated', (data) => {
      console.log('[Socket] 🎨 用户颜色更新:', data)
      
      // 更新在线用户列表中的颜色
      const userIndex = this.onlineUsers.value.findIndex(u => u.userId === data.userId)
      if (userIndex !== -1) {
        this.onlineUsers.value[userIndex].color = data.color
        console.log('[Socket] 已更新用户颜色:', this.onlineUsers.value[userIndex])
      }
      
      // 如果是当前用户,也更新currentUser
      if (this.currentUser.value?.userId === data.userId) {
        this.currentUser.value.color = data.color
      }
    })

    // ====== 5. 连接错误和断开事件 ======
    this.socket.on('connect_error', (error) => {
      console.error('[Socket] ❌ 连接错误:', error.message)
      // 详细信息(含连接URL)仅在开发环境输出,避免生产泄露基础设施配置
      if (import.meta.env.DEV) {
        console.error('[Socket] ❌ 错误详情:', error)
        console.error('[Socket] ❌ 连接URL:', import.meta.env.VITE_WS_URL)
      }
      this.isConnected.value = false
      
      // 检查是否是认证错误
      if (error.message.includes('unauthorized') || error.message.includes('401')) {
        console.warn('[Socket] Token 无效，可能需要重新登录')
      }
    })

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] ❌ 连接断开:', reason)
      console.log('[Socket] ❌ 断开原因详情:', reason)
      this.isConnected.value = false
      this.isAuthenticated.value = false
      this.onlineUsers.value = []
      this.currentDocumentId = null
    })

    // ====== 6. 强制登出事件 ======
    this.socket.on('force-logout', (data) => {
      console.warn('[Socket] ⚠️ 强制登出:', data)
      
      // 断开socket连接
      this.disconnect()
      
      // 清除本地存储
      localStorage.removeItem('token')
      sessionStorage.removeItem('token')
      localStorage.removeItem('user-store')
      sessionStorage.removeItem('user-store')
      
      // 动态导入以避免循环依赖
      import('@arco-design/web-vue').then(({ Modal }) => {
        Modal.warning({
          title: '账号已在其他地方登录',
          content: '您的账号已在其他设备登录。如果不是您本人操作，请立即修改密码或邮箱以确保账号安全！',
          okText: '重新登录',
          onOk: () => {
            // 跳转到登录页
            window.location.href = '/login'
          },
        })
      })
    })

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`[Socket] 重连成功 (尝试 ${attemptNumber} 次)`)
      
      // 重新认证(修复:此前读取了不存在的 'userInfo' key,应为 'user-store')
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      const userStr = localStorage.getItem('user-store') || sessionStorage.getItem('user-store')
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

    // ====== 权限更新事件 ======
    this.socket.on('permission-updated', (data) => {
      console.log('[Socket] 📝 权限已更新:', data)
      // 触发权限更新回调
      this.permissionUpdateCallbacks.forEach(callback => {
        callback(data)
      })
    })

    this.socket.on('document-permission-changed', (data) => {
      console.log('[Socket] 📝 文档权限已变更:', data)
      // 可以用于通知owner权限变更成功
    })

    // ====== 协同功能开关事件 ======
    this.socket.on('collaboration-toggled', (data) => {
      console.log('[Socket] 🔄 协同功能状态变化:', data)
      // 触发协同状态变化回调
      this.collaborationToggleCallbacks.forEach(callback => {
        callback(data)
      })
    })

    // ====== 调试: 仅开发环境监听所有事件(生产环境会泄露 token/内容并影响性能) ======
    if (import.meta.env.DEV) {
      this.socket.onAny((eventName: string, ...args: any[]) => {
        console.log('[Socket] 📥 收到事件:', eventName, args)
      })

      this.socket.onAnyOutgoing((eventName: string, ...args: any[]) => {
        console.log('[Socket] 📤 发送事件:', eventName, args)
      })
    }
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
      console.warn('[Socket] ⚠️ 未连接，无法加入文档')
      return
    }

    // ⭐ 如果还未认证，先保存 documentId，等认证成功后自动加入
    if (!this.isAuthenticated.value) {
      console.warn('[Socket] ⚠️ 未认证，保存 documentId，等待认证完成后加入')
      this.currentDocumentId = documentId
      return
    }

    console.log('[Socket] 📄 加入文档房间:', documentId)
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
    if (!this.socket?.connected) {
      console.warn('[Socket] ⚠️ 未连接,无法发送光标位置')
      return
    }
    console.log('[Socket] 📤 发送光标位置:', cursor)
    this.socket.emit('cursor-position', cursor)
  }

  /**
   * 监听光标位置
   */
  onCursorPosition(callback: (data: any) => void): (() => void) {
    const wrappedCallback = (data: any) => {
      console.log('[Socket] 📥 接收到远程光标:', data)
      callback(data)
    }
    this.socket?.on('cursor-position', wrappedCallback)
    return () => this.socket?.off('cursor-position', wrappedCallback)
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
   * 监听权限更新
   */
  onPermissionUpdate(callback: (data: any) => void): (() => void) {
    this.permissionUpdateCallbacks.push(callback)
    return () => {
      const index = this.permissionUpdateCallbacks.indexOf(callback)
      if (index > -1) {
        this.permissionUpdateCallbacks.splice(index, 1)
      }
    }
  }

  /**
   * 监听协同功能开关
   */
  onCollaborationToggle(callback: (data: any) => void): (() => void) {
    this.collaborationToggleCallbacks.push(callback)
    return () => {
      const index = this.collaborationToggleCallbacks.indexOf(callback)
      if (index > -1) {
        this.collaborationToggleCallbacks.splice(index, 1)
      }
    }
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
