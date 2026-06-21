import Collaboration from '@tiptap/extension-collaboration'
// Tiptap v3.3+ 中协同光标扩展更名为 CollaborationCaret,且与 Collaboration 一样
// 基于 @tiptap/y-tiptap 的 ySyncPluginKey(旧的 -cursor 用 y-prosemirror 的 key,二者不兼容)。
import CollaborationCaret from '@tiptap/extension-collaboration-caret'
import * as Y from 'yjs'
import type { HocuspocusProvider } from '@hocuspocus/provider'

interface UserInfo {
  id: number
  username: string
  color: string
}

/**
 * 获取Yjs协同编辑扩展
 * 注意:这些扩展必须在「创建编辑器」时放入 extensions 数组,
 *       且需关闭 StarterKit 的 history(Collaboration 自带基于 Yjs 的撤销/重做协调)。
 */
export function getYjsExtensions(
  ydoc: Y.Doc,
  provider: HocuspocusProvider,
  userInfo: UserInfo
) {
  const extensions: any[] = [
    // Yjs协同编辑核心扩展
    Collaboration.configure({
      document: ydoc,
      // 使用默认的fragment名称
      field: 'default',
    }),
  ]

  // Yjs协同光标扩展(CollaborationCaret 通过 provider.awareness 同步远端光标/选区)
  if (provider.awareness) {
    extensions.push(
      CollaborationCaret.configure({
        provider: provider,
        user: {
          name: userInfo.username,
          color: userInfo.color,
        },
      }),
    )
  }

  return extensions
}

/**
 * 生成用户颜色
 */
export function generateUserColor(userId: number): string {
  const colors = [
    '#FF6B6B', // 红色
    '#4ECDC4', // 青色
    '#45B7D1', // 蓝色
    '#FFA07A', // 橙色
    '#98D8C8', // 绿色
    '#F7DC6F', // 黄色
    '#BB8FCE', // 紫色
    '#85C1E2', // 浅蓝
    '#F8B88B', // 浅橙
    '#A8E6CF', // 浅绿
  ]

  return colors[userId % colors.length]
}
