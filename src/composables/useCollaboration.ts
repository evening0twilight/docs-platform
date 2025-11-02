/**
 * 文档协作编辑 Composable
 * 封装 WebSocket 相关逻辑，便于在编辑器组件中使用
 */
import { onMounted, onUnmounted, watch } from 'vue'
import { socketService, type DocumentEdit } from '@/services/socket'
import { Message } from '@arco-design/web-vue'

export interface UseCollaborationOptions {
  documentId: string
  // 接收远程编辑的回调
  onRemoteEdit?: (edit: any) => void
  // 接收远程光标的回调
  onRemoteCursor?: (cursor: any) => void
  // 接收远程选区的回调
  onRemoteSelection?: (selection: any) => void
  // 接收输入状态的回调
  onUserTyping?: (typing: any) => void
  // 接收聊天消息的回调
  onChatMessage?: (msg: any) => void
}

export function useCollaboration(options: UseCollaborationOptions) {
  const { documentId, onRemoteEdit, onRemoteCursor, onRemoteSelection, onUserTyping, onChatMessage } = options

  // 存储取消订阅的函数
  const unsubscribers: (() => void)[] = []

  /**
   * 加入文档房间
   */
  const joinDocument = () => {
    if (!socketService.isConnected.value) {
      console.warn('[useCollaboration] WebSocket 未连接，延迟加入文档')
      // 等待连接后再加入
      const unwatch = watch(
        () => socketService.isConnected.value,
        (connected) => {
          if (connected) {
            socketService.joinDocument(documentId)
            unwatch()
          }
        }
      )
      return
    }

    socketService.joinDocument(documentId)
  }

  /**
   * 离开文档房间
   */
  const leaveDocument = () => {
    socketService.leaveDocument(documentId)
  }

  /**
   * 发送文档编辑
   */
  const sendEdit = (edit: DocumentEdit) => {
    socketService.sendDocumentEdit(edit)
  }

  /**
   * 发送光标位置
   */
  const sendCursor = (position: { line: number; column: number }) => {
    socketService.sendCursorPosition({ documentId, position })
  }

  /**
   * 发送选区变化
   */
  const sendSelection = (selection: {
    start: { line: number; column: number }
    end: { line: number; column: number }
  }) => {
    socketService.sendSelectionChange({ documentId, selection })
  }

  /**
   * 发送输入状态
   */
  const sendTyping = (isTyping: boolean) => {
    socketService.sendTypingStatus({ documentId, isTyping })
  }

  /**
   * 发送聊天消息
   */
  const sendChat = (message: string) => {
    socketService.sendChatMessage({ documentId, message })
  }

  /**
   * 设置事件监听
   */
  const setupListeners = () => {
    // 监听远程编辑
    if (onRemoteEdit) {
      const unsub = socketService.onDocumentEdit((data) => {
        console.log('[Collaboration] 收到远程编辑:', data)
        onRemoteEdit(data)
      })
      unsubscribers.push(unsub)
    }

    // 监听远程光标
    if (onRemoteCursor) {
      const unsub = socketService.onCursorPosition((data) => {
        onRemoteCursor(data)
      })
      unsubscribers.push(unsub)
    }

    // 监听远程选区
    if (onRemoteSelection) {
      const unsub = socketService.onSelectionChange((data) => {
        onRemoteSelection(data)
      })
      unsubscribers.push(unsub)
    }

    // 监听输入状态
    if (onUserTyping) {
      const unsub = socketService.onUserTyping((data) => {
        onUserTyping(data)
      })
      unsubscribers.push(unsub)
    }

    // 监听聊天消息
    if (onChatMessage) {
      const unsub = socketService.onChatMessage((data) => {
        onChatMessage(data)
      })
      unsubscribers.push(unsub)
    }
  }

  /**
   * 清理所有订阅
   */
  const cleanup = () => {
    unsubscribers.forEach(unsub => unsub())
    unsubscribers.length = 0
  }

  // 组件挂载时自动加入文档并设置监听
  onMounted(() => {
    setupListeners()
    joinDocument()
  })

  // 组件卸载时自动离开文档并清理监听
  onUnmounted(() => {
    leaveDocument()
    cleanup()
  })

  return {
    // 状态
    isConnected: socketService.isConnected,
    isAuthenticated: socketService.isAuthenticated,
    onlineUsers: socketService.onlineUsers,
    currentUser: socketService.currentUser,

    // 方法
    joinDocument,
    leaveDocument,
    sendEdit,
    sendCursor,
    sendSelection,
    sendTyping,
    sendChat,
  }
}
