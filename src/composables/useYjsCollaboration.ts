import { ref, shallowRef, markRaw, onBeforeUnmount } from 'vue'
import type { Ref } from 'vue'
import * as Y from 'yjs'
import { HocuspocusProvider } from '@hocuspocus/provider'
import type { Editor } from '@tiptap/vue-3'
import { yjsConfig } from '@/config/yjsConfig'

interface UserInfo {
  id: number
  username: string
  color: string
}

/**
 * Yjs/CRDT 协同编辑组合式函数
 *
 * 使用 @hocuspocus/provider,与后端 @hocuspocus/server(YjsModule)配套。
 * 鉴权:通过 token 选项发送 JWT,后端 onAuthenticate 校验。
 */
export function useYjsCollaboration(
  documentId: Ref<string | undefined>,
  userInfo: UserInfo
): {
  ydoc: Ref<Y.Doc | null>
  provider: Ref<HocuspocusProvider | null>
  isConnected: Ref<boolean>
  onlineUsers: Ref<Array<{ id: number; username: string; color: string }>>
  initYjs: (editor?: Editor) => void
  destroyYjs: () => void
  updateCursor: (position: { from: number; to: number }) => void
} {
  // 关键:Yjs 的 Y.Doc / HocuspocusProvider 绝不能被 Vue 的响应式系统深度代理。
  // Yjs 内部大量依赖对象身份比较(value === type)与 instanceof,响应式 Proxy 会破坏它们,
  // 导致 findRootTypeKey 报 "Unexpected case"。因此用 shallowRef + markRaw 保持原始对象。
  const ydoc = shallowRef<Y.Doc | null>(null)
  const provider = shallowRef<HocuspocusProvider | null>(null)
  const isConnected = ref(false)
  const onlineUsers = ref<Array<{ id: number; username: string; color: string }>>([])

  let awarenessChangeHandler: (() => void) | undefined

  /**
   * 初始化 Yjs 文档与 Hocuspocus 连接
   * 注意:Collaboration 扩展需在编辑器创建时传入,这里返回的 ydoc/provider
   *       供 getYjsExtensions() 在「创建编辑器」时使用(见 EditorArea)。
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function initYjs(_editor?: Editor) {
    if (!documentId.value) return

    console.log('[Yjs] 初始化协同编辑:', documentId.value)

    ydoc.value = markRaw(new Y.Doc())

    provider.value = markRaw(new HocuspocusProvider({
      url: yjsConfig.wsUrl,
      name: `document-${documentId.value}`,
      document: ydoc.value,
      // 发送 JWT 给后端 onAuthenticate;函数形式以便每次重连读取最新 token
      token: () =>
        localStorage.getItem('token') || sessionStorage.getItem('token') || '',
      onStatus: ({ status }: { status: string }) => {
        console.log('[Yjs] 连接状态:', status)
        isConnected.value = status === 'connected'
      },
      onAuthenticationFailed: ({ reason }: { reason: string }) => {
        console.error('[Yjs] 鉴权失败:', reason)
        isConnected.value = false
      },
    }))

    // 设置本地用户(供协同光标显示)
    const awareness = provider.value.awareness
    if (awareness) {
      awareness.setLocalStateField('user', {
        id: userInfo.id,
        name: userInfo.username,
        color: userInfo.color,
      })

      // 监听在线用户变化
      awarenessChangeHandler = () => {
        const states = Array.from(awareness.getStates().entries())
        onlineUsers.value = states
          .filter(([clientId]) => clientId !== awareness.clientID)
          .map(([clientId, state]: [number, any]) => ({
            id: state.user?.id || clientId,
            username: state.user?.name || '未知用户',
            color: state.user?.color || '#000000',
          }))
      }
      awareness.on('change', awarenessChangeHandler)
    }

    console.log('[Yjs] 协同编辑初始化完成')
  }

  /**
   * 销毁 Yjs 连接
   */
  function destroyYjs() {
    if (provider.value) {
      console.log('[Yjs] 断开连接')
      const awareness = provider.value.awareness
      if (awareness && awarenessChangeHandler) {
        awareness.off('change', awarenessChangeHandler)
        awarenessChangeHandler = undefined
      }
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
   * 更新本地光标位置(Yjs 模式下通常由 CollaborationCursor 扩展自动处理,此处保留作兜底)
   */
  function updateCursor(position: { from: number; to: number }) {
    const awareness = provider.value?.awareness
    if (awareness) {
      awareness.setLocalStateField('cursor', position)
    }
  }

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
