import { ref, onBeforeUnmount } from 'vue'
import type { Ref } from 'vue'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import type { Editor } from '@tiptap/vue-3'
import { yjsConfig } from '@/config/yjsConfig'

interface UserInfo {
  id: number
  username: string
  color: string
}

/**
 * Yjs协同编辑组合式函数
 */
export function useYjsCollaboration(
  documentId: Ref<string | undefined>,
  userInfo: UserInfo
): {
  ydoc: Ref<Y.Doc | null>
  provider: Ref<WebsocketProvider | null>
  isConnected: Ref<boolean>
  onlineUsers: Ref<Array<{ id: number; username: string; color: string }>>
  initYjs: (editor: Editor) => void
  destroyYjs: () => void
  updateCursor: (position: { from: number; to: number }) => void
} {
  const ydoc = ref<Y.Doc | null>(null)
  const provider = ref<WebsocketProvider | null>(null)
  const isConnected = ref(false)
  const onlineUsers = ref<Array<{ id: number; username: string; color: string }>>([])

  /**
   * 初始化Yjs文档和WebSocket提供者
   */
  function initYjs(editor: Editor) {
    if (!documentId.value) return

    console.log('[Yjs] 初始化协同编辑:', documentId.value)

    // 创建Yjs文档
    ydoc.value = new Y.Doc()
    
    // 创建WebSocket提供者
    provider.value = new WebsocketProvider(
      yjsConfig.wsUrl,
      `document-${documentId.value}`,
      ydoc.value,
      {
        params: {
          userId: userInfo.id.toString(),
          username: userInfo.username,
        },
        connect: true,
        // 连接超时配置
        resyncInterval: yjsConfig.reconnectInterval,
      }
    )

    // 监听连接状态
    provider.value.on('status', (event: { status: string }) => {
      console.log('[Yjs] WebSocket状态:', event.status)
      isConnected.value = event.status === 'connected'
    })

    // 监听在线用户变化
    provider.value.awareness.on('change', () => {
      const states = Array.from(provider.value!.awareness.getStates().entries())
      onlineUsers.value = states
        .filter(([clientId, state]: [number, any]) => clientId !== provider.value!.awareness.clientID)
        .map(([clientId, state]: [number, any]) => ({
          id: state.user?.id || clientId,
          username: state.user?.name || '未知用户',
          color: state.user?.color || '#000000',
        }))
      
      console.log('[Yjs] 在线用户数:', onlineUsers.value.length + 1)
    })

    // 设置当前用户信息
    provider.value.awareness.setLocalStateField('user', {
      id: userInfo.id,
      name: userInfo.username,
      color: userInfo.color,
    })

    console.log('[Yjs] 协同编辑初始化完成')
  }

  /**
   * 销毁Yjs连接
   */
  function destroyYjs() {
    if (provider.value) {
      console.log('[Yjs] 断开连接')
      provider.value.destroy()
      provider.value = null
    }

    if (ydoc.value) {
      ydoc.value.destroy()
      ydoc.value = null
    }

    isConnected.value = false
    onlineUsers.value = []
  }

  /**
   * 更新光标位置
   */
  function updateCursor(position: { from: number; to: number }) {
    if (provider.value?.awareness) {
      provider.value.awareness.setLocalStateField('cursor', position)
    }
  }

  /**
   * 组件卸载时清理
   */
  onBeforeUnmount(() => {
    destroyYjs()
  })

  return {
    ydoc,
    provider,
    isConnected,
    onlineUsers,
    initYjs,
    destroyYjs,
    updateCursor,
  }
}
